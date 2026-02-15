import { PerspectiveCamera } from '../PerspectiveCamera';
import { Renderable } from '../Renderable';
import { RenderContext } from '../RenderContext';
import { Config, DefaultShader } from './DefaultShader';

export interface PBRStyleOptions {
  baseRoughness: number;
  baseMetallic: number;
  specularLevel: number;
  clearcoatStrength: number;
  clearcoatRoughness: number;
  ambientStrength: number;
  hemiStrength: number;
  skyTint: [number, number, number];
  groundTint: [number, number, number];
  shadowLift: number;
  rimStrength: number;
  rimPower: number;
  exposure: number;
  saturation: number;
  valueBoost: number;
  pointLightFalloff: number;
}

const DEFAULT_PBR_STYLE: PBRStyleOptions = {
  baseRoughness: 0.34,
  baseMetallic: 0.0,
  specularLevel: 1.2,
  clearcoatStrength: 0.28,
  clearcoatRoughness: 0.13,
  ambientStrength: 0.24,
  hemiStrength: 0.45,
  skyTint: [0.24, 0.3, 0.5],
  groundTint: [0.03, 0.05, 0.08],
  shadowLift: 0.03,
  rimStrength: 0.05,
  rimPower: 3.2,
  exposure: 1.18,
  saturation: 1.06,
  valueBoost: 1.03,
  pointLightFalloff: 0.2
};

export class PBRShader extends DefaultShader {
  private style: PBRStyleOptions = { ...DEFAULT_PBR_STYLE };

