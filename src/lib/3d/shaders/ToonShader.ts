import { GL20 } from '../GL20';
import { Renderable } from '../Renderable';
import { Config, DefaultShader } from './DefaultShader';
import { Shader } from '../../Shader';
import { Texture, TextureFilter, TextureWrap } from '../../Texture';
import { RenderContext } from '../RenderContext';
import { PerspectiveCamera } from '../PerspectiveCamera';
import { Attributes } from '../attributes/Attributes';
import { IntAttribute } from '../attributes/IntAttribute';

/**
 * Toon/Cel shader with gradient ramping for stylized cartoon rendering.
 *
 * Key differences from DefaultShader:
 * - Lighting is computed per-pixel (Phong) instead of per-vertex (Gouraud)
 * - NdotL is quantized into discrete bands for cel-shading effect
 * - Optional rim lighting for character edge pop
 * - No specular highlights (flat toon aesthetic)
 */
export class ToonShader extends DefaultShader {
  private toonRampTexture: Texture = null;
  private outlineThickness = 0.018;
  private outlineColor = [0.1, 0.08, 0.06];
  private outlineAttributes = new Attributes();

  public static toonVertexShader = `
  #if defined(diffuseTextureFlag) || defined(specularTextureFlag) || defined(emissiveTextureFlag)
  #define textureFlag
  #endif

  #if defined(specularTextureFlag) || defined(specularColorFlag)
  #define specularFlag
  #endif

  attribute vec3 a_position;
  uniform mat4 u_projViewTrans;
  uniform mediump float u_outlinePass;
  uniform float u_outlineThickness;

  #if defined(colorFlag)
  varying vec4 v_color;
  attribute vec4 a_color;
  #endif // colorFlag

  #ifdef normalFlag
  attribute vec3 a_normal;
  uniform mat3 u_normalMatrix;
  varying vec3 v_normal;
  #endif // normalFlag

  #ifdef textureFlag
  attribute vec2 a_texCoords0;
  #endif // textureFlag

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

  // Toon: pass world position to fragment shader for per-pixel lighting
  varying vec3 v_worldPos;

  #ifdef lightingFlag

  #ifdef ambientLightFlag
  uniform vec3 u_ambientLight;
  #endif

  #ifdef ambientCubemapFlag
  uniform vec3 u_ambientCubemap[6];
  #endif

  // We still compute ambient in vertex shader and pass it
  varying vec3 v_ambientLight;

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

  #if defined(ambientLightFlag) || defined(ambientCubemapFlag) || defined(sphericalHarmonicsFlag)
  #define ambientFlag
  #endif

  #endif // lightingFlag

  // Toon: dummy varyings so DefaultShader's uniform setters don't fail
  // (the parent class registers uniforms for v_lightDiffuse/v_lightSpecular)
  varying vec3 v_lightDiffuse;
  #ifdef specularFlag
  varying vec3 v_lightSpecular;
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
      
    #if defined(normalFlag)
      #if defined(skinningFlag)
        vec3 normal = normalize((u_worldTrans * skinning * vec4(a_normal, 0.0)).xyz);
      #else
        vec3 normal = normalize(u_normalMatrix * a_normal);
      #endif
      v_normal = normal;
      if (u_outlinePass > 0.5) {
        pos.xyz += normal * u_outlineThickness;
      }
    #endif
    
    gl_Position = u_projViewTrans * pos;
    v_worldPos = pos.xyz;

    // Compute ambient light contribution in vertex shader
    // NOTE: We intentionally skip the ambientCubemap here.
    // The cubemap accumulates directional light colors which would
    // double-count them (once in ambient, once in the toon ramp).
    #ifdef lightingFlag
      v_lightDiffuse = vec3(0.0);
      #ifdef specularFlag
        v_lightSpecular = vec3(0.0);
      #endif

      #if defined(ambientLightFlag)
        v_ambientLight = u_ambientLight;
      #else
        v_ambientLight = vec3(0.0);
      #endif
    #endif
  }
  `;

