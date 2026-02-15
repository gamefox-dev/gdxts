import { Mesh } from '../Mesh';
import { Position2Attribute } from '../Mesh';
import { Shader } from '../Shader';
import { TexCoordAttribute } from '../Mesh';
import { TextureAtlas } from '../TextureAtlas';
import { Disposable } from '../Utils';
import { VfxManager } from './VfxManager';
import { VfxDefinition, VfxShaderDrawContext } from './types';

const SHADER_VS = /* glsl */ `
attribute vec4 ${Shader.POSITION};
attribute vec2 ${Shader.TEXCOORDS};
varying vec2 v_uv;
uniform mat4 ${Shader.MVP_MATRIX};

void main() {
  v_uv = ${Shader.TEXCOORDS};
  gl_Position = ${Shader.MVP_MATRIX} * ${Shader.POSITION};
}
`;

const ORB_FS = /* glsl */ `
precision mediump float;
varying vec2 v_uv;
uniform float u_time;
uniform float u_alpha;

void main() {
  vec2 p = v_uv * 2.0 - 1.0;
  float r = length(p);
  float angle = atan(p.y, p.x);

  float core = smoothstep(0.34, 0.0, r);
  float halo = smoothstep(0.9, 0.34, r);
  float swirl = 0.5 + 0.5 * sin(angle * 7.0 - u_time * 24.0 + r * 10.0);
  float sparks = pow(max(0.0, sin((angle + u_time * 5.2) * 6.0)), 12.0) * smoothstep(0.75, 0.2, r);

  float alpha = (core * 0.95 + halo * 0.4 * swirl + sparks * 0.6) * u_alpha;
  vec3 color = mix(vec3(1.0, 0.54, 0.14), vec3(1.0, 0.95, 0.8), core);
  color += vec3(1.0, 0.74, 0.26) * sparks * 0.55;

  gl_FragColor = vec4(color, alpha);
}
`;

const TRAIL_FS = /* glsl */ `
precision mediump float;
varying vec2 v_uv;
uniform float u_time;
uniform float u_alpha;

void main() {
  vec2 p = v_uv * 2.0 - 1.0;
  float body = smoothstep(0.26, 0.0, abs(p.y));
  float tail = smoothstep(-1.0, -0.15, p.x);
  float head = smoothstep(0.4, 0.0, length(vec2(p.x - 0.66, p.y * 2.0)));
  float wobble = 0.72 + 0.28 * sin(p.x * 11.0 + p.y * 16.0 - u_time * 18.0);

  float alpha = (body * tail * 0.6 * wobble + head * 1.15) * u_alpha;
  vec3 color = mix(vec3(1.0, 0.38, 0.1), vec3(1.0, 0.9, 0.48), head);
  color += vec3(1.0, 0.62, 0.2) * body * 0.24;

  gl_FragColor = vec4(color, alpha);
}
`;

const LIGHTNING_FS = /* glsl */ `
precision mediump float;
varying vec2 v_uv;
uniform float u_time;
uniform float u_alpha;
uniform float u_rays;
uniform float u_jitter;

float branchCurve(float seed, float x, float t) {
  float wobbleA = sin(x * (7.0 + seed * 9.0) + t * (11.0 + seed * 5.0) + seed * 12.0);
  float wobbleB = sin(x * (15.0 + seed * 11.0) - t * (16.0 + seed * 7.0) + seed * 21.0);
  float jitter = mix(0.25, 1.5, clamp(u_jitter, 0.0, 1.0));
  return wobbleA * (0.05 + seed * 0.08) * jitter + wobbleB * (0.02 + seed * 0.03) * jitter;
}

void main() {
  vec2 p = v_uv * 2.0 - 1.0;
  float x = p.x;
  float y = p.y;
  float pulse = 0.72 + 0.28 * sin(u_time * 42.0);

  // Main bolt core.
  float coreJitter = mix(0.2, 1.2, clamp(u_jitter, 0.0, 1.0));
  float mainCenter = sin(x * 10.0 + u_time * 20.0) * 0.06 * coreJitter;
  float coreDist = abs(y - mainCenter);
  float core = smoothstep(0.06, 0.0, coreDist);
  float glow = smoothstep(0.19, 0.0, coreDist) * 0.45;

  // Branch rays.
  float branches = 0.0;
  const int MAX_RAYS = 12;
  for (int i = 0; i < MAX_RAYS; i++) {
    float fi = float(i);
    if (fi >= u_rays) {
      continue;
    }

    float seed = (fi + 1.0) * 0.137;
    float center = branchCurve(seed, x, u_time);
    float thickness = 0.037 - fi * 0.0016;
    float line = smoothstep(thickness, 0.0, abs(y - center));
    float flicker = 0.55 + 0.45 * sin(u_time * (28.0 + fi * 1.6) + fi * 5.3 + x * 9.0);
    branches += line * flicker;
  }

  float along = smoothstep(-1.0, -0.86, x) * smoothstep(1.0, 0.8, x);
  float alpha = (core * 1.08 + glow + branches * 0.55) * along * pulse * u_alpha;
  vec3 color = mix(vec3(0.18, 0.78, 1.0), vec3(1.0, 1.0, 1.0), core);
  color += vec3(0.28, 0.92, 1.0) * branches * 0.24;

  gl_FragColor = vec4(color, alpha);
}
`;