  public static pbrVertexShader = `
  #if defined(diffuseTextureFlag) || defined(specularTextureFlag) || defined(emissiveTextureFlag)
  #define textureFlag
  #endif

  #if defined(specularTextureFlag) || defined(specularColorFlag)
  #define specularFlag
  #endif

  attribute vec3 a_position;
  uniform mat4 u_projViewTrans;

  #if defined(colorFlag)
  varying vec4 v_color;
  attribute vec4 a_color;
  #endif

  #ifdef normalFlag
  attribute vec3 a_normal;
  uniform mat3 u_normalMatrix;
  varying vec3 v_normal;
  #endif

  #ifdef textureFlag
  attribute vec2 a_texCoords0;
  #endif

  #ifdef diffuseTextureFlag
  uniform vec4 u_diffuseUVTransform;
  varying vec2 v_diffuseUV;
  #endif

  #ifdef emissiveTextureFlag
  uniform vec4 u_emissiveUVTransform;
  varying vec2 v_emissiveUV;
  #endif

  #ifdef specularTextureFlag
  uniform vec4 u_specularUVTransform;
  varying vec2 v_specularUV;
  #endif

  #ifdef boneWeight0Flag
  #define boneWeightsFlag
  attribute vec2 a_boneWeight0;
  #endif

  #ifdef boneWeight1Flag
  #ifndef boneWeightsFlag
  #define boneWeightsFlag
  #endif
  attribute vec2 a_boneWeight1;
  #endif

  #ifdef boneWeight2Flag
  #ifndef boneWeightsFlag
  #define boneWeightsFlag
  #endif
  attribute vec2 a_boneWeight2;
  #endif

  #ifdef boneWeight3Flag
  #ifndef boneWeightsFlag
  #define boneWeightsFlag
  #endif
  attribute vec2 a_boneWeight3;
  #endif

  #ifdef boneWeight4Flag
  #ifndef boneWeightsFlag
  #define boneWeightsFlag
  #endif
  attribute vec2 a_boneWeight4;
  #endif

  #ifdef boneWeight5Flag
  #ifndef boneWeightsFlag
  #define boneWeightsFlag
  #endif
  attribute vec2 a_boneWeight5;
  #endif

  #ifdef boneWeight6Flag
  #ifndef boneWeightsFlag
  #define boneWeightsFlag
  #endif
  attribute vec2 a_boneWeight6;
  #endif

  #ifdef boneWeight7Flag
  #ifndef boneWeightsFlag
  #define boneWeightsFlag
  #endif
  attribute vec2 a_boneWeight7;
  #endif

  #if defined(numBones) && defined(boneWeightsFlag)
  #if (numBones > 0)
  #define skinningFlag
  #endif
  #endif

  uniform mat4 u_worldTrans;

  #if defined(numBones)
  #if numBones > 0
  uniform mat4 u_bones[numBones];
  #endif
  #endif

  #ifdef blendedFlag
  uniform float u_opacity;
  varying float v_opacity;
  #ifdef alphaTestFlag
  uniform float u_alphaTest;
  varying float v_alphaTest;
  #endif
  #endif

  varying vec3 v_worldPos;
  varying vec3 v_ambientLight;

  #ifdef lightingFlag
    #ifdef ambientLightFlag
    uniform vec3 u_ambientLight;
    #endif

    #ifdef ambientCubemapFlag
    uniform vec3 u_ambientCubemap[6];
    #endif
  #endif

  void main() {
    #ifdef diffuseTextureFlag
      v_diffuseUV = u_diffuseUVTransform.xy + a_texCoords0 * u_diffuseUVTransform.zw;
    #endif

    #ifdef emissiveTextureFlag
      v_emissiveUV = u_emissiveUVTransform.xy + a_texCoords0 * u_emissiveUVTransform.zw;
    #endif

    #ifdef specularTextureFlag
      v_specularUV = u_specularUVTransform.xy + a_texCoords0 * u_specularUVTransform.zw;
    #endif

    #if defined(colorFlag)
      v_color = a_color;
    #endif

    #ifdef blendedFlag
      v_opacity = u_opacity;
      #ifdef alphaTestFlag
        v_alphaTest = u_alphaTest;
      #endif
    #endif

    #ifdef skinningFlag
      mat4 skinning = mat4(0.0);
      #ifdef boneWeight0Flag
        skinning += (a_boneWeight0.y) * u_bones[int(a_boneWeight0.x)];
      #endif
      #ifdef boneWeight1Flag
        skinning += (a_boneWeight1.y) * u_bones[int(a_boneWeight1.x)];
      #endif
      #ifdef boneWeight2Flag
        skinning += (a_boneWeight2.y) * u_bones[int(a_boneWeight2.x)];
      #endif
      #ifdef boneWeight3Flag
        skinning += (a_boneWeight3.y) * u_bones[int(a_boneWeight3.x)];
      #endif
      #ifdef boneWeight4Flag
        skinning += (a_boneWeight4.y) * u_bones[int(a_boneWeight4.x)];
      #endif
      #ifdef boneWeight5Flag
        skinning += (a_boneWeight5.y) * u_bones[int(a_boneWeight5.x)];
      #endif
      #ifdef boneWeight6Flag
        skinning += (a_boneWeight6.y) * u_bones[int(a_boneWeight6.x)];
      #endif
      #ifdef boneWeight7Flag
        skinning += (a_boneWeight7.y) * u_bones[int(a_boneWeight7.x)];
      #endif
    #endif

    #ifdef skinningFlag
      vec4 pos = u_worldTrans * skinning * vec4(a_position, 1.0);
    #else
      vec4 pos = u_worldTrans * vec4(a_position, 1.0);
    #endif

    vec3 normal = vec3(0.0, 1.0, 0.0);
    #if defined(normalFlag)
      #if defined(skinningFlag)
        normal = normalize((u_worldTrans * skinning * vec4(a_normal, 0.0)).xyz);
      #else
        normal = normalize(u_normalMatrix * a_normal);
      #endif
      v_normal = normal;
    #endif

    v_ambientLight = vec3(0.0);
    #ifdef lightingFlag
      #ifdef ambientLightFlag
        v_ambientLight += u_ambientLight;
      #endif
      #ifdef ambientCubemapFlag
        vec3 n = normal;
        vec3 squared = n * n;
        vec3 isPositive = step(vec3(0.0), n);
        v_ambientLight += squared.x * mix(u_ambientCubemap[0], u_ambientCubemap[1], isPositive.x);
        v_ambientLight += squared.y * mix(u_ambientCubemap[2], u_ambientCubemap[3], isPositive.y);
        v_ambientLight += squared.z * mix(u_ambientCubemap[4], u_ambientCubemap[5], isPositive.z);
      #endif
    #endif

    gl_Position = u_projViewTrans * pos;
    v_worldPos = pos.xyz;
  }
  `;