  public static toonFragmentShader = `
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
  #endif

  #ifdef specularTextureFlag
  varying MED vec2 v_specularUV;
  #endif

  #ifdef emissiveTextureFlag
  varying MED vec2 v_emissiveUV;
  #endif

  #ifdef diffuseColorFlag
  uniform vec4 u_diffuseColor;
  #endif

  #ifdef diffuseTextureFlag
  uniform sampler2D u_diffuseTexture;
  #endif

  #ifdef specularColorFlag
  uniform vec4 u_specularColor;
  #endif

  #ifdef specularTextureFlag
  uniform sampler2D u_specularTexture;
  #endif

  #ifdef emissiveColorFlag
  uniform vec4 u_emissiveColor;
  #endif

  #ifdef emissiveTextureFlag
  uniform sampler2D u_emissiveTexture;
  #endif

  // Per-pixel lighting data
  varying vec3 v_worldPos;

  // Dummy varyings from vertex shader (unused in toon fragment)
  varying vec3 v_lightDiffuse;
  #ifdef specularFlag
  varying vec3 v_lightSpecular;
  #endif

  #ifdef lightingFlag

  #if defined(ambientLightFlag) || defined(ambientCubemapFlag) || defined(sphericalHarmonicsFlag)
  #define ambientFlag
  #endif

  varying vec3 v_ambientLight;

  uniform vec4 u_cameraPosition;

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

  #endif // lightingFlag

  // Artist ramp texture for toon shading.
  uniform sampler2D u_toonRampTexture;
  uniform vec3 u_shadowTint;
  uniform vec3 u_lightTint;
  uniform vec3 u_specularTint;
  uniform float u_specularSize;
  uniform float u_specularSoftness;
  uniform float u_rimStart;
  uniform float u_rimEnd;
  uniform float u_rimStrength;
  uniform float u_wrap;
  uniform float u_shadowFloor;
  uniform float u_saturation;
  uniform float u_valueBoost;
  uniform vec3 u_skyTint;
  uniform vec3 u_groundTint;
  uniform float u_hemiStrength;
  uniform mediump float u_outlinePass;
  uniform vec3 u_outlineColor;

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

  void main() {
    if (u_outlinePass > 0.5) {
      gl_FragColor = vec4(u_outlineColor, 1.0);
      return;
    }

    #if defined(normalFlag)
      vec3 normal = normalize(v_normal);
    #endif

    // ---- Sample diffuse ----
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

    // ---- Sample emissive ----
    #if defined(emissiveTextureFlag) && defined(emissiveColorFlag)
      vec4 emissive = texture2D(u_emissiveTexture, v_emissiveUV) * u_emissiveColor;
    #elif defined(emissiveTextureFlag)
      vec4 emissive = texture2D(u_emissiveTexture, v_emissiveUV);
    #elif defined(emissiveColorFlag)
      vec4 emissive = u_emissiveColor;
    #else
      vec4 emissive = vec4(0.0);
    #endif

    vec3 diffuseLinear = srgbToLinear(diffuse.rgb);
    vec3 emissiveLinear = srgbToLinear(emissive.rgb);

    // ---- Per-pixel toon lighting ----
    #if (!defined(lightingFlag))
      gl_FragColor.rgb = linearToSrgb(diffuseLinear + emissiveLinear);
    #else
      vec3 totalLight = vec3(0.0);
      vec3 totalTint = vec3(0.0);

      // Directional lights with toon ramp
      #if (numDirectionalLights > 0) && defined(normalFlag)
        for (int i = 0; i < numDirectionalLights; i++) {
          vec3 lightDir = -u_dirLights[i].direction;
          float NdotL = dot(normal, normalize(lightDir));
          float wrapped = clamp((NdotL + u_wrap) / (1.0 + u_wrap), 0.0, 1.0);
          float ramp = texture2D(u_toonRampTexture, vec2(wrapped, 0.5)).r;
          totalLight += u_dirLights[i].color * ramp;
          totalTint += mix(u_shadowTint, u_lightTint, clamp(ramp, 0.0, 1.0));
        }
      #endif

      // Point lights with toon ramp
      #if (numPointLights > 0) && defined(normalFlag)
        for (int i = 0; i < numPointLights; i++) {
          vec3 lightDir = u_pointLights[i].position - v_worldPos;
          float dist2 = dot(lightDir, lightDir);
          lightDir = normalize(lightDir);
          float NdotL = dot(normal, lightDir);
          float wrapped = clamp((NdotL + u_wrap) / (1.0 + u_wrap), 0.0, 1.0);
          float ramp = texture2D(u_toonRampTexture, vec2(wrapped, 0.5)).r;
          float attenuation = 1.0 / (1.0 + dist2);
          totalLight += u_pointLights[i].color * ramp * attenuation;
          totalTint += mix(u_shadowTint, u_lightTint, clamp(ramp, 0.0, 1.0)) * attenuation;
        }
      #endif

      // Stylized thresholded specular blob
      #if defined(normalFlag) && (numDirectionalLights > 0)
      {
        vec3 viewDir = normalize(u_cameraPosition.xyz - v_worldPos);
        vec3 halfVec = normalize(normalize(-u_dirLights[0].direction) + viewDir);
        float specNdotH = max(dot(normal, halfVec), 0.0);
        float spec = smoothstep(u_specularSize - u_specularSoftness, u_specularSize + u_specularSoftness, specNdotH);
        totalLight += u_specularTint * spec;
      }
      #endif

      // Rim lighting for edge pop
      #if defined(normalFlag)
      {
        vec3 viewDir = normalize(u_cameraPosition.xyz - v_worldPos);
        float ndotv = max(dot(normal, viewDir), 0.0);
        float rim = 1.0 - ndotv;
        rim = smoothstep(u_rimStart, u_rimEnd, rim);
        float ndotl = 0.0;
        #if numDirectionalLights > 0
          ndotl = max(dot(normal, normalize(-u_dirLights[0].direction)), 0.0);
        #endif
        rim *= (1.0 - ndotl);
        totalLight += vec3(u_rimStrength) * rim;
      }
      #endif

      float lightCount = float(numDirectionalLights + numPointLights);
      vec3 avgTint = mix(u_shadowTint, u_lightTint, 0.5);
      if (lightCount > 0.0) {
        avgTint = totalTint / lightCount;
      }
      vec3 hemiLight = mix(u_groundTint, u_skyTint, normal.y * 0.5 + 0.5) * u_hemiStrength;
      vec3 lightEnergy = max(v_ambientLight + totalLight + hemiLight, vec3(u_shadowFloor));
      vec3 litLinear = (diffuseLinear * avgTint * lightEnergy) + emissiveLinear;
      litLinear = adjustSaturation(litLinear, u_saturation) * u_valueBoost;
      gl_FragColor.rgb = linearToSrgb(litLinear);
    #endif

    // ---- Alpha ----
    #ifdef blendedFlag
      gl_FragColor.a = diffuse.a * v_opacity;
      #ifdef alphaTestFlag
        if (gl_FragColor.a <= v_alphaTest)
          discard;
      #endif
    #else
      gl_FragColor.a = 1.0;
    #endif
  }
  `;

