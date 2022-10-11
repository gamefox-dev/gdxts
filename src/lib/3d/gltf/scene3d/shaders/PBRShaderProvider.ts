import { TextureAttribute, Usage } from '../../../attributes';
import { DefaultShaderProvider } from '../../../DefaultShaderProvider';
import { GL20 } from '../../../GL20';
import { Renderable } from '../../../Renderable';
import { DefaultShader, Shader3D } from '../../../shaders';
import { DepthShaderConfig } from '../../../shaders/DepthShader';
import { DepthShaderProvider } from '../../../utils/DepthShaderProvider';
import { fragment, vertex } from '../../shaders/gdx-pbr';
import { FogAttribute } from '../attributes/FogAttribute';
import { PBRColorAttribute } from '../attributes/PBRColorAttribute';
import { PBRFlagAttribute } from '../attributes/PBRFlagAttribute';
import { PBRTextureAttribute } from '../attributes/PBRTextureAttribute';
import { PBRUsage } from '../attributes/PBRVertexAttributes';
import { LightsInfo, LightUtils } from '../utils/LightUtils';
import { PBRCommon } from './PBRCommon';
import { PBRDepthShaderProvider } from './PBRDepthShaderProvider';
import { PBRShader } from './PBRShader';
import { PBRShaderConfig, SRGB } from './PBRShaderConfig';

export class PBRShaderProvider extends DefaultShaderProvider {
  public static TAG = 'PBRShader';

  private static lightsInfo = new LightsInfo();

  private static defaultVertexShader: string = null;
  private static gl: WebGLRenderingContext;

  public static getDefaultVertexShader(): string {
    if (PBRShaderProvider.defaultVertexShader == null) PBRShaderProvider.defaultVertexShader = vertex;
    return PBRShaderProvider.defaultVertexShader;
  }

  private static defaultFragmentShader: string = null;

  public static getDefaultFragmentShader(): string {
    if (this.defaultFragmentShader == null) this.defaultFragmentShader = fragment;
    return this.defaultFragmentShader;
  }

  public static createDefaultConfig(): PBRShaderConfig {
    const config = new PBRShaderConfig();
    config.vertexShader = this.getDefaultVertexShader();
    config.fragmentShader = this.getDefaultFragmentShader();
    return config;
  }

  public static createDefaultDepthConfig(): DepthShaderConfig {
    return PBRDepthShaderProvider.createDefaultConfig();
  }

  public static createDefaultWithNumBones(maxBones: number): PBRShaderProvider {
    const config = this.createDefaultConfig();
    config.numBones = maxBones;
    return this.createDefault(config);
  }

  public static createDefault(config: PBRShaderConfig): PBRShaderProvider {
    return new PBRShaderProvider(this.gl, config);
  }

  public static createDefaultDepthtWithNumBones(maxBones: number): DepthShaderProvider {
    const config = this.createDefaultDepthConfig();
    config.numBones = maxBones;
    return this.createDefaultDepth(config);
  }

  public static createDefaultDepth(config: DepthShaderConfig): DepthShaderProvider {
    return new PBRDepthShaderProvider(this.gl, config);
  }

  constructor(gl: WebGLRenderingContext, config: PBRShaderConfig) {
    PBRShaderProvider.gl = gl;
    super(gl, config == null ? PBRShaderProvider.createDefaultConfig() : config);
    if (this.config.vertexShader == null) this.config.vertexShader = PBRShaderProvider.getDefaultVertexShader();
    if (this.config.fragmentShader == null) this.config.fragmentShader = PBRShaderProvider.getDefaultFragmentShader();
  }

  public getShaderCount(): number {
    return this.shaders.length;
  }

  public static morphTargetsPrefix(renderable: Renderable): string {
    let prefix = '';
    // TODO optimize double loop
    for (const att of renderable.meshPart.mesh.getVertexAttributes().attributes) {
      for (let i = 0; i < PBRCommon.MAX_MORPH_TARGETS; i++) {
        if (att.usage == PBRUsage.PositionTarget && att.unit == i) {
          prefix += '#define ' + 'position' + i + 'Flag\n';
        } else if (att.usage == PBRUsage.NormalTarget && att.unit == i) {
          prefix += '#define ' + 'normal' + i + 'Flag\n';
        } else if (att.usage == PBRUsage.TangentTarget && att.unit == i) {
          prefix += '#define ' + 'tangent' + i + 'Flag\n';
        }
      }
    }
    return prefix;
  }

  /**
   * override this method in order to add your own prefix.
   * @param renderable
   * @param config
   */
  public createPrefixBase(renderable: Renderable, config: PBRShaderConfig): string {
    const defaultPrefix = DefaultShader.createPrefix(renderable, config);
    const version = config.glslVersion;
    let prefix = '';
    if (version != null) prefix += version;
    if (config.prefix != null) prefix += config.prefix;
    prefix += defaultPrefix;
    return prefix;
  }