const IMPACT_FS = /* glsl */ `
precision mediump float;
varying vec2 v_uv;
uniform float u_time;
uniform float u_alpha;

void main() {
  vec2 p = v_uv * 2.0 - 1.0;
  float r = max(length(p), 0.0001);
  float angle = atan(p.y, p.x);

  float burst = smoothstep(0.9, 0.0, r);
  float ring = smoothstep(0.5, 0.34, r) - smoothstep(0.34, 0.2, r);
  float rays = pow(max(0.0, cos(angle * 6.0)), 14.0) * smoothstep(0.95, 0.18, r);
  float t = clamp(u_time, 0.0, 1.0);
  float falloff = 1.0 - t * 0.62;

  float alpha = (burst * 0.72 + ring * 0.95 + rays * 0.5) * falloff * u_alpha;
  vec3 color = mix(vec3(1.0, 0.44, 0.12), vec3(1.0, 0.98, 0.86), burst);
  color += vec3(1.0, 0.8, 0.34) * rays * 0.5;

  gl_FragColor = vec4(color, alpha);
}
`;

const SHOCKWAVE_FS = /* glsl */ `
precision mediump float;
varying vec2 v_uv;
uniform float u_time;
uniform float u_alpha;

void main() {
  vec2 p = v_uv * 2.0 - 1.0;
  float d = length(p);
  float t = clamp(u_time, 0.0, 1.0);
  float radius = 0.16 + t * 0.86;
  float thickness = 0.22 - t * 0.13;
  float ring = smoothstep(radius + thickness, radius, d) - smoothstep(radius, radius - thickness, d);
  float haze = smoothstep(radius + 0.32, radius - 0.06, d) * 0.24;

  float alpha = (ring + haze) * (1.0 - t * 0.55) * u_alpha;
  vec3 color = mix(vec3(0.22, 0.82, 1.0), vec3(1.0, 1.0, 1.0), ring);

  gl_FragColor = vec4(color, alpha);
}
`;

const GROUND_RUNE_FS = /* glsl */ `
precision mediump float;
varying vec2 v_uv;
uniform float u_time;
uniform float u_alpha;

void main() {
  vec2 p = v_uv * 2.0 - 1.0;
  float r = length(p);
  float angle = atan(p.y, p.x);

  float outer = smoothstep(0.98, 0.9, r) - smoothstep(0.9, 0.82, r);
  float inner = smoothstep(0.68, 0.6, r) - smoothstep(0.6, 0.53, r);
  float symbols = smoothstep(0.012, 0.0, abs(sin((angle + u_time * 1.35) * 8.0))) * smoothstep(0.92, 0.25, r);
  float pulse = 0.65 + 0.35 * sin(u_time * 6.28318);

  float alpha = (outer * 0.95 + inner * 0.74 + symbols * 0.5) * pulse * u_alpha;
  vec3 color = mix(vec3(0.18, 0.72, 0.98), vec3(0.56, 0.95, 1.0), symbols);

  gl_FragColor = vec4(color, alpha);
}
`;