  private createToonRampTexture(gl: WebGLRenderingContext): Texture {
    const width = 256;
    const pixels = new Uint8ClampedArray(width * 4);

    // Slightly soft Clash-like ramp: deep shadow -> mid -> light.
    const stops = [
      { x: 0.0, v: 0.18 },
      { x: 0.32, v: 0.28 },
      { x: 0.58, v: 0.66 },
      { x: 1.0, v: 1.0 }
    ];

    for (let x = 0; x < width; x++) {
      const t = x / (width - 1);
      let s0 = stops[0];
      let s1 = stops[stops.length - 1];
      for (let i = 0; i < stops.length - 1; i++) {
        if (t >= stops[i].x && t <= stops[i + 1].x) {
          s0 = stops[i];
          s1 = stops[i + 1];
          break;
        }
      }
      const localT = (t - s0.x) / Math.max(1e-5, s1.x - s0.x);
      const v = s0.v + (s1.v - s0.v) * localT;
      const c = Math.max(0, Math.min(255, Math.round(v * 255)));
      const idx = x * 4;
      pixels[idx] = c;
      pixels[idx + 1] = c;
      pixels[idx + 2] = c;
      pixels[idx + 3] = 255;
    }

    const texture = new Texture(gl, new ImageData(pixels, width, 1));
    texture.setFilters(TextureFilter.Linear, TextureFilter.Linear);
    texture.setWraps(TextureWrap.ClampToEdge, TextureWrap.ClampToEdge);
    return texture;
  }

