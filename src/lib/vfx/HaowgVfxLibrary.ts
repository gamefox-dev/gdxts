import { Mesh, Position2Attribute, TexCoordAttribute } from '../Mesh';
import { Shader } from '../Shader';
import { TextureAtlas } from '../TextureAtlas';
import { TextureRegion } from '../TextureRegion';
import { Disposable } from '../Utils';
import { VfxManager } from './VfxManager';
import { VfxDefinition, VfxShaderDrawContext, VfxShaderLayer } from './types';

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

// Source-faithful CPUParticles-style simulation kernel used by HAOWG .tscn effects.
const HAOWG_EFFECT_FS = /* glsl */ `
precision mediump float;

varying vec2 v_uv;

uniform float u_time;
uniform float u_alpha;
uniform vec2 u_quadSize;

uniform float u_simCount;
uniform float u_densityScale;
uniform float u_lifetime;
uniform float u_oneShot;
uniform float u_explosiveness;
uniform float u_preprocess;
uniform float u_randomness;

uniform float u_emissionShape;
uniform float u_emissionRadius;
uniform vec2 u_emissionExtents;
uniform float u_emissionRingRadius;
uniform float u_emissionRingInnerRadius;

uniform vec2 u_direction;
uniform float u_spreadRad;
uniform vec2 u_gravity;
uniform vec2 u_velocityRange;
uniform vec2 u_dampingRange;
uniform vec2 u_angularVelRange;
uniform vec2 u_radialAccelRange;
uniform vec2 u_tangentAccelRange;
uniform vec2 u_scaleRange;
uniform float u_baseSize;

uniform vec4 u_stopVec;
uniform vec4 u_col0;
uniform vec4 u_col1;
uniform vec4 u_col2;
uniform vec4 u_col3;

uniform float u_curveStart;
uniform float u_curveMidT;
uniform float u_curveMid;
uniform float u_curveEnd;

uniform float u_spriteKind;
uniform float u_useSpriteTexture;
uniform vec4 u_spriteUv;
uniform sampler2D u_spriteTex;

float hash1(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

vec2 hash2(float p) {
  return vec2(hash1(p + 1.123), hash1(p + 8.739));
}

vec2 rotate2(vec2 value, float rad) {
  float s = sin(rad);
  float c = cos(rad);
  return vec2(value.x * c - value.y * s, value.x * s + value.y * c);
}

float curveSample(float t) {
  float mt = clamp(u_curveMidT, 0.01, 0.99);
  if (t <= mt) {
    float a = t / mt;
    return mix(u_curveStart, u_curveMid, a);
  }

  float b = (t - mt) / (1.0 - mt);
  return mix(u_curveMid, u_curveEnd, b);
}

vec4 rampSample(float t) {
  float s0 = u_stopVec.x;
  float s1 = max(s0, u_stopVec.y);
  float s2 = max(s1, u_stopVec.z);
  float s3 = max(s2, u_stopVec.w);

  if (t <= s1) {
    float a = (t - s0) / max(s1 - s0, 0.0001);
    return mix(u_col0, u_col1, clamp(a, 0.0, 1.0));
  }

  if (t <= s2) {
    float b = (t - s1) / max(s2 - s1, 0.0001);
    return mix(u_col1, u_col2, clamp(b, 0.0, 1.0));
  }

  float c = (t - s2) / max(s3 - s2, 0.0001);
  return mix(u_col2, u_col3, clamp(c, 0.0, 1.0));
}

float shapeMask(vec2 rel, float size, float spriteKind, float spin) {
  vec2 q = rotate2(rel, -spin);

  if (spriteKind < 0.5) {
    float d = length(q);
    return smoothstep(size, size * 0.18, d);
  }

  if (spriteKind < 1.5) {
    vec2 n = vec2(q.x / max(size * 0.7, 0.001), q.y / max(size, 0.001));
    float d2 = dot(n, n);
    float leaf = smoothstep(1.1, 0.15, d2);
    float cut = smoothstep(-0.65, 0.9, n.y);
    return leaf * cut;
  }

  if (spriteKind < 2.5) {
    float d = length(q);
    float core = smoothstep(size * 0.75, size * 0.05, d);
    float halo = smoothstep(size * 1.6, size * 0.2, d) * 0.4;
    return core + halo;
  }

  if (spriteKind < 3.5) {
    vec2 n = vec2(q.x / max(size * 0.32, 0.001), q.y / max(size, 0.001));
    float d = length(n);
    float streak = smoothstep(1.1, 0.1, d);
    float core = smoothstep(size * 0.55, size * 0.05, length(q));
    return max(streak, core * 0.9);
  }

  vec2 flame = vec2(q.x / max(size * 0.58, 0.001), (q.y + size * 0.3) / max(size * 1.15, 0.001));
  float body = smoothstep(1.1, 0.08, dot(flame, flame));
  float tip = smoothstep(1.1, -0.2, flame.y);
  return body * tip;
}

void main() {
  vec2 local = (v_uv - 0.5) * u_quadSize;
  vec4 accum = vec4(0.0);

  const int MAX_PARTICLES = 72;

  float count = clamp(u_simCount, 1.0, float(MAX_PARTICLES));
  float oneShot = step(0.5, u_oneShot);
  float lifetime = max(0.01, u_lifetime);
  vec2 dir = u_direction;
  float dirLen = length(dir);
  float spread = max(0.0, u_spreadRad);
  float tGlobal = max(0.0, u_time + u_preprocess);

  for (int i = 0; i < MAX_PARTICLES; i++) {
    float fi = float(i);
    if (fi >= count) {
      continue;
    }

    float seed = fi * 17.371 + 4.19;
    vec2 hr = hash2(seed);

    float age = 0.0;
    if (oneShot > 0.5) {
      float spawnRange = max(0.01, lifetime * (1.0 - clamp(u_explosiveness, 0.0, 1.0)));
      float spawnTime = hr.x * spawnRange;
      age = tGlobal - spawnTime;
      if (age < 0.0 || age > lifetime) {
        continue;
      }
    } else {
      age = mod(tGlobal + hr.x * lifetime, lifetime);
    }

    float lt = clamp(age / lifetime, 0.0, 1.0);

    vec2 emit = vec2(0.0);
    if (u_emissionShape < 0.5) {
      emit = vec2(0.0);
    } else if (u_emissionShape < 1.5) {
      float ang = hr.y * 6.2831853;
      float rr = sqrt(hash1(seed + 1.0)) * u_emissionRadius;
      emit = vec2(cos(ang), sin(ang)) * rr;
    } else if (u_emissionShape < 2.5) {
      vec2 h2 = hash2(seed + 2.0) - 0.5;
      emit = h2 * 2.0 * u_emissionExtents;
    } else if (u_emissionShape < 3.5) {
      vec2 h3 = hash2(seed + 3.0) - 0.5;
      emit = h3 * 2.0 * u_emissionExtents;
    } else {
      float ang2 = hr.y * 6.2831853;
      float rr2 = mix(u_emissionRingInnerRadius, u_emissionRingRadius, hash1(seed + 7.0));
      emit = vec2(cos(ang2), sin(ang2)) * rr2;
    }

    float baseAngle = (dirLen > 0.001) ? atan(dir.y, dir.x) : (hr.y * 6.2831853);
    float angle = baseAngle + (hash1(seed + 4.0) - 0.5) * spread;
    float randAmp = mix(1.0 - u_randomness, 1.0 + u_randomness, hash1(seed + 9.0));
    float speed = mix(u_velocityRange.x, u_velocityRange.y, hash1(seed + 5.0)) * randAmp;

    float damping = mix(u_dampingRange.x, u_dampingRange.y, hash1(seed + 6.0));
    float dampF = exp(-max(0.0, damping) * 0.02 * age);

    vec2 vel = vec2(cos(angle), sin(angle)) * speed * dampF;

    float radialAccel = mix(u_radialAccelRange.x, u_radialAccelRange.y, hash1(seed + 10.0));
    float tangentAccel = mix(u_tangentAccelRange.x, u_tangentAccelRange.y, hash1(seed + 11.0));
    vec2 radialDir = normalize(emit + vec2(0.0001, 0.0));
    vec2 tangentDir = vec2(-radialDir.y, radialDir.x);
    vec2 accel = 0.5 * (radialDir * radialAccel + tangentDir * tangentAccel) * age * age;

    vec2 pos = emit + vel * age + 0.5 * u_gravity * age * age + accel;

    float sc = mix(u_scaleRange.x, u_scaleRange.y, hash1(seed + 12.0));
    float curve = max(0.0, curveSample(lt));
    float size = max(0.75, sc * curve * u_baseSize);

    float spin = mix(u_angularVelRange.x, u_angularVelRange.y, hash1(seed + 13.0)) * 0.01745329 * age;

    vec2 rel = local - pos;
    float mask = shapeMask(rel, size, u_spriteKind, spin);
    if (mask <= 0.0001) {
      continue;
    }

    vec4 ramp = rampSample(lt);

    if (u_useSpriteTexture > 0.5) {
      vec2 q = rotate2(rel, -spin);
      vec2 puv = q / (2.0 * size) + 0.5;
      if (puv.x < 0.0 || puv.x > 1.0 || puv.y < 0.0 || puv.y > 1.0) {
        continue;
      }

      vec2 tuv = mix(u_spriteUv.xy, u_spriteUv.zw, puv);
      vec4 tex = texture2D(u_spriteTex, tuv);
      mask *= tex.a;
      ramp.rgb *= mix(vec3(1.0), tex.rgb, 0.85);
    }

    accum.rgb += ramp.rgb * ramp.a * mask;
    accum.a += ramp.a * mask;
  }

  accum.rgb *= u_densityScale;
  accum.a *= u_densityScale;
  accum = clamp(accum, 0.0, 1.0);
  accum *= u_alpha;

  gl_FragColor = accum;
}
`;