  public static pbrFragmentShader = `
  #ifdef GL_ES
  #define LOWP lowp
  #define MED mediump
  #define HIGH highp
  precision mediump float;
  #else
  #define MED
  #define LOWP
  #define HIGH
  #endif

  #if defined(specularTextureFlag) || defined(specularColorFlag)
  #define specularFlag
  #endif

  #ifdef normalFlag
  varying vec3 v_normal;
  #endif

  varying vec3 v_worldPos;
  varying vec3 v_ambientLight;

  #if defined(colorFlag)
  varying vec4 v_color;
  #endif

  #ifdef blendedFlag
  varying float v_opacity;
  #ifdef alphaTestFlag
  varying float v_alphaTest;
  #endif
  #endif

  #if defined(diffuseTextureFlag) || defined(specularTextureFlag) || defined(emissiveTextureFlag)
  #define textureFlag
  #endif

  #ifdef diffuseTextureFlag
  varying MED vec2 v_diffuseUV;
  uniform sampler2D u_diffuseTexture;
  #endif

  #ifdef specularTextureFlag
  varying MED vec2 v_specularUV;
  uniform sampler2D u_specularTexture;
  #endif

  #ifdef emissiveTextureFlag
  varying MED vec2 v_emissiveUV;
  uniform sampler2D u_emissiveTexture;
  #endif

  #ifdef diffuseColorFlag
  uniform vec4 u_diffuseColor;
  #endif

  #ifdef specularColorFlag
  uniform vec4 u_specularColor;
  #endif

  #ifdef emissiveColorFlag
  uniform vec4 u_emissiveColor;
  #endif

  #ifdef shininessFlag
  uniform float u_shininess;
  #endif

  uniform vec4 u_cameraPosition;
  #ifdef lightingFlag
  #if numDirectionalLights > 0
  struct DirectionalLight
  {
    vec3 color;
    vec3 direction;
  };
  uniform DirectionalLight u_dirLights[numDirectionalLights];
  #endif

  #if numPointLights > 0
  struct PointLight
  {
    vec3 color;
    vec3 position;
  };
  uniform PointLight u_pointLights[numPointLights];
  #endif
  #endif

  uniform float u_baseRoughness;
  uniform float u_baseMetallic;
  uniform float u_specularLevel;
  uniform float u_clearcoatStrength;
  uniform float u_clearcoatRoughness;
  uniform float u_ambientStrength;
  uniform float u_hemiStrength;
  uniform vec3 u_skyTint;
  uniform vec3 u_groundTint;
  uniform float u_shadowLift;
  uniform float u_rimStrength;
  uniform float u_rimPower;
  uniform float u_exposure;
  uniform float u_saturation;
  uniform float u_valueBoost;
  uniform float u_pointLightFalloff;

  const float PI = 3.14159265359;

  vec3 srgbToLinear(vec3 color) {
    return pow(max(color, vec3(0.0)), vec3(2.2));
  }

  vec3 linearToSrgb(vec3 color) {
    return pow(max(color, vec3(0.0)), vec3(1.0 / 2.2));
  }

  vec3 adjustSaturation(vec3 color, float saturation) {
    float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
    return mix(vec3(luma), color, saturation);
  }

  vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
  }

  float fresnelSchlickScalar(float cosTheta, float F0) {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
  }

  float distributionGGX(vec3 N, vec3 H, float roughness) {
    float a = roughness * roughness;
    float a2 = a * a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH * NdotH;
    float num = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;
    return num / max(denom, 1e-4);
  }

  float geometrySchlickGGX(float NdotV, float roughness) {
    float r = roughness + 1.0;
    float k = (r * r) * 0.125;
    float denom = NdotV * (1.0 - k) + k;
    return NdotV / max(denom, 1e-4);
  }

  float geometrySmith(vec3 N, vec3 V, vec3 L, float roughness) {
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = geometrySchlickGGX(NdotV, roughness);
    float ggx1 = geometrySchlickGGX(NdotL, roughness);
    return ggx1 * ggx2;
  }

  vec3 acesFilm(vec3 x) {
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
  }

  void main() {
    #if defined(diffuseTextureFlag) && defined(diffuseColorFlag) && defined(colorFlag)
      vec4 diffuse = texture2D(u_diffuseTexture, v_diffuseUV) * u_diffuseColor * v_color;
    #elif defined(diffuseTextureFlag) && defined(diffuseColorFlag)
      vec4 diffuse = texture2D(u_diffuseTexture, v_diffuseUV) * u_diffuseColor;
    #elif defined(diffuseTextureFlag) && defined(colorFlag)
      vec4 diffuse = texture2D(u_diffuseTexture, v_diffuseUV) * v_color;
    #elif defined(diffuseTextureFlag)
      vec4 diffuse = texture2D(u_diffuseTexture, v_diffuseUV);
    #elif defined(diffuseColorFlag) && defined(colorFlag)
      vec4 diffuse = u_diffuseColor * v_color;
    #elif defined(diffuseColorFlag)
      vec4 diffuse = u_diffuseColor;
    #elif defined(colorFlag)
      vec4 diffuse = v_color;
    #else
      vec4 diffuse = vec4(1.0);
    #endif

    #if defined(specularTextureFlag) && defined(specularColorFlag)
      vec3 specInput = texture2D(u_specularTexture, v_specularUV).rgb * u_specularColor.rgb;
    #elif defined(specularTextureFlag)
      vec3 specInput = texture2D(u_specularTexture, v_specularUV).rgb;
    #elif defined(specularColorFlag)
      vec3 specInput = u_specularColor.rgb;
    #else
      vec3 specInput = vec3(1.0);
    #endif

    #if defined(emissiveTextureFlag) && defined(emissiveColorFlag)
      vec4 emissive = texture2D(u_emissiveTexture, v_emissiveUV) * u_emissiveColor;
    #elif defined(emissiveTextureFlag)
      vec4 emissive = texture2D(u_emissiveTexture, v_emissiveUV);
    #elif defined(emissiveColorFlag)
      vec4 emissive = u_emissiveColor;
    #else
      vec4 emissive = vec4(0.0);
    #endif

    vec3 baseColor = srgbToLinear(diffuse.rgb);
    vec3 emissiveLinear = srgbToLinear(emissive.rgb);
    vec3 specLinear = srgbToLinear(specInput);
    float specMask = clamp(dot(specLinear, vec3(0.2126, 0.7152, 0.0722)), 0.0, 1.0);

    vec3 N = vec3(0.0, 1.0, 0.0);
    #ifdef normalFlag
      N = normalize(v_normal);
    #endif
    vec3 V = normalize(u_cameraPosition.xyz - v_worldPos);
    float NdotV = max(dot(N, V), 1e-4);

    float roughness = clamp(u_baseRoughness, 0.05, 0.98);
    #ifdef shininessFlag
      float fromShininess = sqrt(2.0 / max(u_shininess + 2.0, 2.0));
      roughness = mix(roughness, clamp(fromShininess, 0.05, 0.95), 0.45);
    #endif
    roughness = clamp(roughness - specMask * 0.05, 0.05, 0.96);

    float metallic = clamp(u_baseMetallic, 0.0, 1.0);
    vec3 F0 = mix(vec3(0.04), baseColor, metallic);
    F0 *= mix(0.82, 1.18, specMask);
    F0 *= u_specularLevel;
    F0 = clamp(F0, vec3(0.02), vec3(0.98));

    vec3 Lo = vec3(0.0);

    #if defined(lightingFlag)
      #if numDirectionalLights > 0
        for (int i = 0; i < numDirectionalLights; i++) {
          vec3 L = normalize(-u_dirLights[i].direction);
          vec3 H = normalize(V + L);
          float NdotL = max(dot(N, L), 0.0);
          if (NdotL > 0.0) {
            vec3 radiance = u_dirLights[i].color;
            vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);
            float D = distributionGGX(N, H, roughness);
            float G = geometrySmith(N, V, L, roughness);
            vec3 spec = (D * G * F) / max(4.0 * NdotV * NdotL, 1e-4);
            vec3 kS = F;
            vec3 kD = (vec3(1.0) - kS) * (1.0 - metallic);
            vec3 diffuseBRDF = kD * baseColor / PI;
            Lo += (diffuseBRDF + spec) * radiance * NdotL;

            float ccRough = clamp(u_clearcoatRoughness, 0.04, 0.4);
            float Dcc = distributionGGX(N, H, ccRough);
            float Gcc = geometrySmith(N, V, L, ccRough);
            float Fcc = fresnelSchlickScalar(max(dot(H, V), 0.0), 0.04);
            float clearcoat = (Dcc * Gcc * Fcc) / max(4.0 * NdotV * NdotL, 1e-4);
            Lo += radiance * (clearcoat * u_clearcoatStrength * NdotL);
          }
        }
      #endif

      #if numPointLights > 0
        for (int i = 0; i < numPointLights; i++) {
          vec3 toLight = u_pointLights[i].position - v_worldPos;
          float dist2 = dot(toLight, toLight);
          vec3 L = normalize(toLight);
          vec3 H = normalize(V + L);
          float NdotL = max(dot(N, L), 0.0);
          if (NdotL > 0.0) {
            float attenuation = 1.0 / (1.0 + dist2 * u_pointLightFalloff);
            vec3 radiance = u_pointLights[i].color * attenuation;
            vec3 F = fresnelSchlick(max(dot(H, V), 0.0), F0);
            float D = distributionGGX(N, H, roughness);
            float G = geometrySmith(N, V, L, roughness);
            vec3 spec = (D * G * F) / max(4.0 * NdotV * NdotL, 1e-4);
            vec3 kS = F;
            vec3 kD = (vec3(1.0) - kS) * (1.0 - metallic);
            vec3 diffuseBRDF = kD * baseColor / PI;
            Lo += (diffuseBRDF + spec) * radiance * NdotL;
          }
        }
      #endif
    #endif

    vec3 hemi = mix(u_groundTint, u_skyTint, N.y * 0.5 + 0.5) * u_hemiStrength;
    vec3 ambientDiffuse = (v_ambientLight * u_ambientStrength + hemi) * baseColor * (1.0 - metallic);
    vec3 ambientSpec = fresnelSchlick(NdotV, F0) * (0.04 + (1.0 - roughness) * 0.18) * (hemi + v_ambientLight * 0.35);

    float rim = pow(clamp(1.0 - NdotV, 0.0, 1.0), u_rimPower) * u_rimStrength;
    vec3 rimLight = mix(u_skyTint, vec3(1.0), 0.45) * rim;

    vec3 colorLinear = ambientDiffuse + ambientSpec + Lo + emissiveLinear + rimLight + baseColor * u_shadowLift;
    colorLinear = acesFilm(colorLinear * u_exposure);
    colorLinear = adjustSaturation(colorLinear, u_saturation) * u_valueBoost;
    gl_FragColor.rgb = linearToSrgb(colorLinear);

    #ifdef blendedFlag
      gl_FragColor.a = diffuse.a * v_opacity;
      #ifdef alphaTestFlag
        if (gl_FragColor.a <= v_alphaTest) {
          discard;
        }
      #endif
    #else
      gl_FragColor.a = 1.0;
    #endif
  }
  `;