  public init() {
    super.init();
    if (!this.toonRampTexture) {
      this.toonRampTexture = this.createToonRampTexture(this.gl);
    }
  }

  public begin(camera: PerspectiveCamera, context: RenderContext) {
    super.begin(camera, context);
    this.program.setUniform3f('u_shadowTint', 0.72, 0.8, 1.0);
    this.program.setUniform3f('u_lightTint', 1.0, 0.95, 0.88);
    this.program.setUniform3f('u_specularTint', 1.0, 0.93, 0.82);
    this.program.setUniformf('u_specularSize', 0.84);
    this.program.setUniformf('u_specularSoftness', 0.05);
    this.program.setUniformf('u_rimStart', 0.66);
    this.program.setUniformf('u_rimEnd', 0.98);
    this.program.setUniformf('u_rimStrength', 0.22);
    this.program.setUniformf('u_wrap', 0.24);
    this.program.setUniformf('u_shadowFloor', 0.22);
    this.program.setUniformf('u_saturation', 1.14);
    this.program.setUniformf('u_valueBoost', 1.08);
    this.program.setUniform3f('u_skyTint', 0.72, 0.82, 1.0);
    this.program.setUniform3f('u_groundTint', 0.56, 0.47, 0.42);
    this.program.setUniformf('u_hemiStrength', 0.26);
    if (!!this.toonRampTexture) {
      const unit = this.context.textureBinder.bindTexture(this.toonRampTexture);
      this.program.setUniformi('u_toonRampTexture', unit);
    }
  }

  public dispose() {
    if (!!this.toonRampTexture) {
      this.toonRampTexture.dispose();
      this.toonRampTexture = null;
    }
    super.dispose();
  }

  public renderOutline(renderable: Renderable) {
    if (renderable.worldTransform.det3x3() === 0) return;
    this.outlineAttributes.clear();
    if (!!renderable.environment) this.outlineAttributes.setAttributes(renderable.environment.getAttributes());
    if (!!renderable.material) this.outlineAttributes.setAttributes(renderable.material.getAttributes());
    this.outlineAttributes.set(IntAttribute.createCullFace(GL20.GL_FRONT));

    // Inverted-hull outline pass.
    this.program.setUniformf('u_outlineThickness', this.outlineThickness);
    this.program.setUniform3f('u_outlineColor', this.outlineColor[0], this.outlineColor[1], this.outlineColor[2]);
    this.program.setUniformf('u_outlinePass', 1.0);
    super.renderWithCombinedAttributes(renderable, this.outlineAttributes);
    this.program.setUniformf('u_outlinePass', 0.0);
  }

  constructor(gl: WebGLRenderingContext, renderable: Renderable, config: Config = null) {
    super(gl, renderable, config, '', ToonShader.toonVertexShader, ToonShader.toonFragmentShader);
  }
}