const BUFF_HALO_FS = /* glsl */ `
precision mediump float;
varying vec2 v_uv;
uniform float u_time;
uniform float u_alpha;

void main() {
  vec2 p = v_uv * 2.0 - 1.0;
  float r = length(p);
  float angle = atan(p.y, p.x);

  float ring = smoothstep(0.78, 0.68, r) - smoothstep(0.68, 0.58, r);
  float core = smoothstep(0.92, 0.0, r);
  float sweep = smoothstep(0.02, 0.0, abs(sin((angle + u_time * 2.4) * 2.0)));
  float ripple = 0.82 + 0.18 * sin(u_time * 9.5 + r * 11.0);

  float alpha = (ring * (0.86 + sweep * 0.36) + core * 0.22 * ripple) * u_alpha;
  vec3 color = mix(vec3(0.2, 0.95, 0.54), vec3(0.86, 1.0, 0.9), ring + sweep * 0.25);

  gl_FragColor = vec4(color, alpha);
}
`;

const DEBUFF_MARK_FS = /* glsl */ `
precision mediump float;
varying vec2 v_uv;
uniform float u_time;
uniform float u_alpha;

void main() {
  vec2 p = v_uv * 2.0 - 1.0;
  float r = length(p);
  float d1 = abs(p.x - p.y);
  float d2 = abs(p.x + p.y);
  float cross = smoothstep(0.15, 0.0, min(d1, d2));
  float fog = smoothstep(0.9, 0.0, r);
  float flicker = 0.72 + 0.28 * sin(u_time * 18.0 + r * 10.0);

  float alpha = (cross * 0.95 + fog * 0.2) * flicker * u_alpha;
  vec3 color = mix(vec3(1.0, 0.22, 0.22), vec3(1.0, 0.72, 0.18), cross * 0.4);

  gl_FragColor = vec4(color, alpha);
}
`;

const SLASH_FS = /* glsl */ `
precision mediump float;
varying vec2 v_uv;
uniform float u_time;
uniform float u_alpha;

void main() {
  vec2 p = v_uv * 2.0 - 1.0;
  float diagonal = abs(p.y + p.x * 0.34);
  float slash = smoothstep(0.2, 0.0, diagonal);
  float tip = smoothstep(1.0, 0.25, p.x);
  float trail = smoothstep(-0.95, -0.1, p.x);
  float pulse = 0.65 + 0.35 * sin((u_time * 10.0) - p.x * 8.0);

  float t = clamp(u_time, 0.0, 1.0);
  float alpha = slash * tip * trail * (0.55 + pulse * 0.45) * (1.0 - t * 0.35) * u_alpha;
  vec3 color = mix(vec3(0.92, 0.98, 1.0), vec3(0.36, 0.86, 1.0), abs(p.y));

  gl_FragColor = vec4(color, alpha);
}
`;

const SKY_SWORD_FS = /* glsl */ `
precision mediump float;
varying vec2 v_uv;
uniform float u_time;
uniform float u_alpha;

void main() {
  float x = abs(v_uv.x - 0.5);
  float core = smoothstep(0.22, 0.0, x);
  float glow = smoothstep(0.48, 0.0, x);
  float body = smoothstep(0.0, 0.16, v_uv.y) * smoothstep(1.0, 0.6, v_uv.y);
  float pulse = 0.78 + 0.22 * sin(u_time * 30.0);
  float crown = smoothstep(0.22, 0.0, distance(v_uv, vec2(0.5, 0.92)));

  vec3 color = mix(vec3(0.2, 0.75, 1.0), vec3(1.0), core);
  float alpha = (core * pulse + glow * 0.32 + crown * 0.95) * body * u_alpha;

  gl_FragColor = vec4(color, alpha);
}
`;

type BlendMode = 'alpha' | 'additive';

type ShaderQuadDrawOptions = {
  projection: Float32Array;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  rotationDeg?: number;
  time: number;
  alpha: number;
  blendMode?: BlendMode;
  beforeDraw?: (shader: Shader) => void;
};

class ShaderQuadRenderer implements Disposable {
  private mesh: Mesh;
  private shader: Shader;

  constructor(
    private gl: WebGLRenderingContext,
    fragmentSource: string
  ) {
    this.mesh = new Mesh(gl, [new Position2Attribute(), new TexCoordAttribute()], 4, 6);
    this.mesh.setIndices([0, 1, 2, 2, 3, 0]);
    this.shader = new Shader(gl, SHADER_VS, fragmentSource);
  }