// Source-faithful shader preview kernel mirroring HAOWG gdshader behaviors.
const HAOWG_SHADER_FS = /* glsl */ `
precision mediump float;

varying vec2 v_uv;

uniform float u_mode;
uniform float u_time;
uniform float u_alpha;
uniform vec2 u_resolution;
uniform float u_distortionAmount;
uniform float u_intensity;

uniform float u_a;
uniform float u_b;
uniform float u_c;
uniform float u_d;

uniform vec4 u_colorA;
uniform vec4 u_colorB;
uniform vec4 u_colorC;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 34.45);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    sum += noise(p) * amp;
    p = p * 2.07 + vec2(7.13, 3.91);
    amp *= 0.5;
  }
  return sum;
}

vec4 sampleBase(vec2 uv) {
  vec2 p = uv * 2.0 - 1.0;
  float r = length(p);
  float a = smoothstep(1.0, 0.2, r);
  vec3 col = vec3(0.82 + (0.18 * (1.0 - r)));
  return vec4(col, a);
}

vec4 blur9(vec2 uv, float amount) {
  vec4 sum = vec4(0.0);
  vec2 res = max(u_resolution, vec2(1.0));
  vec2 blur = amount * res;
  for (int i = -4; i <= 4; i++) {
    for (int j = -4; j <= 4; j++) {
      vec2 shift = vec2(float(i), float(j)) / res;
      sum += sampleBase(uv + shift * blur);
    }
  }
  return sum / 81.0;
}

float hexDist(vec2 p) {
  p = abs(p);
  float c = dot(p, normalize(vec2(1.0, 1.732)));
  return max(c, p.x);
}

void main() {
  vec2 uv = v_uv;
  float t = u_time;
  vec4 tex = sampleBase(uv);
  vec4 outColor = tex;

  if (u_mode < 0.5) {
    // blink.gdshader
    float blink = sin(t * max(u_a, 0.0)) * 0.5 + 0.5;
    blink = mix(clamp(u_b, 0.0, 1.0), 1.0, blink);
    outColor = tex;
    outColor.a *= blink;
  } else if (u_mode < 1.5) {
    // blur_amount.gdshader
    outColor = blur9(uv, clamp(u_a, 0.0, 0.2));
  } else if (u_mode < 2.5) {
    // burning.gdshader
    float burnAmount = clamp(u_a, 0.0, 1.0);
    float distortionStrength = u_b;
    vec2 dUv = uv + vec2(t * 0.1, t * 0.2);
    vec2 distortion = vec2(noise(dUv * 6.0), noise(dUv.yx * 7.0));
    distortion = (distortion - 0.5) * distortionStrength * burnAmount;
    tex = sampleBase(uv + distortion);

    float fireGradient = sin(uv.y * 10.0 - t * 5.0) * 0.5 + 0.5;
    vec4 fireColor = mix(u_colorA, u_colorB, fireGradient);
    float burnEdge = smoothstep(0.3, 0.7, uv.y + burnAmount * 1.5 - 0.5);

    outColor = mix(tex, fireColor, burnEdge * burnAmount * 0.6);
    outColor.a = tex.a;
  } else if (u_mode < 3.5) {
    // chromatic_aberration.gdshader
    vec2 offsetDir = normalize(vec2(max(abs(u_b), 0.0001) * sign(u_b), max(abs(u_c), 0.0001) * sign(u_c)));
    vec2 offset = offsetDir * u_a;
    float r = sampleBase(uv + offset).r;
    float g = sampleBase(uv).g;
    float b = sampleBase(uv - offset).b;
    float a = sampleBase(uv).a;
    outColor = vec4(r, g, b, a);
  } else if (u_mode < 4.5) {
    // color_change.gdshader
    float mixAmount = clamp(u_a, 0.0, 1.0);
    float preserveLum = step(0.5, u_b);
    vec3 targetColor = u_colorA.rgb;

    float luminance = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
    vec3 newColor = mix(tex.rgb, targetColor, mixAmount);

    if (preserveLum > 0.5) {
      float newLum = dot(newColor, vec3(0.299, 0.587, 0.114));
      if (newLum > 0.0001) {
        newColor *= luminance / newLum;
      }
    }

    outColor = vec4(newColor, tex.a);
  } else if (u_mode < 5.5) {
    // dissolve.gdshader
    float dissolveAmount = clamp(u_a, 0.0, 1.0);
    float edgeWidth = max(0.001, u_b);
    float n = fbm(uv * 8.0 + t * 0.15);

    float dissolveEdge = dissolveAmount + edgeWidth;
    float alpha = smoothstep(dissolveAmount, dissolveEdge, n);

    float edge = smoothstep(dissolveAmount, dissolveAmount + edgeWidth, n);
    edge *= 1.0 - smoothstep(dissolveAmount + edgeWidth * 0.5, dissolveEdge, n);

    outColor = mix(tex, u_colorA, edge);
    outColor.a = tex.a * alpha;
  } else if (u_mode < 6.5) {
    // enemy.gdshader
    vec2 shaken = uv;
    shaken.x += sin(t * 50.0) * u_b;
    shaken.y += cos(t * 50.0) * u_b;

    vec4 blurred = blur9(shaken, clamp(u_a, 0.0, 0.2));
    vec4 white = vec4(1.0, 1.0, 1.0, blurred.a);
    outColor = mix(blurred, white, clamp(u_c, 0.0, 1.0));
  } else if (u_mode < 7.5) {
    // energy_barrier.gdshader
    float hexScale = max(1.0, u_a);
    float pulseSpeed = max(0.0, u_b);
    float edgeBrightness = max(0.0, u_c);

    vec2 tuv = uv * hexScale;
    vec2 r = vec2(1.0, 1.732);
    vec2 h = r * 0.5;

    vec2 aa = mod(tuv, r) - h;
    vec2 bb = mod(tuv - h, r) - h;
    vec2 gv = length(aa) < length(bb) ? aa : bb;

    float dist = hexDist(gv);
    float hex = smoothstep(0.05, 0.02, abs(dist - 0.5));
    float pulse = sin(t * pulseSpeed) * 0.3 + 0.7;

    vec4 barrierColor = u_colorA;
    vec4 hexPattern = barrierColor * hex * edgeBrightness * pulse;

    outColor = mix(tex, barrierColor, 0.3) + hexPattern;
    outColor.a = max(tex.a, hexPattern.a * 0.8);
  } else if (u_mode < 8.5) {
    // flash_white.gdshader
    float flashAmount = clamp(u_a, 0.0, 1.0);
    vec4 flashColor = u_colorA;
    outColor = mix(tex, flashColor, flashAmount * tex.a);
    outColor.a = tex.a;
  } else if (u_mode < 9.5) {
    // fog.gdshader
    float density = clamp(u_a, 0.0, 1.0);
    vec2 speed = vec2(u_b, u_c);
    vec2 fuv = fract(uv + speed * t);
    float n = noise(fuv * 5.0 + vec2(2.3, 8.1));
    float fog = clamp(n * 2.0 - 1.0, 0.0, 1.0);
    outColor = tex;
    outColor.a *= fog * density;
  } else if (u_mode < 10.5) {
    // frozen.gdshader
    float freezeAmount = clamp(u_a, 0.0, 1.0);
    float crystalIntensity = clamp(u_b, 0.0, 1.0);
    vec4 iceColor = u_colorA;

    float pattern = fbm(uv * 12.0 + vec2(t * 0.02, 0.0));
    vec3 frozenColor = mix(tex.rgb, iceColor.rgb, freezeAmount * 0.6);
    frozenColor += vec3(pattern) * crystalIntensity * freezeAmount;
    outColor = vec4(frozenColor, tex.a);
  } else if (u_mode < 11.5) {
    // grayscale.gdshader
    float grayscaleAmount = clamp(u_a, 0.0, 1.0);
    float luminance = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
    vec3 gs = vec3(luminance);
    outColor = vec4(mix(tex.rgb, gs, grayscaleAmount), tex.a);
  } else if (u_mode < 12.5) {
    // heat_distortion.gdshader
    float distortionSpeed = max(0.0, u_a);
    float distortionAmount = max(0.0, u_b) * u_distortionAmount;

    vec2 noiseUv = uv + vec2(t * distortionSpeed * 0.1, t * distortionSpeed * 0.2);
    vec2 distortion = vec2(noise(noiseUv * 7.0), noise(noiseUv.yx * 9.0));
    distortion = (distortion - 0.5) * distortionAmount;
    outColor = sampleBase(uv + distortion);
  } else if (u_mode < 13.5) {
    // invisibility.gdshader
    float invisibilityAmount = clamp(u_a, 0.0, 1.0);
    float distortionAmount = max(0.0, u_b) * u_distortionAmount;

    vec2 distortion = vec2(noise((uv + vec2(t * 0.1, 0.0)) * 8.0), noise((uv + vec2(0.0, t * 0.1)) * 8.0));
    distortion = (distortion - 0.5) * distortionAmount * invisibilityAmount;

    tex = sampleBase(uv + distortion);

    float edge = 1.0 - smoothstep(0.0, 0.2, abs(0.5 - uv.x)) * smoothstep(0.0, 0.2, abs(0.5 - uv.y));
    vec4 edgeGlow = vec4(0.5, 0.8, 1.0, 1.0) * edge * invisibilityAmount * 0.3;

    outColor = mix(tex, vec4(0.0), invisibilityAmount * 0.7) + edgeGlow;
    outColor.a = tex.a * (1.0 - invisibilityAmount * 0.8);
  } else if (u_mode < 14.5) {
    // outline_glow.gdshader
    vec4 textureColor = tex;
    float outlineWidth = max(0.0, u_a);
    float glowIntensity = max(0.0, u_b);

    float alphaSum = 0.0;
    float samples = 8.0;
    float stepSize = outlineWidth / 100.0;

    for (int k = 0; k < 8; k++) {
      float ang = (6.2831853 / 8.0) * float(k);
      vec2 offset = vec2(cos(ang), sin(ang)) * stepSize;
      alphaSum += sampleBase(uv + offset).a;
    }

    float outline = step(0.1, alphaSum) * (1.0 - textureColor.a);
    outColor = mix(textureColor, u_colorA * glowIntensity, outline);
    outColor.a = max(textureColor.a, outline);
  } else if (u_mode < 15.5) {
    // petrify.gdshader
    float petrifyAmount = clamp(u_a, 0.0, 1.0);
    float crackIntensity = clamp(u_b, 0.0, 1.0);
    vec3 stoneColor = u_colorA.rgb;

    float cracks = fbm(uv * 14.0);
    float gray = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
    vec3 stone = mix(vec3(gray), stoneColor, 0.5);
    vec3 petrified = mix(tex.rgb, stone, petrifyAmount);
    petrified = mix(petrified, petrified * 0.5, cracks * crackIntensity * petrifyAmount);
    outColor = vec4(petrified, tex.a);
  } else if (u_mode < 16.5) {
    // poison.gdshader
    float poisonAmount = clamp(u_a, 0.0, 1.0);
    float pulseSpeed = max(0.0, u_b);

    float pulse = sin(t * pulseSpeed) * 0.5 + 0.5;
    float poisonIntensity = poisonAmount * pulse * 0.5;
    vec3 poisoned = mix(tex.rgb, u_colorA.rgb, poisonIntensity);
    outColor = vec4(poisoned, tex.a);
  } else if (u_mode < 17.5) {
    // portal_vortex.gdshader
    float vortexSpeed = max(0.0, u_a);
    float vortexStrength = clamp(u_b, 0.0, 1.0);

    vec2 center = vec2(0.5, 0.5);
    vec2 uvCentered = uv - center;

    float dist = length(uvCentered);
    float ang = atan(uvCentered.y, uvCentered.x);
    float spiral = ang + dist * 10.0 - t * vortexSpeed;

    vec2 vortexUv = vec2(cos(spiral) * dist + 0.5, sin(spiral) * dist + 0.5);

    float colorMix = sin(dist * 10.0 - t * vortexSpeed * 2.0) * 0.5 + 0.5;
    vec4 portalColor = mix(u_colorA, u_colorB, colorMix);

    vec4 textureColor = sampleBase(mix(uv, vortexUv, vortexStrength));
    outColor = mix(textureColor, portalColor, 0.6 * (1.0 - dist * 2.0));
    outColor.a = textureColor.a;
  } else if (u_mode < 18.5) {
    // radial_blur.gdshader
    float blurStrength = clamp(u_a, 0.0, 0.1);
    vec2 blurCenter = vec2(0.5, 0.5);
    vec2 direction = uv - blurCenter;

    vec4 color = vec4(0.0);
    const int SAMPLES = 16;
    for (int i = 0; i < SAMPLES; i++) {
      float tt = float(i) / float(SAMPLES - 1);
      vec2 offset = direction * blurStrength * tt;
      color += sampleBase(uv - offset);
    }

    outColor = color / float(SAMPLES);
  } else if (u_mode < 19.5) {
    // shake_intensity.gdshader
    vec2 suv = uv;
    suv.x += sin(t * 50.0) * u_a;
    suv.y += cos(t * 50.0) * u_a;
    outColor = sampleBase(suv);
  } else if (u_mode < 20.5) {
    // starSky.gdshader (compact faithful form)
    vec3 bg = vec3(0.03, 0.04, 0.08);
    vec2 dimensions = max(u_resolution, vec2(1.0));

    float smallStars = max(1.0, u_a);
    float largeStars = max(1.0, u_b);
    float baseScroll = max(0.0, u_c);
    float addScroll = max(0.0, u_d);

    float timeShift = 10000.0 + t;

    float smallRn = fract(sin(floor(uv.y * smallStars)) * dimensions.y);
    float largeRn = fract(sin(floor(uv.y * largeStars)) * dimensions.y);

    vec2 smallUv = vec2(
      fract(uv.x + (baseScroll + smallRn * addScroll) * timeShift) * smallStars * dimensions.x / dimensions.y,
      fract(uv.y * smallStars)
    ) * 2.0 - 1.0;

    vec2 largeUv = vec2(
      fract(uv.x + (baseScroll + largeRn * addScroll) * timeShift) * largeStars * dimensions.x / dimensions.y,
      fract(uv.y * largeStars)
    ) * 2.0 - 1.0;

    vec4 farCol = u_colorA;
    vec4 nearCol = u_colorB;

    vec4 starColor = mix(farCol, nearCol, smallRn);
    float smallSize = mix(0.5, 1.0, smallRn);
    float smallMask = max((smallSize - length(smallUv)) / smallSize, 0.0);

    vec4 bigColor = mix(farCol, nearCol, largeRn);
    float bigSize = mix(0.5, 1.0, largeRn);
    float bigCircle = max((bigSize / 1.7 - length(largeUv)) / bigSize, 0.0);
    float bigCross = max((bigSize - length(largeUv)) / bigSize / 2.0, 0.0);
    bigCross *= max(step(abs(largeUv.x), bigSize / 10.0), step(abs(largeUv.y), bigSize / 10.0));

    vec3 col = bg;
    col = mix(col, starColor.rgb, smallMask * starColor.a);
    col = mix(col, bigColor.rgb, (bigCircle + bigCross) * bigColor.a);

    outColor = vec4(col, 1.0);
  } else if (u_mode < 21.5) {
    // vignette.gdshader
    float strength = clamp(u_a, 0.0, 1.0);
    float size = clamp(u_b, 0.0, 2.0);

    vec2 center = vec2(0.5, 0.5);
    float dist = distance(uv, center);

    float vignette = smoothstep(size, size - 0.5, dist);
    vignette = 1.0 - vignette;

    outColor = mix(tex, tex * u_colorA, vignette * strength);
    outColor.a = tex.a;
  } else if (u_mode < 22.5) {
    // water.gdshader (screen-texture variant adapted to local preview)
    float level = clamp(u_a, 0.0, 1.0);
    float waterSpeed = u_b;
    float waveDistortion = u_c * u_distortionAmount;
    float waterOpacity = clamp(u_d, 0.0, 1.0);

    vec2 puv = uv;
    vec2 pixelRes = max(vec2(16.0), u_resolution * 0.2);
    puv *= pixelRes;
    puv = floor(puv);
    puv /= pixelRes;

    float wave = noise(vec2(puv.x * 5.0, t * waterSpeed * 1.5)) * 0.02;
    vec4 color = vec4(0.0);

    if (puv.y >= level + wave) {
      vec2 waterUv = vec2(puv.x, puv.y * 7.0);
      float n = noise(vec2(waterUv.x + t * waterSpeed, waterUv.y)) * waveDistortion;
      n -= 0.5 * waveDistortion;

      float texLine = step(0.35, noise((puv + vec2(n, 0.0)) * vec2(1.5, 10.0)));
      color.rgb = mix(vec3(0.0), vec3(1.0), texLine);

      vec4 reflected = sampleBase(vec2(clamp(uv.x + n, 0.0, 1.0), clamp(1.7 - (uv.y - level), 0.0, 1.0)));
      color = mix(color, reflected, 0.5);
      color = mix(color, u_colorA, waterOpacity);

      if (abs(puv.y - (level + wave)) < 0.02) {
        float splash = noise(vec2(puv.x * 5.0, t * waterSpeed)) * 2.0;
        color.a *= splash;
        float whiteFactor = 1.0 - smoothstep(level, level + 0.02, puv.y);
        color.rgb = mix(color.rgb, vec3(1.0), whiteFactor);
      }

      float edgeFadeWidth = 0.05;
      float edgeOpacity = 1.0;
      edgeOpacity *= smoothstep(0.0, edgeFadeWidth, uv.x);
      edgeOpacity *= smoothstep(0.0, edgeFadeWidth, 1.0 - uv.x);
      color.a *= edgeOpacity;
    }

    outColor = color;
  } else {
    // water_surface.gdshader
    vec2 waveDirection = normalize(vec2(max(abs(u_d), 0.0001) * sign(u_d), 0.0001));
    float waveSpeed = max(0.0, u_a);
    float waveFrequency = max(0.0, u_b);
    float waveAmplitude = max(0.0, u_c) * u_distortionAmount;

    vec2 waveOffset = vec2(
      sin(uv.y * waveFrequency + t * waveSpeed) * waveAmplitude,
      cos(uv.x * waveFrequency + t * waveSpeed) * waveAmplitude
    );

    waveOffset += waveDirection * (sin(t * waveSpeed) * waveAmplitude * 0.25);
    outColor = sampleBase(uv + waveOffset) * u_colorA;
  }

  outColor.rgb *= u_intensity;
  outColor *= u_alpha;
  gl_FragColor = outColor;
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

const rotateVec = (x: number, y: number, deg: number): [number, number] => {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [x * c - y * s, x * s + y * c];
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const mapIds = <T extends readonly string[]>(prefix: string, names: T): Record<T[number], string> => {
  const out = {} as Record<T[number], string>;
  names.forEach(name => {
    out[name] = `${prefix}.${name}`;
  });
  return out;
};

const toTitle = (value: string) => value.split('_').map(token => token[0].toUpperCase() + token.slice(1)).join(' ');

export const HAOWG_EFFECT_SOURCE_NAMES = [
  'ash_particles',
  'blood_splash',
  'campfire_smoke',
  'candle_flame',
  'combat_particle',
  'combo_ring',
  'dash_trail',
  'dust_cloud',
  'energy_burst',
  'falling_leaves',
  'fireball_trail',
  'fireflies',
  'heal_particles',
  'ice_frost',
  'jump_dust',
  'lightning_chain',
  'magic_aura',
  'poison_cloud',
  'portal_vortex',
  'rain_drops',
  'shield_break',
  'snow_flakes',
  'sparks',
  'steam',
  'summon_circle',
  'torch_fire',
  'wall_slide_spark',
  'water_splash',
  'waterfall_mist',
  'wood_debris'
] as const;

export const HAOWG_SHADER_SOURCE_NAMES = [
  'blink',
  'blur_amount',
  'burning',
  'chromatic_aberration',
  'color_change',
  'dissolve',
  'enemy',
  'energy_barrier',
  'flash_white',
  'fog',
  'frozen',
  'grayscale',
  'heat_distortion',
  'invisibility',
  'outline_glow',
  'petrify',
  'poison',
  'portal_vortex',
  'radial_blur',
  'shake_intensity',
  'starSky',
  'vignette',
  'water',
  'water_surface'
] as const;

export type HaowgEffectSourceName = (typeof HAOWG_EFFECT_SOURCE_NAMES)[number];
export type HaowgShaderSourceName = (typeof HAOWG_SHADER_SOURCE_NAMES)[number];

export const HAOWG_EFFECT_IDS = mapIds('haowg.effect', HAOWG_EFFECT_SOURCE_NAMES);
export const HAOWG_SHADER_IDS = mapIds('haowg.shader', HAOWG_SHADER_SOURCE_NAMES);
export const HAOWG_VFX_IDS = {
  ...HAOWG_EFFECT_IDS,
  ...HAOWG_SHADER_IDS
} as const;

export interface HaowgShowcaseItem {
  id: string;
  label: string;
  sourcePath: string;
  kind: 'effect' | 'shader';
  spawnKind: 'position' | 'motion';
  paramProfile: 'none' | 'lightning' | 'distortion';
  interval: number;
}

const MOTION_EFFECTS = new Set<HaowgEffectSourceName>(['dash_trail', 'fireball_trail']);
const LOOP_EFFECTS = new Set<HaowgEffectSourceName>([
  'ash_particles',
  'campfire_smoke',
  'candle_flame',
  'dash_trail',
  'falling_leaves',
  'fireball_trail',
  'fireflies',
  'heal_particles',
  'magic_aura',
  'poison_cloud',
  'portal_vortex',
  'rain_drops',
  'snow_flakes',
  'summon_circle',
  'torch_fire',
  'wall_slide_spark',
  'waterfall_mist'
]);

const DISTORTION_SHADERS = new Set<HaowgShaderSourceName>([
  'heat_distortion',
  'chromatic_aberration',
  'radial_blur',
  'water',
  'water_surface',
  'invisibility'
]);

export const HAOWG_SHOWCASE_ITEMS: HaowgShowcaseItem[] = [
  ...HAOWG_EFFECT_SOURCE_NAMES.map(name => ({
    id: HAOWG_EFFECT_IDS[name],
    label: toTitle(name),
    sourcePath: `addons/vfx_library/effects/${name}.tscn`,
    kind: 'effect' as const,
    spawnKind: MOTION_EFFECTS.has(name) ? ('motion' as const) : ('position' as const),
    paramProfile: name === 'lightning_chain' ? ('lightning' as const) : ('none' as const),
    interval: MOTION_EFFECTS.has(name) ? 0.8 : LOOP_EFFECTS.has(name) ? 2.2 : 1.0
  })),
  ...HAOWG_SHADER_SOURCE_NAMES.map(name => ({
    id: HAOWG_SHADER_IDS[name],
    label: `Shader: ${toTitle(name)}`,
    sourcePath: `addons/vfx_library/shaders/${name}.gdshader`,
    kind: 'shader' as const,
    spawnKind: 'position' as const,
    paramProfile: name === 'shake_intensity' ? ('lightning' as const) : DISTORTION_SHADERS.has(name) ? ('distortion' as const) : ('none' as const),
    interval: 2.5
  }))
];

type SpriteKind = 'dot' | 'leaf' | 'firefly' | 'spark' | 'fire';

interface HaowgParticleSpec {
  amount: number;
  lifetime: number;
  oneShot: boolean;
  explosiveness: number;
  preprocess: number;
  randomness: number;

  emissionShape: 0 | 1 | 2 | 3 | 6;
  emissionRadius: number;
  emissionExtents: [number, number];
  emissionRingRadius: number;
  emissionRingInnerRadius: number;

  direction: [number, number];
  spreadDeg: number;
  gravity: [number, number];
  velocityMin: number;
  velocityMax: number;
  dampingMin: number;
  dampingMax: number;
  angularVelocityMin: number;
  angularVelocityMax: number;
  radialAccelMin: number;
  radialAccelMax: number;
  tangentialAccelMin: number;
  tangentialAccelMax: number;

  scaleMin: number;
  scaleMax: number;
  baseSize: number;
  curveStart: number;
  curveMidT: number;
  curveMid: number;
  curveEnd: number;

  stops: [number, number, number, number];
  colors: [[number, number, number, number], [number, number, number, number], [number, number, number, number], [number, number, number, number]];

  blendMode: BlendMode;
  spriteKind: SpriteKind;
  spriteRegion?: string;

  sizeOverride?: [number, number];
}

const C = (r: number, g: number, b: number, a: number): [number, number, number, number] => [r, g, b, a];

const S = (spec: Partial<HaowgParticleSpec>): HaowgParticleSpec => ({
  amount: 20,
  lifetime: 1,
  oneShot: false,
  explosiveness: 0,
  preprocess: 0,
  randomness: 0.3,

  emissionShape: 1,
  emissionRadius: 6,
  emissionExtents: [6, 6],
  emissionRingRadius: 20,
  emissionRingInnerRadius: 12,

  direction: [0, -1],
  spreadDeg: 20,
  gravity: [0, 0],
  velocityMin: 20,
  velocityMax: 40,
  dampingMin: 0,
  dampingMax: 0,
  angularVelocityMin: 0,
  angularVelocityMax: 0,
  radialAccelMin: 0,
  radialAccelMax: 0,
  tangentialAccelMin: 0,
  tangentialAccelMax: 0,

  scaleMin: 2,
  scaleMax: 4,
  baseSize: 4,
  curveStart: 1,
  curveMidT: 0.5,
  curveMid: 1,
  curveEnd: 0,

  stops: [0, 0.35, 0.7, 1],
  colors: [C(1, 1, 1, 1), C(1, 1, 1, 0.8), C(1, 1, 1, 0.35), C(1, 1, 1, 0)],

  blendMode: 'alpha',
  spriteKind: 'dot',
  ...spec
});

const EFFECT_SPECS: Record<HaowgEffectSourceName, HaowgParticleSpec> = {
  ash_particles: S({
    amount: 20,
    lifetime: 3.0,
    preprocess: 1.5,
    randomness: 0.5,
    emissionShape: 2,
    emissionExtents: [85, 45],
    direction: [0, -1],
    spreadDeg: 30,
    gravity: [0, -20],
    velocityMin: 15,
    velocityMax: 30,
    angularVelocityMin: -90,
    angularVelocityMax: 90,
    scaleMin: 2,
    scaleMax: 4,
    baseSize: 4,
    curveStart: 0.5,
    curveMidT: 0.5,
    curveMid: 1.0,
    curveEnd: 0.0,
    stops: [0.0, 0.5, 0.8, 1.0],
    colors: [C(0.4, 0.4, 0.4, 0.6), C(0.5, 0.5, 0.5, 0.4), C(0.6, 0.6, 0.6, 0.2), C(0.6, 0.6, 0.6, 0)],
    blendMode: 'alpha',
    sizeOverride: [320, 220]
  }),
  blood_splash: S({
    amount: 20,
    lifetime: 0.4,
    oneShot: true,
    explosiveness: 1,
    randomness: 0.3,
    emissionShape: 1,
    emissionRadius: 5,
    direction: [0, 0],
    spreadDeg: 180,
    gravity: [0, 600],
    velocityMin: 80,
    velocityMax: 150,
    dampingMin: 30,
    dampingMax: 60,
    scaleMin: 2,
    scaleMax: 5,
    baseSize: 3.2,
    stops: [0.0, 0.3, 0.7, 1.0],
    colors: [C(1, 0.2, 0.2, 1), C(0.8, 0, 0, 1), C(0.4, 0, 0, 0.8), C(0.2, 0, 0, 0)],
    blendMode: 'additive',
    sizeOverride: [260, 240]
  }),
  campfire_smoke: S({
    amount: 15,
    lifetime: 3,
    preprocess: 1.5,
    randomness: 0.4,
    emissionShape: 1,
    emissionRadius: 8,
    direction: [0, -1],
    spreadDeg: 25,
    gravity: [0, -40],
    velocityMin: 15,
    velocityMax: 30,
    scaleMin: 4,
    scaleMax: 8,
    baseSize: 4.4,
    curveStart: 0.3,
    curveMidT: 0.4,
    curveMid: 1,
    curveEnd: 0.8,
    stops: [0, 0.5, 0.8, 1],
    colors: [C(0.3, 0.3, 0.3, 0.5), C(0.5, 0.5, 0.5, 0.3), C(0.6, 0.6, 0.6, 0.15), C(0.6, 0.6, 0.6, 0)],
    blendMode: 'alpha',
    sizeOverride: [280, 300]
  }),
  candle_flame: S({
    amount: 15,
    lifetime: 0.8,
    preprocess: 0.5,
    randomness: 0.4,
    emissionShape: 1,
    emissionRadius: 3,
    direction: [0, -1],
    spreadDeg: 15,
    gravity: [0, -200],
    velocityMin: 10,
    velocityMax: 20,
    scaleMin: 2,
    scaleMax: 4,
    baseSize: 3.2,
    curveStart: 0.0,
    curveMidT: 0.2,
    curveMid: 1,
    curveEnd: 0,
    stops: [0, 0.3, 0.7, 1],
    colors: [C(1, 1, 0.9, 1), C(1, 0.8, 0.3, 1), C(0.9, 0.4, 0, 1), C(0.2, 0.2, 0.2, 0)],
    blendMode: 'additive',
    spriteKind: 'fire',
    sizeOverride: [160, 240]
  }),
  combat_particle: S({
    amount: 15,
    lifetime: 0.6,
    oneShot: true,
    explosiveness: 1,
    direction: [0, 0],
    spreadDeg: 180,
    gravity: [0, 500],
    velocityMin: 100,
    velocityMax: 200,
    scaleMin: 4,
    scaleMax: 8,
    baseSize: 3.2,
    stops: [0, 0.5, 0.8, 1],
    colors: [C(1, 1, 1, 1), C(0.8, 0.6, 0.4, 0.8), C(0.3, 0.3, 0.3, 0.3), C(0.3, 0.3, 0.3, 0)],
    blendMode: 'additive',
    sizeOverride: [280, 250]
  }),
  combo_ring: S({
    amount: 20,
    lifetime: 0.5,
    oneShot: true,
    explosiveness: 0.5,
    randomness: 0.3,
    emissionShape: 1,
    emissionRadius: 25,
    direction: [0, 0],
    spreadDeg: 180,
    gravity: [0, 0],
    velocityMin: 80,
    velocityMax: 120,
    radialAccelMin: -80,
    radialAccelMax: -80,
    scaleMin: 2,
    scaleMax: 4,
    baseSize: 2.8,
    stops: [0, 0.5, 0.8, 1],
    colors: [C(1, 0.9, 0.3, 1), C(1, 0.6, 0, 1), C(1, 0.3, 0, 0.45), C(1, 0.3, 0, 0)],
    blendMode: 'additive',
    sizeOverride: [320, 320]
  }),
  dash_trail: S({
    amount: 12,
    lifetime: 0.3,
    oneShot: false,
    explosiveness: 0.3,
    randomness: 0.3,
    emissionShape: 1,
    emissionRadius: 8,
    direction: [1, 0],
    spreadDeg: 40,
    gravity: [0, 0],
    velocityMin: 10,
    velocityMax: 30,
    scaleMin: 4,
    scaleMax: 8,
    baseSize: 2.5,
    stops: [0, 0.6, 0.85, 1],
    colors: [C(0.8, 0.9, 1, 0.6), C(0.5, 0.7, 1, 0.4), C(0.3, 0.5, 0.8, 0.2), C(0.3, 0.5, 0.8, 0)],
    blendMode: 'additive',
    sizeOverride: [220, 90]
  }),
  dust_cloud: S({
    amount: 20,
    lifetime: 1.5,
    oneShot: true,
    explosiveness: 0.5,
    randomness: 0.3,
    emissionShape: 1,
    emissionRadius: 10,
    direction: [0, -1],
    gravity: [0, -20],
    velocityMin: 20,
    velocityMax: 50,
    scaleMin: 3,
    scaleMax: 6,
    baseSize: 3.8,
    curveStart: 0.3,
    curveMidT: 0.3,
    curveMid: 1,
    curveEnd: 0.5,
    stops: [0, 0.5, 0.8, 1],
    colors: [C(0.6, 0.5, 0.4, 0.5), C(0.7, 0.6, 0.5, 0.3), C(0.8, 0.7, 0.6, 0.15), C(0.8, 0.7, 0.6, 0)],
    blendMode: 'alpha',
    sizeOverride: [300, 210]
  }),
  energy_burst: S({
    amount: 30,
    lifetime: 0.8,
    oneShot: true,
    explosiveness: 0.8,
    randomness: 0.4,
    emissionShape: 1,
    emissionRadius: 10,
    direction: [0, 0],
    spreadDeg: 180,
    gravity: [0, 0],
    velocityMin: 50,
    velocityMax: 120,
    angularVelocityMin: -180,
    angularVelocityMax: 180,
    dampingMin: 50,
    dampingMax: 100,
    scaleMin: 3,
    scaleMax: 7,
    baseSize: 3.2,
    curveStart: 0,
    curveMidT: 0.3,
    curveMid: 1,
    curveEnd: 0,
    stops: [0, 0.4, 0.75, 1],
    colors: [C(1, 1, 1, 1), C(0.5, 0.8, 1, 1), C(0.2, 0.4, 0.8, 0.45), C(0.2, 0.4, 0.8, 0)],
    blendMode: 'additive',
    sizeOverride: [330, 330]
  }),
  falling_leaves: S({
    amount: 15,
    lifetime: 5,
    preprocess: 3,
    randomness: 0.5,
    emissionShape: 2,
    emissionExtents: [180, 120],
    direction: [0, 1],
    spreadDeg: 20,
    gravity: [0, 30],
    velocityMin: 10,
    velocityMax: 30,
    angularVelocityMin: -90,
    angularVelocityMax: 90,
    scaleMin: 0.3,
    scaleMax: 0.6,
    baseSize: 38,
    stops: [0, 0.7, 0.9, 1],
    colors: [C(1, 0.9, 0.4, 1), C(0.9, 0.6, 0.3, 1), C(0.7, 0.4, 0.2, 0.8), C(0.7, 0.4, 0.2, 0.1)],
    blendMode: 'alpha',
    spriteKind: 'leaf',
    spriteRegion: 'leaf',
    sizeOverride: [430, 560]
  }),
  fireball_trail: S({
    amount: 20,
    lifetime: 0.5,
    randomness: 0.3,
    emissionShape: 1,
    emissionRadius: 8,
    direction: [1, 0],
    spreadDeg: 30,
    gravity: [0, -100],
    velocityMin: 20,
    velocityMax: 40,
    scaleMin: 3,
    scaleMax: 6,
    baseSize: 3.3,
    stops: [0, 0.3, 0.7, 1],
    colors: [C(1, 1, 0.8, 1), C(1, 0.7, 0.2, 1), C(0.9, 0.3, 0, 0.8), C(0.3, 0.1, 0, 0)],
    blendMode: 'additive',
    spriteKind: 'fire',
    spriteRegion: 'fire_particle',
    sizeOverride: [260, 130]
  }),
  fireflies: S({
    amount: 20,
    lifetime: 3,
    preprocess: 2,
    randomness: 0.5,
    emissionShape: 2,
    emissionExtents: [130, 95],
    direction: [0, 0],
    spreadDeg: 180,
    gravity: [0, 0],
    velocityMin: 10,
    velocityMax: 30,
    scaleMin: 0.5,
    scaleMax: 0.9,
    baseSize: 24,
    stops: [0, 0.5, 0.8, 1],
    colors: [C(1, 1, 0.5, 0.0), C(1, 1, 0.5, 1), C(1, 1, 0.5, 0.7), C(1, 1, 0.5, 0)],
    blendMode: 'additive',
    spriteKind: 'firefly',
    spriteRegion: 'firefly',
    sizeOverride: [330, 240]
  }),
  heal_particles: S({
    amount: 15,
    lifetime: 1.2,
    preprocess: 0.5,
    randomness: 0.5,
    emissionShape: 1,
    emissionRadius: 20,
    direction: [0, -1],
    spreadDeg: 30,
    gravity: [0, -80],
    velocityMin: 20,
    velocityMax: 50,
    scaleMin: 2,
    scaleMax: 5,
    baseSize: 3.5,
    curveStart: 0.5,
    curveMidT: 0.5,
    curveMid: 1,
    curveEnd: 0,
    stops: [0, 0.5, 0.8, 1],
    colors: [C(0.3, 1, 0.3, 1), C(0.5, 1, 0.7, 1), C(0.7, 1, 0.9, 0.4), C(0.7, 1, 0.9, 0)],
    blendMode: 'additive',
    sizeOverride: [280, 320]
  }),
  ice_frost: S({
    amount: 20,
    lifetime: 0.8,
    oneShot: true,
    explosiveness: 0.7,
    randomness: 0.4,
    emissionShape: 1,
    emissionRadius: 15,
    direction: [0, -1],
    spreadDeg: 60,
    gravity: [0, -50],
    velocityMin: 30,
    velocityMax: 60,
    angularVelocityMin: -180,
    angularVelocityMax: 180,
    scaleMin: 3,
    scaleMax: 6,
    baseSize: 3.0,
    stops: [0, 0.5, 0.8, 1],
    colors: [C(0.8, 0.9, 1, 1), C(0.5, 0.7, 1, 0.8), C(0.3, 0.5, 0.9, 0.45), C(0.3, 0.5, 0.9, 0)],
    blendMode: 'additive',
    sizeOverride: [300, 280]
  }),
  jump_dust: S({
    amount: 10,
    lifetime: 0.4,
    oneShot: true,
    explosiveness: 1,
    randomness: 0.4,
    emissionShape: 1,
    emissionRadius: 12,
    direction: [0, -1],
    spreadDeg: 60,
    gravity: [0, 50],
    velocityMin: 30,
    velocityMax: 60,
    scaleMin: 3,
    scaleMax: 6,
    baseSize: 3.3,
    stops: [0, 0.5, 0.8, 1],
    colors: [C(0.7, 0.6, 0.5, 0.7), C(0.8, 0.7, 0.6, 0.5), C(0.9, 0.8, 0.7, 0.2), C(0.9, 0.8, 0.7, 0)],
    blendMode: 'alpha',
    sizeOverride: [260, 210]
  }),
  lightning_chain: S({
    amount: 30,
    lifetime: 0.3,
    oneShot: true,
    explosiveness: 0.8,
    randomness: 0.3,
    emissionShape: 3,
    emissionExtents: [5, 5],
    direction: [1, 0],
    spreadDeg: 10,
    gravity: [0, 0],
    velocityMin: 120,
    velocityMax: 200,
    scaleMin: 1.5,
    scaleMax: 3,
    baseSize: 2.6,
    curveStart: 1,
    curveMidT: 0.5,
    curveMid: 1.5,
    curveEnd: 0,
    stops: [0, 0.2, 0.5, 1],
    colors: [C(1, 1, 1, 1), C(0.7, 0.85, 1, 1), C(0.4, 0.7, 1, 0.8), C(0.2, 0.5, 1, 0)],
    blendMode: 'additive',
    sizeOverride: [220, 130]
  }),
  magic_aura: S({
    amount: 96,
    lifetime: 2,
    preprocess: 2,
    randomness: 0.4,
    emissionShape: 6,
    emissionRingRadius: 60,
    emissionRingInnerRadius: 53,
    direction: [0, 0],
    spreadDeg: 180,
    gravity: [0, 0],
    radialAccelMin: -17.04,
    radialAccelMax: -13.04,
    tangentialAccelMin: 20,
    tangentialAccelMax: 35,
    scaleMin: 3,
    scaleMax: 5,
    baseSize: 2.5,
    curveStart: 1,
    curveMidT: 0.2698,
    curveMid: 0.6849,
    curveEnd: 0.49,
    stops: [0.0, 0.27, 0.6, 0.97],
    colors: [C(0.8768, 0.1587, 0.1587, 1), C(0.2076, 0.9209, 0.197, 1), C(0.3432, 0.197, 0.9209, 1), C(0.4916, 0.197, 0.9209, 1)],
    blendMode: 'additive',
    sizeOverride: [360, 360]
  }),
  poison_cloud: S({
    amount: 25,
    lifetime: 2,
    randomness: 0.4,
    emissionShape: 1,
    emissionRadius: 15,
    direction: [0, -1],
    gravity: [0, -10],
    velocityMin: 10,
    velocityMax: 30,
    scaleMin: 3,
    scaleMax: 6,
    baseSize: 3.8,
    curveStart: 0.3,
    curveMidT: 0.4,
    curveMid: 1,
    curveEnd: 0.7,
    stops: [0, 0.4, 0.8, 1],
    colors: [C(0.2, 0.8, 0.2, 0.6), C(0.3, 0.9, 0.3, 0.4), C(0.4, 1, 0.4, 0.15), C(0.4, 1, 0.4, 0)],
    blendMode: 'alpha',
    sizeOverride: [320, 260]
  }),
  portal_vortex: S({
    amount: 72,
    lifetime: 1.5,
    preprocess: 1,
    randomness: 0.3,
    emissionShape: 1,
    emissionRadius: 40,
    direction: [0, 0],
    spreadDeg: 180,
    gravity: [0, 0],
    velocityMin: 20,
    velocityMax: 50,
    angularVelocityMin: -180,
    angularVelocityMax: 180,
    radialAccelMin: -120,
    radialAccelMax: -120,
    tangentialAccelMin: 50,
    tangentialAccelMax: 100,
    scaleMin: 2,
    scaleMax: 5,
    baseSize: 2.6,
    curveStart: 1,
    curveMidT: 0.5,
    curveMid: 0.8,
    curveEnd: 0,
    stops: [0, 0.5, 0.8, 1],
    colors: [C(0.6, 0.3, 1, 1), C(0.4, 0.2, 0.8, 0.8), C(0.2, 0.1, 0.5, 0.3), C(0.2, 0.1, 0.5, 0)],
    blendMode: 'additive',
    sizeOverride: [360, 360]
  }),
  rain_drops: S({
    amount: 72,
    lifetime: 1.5,
    randomness: 0.3,
    emissionShape: 2,
    emissionExtents: [200, 360],
    direction: [0.2, 1],
    spreadDeg: 5,
    gravity: [20, 800],
    velocityMin: 200,
    velocityMax: 300,
    scaleMin: 0.4,
    scaleMax: 2,
    baseSize: 1.6,
    stops: [0, 0.35, 0.7, 1],
    colors: [C(0.6, 0.7, 0.9, 0.6), C(0.55, 0.65, 0.85, 0.45), C(0.5, 0.6, 0.8, 0.25), C(0.5, 0.6, 0.8, 0.0)],
    blendMode: 'alpha',
    spriteKind: 'spark',
    sizeOverride: [430, 790]
  }),
  shield_break: S({
    amount: 25,
    lifetime: 0.6,
    oneShot: true,
    explosiveness: 1,
    randomness: 0.4,
    emissionShape: 1,
    emissionRadius: 15,
    direction: [0, 0],
    spreadDeg: 180,
    gravity: [0, 400],
    velocityMin: 100,
    velocityMax: 200,
    angularVelocityMin: -360,
    angularVelocityMax: 360,
    scaleMin: 3,
    scaleMax: 6,
    baseSize: 3.3,
    stops: [0, 0.3, 0.8, 1],
    colors: [C(0.5, 0.8, 1, 1), C(0.3, 0.6, 1, 0.8), C(0.2, 0.4, 0.8, 0.2), C(0.2, 0.4, 0.8, 0)],
    blendMode: 'additive',
    sizeOverride: [320, 260]
  }),
  snow_flakes: S({
    amount: 60,
    lifetime: 5,
    preprocess: 3,
    randomness: 0.5,
    emissionShape: 2,
    emissionExtents: [200, 360],
    direction: [0.3, 1],
    spreadDeg: 15,
    gravity: [10, 50],
    velocityMin: 20,
    velocityMax: 40,
    angularVelocityMin: -90,
    angularVelocityMax: 90,
    scaleMin: 2,
    scaleMax: 5,
    baseSize: 2.5,
    stops: [0, 0.5, 0.8, 1],
    colors: [C(1, 1, 1, 1), C(0.95, 0.95, 1, 0.8), C(0.9, 0.9, 0.95, 0.35), C(0.9, 0.9, 0.95, 0)],
    blendMode: 'alpha',
    sizeOverride: [430, 790]
  }),
  sparks: S({
    amount: 30,
    lifetime: 0.5,
    oneShot: true,
    explosiveness: 1,
    randomness: 0.5,
    emissionShape: 1,
    emissionRadius: 5,
    direction: [0, -1],
    spreadDeg: 180,
    gravity: [0, 500],
    velocityMin: 100,
    velocityMax: 200,
    dampingMin: 50,
    dampingMax: 100,
    scaleMin: 0.2,
    scaleMax: 0.8,
    baseSize: 18,
    stops: [0.04, 0.18, 0.83, 1],
    colors: [C(1, 1, 1, 1), C(1, 1, 0.5, 1), C(0.958, 0.702, 0.243, 1), C(1, 0.3, 0, 0)],
    blendMode: 'additive',
    spriteKind: 'spark',
    spriteRegion: 'spark_particle2',
    sizeOverride: [300, 250]
  }),
  steam: S({
    amount: 20,
    lifetime: 2,
    oneShot: true,
    explosiveness: 0.8,
    randomness: 0.3,
    emissionShape: 1,
    emissionRadius: 8,
    direction: [0, -1],
    spreadDeg: 30,
    gravity: [0, -50],
    velocityMin: 20,
    velocityMax: 40,
    scaleMin: 3,
    scaleMax: 6,
    baseSize: 4,
    curveStart: 0.2,
    curveMidT: 0.5,
    curveMid: 1,
    curveEnd: 0,
    stops: [0, 0.7, 0.9, 1],
    colors: [C(0.8, 0.8, 0.8, 0.6), C(0.9, 0.9, 0.9, 0.4), C(1, 1, 1, 0.2), C(1, 1, 1, 0)],
    blendMode: 'alpha',
    sizeOverride: [300, 300]
  }),
  summon_circle: S({
    amount: 25,
    lifetime: 1.5,
    preprocess: 0.5,
    randomness: 0.3,
    emissionShape: 2,
    emissionExtents: [130, 80],
    direction: [0, -1],
    spreadDeg: 20,
    gravity: [0, -50],
    velocityMin: 30,
    velocityMax: 60,
    scaleMin: 2,
    scaleMax: 4,
    baseSize: 3,
    curveStart: 0,
    curveMidT: 0.4,
    curveMid: 1,
    curveEnd: 0,
    stops: [0, 0.5, 0.8, 1],
    colors: [C(1, 0.9, 0.5, 1), C(0.8, 0.5, 1, 0.8), C(0.5, 0.3, 0.8, 0.2), C(0.5, 0.3, 0.8, 0)],
    blendMode: 'additive',
    sizeOverride: [340, 260]
  }),
  torch_fire: S({
    amount: 50,
    lifetime: 0.6,
    preprocess: 1,
    randomness: 0.3,
    emissionShape: 1,
    emissionRadius: 8,
    direction: [0, -1],
    spreadDeg: 20,
    gravity: [0, -450],
    velocityMin: 20,
    velocityMax: 40,
    angularVelocityMin: -360,
    angularVelocityMax: 360,
    scaleMin: 0.5,
    scaleMax: 1.5,
    baseSize: 20,
    curveStart: 0,
    curveMidT: 0.11,
    curveMid: 1,
    curveEnd: 0,
    stops: [0.058, 0.192, 0.686, 0.936],
    colors: [C(1, 1, 1, 1), C(0.97, 0.177, 0.0, 1), C(1, 0.013, 0, 1), C(0.324, 0.241, 0.240, 1)],
    blendMode: 'additive',
    spriteKind: 'fire',
    spriteRegion: 'fire_particle',
    sizeOverride: [230, 320]
  }),
  wall_slide_spark: S({
    amount: 18,
    lifetime: 0.3,
    oneShot: false,
    randomness: 0.5,
    emissionShape: 1,
    emissionRadius: 5,
    direction: [0, -1],
    spreadDeg: 30,
    gravity: [0, 300],
    velocityMin: 40,
    velocityMax: 80,
    scaleMin: 2,
    scaleMax: 4,
    baseSize: 2.4,
    stops: [0, 0.4, 0.8, 1],
    colors: [C(1, 0.9, 0.5, 1), C(1, 0.6, 0.2, 0.8), C(1, 0.3, 0.0, 0.2), C(1, 0.3, 0.0, 0)],
    blendMode: 'additive',
    spriteKind: 'spark',
    sizeOverride: [220, 260]
  }),
  water_splash: S({
    amount: 25,
    lifetime: 0.8,
    oneShot: true,
    explosiveness: 1,
    randomness: 0.4,
    emissionShape: 1,
    emissionRadius: 8,
    direction: [0, -1],
    spreadDeg: 60,
    gravity: [0, 400],
    velocityMin: 80,
    velocityMax: 150,
    scaleMin: 2,
    scaleMax: 4,
    baseSize: 2.8,
    stops: [0, 0.5, 0.8, 1],
    colors: [C(0.3, 0.5, 1, 1), C(0.4, 0.6, 1, 0.8), C(0.5, 0.7, 1, 0.25), C(0.5, 0.7, 1, 0)],
    blendMode: 'alpha',
    sizeOverride: [280, 260]
  }),
  waterfall_mist: S({
    amount: 30,
    lifetime: 2.5,
    preprocess: 1.5,
    randomness: 0.4,
    emissionShape: 2,
    emissionExtents: [170, 95],
    direction: [0, -1],
    spreadDeg: 40,
    gravity: [0, -30],
    velocityMin: 20,
    velocityMax: 40,
    scaleMin: 5,
    scaleMax: 10,
    baseSize: 3.4,
    curveStart: 0.2,
    curveMidT: 0.5,
    curveMid: 1,
    curveEnd: 0.5,
    stops: [0, 0.6, 0.85, 1],
    colors: [C(0.7, 0.8, 0.9, 0.4), C(0.8, 0.85, 0.95, 0.3), C(0.9, 0.9, 1, 0.12), C(0.9, 0.9, 1, 0)],
    blendMode: 'alpha',
    sizeOverride: [420, 280]
  }),
  wood_debris: S({
    amount: 15,
    lifetime: 0.7,
    oneShot: true,
    explosiveness: 1,
    randomness: 0.5,
    emissionShape: 1,
    emissionRadius: 8,
    direction: [0, -1],
    spreadDeg: 180,
    gravity: [0, 400],
    velocityMin: 100,
    velocityMax: 200,
    angularVelocityMin: -360,
    angularVelocityMax: 360,
    scaleMin: 2,
    scaleMax: 4,
    baseSize: 3.0,
    stops: [0.0, 0.002, 0.9, 1.0],
    colors: [C(0.8, 0.6, 0.4, 1), C(0.486, 0.387, 0.288, 1), C(0.42, 0.33, 0.22, 0.2), C(0.42, 0.33, 0.22, 0)],
    blendMode: 'alpha',
    sizeOverride: [260, 250]
  })
};

const spriteKindToFloat = (kind: SpriteKind): number => {
  switch (kind) {
    case 'leaf':
      return 1;
    case 'firefly':
      return 2;
    case 'spark':
      return 3;
    case 'fire':
      return 4;
    default:
      return 0;
  }
};

const defaultSizeFromSpec = (spec: HaowgParticleSpec): [number, number] => {
  if (spec.sizeOverride) {
    return spec.sizeOverride;
  }

  const emitW = spec.emissionShape === 2 || spec.emissionShape === 3 ? spec.emissionExtents[0] * 2 : spec.emissionRadius * 2;
  const emitH = spec.emissionShape === 2 || spec.emissionShape === 3 ? spec.emissionExtents[1] * 2 : spec.emissionRadius * 2;
  const travel = spec.velocityMax * spec.lifetime;
  const gravX = Math.abs(spec.gravity[0]) * spec.lifetime * spec.lifetime * 0.5;
  const gravY = Math.abs(spec.gravity[1]) * spec.lifetime * spec.lifetime * 0.5;
  const spread = spec.scaleMax * spec.baseSize * 2.2;

  const width = Math.max(120, emitW + travel + gravX + spread);
  const height = Math.max(120, emitH + travel + gravY + spread);
  return [width, height];
};

interface ShaderSpec {
  mode: number;
  a?: number;
  b?: number;
  c?: number;
  d?: number;
  colorA?: [number, number, number, number];
  colorB?: [number, number, number, number];
  colorC?: [number, number, number, number];
  blendMode?: BlendMode;
  size?: [number, number];
}

const SHADER_MODE: Record<HaowgShaderSourceName, number> = {
  blink: 0,
  blur_amount: 1,
  burning: 2,
  chromatic_aberration: 3,
  color_change: 4,
  dissolve: 5,
  enemy: 6,
  energy_barrier: 7,
  flash_white: 8,
  fog: 9,
  frozen: 10,
  grayscale: 11,
  heat_distortion: 12,
  invisibility: 13,
  outline_glow: 14,
  petrify: 15,
  poison: 16,
  portal_vortex: 17,
  radial_blur: 18,
  shake_intensity: 19,
  starSky: 20,
  vignette: 21,
  water: 22,
  water_surface: 23
};

const SHADER_SPECS: Record<HaowgShaderSourceName, ShaderSpec> = {
  blink: { mode: SHADER_MODE.blink, a: 10, b: 0.3, size: [230, 230] },
  blur_amount: { mode: SHADER_MODE.blur_amount, a: 0.08, size: [230, 230] },
  burning: {
    mode: SHADER_MODE.burning,
    a: 0.8,
    b: 0.03,
    colorA: [1.0, 0.8, 0.2, 1.0],
    colorB: [1.0, 0.3, 0.0, 1.0],
    size: [230, 230]
  },
  chromatic_aberration: { mode: SHADER_MODE.chromatic_aberration, a: 0.012, b: 1.0, c: 0.0, size: [230, 230] },
  color_change: {
    mode: SHADER_MODE.color_change,
    a: 0.7,
    b: 1.0,
    colorA: [1.0, 0.3, 0.3, 1.0],
    size: [230, 230]
  },
  dissolve: {
    mode: SHADER_MODE.dissolve,
    a: 0.45,
    b: 0.05,
    colorA: [1.0, 0.5, 0.0, 1.0],
    size: [230, 230]
  },
  enemy: { mode: SHADER_MODE.enemy, a: 0.06, b: 0.02, c: 0.55, size: [230, 230] },
  energy_barrier: {
    mode: SHADER_MODE.energy_barrier,
    a: 20,
    b: 3,
    c: 1.5,
    colorA: [0.3, 0.7, 1.0, 0.8],
    size: [250, 250]
  },
  flash_white: { mode: SHADER_MODE.flash_white, a: 0.85, colorA: [1.0, 1.0, 1.0, 1.0], size: [230, 230] },
  fog: { mode: SHADER_MODE.fog, a: 0.35, b: 0.02, c: 0.01, blendMode: 'alpha', size: [300, 220] },
  frozen: {
    mode: SHADER_MODE.frozen,
    a: 0.8,
    b: 0.5,
    colorA: [0.5, 0.8, 1.0, 1.0],
    size: [230, 230]
  },
  grayscale: { mode: SHADER_MODE.grayscale, a: 1.0, size: [230, 230] },
  heat_distortion: { mode: SHADER_MODE.heat_distortion, a: 2.0, b: 0.03, blendMode: 'alpha', size: [230, 230] },
  invisibility: { mode: SHADER_MODE.invisibility, a: 0.85, b: 0.02, blendMode: 'alpha', size: [230, 230] },
  outline_glow: {
    mode: SHADER_MODE.outline_glow,
    a: 2.0,
    b: 1.0,
    colorA: [1.0, 1.0, 0.5, 1.0],
    size: [250, 250]
  },
  petrify: {
    mode: SHADER_MODE.petrify,
    a: 0.85,
    b: 0.5,
    colorA: [0.5, 0.5, 0.5, 1.0],
    size: [230, 230]
  },
  poison: {
    mode: SHADER_MODE.poison,
    a: 0.9,
    b: 3.0,
    colorA: [0.3, 1.0, 0.3, 1.0],
    size: [230, 230]
  },
  portal_vortex: {
    mode: SHADER_MODE.portal_vortex,
    a: 2.0,
    b: 0.5,
    colorA: [0.5, 0.2, 1.0, 1.0],
    colorB: [0.2, 0.8, 1.0, 1.0],
    size: [260, 260]
  },
  radial_blur: { mode: SHADER_MODE.radial_blur, a: 0.03, blendMode: 'alpha', size: [260, 260] },
  shake_intensity: { mode: SHADER_MODE.shake_intensity, a: 0.03, size: [230, 230] },
  starSky: {
    mode: SHADER_MODE.starSky,
    a: 50,
    b: 8,
    c: 0.05,
    d: 0.05,
    colorA: [0.5, 0.0, 1.0, 1.0],
    colorB: [1.0, 1.0, 1.0, 1.0],
    size: [360, 230]
  },
  vignette: {
    mode: SHADER_MODE.vignette,
    a: 0.5,
    b: 0.8,
    colorA: [1.0, 0.0, 0.0, 1.0],
    blendMode: 'alpha',
    size: [300, 230]
  },
  water: {
    mode: SHADER_MODE.water,
    a: 0.52,
    b: 0.05,
    c: 0.2,
    d: 0.35,
    colorA: [0.3, 0.5, 0.9, 1.0],
    blendMode: 'alpha',
    size: [360, 180]
  },
  water_surface: {
    mode: SHADER_MODE.water_surface,
    a: 1.0,
    b: 5.0,
    c: 0.02,
    d: 1.0,
    colorA: [0.5, 0.7, 1.0, 0.8],
    blendMode: 'alpha',
    size: [360, 180]
  }
};

interface LayerOptions {
  point?: 'position' | 'source' | 'target' | 'motion';
  pass?: 'behind' | 'front';
  startTime?: number;
  duration?: number;
  loop?: boolean;
  width?: number;
  height?: number;
  alpha?: number;
  alphaFrom?: number;
  alphaTo?: number;
  scaleFrom?: number;
  scaleTo?: number;
  blendMode?: BlendMode;
  extraData?: Record<string, unknown>;
}

const particleLayer = (effectName: HaowgEffectSourceName, options: LayerOptions = {}): VfxShaderLayer => {
  const spec = EFFECT_SPECS[effectName];
  const [w, h] = defaultSizeFromSpec(spec);

  return {
    kind: 'shader',
    shaderKey: 'haowg.effectParticle',
    pass: options.pass ?? 'front',
    point: options.point ?? 'position',
    startTime: options.startTime,
    duration: options.duration,
    loop: options.loop,
    width: options.width ?? w,
    height: options.height ?? h,
    alpha: options.alpha,
    alphaFrom: options.alphaFrom,
    alphaTo: options.alphaTo,
    scaleFrom: options.scaleFrom,
    scaleTo: options.scaleTo,
    data: {
      effectName,
      blendMode: options.blendMode ?? spec.blendMode,
      ...options.extraData
    }
  };
};

const shaderPreviewLayer = (shaderName: HaowgShaderSourceName): VfxShaderLayer => {
  const spec = SHADER_SPECS[shaderName];
  const size = spec.size ?? [230, 230];
  return {
    kind: 'shader',
    shaderKey: 'haowg.sourceShader',
    pass: 'front',
    point: 'position',
    loop: true,
    width: size[0],
    height: size[1],
    alpha: 1,
    data: {
      shaderName,
      blendMode: spec.blendMode ?? 'additive',
      a: spec.a,
      b: spec.b,
      c: spec.c,
      d: spec.d,
      colorA: spec.colorA,
      colorB: spec.colorB,
      colorC: spec.colorC
    }
  };
};

const EFFECT_DEFINITIONS = (): VfxDefinition[] => [
  {
    id: HAOWG_EFFECT_IDS.ash_particles,
    duration: 3,
    loop: true,
    layers: [particleLayer('ash_particles', { pass: 'behind', alpha: 0.86 })]
  },
  {
    id: HAOWG_EFFECT_IDS.blood_splash,
    duration: 0.55,
    layers: [particleLayer('blood_splash', { alpha: 1 })]
  },
  {
    id: HAOWG_EFFECT_IDS.campfire_smoke,
    duration: 3,
    loop: true,
    layers: [particleLayer('campfire_smoke', { pass: 'behind', alpha: 0.9 })]
  },
  {
    id: HAOWG_EFFECT_IDS.candle_flame,
    duration: 0.9,
    loop: true,
    layers: [particleLayer('candle_flame', { alpha: 0.95 })]
  },
  {
    id: HAOWG_EFFECT_IDS.combat_particle,
    duration: 0.7,
    layers: [particleLayer('combat_particle', { alpha: 1 })]
  },
  {
    id: HAOWG_EFFECT_IDS.combo_ring,
    duration: 0.62,
    layers: [particleLayer('combo_ring', { alpha: 1 })]
  },
  {
    id: HAOWG_EFFECT_IDS.dash_trail,
    duration: 0.36,
    loop: true,
    motion: { from: 'source', to: 'target', duration: 0.28, easing: 'easeOutCubic' },
    layers: [particleLayer('dash_trail', { point: 'motion', duration: 0.28, alpha: 0.92 })]
  },
  {
    id: HAOWG_EFFECT_IDS.dust_cloud,
    duration: 1.7,
    layers: [particleLayer('dust_cloud', { pass: 'behind', alpha: 0.9 })]
  },
  {
    id: HAOWG_EFFECT_IDS.energy_burst,
    duration: 0.95,
    layers: [particleLayer('energy_burst', { alpha: 1 })]
  },
  {
    id: HAOWG_EFFECT_IDS.falling_leaves,
    duration: 5,
    loop: true,
    layers: [particleLayer('falling_leaves', { pass: 'behind', alpha: 0.95 })]
  },
  {
    id: HAOWG_EFFECT_IDS.fireball_trail,
    duration: 0.58,
    loop: true,
    motion: { from: 'source', to: 'target', duration: 0.45, easing: 'easeOutCubic' },
    layers: [particleLayer('fireball_trail', { point: 'motion', duration: 0.45, alpha: 0.96 })]
  },
  {
    id: HAOWG_EFFECT_IDS.fireflies,
    duration: 3,
    loop: true,
    layers: [particleLayer('fireflies', { pass: 'behind', alpha: 1 })]
  },
  {
    id: HAOWG_EFFECT_IDS.heal_particles,
    duration: 1.2,
    loop: true,
    layers: [particleLayer('heal_particles', { alpha: 0.98 })]
  },
  {
    id: HAOWG_EFFECT_IDS.ice_frost,
    duration: 0.95,
    layers: [particleLayer('ice_frost', { alpha: 1 })]
  },
  {
    id: HAOWG_EFFECT_IDS.jump_dust,
    duration: 0.55,
    layers: [particleLayer('jump_dust', { pass: 'behind', alpha: 0.95 })]
  },
  {
    id: HAOWG_EFFECT_IDS.lightning_chain,
    duration: 0.45,
    layers: [
      particleLayer('lightning_chain', { alpha: 0.95, extraData: { rotDeg: 0, tunableLightning: true } }),
      particleLayer('lightning_chain', { alpha: 0.95, extraData: { rotDeg: 60, tunableLightning: true } }),
      particleLayer('lightning_chain', { alpha: 0.95, extraData: { rotDeg: 120, tunableLightning: true } }),
      particleLayer('lightning_chain', { alpha: 0.95, extraData: { rotDeg: 180, tunableLightning: true } }),
      particleLayer('lightning_chain', { alpha: 0.95, extraData: { rotDeg: 240, tunableLightning: true } }),
      particleLayer('lightning_chain', { alpha: 0.95, extraData: { rotDeg: 300, tunableLightning: true } })
    ]
  },
  {
    id: HAOWG_EFFECT_IDS.magic_aura,
    duration: 2,
    loop: true,
    layers: [particleLayer('magic_aura', { pass: 'behind', alpha: 0.98 })]
  },
  {
    id: HAOWG_EFFECT_IDS.poison_cloud,
    duration: 2,
    loop: true,
    layers: [particleLayer('poison_cloud', { pass: 'behind', alpha: 0.9 })]
  },
  {
    id: HAOWG_EFFECT_IDS.portal_vortex,
    duration: 1.8,
    loop: true,
    layers: [particleLayer('portal_vortex', { pass: 'behind', alpha: 0.96 })]
  },
  {
    id: HAOWG_EFFECT_IDS.rain_drops,
    duration: 1.5,
    loop: true,
    layers: [particleLayer('rain_drops', { pass: 'behind', alpha: 0.92, blendMode: 'alpha' })]
  },
  {
    id: HAOWG_EFFECT_IDS.shield_break,
    duration: 0.78,
    layers: [particleLayer('shield_break', { alpha: 1 })]
  },
  {
    id: HAOWG_EFFECT_IDS.snow_flakes,
    duration: 5,
    loop: true,
    layers: [particleLayer('snow_flakes', { pass: 'behind', alpha: 0.92, blendMode: 'alpha' })]
  },
  {
    id: HAOWG_EFFECT_IDS.sparks,
    duration: 0.62,
    layers: [particleLayer('sparks', { alpha: 1 })]
  },
  {
    id: HAOWG_EFFECT_IDS.steam,
    duration: 2.1,
    layers: [particleLayer('steam', { pass: 'behind', alpha: 0.9, blendMode: 'alpha' })]
  },
  {
    id: HAOWG_EFFECT_IDS.summon_circle,
    duration: 1.5,
    loop: true,
    layers: [particleLayer('summon_circle', { alpha: 0.96 })]
  },
  {
    id: HAOWG_EFFECT_IDS.torch_fire,
    duration: 0.65,
    loop: true,
    layers: [particleLayer('torch_fire', { alpha: 0.98 })]
  },
  {
    id: HAOWG_EFFECT_IDS.wall_slide_spark,
    duration: 0.35,
    loop: true,
    layers: [particleLayer('wall_slide_spark', { alpha: 0.95 })]
  },
  {
    id: HAOWG_EFFECT_IDS.water_splash,
    duration: 0.95,
    layers: [particleLayer('water_splash', { pass: 'behind', alpha: 0.95, blendMode: 'alpha' })]
  },
  {
    id: HAOWG_EFFECT_IDS.waterfall_mist,
    duration: 2.5,
    loop: true,
    layers: [particleLayer('waterfall_mist', { pass: 'behind', alpha: 0.92, blendMode: 'alpha' })]
  },
  {
    id: HAOWG_EFFECT_IDS.wood_debris,
    duration: 0.8,
    layers: [particleLayer('wood_debris', { alpha: 1 })]
  }
];

const SHADER_DEFINITIONS = (): VfxDefinition[] =>
  HAOWG_SHADER_SOURCE_NAMES.map(name => ({
    id: HAOWG_SHADER_IDS[name],
    duration: 2.6,
    loop: true,
    layers: [shaderPreviewLayer(name)]
  }));

const parseNumber = (value: unknown, fallback: number): number => (typeof value === 'number' && Number.isFinite(value) ? value : fallback);

const parseString = (value: unknown, fallback: string): string => (typeof value === 'string' ? value : fallback);

const parseBlend = (value: unknown, fallback: BlendMode): BlendMode => (value === 'alpha' ? 'alpha' : value === 'additive' ? 'additive' : fallback);

const safeUniform1f = (gl: WebGLRenderingContext, shader: Shader, name: string, value: number) => {
  const loc = shader.getUniformLocation(name, false);
  if (loc) {
    gl.uniform1f(loc, value);
  }
};

const safeUniform2f = (gl: WebGLRenderingContext, shader: Shader, name: string, x: number, y: number) => {
  const loc = shader.getUniformLocation(name, false);
  if (loc) {
    gl.uniform2f(loc, x, y);
  }
};

const safeUniform4f = (gl: WebGLRenderingContext, shader: Shader, name: string, x: number, y: number, z: number, w: number) => {
  const loc = shader.getUniformLocation(name, false);
  if (loc) {
    gl.uniform4f(loc, x, y, z, w);
  }
};

const safeUniform1i = (gl: WebGLRenderingContext, shader: Shader, name: string, value: number) => {
  const loc = shader.getUniformLocation(name, false);
  if (loc) {
    gl.uniform1i(loc, value);
  }
};

const regionUv = (region: TextureRegion): [number, number, number, number] => [region.u, region.v, region.u2, region.v2];

export interface HaowgVfxLibraryOptions {
  gl: WebGLRenderingContext;
  projection: () => Float32Array;
  spriteAtlas?: TextureAtlas;
  lightningRayCount?: () => number;
  lightningJitter?: () => number;
  distortionAmount?: () => number;
  intensity?: () => number;
}

export interface HaowgVfxLibrary extends Disposable {
  effectIds: typeof HAOWG_EFFECT_IDS;
  shaderIds: typeof HAOWG_SHADER_IDS;
  showcaseItems: HaowgShowcaseItem[];
}

export const installHaowgVfxLibrary = async (
  vfx: VfxManager,
  options: HaowgVfxLibraryOptions
): Promise<HaowgVfxLibrary> => {
  const { gl, projection } = options;

  const getLightningRayCount = options.lightningRayCount ?? (() => 6);
  const getLightningJitter = options.lightningJitter ?? (() => 0.55);
  const getDistortionAmount = options.distortionAmount ?? (() => 0.5);
  const getIntensity = options.intensity ?? (() => 1);

  if (options.spriteAtlas) {
    vfx.registerAtlas('haowg.sprites', options.spriteAtlas);
  }

  const spriteRegions = new Map<string, TextureRegion>();
  if (options.spriteAtlas) {
    for (const key of ['leaf', 'firefly', 'spark_particle2', 'fire_particle']) {
      const region = options.spriteAtlas.findRegion(key);
      if (region) {
        spriteRegions.set(key, region);
      }
    }
  }

  const effectRenderer = new ShaderQuadRenderer(gl, HAOWG_EFFECT_FS);
  const sourceShaderRenderer = new ShaderQuadRenderer(gl, HAOWG_SHADER_FS);

  vfx.registerShaderRenderer('haowg.effectParticle', {
    draw: (ctx: VfxShaderDrawContext) => {
      const data = (ctx.layer.data ?? {}) as Record<string, unknown>;
      const effectName = parseString(data.effectName, 'ash_particles') as HaowgEffectSourceName;
      const spec = EFFECT_SPECS[effectName] ?? EFFECT_SPECS.ash_particles;

      const blendMode = parseBlend(data.blendMode, spec.blendMode);

      let centerX = ctx.position.x;
      let centerY = ctx.position.y;
      let width = ctx.width * ctx.scaleX;
      let height = ctx.height * ctx.scaleY;
      let rotationDeg = ctx.rotation;

      if (ctx.layer.point === 'motion') {
        const len = distance(ctx.source, ctx.motion);
        if (len > 1) {
          centerX = ctx.source.x + (ctx.motion.x - ctx.source.x) * 0.5;
          centerY = ctx.source.y + (ctx.motion.y - ctx.source.y) * 0.5;
          width = Math.max(width, len + width * 0.35);
          rotationDeg = angleDeg(ctx.source, ctx.motion);
        }
      }

      const rotDeg = parseNumber(data.rotDeg, 0);

      let dirX = spec.direction[0];
      let dirY = spec.direction[1];
      if (rotDeg !== 0) {
        [dirX, dirY] = rotateVec(dirX, dirY, rotDeg);
      }

      let amount = spec.amount;
      let spreadDeg = spec.spreadDeg;
      let randomness = spec.randomness;

      if (effectName === 'lightning_chain' || data.tunableLightning === true) {
        const rayScale = clamp(getLightningRayCount() / 6, 0.25, 2.0);
        amount = clamp(Math.round(spec.amount * rayScale), 4, 72);
        spreadDeg = clamp(spec.spreadDeg * (0.5 + getLightningJitter() * 1.6), 2, 60);
        randomness = clamp(spec.randomness * (0.5 + getLightningJitter()), 0, 1);
      }

      const simCount = clamp(Math.round(amount), 1, 72);
      const densityScale = amount > 72 ? amount / 72 : 1;

      const spriteKind = spriteKindToFloat(spec.spriteKind);
      const region = spec.spriteRegion ? spriteRegions.get(spec.spriteRegion) : undefined;
      const useSprite = !!region;

      effectRenderer.draw({
        projection: projection(),
        centerX,
        centerY,
        width,
        height,
        rotationDeg,
        time: ctx.localTime,
        alpha: ctx.alpha,
        blendMode,
        beforeDraw: shader => {
          safeUniform2f(gl, shader, 'u_quadSize', width, height);

          safeUniform1f(gl, shader, 'u_simCount', simCount);
          safeUniform1f(gl, shader, 'u_densityScale', densityScale);
          safeUniform1f(gl, shader, 'u_lifetime', spec.lifetime);
          safeUniform1f(gl, shader, 'u_oneShot', spec.oneShot ? 1 : 0);
          safeUniform1f(gl, shader, 'u_explosiveness', spec.explosiveness);
          safeUniform1f(gl, shader, 'u_preprocess', spec.preprocess);
          safeUniform1f(gl, shader, 'u_randomness', randomness);

          safeUniform1f(gl, shader, 'u_emissionShape', spec.emissionShape);
          safeUniform1f(gl, shader, 'u_emissionRadius', spec.emissionRadius);
          safeUniform2f(gl, shader, 'u_emissionExtents', spec.emissionExtents[0], spec.emissionExtents[1]);
          safeUniform1f(gl, shader, 'u_emissionRingRadius', spec.emissionRingRadius);
          safeUniform1f(gl, shader, 'u_emissionRingInnerRadius', spec.emissionRingInnerRadius);

          safeUniform2f(gl, shader, 'u_direction', dirX, dirY);
          safeUniform1f(gl, shader, 'u_spreadRad', (spreadDeg * Math.PI) / 180);
          safeUniform2f(gl, shader, 'u_gravity', spec.gravity[0], spec.gravity[1]);
          safeUniform2f(gl, shader, 'u_velocityRange', spec.velocityMin, spec.velocityMax);
          safeUniform2f(gl, shader, 'u_dampingRange', spec.dampingMin, spec.dampingMax);
          safeUniform2f(gl, shader, 'u_angularVelRange', spec.angularVelocityMin, spec.angularVelocityMax);
          safeUniform2f(gl, shader, 'u_radialAccelRange', spec.radialAccelMin, spec.radialAccelMax);
          safeUniform2f(gl, shader, 'u_tangentAccelRange', spec.tangentialAccelMin, spec.tangentialAccelMax);
          safeUniform2f(gl, shader, 'u_scaleRange', spec.scaleMin, spec.scaleMax);
          safeUniform1f(gl, shader, 'u_baseSize', spec.baseSize);

          safeUniform4f(gl, shader, 'u_stopVec', spec.stops[0], spec.stops[1], spec.stops[2], spec.stops[3]);
          safeUniform4f(gl, shader, 'u_col0', spec.colors[0][0], spec.colors[0][1], spec.colors[0][2], spec.colors[0][3]);
          safeUniform4f(gl, shader, 'u_col1', spec.colors[1][0], spec.colors[1][1], spec.colors[1][2], spec.colors[1][3]);
          safeUniform4f(gl, shader, 'u_col2', spec.colors[2][0], spec.colors[2][1], spec.colors[2][2], spec.colors[2][3]);
          safeUniform4f(gl, shader, 'u_col3', spec.colors[3][0], spec.colors[3][1], spec.colors[3][2], spec.colors[3][3]);

          safeUniform1f(gl, shader, 'u_curveStart', spec.curveStart);
          safeUniform1f(gl, shader, 'u_curveMidT', spec.curveMidT);
          safeUniform1f(gl, shader, 'u_curveMid', spec.curveMid);
          safeUniform1f(gl, shader, 'u_curveEnd', spec.curveEnd);

          safeUniform1f(gl, shader, 'u_spriteKind', spriteKind);
          safeUniform1f(gl, shader, 'u_useSpriteTexture', useSprite ? 1 : 0);

          if (useSprite && region) {
            const [u, v, u2, v2] = regionUv(region);
            safeUniform4f(gl, shader, 'u_spriteUv', u, v, u2, v2);
            region.texture.bind(1);
            safeUniform1i(gl, shader, 'u_spriteTex', 1);
          }
        }
      });
    }
  });

  vfx.registerShaderRenderer('haowg.sourceShader', {
    draw: (ctx: VfxShaderDrawContext) => {
      const data = (ctx.layer.data ?? {}) as Record<string, unknown>;
      const shaderName = parseString(data.shaderName, 'blink') as HaowgShaderSourceName;
      const spec = SHADER_SPECS[shaderName] ?? SHADER_SPECS.blink;

      const mode = spec.mode;
      const blendMode = parseBlend(data.blendMode, spec.blendMode ?? 'additive');

      let a = parseNumber(data.a, spec.a ?? 0);
      let b = parseNumber(data.b, spec.b ?? 0);
      let c = parseNumber(data.c, spec.c ?? 0);
      let d = parseNumber(data.d, spec.d ?? 0);

      if (shaderName === 'shake_intensity') {
        a = clamp(a * (0.4 + getLightningJitter()), 0, 0.2);
      }

      if (DISTORTION_SHADERS.has(shaderName)) {
        b = b * (0.5 + getDistortionAmount());
      }

      const colorA = (data.colorA as [number, number, number, number] | undefined) ?? spec.colorA ?? [1, 1, 1, 1];
      const colorB = (data.colorB as [number, number, number, number] | undefined) ?? spec.colorB ?? [1, 1, 1, 1];
      const colorC = (data.colorC as [number, number, number, number] | undefined) ?? spec.colorC ?? [1, 1, 1, 1];

      sourceShaderRenderer.draw({
        projection: projection(),
        centerX: ctx.position.x,
        centerY: ctx.position.y,
        width: ctx.width * ctx.scaleX,
        height: ctx.height * ctx.scaleY,
        rotationDeg: ctx.rotation,
        time: ctx.localTime,
        alpha: ctx.alpha,
        blendMode,
        beforeDraw: shader => {
          safeUniform1f(gl, shader, 'u_mode', mode);
          safeUniform2f(gl, shader, 'u_resolution', ctx.width * ctx.scaleX, ctx.height * ctx.scaleY);
          safeUniform1f(gl, shader, 'u_distortionAmount', getDistortionAmount());
          safeUniform1f(gl, shader, 'u_intensity', getIntensity());

          safeUniform1f(gl, shader, 'u_a', a);
          safeUniform1f(gl, shader, 'u_b', b);
          safeUniform1f(gl, shader, 'u_c', c);
          safeUniform1f(gl, shader, 'u_d', d);

          safeUniform4f(gl, shader, 'u_colorA', colorA[0], colorA[1], colorA[2], colorA[3]);
          safeUniform4f(gl, shader, 'u_colorB', colorB[0], colorB[1], colorB[2], colorB[3]);
          safeUniform4f(gl, shader, 'u_colorC', colorC[0], colorC[1], colorC[2], colorC[3]);
        }
      });
    }
  });

  vfx.registerDefinitions([...EFFECT_DEFINITIONS(), ...SHADER_DEFINITIONS()]);

  return {
    effectIds: HAOWG_EFFECT_IDS,
    shaderIds: HAOWG_SHADER_IDS,
    showcaseItems: HAOWG_SHOWCASE_ITEMS,
    dispose() {
      effectRenderer.dispose();
      sourceShaderRenderer.dispose();
    }
  };
};
