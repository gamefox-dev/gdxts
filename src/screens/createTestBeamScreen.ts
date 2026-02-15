import { YDOWN } from '..';
import {
  Disposable,
  Mesh,
  Position2Attribute,
  Screen,
  Shader,
  TexCoordAttribute,
  Vector2,
  VertexAttribute,
  VertexAttributeType,
  Viewport,
  ViewportInputHandler
} from '../lib';

const VS = /* glsl */ `
  attribute vec4 ${Shader.POSITION};
  attribute vec2 ${Shader.TEXCOORDS};
  attribute vec2 a_start;
  attribute vec2 a_end;
  attribute float a_time;

  varying vec2 v_texCoord;
  varying vec2 v_start;
  varying vec2 v_end;
  varying float v_time;

  uniform mat4 ${Shader.MVP_MATRIX};
  void main() {
    v_texCoord = ${Shader.TEXCOORDS};
    gl_Position = ${Shader.MVP_MATRIX} * ${Shader.POSITION};
    v_start = a_start;
    v_end = a_end;
    v_time = a_time;
  }
`;

const FS = /* glsl */ `
  precision mediump float;

  varying vec2 v_texCoord;
  varying vec2 v_start;
  varying vec2 v_end;
  varying float v_time;

  uniform vec2 u_resolution;
  uniform vec3 u_timings;
  uniform vec3 u_style;

  void main() {
    vec2 uv = (v_texCoord - 0.5 * u_resolution.xy) / u_resolution.y;
    vec2 mouse = (v_end - 0.5 * u_resolution.xy) / u_resolution.y;
    vec2 center = (v_start - 0.5 * u_resolution.xy) / u_resolution.y;

    float iTime = v_time;

    float growDuration = u_timings.x;
    float lingerDuration = u_timings.y;
    float fadeDuration = u_timings.z;
    float totalDuration = growDuration + lingerDuration + fadeDuration;

    float coreThickness = u_style.x;
    float beamThickness = u_style.y;
    float glowThickness = u_style.z;

    vec2 beamDir = normalize(mouse - center);
    float targetLength = length(mouse - center);

    float localTime = mod(iTime, totalDuration);

    float currentLength;
    float fade = 1.0;
    float rootIntensity = 1.0;
    float impactIntensity = 0.0;

    if (localTime < growDuration) {
      currentLength = targetLength * (localTime / growDuration);
      fade = 1.0;
      rootIntensity = 1.0;
      impactIntensity = 0.0;
    } else if (localTime < growDuration + lingerDuration) {
      currentLength = targetLength;
      fade = 1.0;
      rootIntensity = 1.0;
      float lingerTime = (localTime - growDuration) / lingerDuration;
      impactIntensity = 1.0 + 0.2 * sin(lingerTime * 30.0);
    } else {
      currentLength = targetLength;
      float fadeTime = localTime - (growDuration + lingerDuration);
      fade = 1.0 - (fadeTime / fadeDuration);
      rootIntensity = fade;
      impactIntensity = fade * 0.5;
    }

    vec2 p = uv - center;
    float h = clamp(dot(p, beamDir) / currentLength, 0.0, 1.0);
    vec2 projection = center + beamDir * h * currentLength;
    float dist = length(uv - projection);

    float core = smoothstep(coreThickness, 0.0, dist);
    float beam = smoothstep(beamThickness + glowThickness, beamThickness, dist);

    float rootRadius = 0.03;
    float rootGlow = 0.03;
    float distFromRoot = length(uv - center);
    float rootAlpha = smoothstep(rootRadius + rootGlow, rootRadius * 0.5, distFromRoot);
    float rootCore = smoothstep(rootRadius * 0.5, 0.0, distFromRoot);

    vec2 targetPos = center + beamDir * currentLength;
    float distFromTarget = length(uv - targetPos);
    float impactRadius = 0.01;
    float impactGlow = 0.05;

    float ringSize = impactRadius * (1.0 + 0.3 * sin(localTime * 10.0));
    float ringThickness = 0.005;
    float ring =
      smoothstep(ringSize + ringThickness, ringSize, distFromTarget) -
      smoothstep(ringSize, ringSize - ringThickness, distFromTarget);

    float impactCore = smoothstep(impactRadius + impactGlow, impactRadius, distFromTarget);
    float impact = impactCore + ring * 0.5;

    float rootFade = 1.0;
    if (localTime >= growDuration + lingerDuration) {
      float fadeTime = localTime - (growDuration + lingerDuration);
      float fadeProgress = fadeTime / fadeDuration;
      rootFade = smoothstep(fadeProgress, fadeProgress + 0.2, h);
    }

    vec3 beamColor = mix(
      vec3(0.2, 0.6, 1.0),
      vec3(0.1, 0.3, 1.0),
      dist / (beamThickness + glowThickness)
    );

    vec3 col = mix(beamColor, vec3(1.0), core) * beam * fade * rootFade;

    float bloom = smoothstep(beamThickness + glowThickness, beamThickness, dist * 0.5);
    col += beamColor * bloom * 0.5 * fade * rootFade;

    vec3 rootCol = mix(beamColor, vec3(1.0), rootCore);
    vec3 finalCol = col;
    if (rootAlpha > 0.0) {
      finalCol = mix(col, rootCol, rootAlpha * rootIntensity);
    }

    vec3 impactCol = mix(beamColor * 1.5, vec3(1.0), 0.5);
    finalCol += impactCol * impact * impactIntensity;

    float alpha = max(max(beam * fade * rootFade, rootAlpha * rootIntensity), impact * impactIntensity);

    gl_FragColor = vec4(finalCol, alpha);
  }
`;