  draw(options: ShaderQuadDrawOptions) {
    const halfW = options.width * 0.5;
    const halfH = options.height * 0.5;
    const angle = ((options.rotationDeg ?? 0) * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const rotate = (x: number, y: number): [number, number] => {
      const rx = x * cos - y * sin + options.centerX;
      const ry = x * sin + y * cos + options.centerY;
      return [rx, ry];
    };

    const [x1, y1] = rotate(-halfW, -halfH);
    const [x2, y2] = rotate(halfW, -halfH);
    const [x3, y3] = rotate(halfW, halfH);
    const [x4, y4] = rotate(-halfW, halfH);

    const vertices = this.mesh.getVertices();
    let i = 0;
    vertices[i++] = x1;
    vertices[i++] = y1;
    vertices[i++] = 0;
    vertices[i++] = 0;

    vertices[i++] = x2;
    vertices[i++] = y2;
    vertices[i++] = 1;
    vertices[i++] = 0;

    vertices[i++] = x3;
    vertices[i++] = y3;
    vertices[i++] = 1;
    vertices[i++] = 1;

    vertices[i++] = x4;
    vertices[i++] = y4;
    vertices[i++] = 0;
    vertices[i++] = 1;
    this.mesh.setVerticesLength(i);

    this.shader.bind();
    this.shader.setUniform4x4f(Shader.MVP_MATRIX, options.projection);
    this.shader.setUniformf('u_time', options.time);
    this.shader.setUniformf('u_alpha', options.alpha);
    options.beforeDraw?.(this.shader);

    this.gl.enable(this.gl.BLEND);
    if (options.blendMode === 'additive') {
      this.gl.blendFuncSeparate(this.gl.SRC_ALPHA, this.gl.ONE, this.gl.ONE, this.gl.ONE);
    } else {
      this.gl.blendFuncSeparate(
        this.gl.SRC_ALPHA,
        this.gl.ONE_MINUS_SRC_ALPHA,
        this.gl.ONE,
        this.gl.ONE_MINUS_SRC_ALPHA
      );
    }

    this.mesh.draw(this.shader, this.gl.TRIANGLES);
  }

  dispose() {
    this.mesh.dispose();
    this.shader.dispose();
  }
}

const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const angleDeg = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
};

export const STANDARD_VFX_IDS = {
  projectileTrail: 'std.projectile.trail',
  lightningBolt: 'std.lightning.bolt',
  hitImpact: 'std.hit.impact',
  meleeJumpSlash: 'std.melee.jump_slash',
  areaBurst: 'std.area.burst',
  groundAura: 'std.ground.aura',
  buffAura: 'std.buff.aura',
  statusDebuff: 'std.status.debuff',
  skySword: 'std.sky.sword'
} as const;

export type StandardVfxId = (typeof STANDARD_VFX_IDS)[keyof typeof STANDARD_VFX_IDS];

export interface StandardVfxLibraryOptions {
  gl: WebGLRenderingContext;
  projection: () => Float32Array;
  particleAtlas: TextureAtlas;
  lightningRayCount?: () => number;
  lightningJitter?: () => number;
}

export interface StandardVfxLibrary extends Disposable {
  ids: typeof STANDARD_VFX_IDS;
}