  public createPrefixSRGB(renderable: Renderable, config: PBRShaderConfig): string {
    let prefix = '';
    if (config.manualSRGB != SRGB.NONE) {
      prefix += '#define MANUAL_SRGB\n';
      if (config.manualSRGB == SRGB.FAST) {
        prefix += '#define SRGB_FAST_APPROXIMATION\n';
      }
    }
    if (config.manualGammaCorrection) {
      prefix += '#define GAMMA_CORRECTION ' + config.gamma + '\n';
    }
    return prefix;
  }

  protected createShader(gl: WebGLRenderingContext, renderable: Renderable): Shader3D {
    const config = this.config as PBRShaderConfig;

    let prefix = this.createPrefixBase(renderable, config);

    // Morph targets
    prefix += PBRShaderProvider.morphTargetsPrefix(renderable);

    // optional base color factor
    if (renderable.material.has(PBRColorAttribute.BaseColorFactor)) {
      prefix += '#define baseColorFactorFlag\n';
    }

    // Lighting
    let primitiveType = renderable.meshPart.primitiveType;
    const isLineOrPoint =
      primitiveType == GL20.GL_POINTS ||
      primitiveType == GL20.GL_LINES ||
      primitiveType == GL20.GL_LINE_LOOP ||
      primitiveType == GL20.GL_LINE_STRIP;
    const unlit =
      isLineOrPoint ||
      renderable.material.has(PBRFlagAttribute.Unlit) ||
      renderable.meshPart.mesh.getVertexAttribute(Usage.Normal) == null;

    if (unlit) {
      prefix += '#define unlitFlag\n';
    } else {
      if (renderable.material.has(PBRTextureAttribute.MetallicRoughnessTexture)) {
        prefix += '#define metallicRoughnessTextureFlag\n';
      }
      if (renderable.material.has(PBRTextureAttribute.OcclusionTexture)) {
        prefix += '#define occlusionTextureFlag\n';
      }

      // IBL options
      // 	let specualarCubemapAttribute: PBRCubemapAttribute = null;
      // 	if(renderable.environment != null){
      // 		if(renderable.environment.has(PBRCubemapAttribute.SpecularEnv)){
      // 			prefix += "#define diffuseSpecularEnvSeparateFlag\n";
      // 			specualarCubemapAttribute = renderable.environment.get(PBRCubemapAttribute.class, PBRCubemapAttribute.SpecularEnv);
      // 		}else if(renderable.environment.has(PBRCubemapAttribute.DiffuseEnv)){
      // 			specualarCubemapAttribute = renderable.environment.get(PBRCubemapAttribute.class, PBRCubemapAttribute.DiffuseEnv);
      // 		}else if(renderable.environment.has(PBRCubemapAttribute.EnvironmentMap)){
      // 			specualarCubemapAttribute = renderable.environment.get(PBRCubemapAttribute.class, PBRCubemapAttribute.EnvironmentMap);
      // 		}
      // 		if(specualarCubemapAttribute != null){
      // 			prefix += "#define USE_IBL\n";

      // 			boolean textureLodSupported;
      // 			if(isGL3()){
      // 				textureLodSupported = true;
      // 			}else if(Gdx.graphics.supportsExtension("EXT_shader_texture_lod")){
      // 				prefix += "#define USE_TEXTURE_LOD_EXT\n";
      // 				textureLodSupported = true;
      // 			}else{
      // 				textureLodSupported = false;
      // 			}

      // 			TextureFilter textureFilter = specualarCubemapAttribute.textureDescription.minFilter != null ? specualarCubemapAttribute.textureDescription.minFilter : specualarCubemapAttribute.textureDescription.texture.getMinFilter();
      // 			if(textureLodSupported && textureFilter.equals(TextureFilter.MipMap)){
      // 				prefix += "#define USE_TEX_LOD\n";
      // 			}

      // 			if(renderable.environment.has(PBRTextureAttribute.BRDFLUTTexture)){
      // 				prefix += "#define brdfLUTTexture\n";
      // 			}
      // 		}
      // 		// TODO check GLSL extension 'OES_standard_derivatives' for WebGL

      // 		if(renderable.environment.has(ColorAttribute.AmbientLight)){
      // 			prefix += "#define ambientLightFlag\n";
      // 		}

      // 		if(renderable.environment.has(PBRMatrixAttribute.EnvRotation)){
      // 			prefix += "#define ENV_ROTATION\n";
      // 		}
      // 	}

      // }

      // SRGB
      prefix += this.createPrefixSRGB(renderable, config);

      // multi UVs
      let maxUVIndex = -1;

      {
        const attribute = renderable.material.get(TextureAttribute.Diffuse) as TextureAttribute;
        if (attribute != null) {
          prefix += '#define v_diffuseUV v_texCoord' + attribute.uvIndex + '\n';
          maxUVIndex = Math.max(maxUVIndex, attribute.uvIndex);
        }
      }
      {
        const attribute = renderable.material.get(TextureAttribute.Emissive) as TextureAttribute;
        if (attribute != null) {
          prefix += '#define v_emissiveUV v_texCoord' + attribute.uvIndex + '\n';
          maxUVIndex = Math.max(maxUVIndex, attribute.uvIndex);
        }
      }
      {
        const attribute = renderable.material.get(TextureAttribute.Normal) as TextureAttribute;
        if (attribute != null) {
          prefix += '#define v_normalUV v_texCoord' + attribute.uvIndex + '\n';
          maxUVIndex = Math.max(maxUVIndex, attribute.uvIndex);
        }
      }
      {
        const attribute = renderable.material.get(PBRTextureAttribute.MetallicRoughnessTexture) as TextureAttribute;
        if (attribute != null) {
          prefix += '#define v_metallicRoughnessUV v_texCoord' + attribute.uvIndex + '\n';
          maxUVIndex = Math.max(maxUVIndex, attribute.uvIndex);
        }
      }
      {
        const attribute = renderable.material.get(PBRTextureAttribute.OcclusionTexture) as TextureAttribute;
        if (attribute != null) {
          prefix += '#define v_occlusionUV v_texCoord' + attribute.uvIndex + '\n';
          maxUVIndex = Math.max(maxUVIndex, attribute.uvIndex);
        }
      }

      if (maxUVIndex >= 0) {
        prefix += '#define textureFlag\n';
      }
      if (maxUVIndex == 1) {
        prefix += '#define textureCoord1Flag\n';
      } else if (maxUVIndex > 1) {
        throw new Error('more than 2 texture coordinates attribute not supported');
      }

      // Fog

      if (renderable.environment != null && renderable.environment.has(FogAttribute.FogEquation)) {
        prefix += '#define fogEquationFlag\n';
      }

      // colors
      for (const attribute of renderable.meshPart.mesh.getVertexAttributes().attributes) {
        if (attribute.usage == Usage.ColorUnpacked) {
          prefix += '#define color' + attribute.unit + 'Flag\n';
        }
      }

      //

      let numBoneInfluence = 0;
      let numMorphTarget = 0;
      let numColor = 0;

      for (const attribute of renderable.meshPart.mesh.getVertexAttributes().attributes) {
        if (attribute.usage == Usage.ColorPacked) {
          throw new Error('color packed attribute not supported');
        } else if (attribute.usage == Usage.ColorUnpacked) {
          numColor = Math.max(numColor, attribute.unit + 1);
        } else if (
          (attribute.usage == PBRUsage.PositionTarget && attribute.unit >= PBRCommon.MAX_MORPH_TARGETS) ||
          (attribute.usage == PBRUsage.NormalTarget && attribute.unit >= PBRCommon.MAX_MORPH_TARGETS) ||
          (attribute.usage == PBRUsage.TangentTarget && attribute.unit >= PBRCommon.MAX_MORPH_TARGETS)
        ) {
          numMorphTarget = Math.max(numMorphTarget, attribute.unit + 1);
        } else if (attribute.usage == Usage.BoneWeight) {
          numBoneInfluence = Math.max(numBoneInfluence, attribute.unit + 1);
        }
      }

      PBRCommon.checkVertexAttributes(renderable);

      if (numBoneInfluence > 8) {
        console.error('more than 8 bones influence attributes not supported: ' + numBoneInfluence + ' found.');
      }
      if (numMorphTarget > PBRCommon.MAX_MORPH_TARGETS) {
        console.error('more than 8 morph target attributes not supported: ' + numMorphTarget + ' found.');
      }
      if (numColor > config.numVertexColors) {
        console.error(
          'more than ' + config.numVertexColors + ' color attributes not supported: ' + numColor + ' found.'
        );
      }

      if (renderable.environment != null) {
        LightUtils.getLightsInfoFromEnvironment(PBRShaderProvider.lightsInfo, renderable.environment);
        if (PBRShaderProvider.lightsInfo.dirLights > config.numDirectionalLights) {
          console.error(
            'too many directional lights detected: ' +
              PBRShaderProvider.lightsInfo.dirLights +
              '/' +
              config.numDirectionalLights
          );
        }
        if (PBRShaderProvider.lightsInfo.pointLights > config.numPointLights) {
          console.error(
            'too many point lights detected: ' + PBRShaderProvider.lightsInfo.pointLights + '/' + config.numPointLights
          );
        }
        if (PBRShaderProvider.lightsInfo.spotLights > config.numSpotLights) {
          console.error(
            'too many spot lights detected: ' + PBRShaderProvider.lightsInfo.spotLights + '/' + config.numSpotLights
          );
        }
        if (PBRShaderProvider.lightsInfo.miscLights > 0) {
          console.error('unknow type lights not supported.');
        }
      }

      const shader = this.createShaderWithPerfix(PBRShaderProvider.gl, renderable, config, prefix);

      // prevent infinite loop (TODO remove this for libgdx 1.9.12+)
      if (!shader.canRender(renderable)) {
        throw new Error('cannot render with this shader');
      }

      return shader;
    }
  }

  /**
   * override this method in order to provide your own PBRShader subclass.
   * @param renderable
   * @param config
   * @param prefix
   */
  protected createShaderWithPerfix(
    gl: WebGLRenderingContext,
    renderable: Renderable,
    config: PBRShaderConfig,
    prefix: string
  ): PBRShader {
    return new PBRShader(gl, renderable, config, prefix);
  }
}