class BeamRenderer implements Disposable {
  mesh: Mesh;
  shader: Shader;

  projectionValues: Float32Array = new Float32Array(16);
  setProjection(projectionValues: Float32Array) {
    this.projectionValues = projectionValues;
  }

  growDuration = 0.2;
  lingerDuration = 0.5;
  fadeDuration = 0.3;
  setTimings(growDuration: number, lingerDuration: number, fadeDuration: number) {
    this.growDuration = growDuration;
    this.lingerDuration = lingerDuration;
    this.fadeDuration = fadeDuration;
  }

  coreThickness = 0.003;
  beamThickness = 0.004;
  glowThickness = 0.02;
  setStyle(coreThickness: number, beamThickness: number, glowThickness: number) {
    this.coreThickness = coreThickness;
    this.beamThickness = beamThickness;
    this.glowThickness = glowThickness;
  }

  constructor(
    private gl: WebGLRenderingContext,
    private screenWidth: number,
    private screenHeight: number
  ) {
    const maxVertices = 10920;
    this.mesh = new Mesh(
      gl,
      [
        new Position2Attribute(),
        new TexCoordAttribute(),
        new VertexAttribute('a_start', VertexAttributeType.Float, 2),
        new VertexAttribute('a_end', VertexAttributeType.Float, 2),
        new VertexAttribute('a_time', VertexAttributeType.Float, 1)
      ],
      maxVertices,
      0
    );
    this.shader = new Shader(gl, VS, FS);
  }

  isDrawing = false;
  vertexIndex = 0;
  begin() {
    if (this.isDrawing) {
      throw new Error('BeamRenderer.begin() has already been called');
    }
    this.vertexIndex = 0;
    this.isDrawing = true;

    this.shader.bind();
    this.shader.setUniform4x4f(Shader.MVP_MATRIX, this.projectionValues);
    this.shader.setUniform2f('u_resolution', this.screenWidth, this.screenHeight);
    this.shader.setUniform3f('u_timings', this.growDuration, this.lingerDuration, this.fadeDuration);
    this.shader.setUniform3f('u_style', this.coreThickness, this.beamThickness, this.glowThickness);

    const gl = this.gl;
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  }