export const installStandardVfxLibrary = async (
  vfx: VfxManager,
  options: StandardVfxLibraryOptions
): Promise<StandardVfxLibrary> => {
  const { gl, projection, particleAtlas } = options;
  const getLightningRayCount = options.lightningRayCount ?? (() => 4);
  const getLightningJitter = options.lightningJitter ?? (() => 0.55);

  await Promise.all([
    vfx.loadParticleTemplate(
      'std.trail_soft',
      {
        effectFile: './vfx/CloudTrailSoft.p',
        flipY: true,
        poolMin: 24,
        poolMax: 280
      },
      particleAtlas
    ),
    vfx.loadParticleTemplate(
      'std.burst_soft',
      {
        effectFile: './vfx/CloudBurstSoft.p',
        flipY: true,
        poolMin: 24,
        poolMax: 280
      },
      particleAtlas
    ),
    vfx.loadParticleTemplate(
      'std.ground_mist',
      {
        effectFile: './vfx/CloudGroundMist.p',
        flipY: true,
        poolMin: 18,
        poolMax: 220
      },
      particleAtlas
    )
  ]);

  const orbRenderer = new ShaderQuadRenderer(gl, ORB_FS);
  const trailRenderer = new ShaderQuadRenderer(gl, TRAIL_FS);
  const lightningRenderer = new ShaderQuadRenderer(gl, LIGHTNING_FS);
  const impactRenderer = new ShaderQuadRenderer(gl, IMPACT_FS);
  const shockwaveRenderer = new ShaderQuadRenderer(gl, SHOCKWAVE_FS);
  const groundRuneRenderer = new ShaderQuadRenderer(gl, GROUND_RUNE_FS);
  const buffHaloRenderer = new ShaderQuadRenderer(gl, BUFF_HALO_FS);
  const debuffRenderer = new ShaderQuadRenderer(gl, DEBUFF_MARK_FS);
  const slashRenderer = new ShaderQuadRenderer(gl, SLASH_FS);
  const skySwordRenderer = new ShaderQuadRenderer(gl, SKY_SWORD_FS);

  vfx.registerShaderRenderer('std.orb', {
    draw: (ctx: VfxShaderDrawContext) => {
      orbRenderer.draw({
        projection: projection(),
        centerX: ctx.position.x,
        centerY: ctx.position.y,
        width: ctx.width * ctx.scaleX,
        height: ctx.height * ctx.scaleY,
        time: ctx.localTime,
        alpha: ctx.alpha,
        blendMode: 'additive'
      });
    }
  });

  vfx.registerShaderRenderer('std.trail', {
    draw: (ctx: VfxShaderDrawContext) => {
      const length = distance(ctx.source, ctx.motion);
      if (length < 2) {
        return;
      }

      const centerX = ctx.source.x + (ctx.motion.x - ctx.source.x) * 0.5;
      const centerY = ctx.source.y + (ctx.motion.y - ctx.source.y) * 0.5;
      trailRenderer.draw({
        projection: projection(),
        centerX,
        centerY,
        width: Math.max(length + 42, 70),
        height: ctx.height * ctx.scaleY,
        rotationDeg: angleDeg(ctx.source, ctx.motion),
        time: ctx.localTime,
        alpha: ctx.alpha,
        blendMode: 'additive'
      });
    }
  });

  vfx.registerShaderRenderer('std.lightning', {
    draw: (ctx: VfxShaderDrawContext) => {
      const length = distance(ctx.source, ctx.motion);
      if (length < 2) {
        return;
      }
      const rays = Math.max(1, Math.min(12, Math.round(getLightningRayCount())));
      const centerX = ctx.source.x + (ctx.motion.x - ctx.source.x) * 0.5;
      const centerY = ctx.source.y + (ctx.motion.y - ctx.source.y) * 0.5;
      lightningRenderer.draw({
        projection: projection(),
        centerX,
        centerY,
        width: Math.max(length + 34, 70),
        height: ctx.height * ctx.scaleY,
        rotationDeg: angleDeg(ctx.source, ctx.motion),
        time: ctx.localTime,
        alpha: ctx.alpha,
        blendMode: 'additive',
        beforeDraw: shader => {
          shader.setUniformf('u_rays', rays);
          shader.setUniformf('u_jitter', Math.max(0, Math.min(1, getLightningJitter())));
        }
      });
    }
  });

  vfx.registerShaderRenderer('std.impact', {
    draw: (ctx: VfxShaderDrawContext) => {
      impactRenderer.draw({
        projection: projection(),
        centerX: ctx.position.x,
        centerY: ctx.position.y,
        width: ctx.width * ctx.scaleX,
        height: ctx.height * ctx.scaleY,
        time: ctx.normalizedTime,
        alpha: ctx.alpha,
        blendMode: 'additive'
      });
    }
  });

  vfx.registerShaderRenderer('std.shockwave', {
    draw: (ctx: VfxShaderDrawContext) => {
      shockwaveRenderer.draw({
        projection: projection(),
        centerX: ctx.position.x,
        centerY: ctx.position.y,
        width: ctx.width * ctx.scaleX,
        height: ctx.height * ctx.scaleY,
        time: ctx.normalizedTime,
        alpha: ctx.alpha
      });
    }
  });

  vfx.registerShaderRenderer('std.ground_rune', {
    draw: (ctx: VfxShaderDrawContext) => {
      groundRuneRenderer.draw({
        projection: projection(),
        centerX: ctx.position.x,
        centerY: ctx.position.y,
        width: ctx.width * ctx.scaleX,
        height: ctx.height * ctx.scaleY,
        time: ctx.localTime,
        alpha: ctx.alpha,
        blendMode: 'additive'
      });
    }
  });

  vfx.registerShaderRenderer('std.buff_halo', {
    draw: (ctx: VfxShaderDrawContext) => {
      buffHaloRenderer.draw({
        projection: projection(),
        centerX: ctx.position.x,
        centerY: ctx.position.y,
        width: ctx.width * ctx.scaleX,
        height: ctx.height * ctx.scaleY,
        time: ctx.localTime,
        alpha: ctx.alpha,
        blendMode: 'additive'
      });
    }
  });

  vfx.registerShaderRenderer('std.status_mark', {
    draw: (ctx: VfxShaderDrawContext) => {
      debuffRenderer.draw({
        projection: projection(),
        centerX: ctx.position.x,
        centerY: ctx.position.y,
        width: ctx.width * ctx.scaleX,
        height: ctx.height * ctx.scaleY,
        time: ctx.localTime,
        alpha: ctx.alpha,
        blendMode: 'additive'
      });
    }
  });

  vfx.registerShaderRenderer('std.slash', {
    draw: (ctx: VfxShaderDrawContext) => {
      slashRenderer.draw({
        projection: projection(),
        centerX: ctx.position.x,
        centerY: ctx.position.y,
        width: ctx.width * ctx.scaleX,
        height: ctx.height * ctx.scaleY,
        rotationDeg: angleDeg(ctx.source, ctx.target),
        time: ctx.normalizedTime,
        alpha: ctx.alpha,
        blendMode: 'additive'
      });
    }
  });

  vfx.registerShaderRenderer('std.sky_sword', {
    draw: (ctx: VfxShaderDrawContext) => {
      skySwordRenderer.draw({
        projection: projection(),
        centerX: ctx.position.x,
        centerY: ctx.position.y - (ctx.height * ctx.scaleY) * 0.5,
        width: ctx.width * ctx.scaleX,
        height: ctx.height * ctx.scaleY,
        time: ctx.localTime,
        alpha: ctx.alpha,
        blendMode: 'additive'
      });
    }
  });

  const definitions: VfxDefinition[] = [
    {
      id: STANDARD_VFX_IDS.projectileTrail,
      duration: 0.86,
      motion: { from: 'source', to: 'target', duration: 0.56, easing: 'easeOutCubic' },
      layers: [
        {
          kind: 'shader',
          pass: 'behind',
          shaderKey: 'std.trail',
          point: 'motion',
          height: 74,
          duration: 0.56,
          alpha: 0.92
        },
        {
          kind: 'particle',
          pass: 'behind',
          templateKey: 'std.trail_soft',
          point: 'motion',
          followMotion: true,
          duration: 0.58,
          scaleX: 0.36,
          scaleY: 0.36
        },
        {
          kind: 'shader',
          pass: 'front',
          shaderKey: 'std.orb',
          point: 'motion',
          width: 92,
          height: 92,
          duration: 0.56,
          alpha: 0.96
        },
        {
          kind: 'shader',
          pass: 'front',
          shaderKey: 'std.impact',
          point: 'target',
          startTime: 0.52,
          duration: 0.24,
          width: 170,
          height: 170,
          alpha: 0.96
        },
        {
          kind: 'particle',
          pass: 'front',
          templateKey: 'std.burst_soft',
          point: 'target',
          startTime: 0.5,
          duration: 0.32,
          scaleX: 0.5,
          scaleY: 0.5
        }
      ]
    },
    {
      id: STANDARD_VFX_IDS.lightningBolt,
      duration: 0.84,
      motion: { from: 'source', to: 'target', duration: 0.54, easing: 'easeOutCubic' },
      layers: [
        {
          kind: 'shader',
          pass: 'behind',
          shaderKey: 'std.lightning',
          point: 'motion',
          duration: 0.54,
          height: 118,
          alpha: 0.96
        },
        {
          kind: 'particle',
          pass: 'behind',
          templateKey: 'std.trail_soft',
          point: 'motion',
          followMotion: true,
          duration: 0.58,
          scaleX: 0.24,
          scaleY: 0.24
        },
        {
          kind: 'shader',
          pass: 'front',
          shaderKey: 'std.impact',
          point: 'target',
          startTime: 0.5,
          duration: 0.3,
          width: 205,
          height: 205,
          alpha: 0.88
        },
        {
          kind: 'shader',
          pass: 'behind',
          shaderKey: 'std.shockwave',
          point: 'target',
          startTime: 0.52,
          duration: 0.28,
          width: 260,
          height: 260,
          alpha: 0.8
        }
      ]
    },
    {
      id: STANDARD_VFX_IDS.hitImpact,
      duration: 0.72,
      layers: [
        {
          kind: 'shader',
          pass: 'behind',
          shaderKey: 'std.shockwave',
          point: 'position',
          width: 250,
          height: 250,
          duration: 0.46,
          alpha: 1
        },
        {
          kind: 'shader',
          pass: 'front',
          shaderKey: 'std.impact',
          point: 'position',
          width: 220,
          height: 220,
          duration: 0.5,
          alpha: 1
        },
        {
          kind: 'particle',
          pass: 'front',
          templateKey: 'std.burst_soft',
          point: 'position',
          startTime: 0.02,
          duration: 0.52,
          scaleX: 0.62,
          scaleY: 0.62
        }
      ]
    },
    {
      id: STANDARD_VFX_IDS.meleeJumpSlash,
      duration: 1.12,
      motion: { from: 'source', to: 'target', duration: 0.44, easing: 'easeOutCubic' },
      layers: [
        {
          kind: 'particle',
          pass: 'behind',
          templateKey: 'std.burst_soft',
          point: 'source',
          duration: 0.24,
          scaleX: 0.48,
          scaleY: 0.48
        },
        {
          kind: 'shader',
          pass: 'behind',
          shaderKey: 'std.trail',
          point: 'motion',
          startTime: 0.06,
          duration: 0.32,
          height: 74,
          alpha: 0.84
        },
        {
          kind: 'shader',
          pass: 'front',
          shaderKey: 'std.slash',
          point: 'motion',
          startTime: 0.06,
          duration: 0.4,
          width: 252,
          height: 136,
          alpha: 1
        },
        {
          kind: 'shader',
          pass: 'front',
          shaderKey: 'std.impact',
          point: 'target',
          startTime: 0.42,
          duration: 0.44,
          width: 226,
          height: 226,
          alpha: 1
        },
        {
          kind: 'shader',
          pass: 'behind',
          shaderKey: 'std.shockwave',
          point: 'target',
          startTime: 0.44,
          duration: 0.42,
          width: 272,
          height: 272,
          alpha: 0.9
        },
        {
          kind: 'particle',
          pass: 'front',
          templateKey: 'std.burst_soft',
          point: 'target',
          startTime: 0.4,
          duration: 0.46,
          scaleX: 0.72,
          scaleY: 0.72
        }
      ]
    },
    {
      id: STANDARD_VFX_IDS.areaBurst,
      duration: 1.05,
      layers: [
        {
          kind: 'shader',
          pass: 'behind',
          shaderKey: 'std.shockwave',
          point: 'position',
          width: 360,
          height: 360,
          duration: 0.58,
          alphaFrom: 1,
          alphaTo: 0.18,
          scaleFrom: 0.32,
          scaleTo: 1
        },
        {
          kind: 'shader',
          pass: 'behind',
          shaderKey: 'std.ground_rune',
          point: 'position',
          width: 290,
          height: 290,
          startTime: 0.02,
          duration: 0.88,
          alpha: 0.78,
          scaleFrom: 0.35,
          scaleTo: 1.2
        },
        {
          kind: 'shader',
          pass: 'front',
          shaderKey: 'std.impact',
          point: 'position',
          startTime: 0.04,
          duration: 0.34,
          width: 210,
          height: 210,
          alpha: 0.96
        },
        {
          kind: 'particle',
          pass: 'front',
          templateKey: 'std.burst_soft',
          point: 'position',
          startTime: 0.04,
          duration: 0.6,
          scaleX: 0.84,
          scaleY: 0.84
        },
        {
          kind: 'particle',
          pass: 'behind',
          templateKey: 'std.ground_mist',
          point: 'position',
          startTime: 0.1,
          duration: 0.82,
          scaleX: 0.5,
          scaleY: 0.5
        }
      ]
    },
    {
      id: STANDARD_VFX_IDS.groundAura,
      duration: 2.8,
      layers: [
        {
          kind: 'shader',
          pass: 'behind',
          shaderKey: 'std.ground_rune',
          point: 'position',
          width: 260,
          height: 180,
          duration: 2.8,
          loop: true,
          alpha: 0.82
        },
        {
          kind: 'particle',
          pass: 'behind',
          templateKey: 'std.ground_mist',
          point: 'position',
          duration: 2.8,
          scaleX: 0.58,
          scaleY: 0.58
        }
      ]
    },
    {
      id: STANDARD_VFX_IDS.buffAura,
      duration: 2.25,
      layers: [
        {
          kind: 'shader',
          pass: 'behind',
          shaderKey: 'std.ground_rune',
          point: 'position',
          offsetY: 52,
          width: 190,
          height: 120,
          duration: 2.25,
          loop: true,
          alpha: 0.64
        },
        {
          kind: 'shader',
          pass: 'front',
          shaderKey: 'std.buff_halo',
          point: 'position',
          width: 190,
          height: 190,
          duration: 2.25,
          loop: true,
          alpha: 0.95
        },
        {
          kind: 'particle',
          pass: 'front',
          templateKey: 'std.trail_soft',
          point: 'position',
          offsetY: -36,
          duration: 2.25,
          scaleX: 0.2,
          scaleY: 0.2
        }
      ]
    },
    {
      id: STANDARD_VFX_IDS.statusDebuff,
      duration: 2.0,
      layers: [
        {
          kind: 'shader',
          pass: 'behind',
          shaderKey: 'std.shockwave',
          point: 'position',
          width: 170,
          height: 170,
          duration: 0.24,
          alpha: 0.5
        },
        {
          kind: 'shader',
          pass: 'front',
          shaderKey: 'std.status_mark',
          point: 'position',
          offsetY: -74,
          width: 140,
          height: 140,
          duration: 2.0,
          loop: true,
          alpha: 0.95
        },
        {
          kind: 'particle',
          pass: 'front',
          templateKey: 'std.ground_mist',
          point: 'position',
          duration: 2.0,
          scaleX: 0.34,
          scaleY: 0.34
        }
      ]
    },
    {
      id: STANDARD_VFX_IDS.skySword,
      duration: 1.12,
      layers: [
        {
          kind: 'shader',
          pass: 'front',
          shaderKey: 'std.sky_sword',
          point: 'target',
          width: 92,
          height: 600,
          duration: 0.78,
          alpha: 0.96
        },
        {
          kind: 'shader',
          pass: 'front',
          shaderKey: 'std.impact',
          point: 'target',
          startTime: 0.52,
          duration: 0.28,
          width: 230,
          height: 230,
          alpha: 0.95
        },
        {
          kind: 'shader',
          pass: 'behind',
          shaderKey: 'std.shockwave',
          point: 'target',
          startTime: 0.56,
          duration: 0.34,
          width: 310,
          height: 310,
          alpha: 0.85
        },
        {
          kind: 'particle',
          pass: 'front',
          templateKey: 'std.burst_soft',
          point: 'target',
          startTime: 0.54,
          duration: 0.36,
          scaleX: 0.72,
          scaleY: 0.72
        }
      ]
    }
  ];

  vfx.registerDefinitions(definitions);

  return {
    ids: STANDARD_VFX_IDS,
    dispose() {
      orbRenderer.dispose();
      trailRenderer.dispose();
      lightningRenderer.dispose();
      impactRenderer.dispose();
      shockwaveRenderer.dispose();
      groundRuneRenderer.dispose();
      buffHaloRenderer.dispose();
      debuffRenderer.dispose();
      slashRenderer.dispose();
      skySwordRenderer.dispose();
    }
  };
};