  public begin(camera: PerspectiveCamera, context: RenderContext) {
    super.begin(camera, context);
    this.program.setUniformf('u_baseRoughness', this.style.baseRoughness);
    this.program.setUniformf('u_baseMetallic', this.style.baseMetallic);
    this.program.setUniformf('u_specularLevel', this.style.specularLevel);
    this.program.setUniformf('u_clearcoatStrength', this.style.clearcoatStrength);
    this.program.setUniformf('u_clearcoatRoughness', this.style.clearcoatRoughness);
    this.program.setUniformf('u_ambientStrength', this.style.ambientStrength);
    this.program.setUniformf('u_hemiStrength', this.style.hemiStrength);
    this.program.setUniform3f('u_skyTint', this.style.skyTint[0], this.style.skyTint[1], this.style.skyTint[2]);
    this.program.setUniform3f(
      'u_groundTint',
      this.style.groundTint[0],
      this.style.groundTint[1],
      this.style.groundTint[2]
    );
    this.program.setUniformf('u_shadowLift', this.style.shadowLift);
    this.program.setUniformf('u_rimStrength', this.style.rimStrength);
    this.program.setUniformf('u_rimPower', this.style.rimPower);
    this.program.setUniformf('u_exposure', this.style.exposure);
    this.program.setUniformf('u_saturation', this.style.saturation);
    this.program.setUniformf('u_valueBoost', this.style.valueBoost);
    this.program.setUniformf('u_pointLightFalloff', this.style.pointLightFalloff);
  }

  public setStyle(style: Partial<PBRStyleOptions>) {
    this.style = { ...DEFAULT_PBR_STYLE, ...style };
  }

  constructor(
    gl: WebGLRenderingContext,
    renderable: Renderable,
    config: Config = null,
    style?: Partial<PBRStyleOptions>
  ) {
    super(gl, renderable, config, '', PBRShader.pbrVertexShader, PBRShader.pbrFragmentShader);
    if (!!style) {
      this.style = { ...DEFAULT_PBR_STYLE, ...style };
    }
  }
}