  private vertex(
    x: number,
    y: number,
    u: number,
    v: number,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    time: number
  ) {
    let idx = this.vertexIndex;
    const vertices = this.mesh.getVertices();
    vertices[idx++] = x;
    vertices[idx++] = y;
    vertices[idx++] = u;
    vertices[idx++] = v;
    vertices[idx++] = startX;
    vertices[idx++] = startY;
    vertices[idx++] = endX;
    vertices[idx++] = endY;
    vertices[idx++] = time;
    this.vertexIndex = idx;
    if (this.vertexIndex >= vertices.length) {
      this.flush();
    }
  }

  draw(startX: number, startY: number, endX: number, endY: number, time: number) {
    if (!this.isDrawing) {
      throw new Error('BeamRenderer.begin() has not been called');
    }

    this.vertex(0, 0, 0, 0, startX, startY, endX, endY, time);
    this.vertex(this.screenWidth, 0, this.screenWidth, 0, startX, startY, endX, endY, time);
    this.vertex(0, this.screenHeight, 0, this.screenHeight, startX, startY, endX, endY, time);

    this.vertex(this.screenWidth, 0, this.screenWidth, 0, startX, startY, endX, endY, time);
    this.vertex(0, this.screenHeight, 0, this.screenHeight, startX, startY, endX, endY, time);
    this.vertex(
      this.screenWidth,
      this.screenHeight,
      this.screenWidth,
      this.screenHeight,
      startX,
      startY,
      endX,
      endY,
      time
    );
  }

  end() {
    if (!this.isDrawing) {
      throw new Error('BeamRenderer.begin() has not been called');
    }
    this.flush();
    this.gl.disable(this.gl.BLEND);
    this.isDrawing = false;
  }

  flush() {
    if (this.vertexIndex === 0) {
      return;
    }
    this.mesh.setVerticesLength(this.vertexIndex);
    this.mesh.draw(this.shader, this.gl.TRIANGLES);
    this.vertexIndex = 0;
  }

  dispose() {
    this.mesh.dispose();
    this.shader.dispose();
  }
}

export const createTestBeamScreen = async (viewport: Viewport): Promise<Screen> => {
  const gl = viewport.getContext();
  const camera = viewport.getCamera();
  camera.setYDown(YDOWN);

  const worldWidth = camera.viewportWidth;
  const worldHeight = camera.viewportHeight;
  const centerX = worldWidth / 2;
  const centerY = worldHeight / 2;

  const beamRenderer = new BeamRenderer(gl, worldWidth, worldHeight);
  beamRenderer.setStyle(0.002, 0.002, 0.01);

  const inputHandler = new ViewportInputHandler(viewport);
  const beamTarget = new Vector2(centerX, centerY);

  const timeOffsets: number[] = [];
  const beamTargets = Array.from({ length: 49 }, () => {
    timeOffsets.push(Math.random() * 0.5 + 1);
    return new Vector2((Math.random() * worldWidth) / 2, (Math.random() * worldHeight) / 2);
  });

  let stateTime = 0;

  return {
    update(delta) {
      if (inputHandler.isTouched()) {
        beamTarget.setVector(inputHandler.getTouchedWorldCoord(camera));
        stateTime = 0;
      }

      stateTime += delta;

      beamRenderer.setProjection(camera.combined);
      beamRenderer.begin();
      beamRenderer.draw(centerX, centerY, beamTarget.x, beamTarget.y, stateTime);
      for (let i = 0; i < beamTargets.length; i++) {
        const beam = beamTargets[i];
        const timeOffset = timeOffsets[i];
        beamRenderer.draw(centerX, centerY, beam.x, beam.y, stateTime * timeOffset);
      }
      beamRenderer.end();
    },
    dispose() {
      beamRenderer.dispose();
      inputHandler.cleanup();
    }
  };
};
