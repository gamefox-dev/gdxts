import { Matrix3 } from '../../../../Matrix3';
import { Shader } from '../../../../Shader';
import { Color } from '../../../../Utils';
import { Vector2 } from '../../../../Vector2';
import { Vector3 } from '../../../../Vector3';
import { Attributes, ColorAttribute3D, DirectionalLightsAttribute, TextureAttribute, Usage } from '../../../attributes';
import { Renderable } from '../../../Renderable';
import { BaseShader, DefaultShader, DefaultShaderConfig, Inputs, LocalSetter, Uniform } from '../../../shaders';
import { FogAttribute } from '../attributes/FogAttribute';
import { PBRColorAttribute } from '../attributes/PBRColorAttribute';
import { PBRFloatAttribute } from '../attributes/PBRFloatAttribute';
import { PBRMatrixAttribute } from '../attributes/PBRMatrixAttribute';
import { PBRTextureAttribute } from '../attributes/PBRTextureAttribute';
import { PBRUsage } from '../attributes/PBRVertexAttributes';
import { DirectionalLightEx } from '../lights/DirectionalLightEx';
import { WeightVector } from '../model/WeightVector';

export class PBRShader extends DefaultShader {
  private static v2 = new Vector2();

  public static baseColorTextureUniform = new Uniform('u_diffuseTexture', PBRTextureAttribute.BaseColorTexture);
  public static baseColorTextureSetter = new (class extends LocalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      const unit = shader.context.textureBinder.bindTexture(
        (combinedAttributes.get(PBRTextureAttribute.BaseColorTexture) as TextureAttribute).texture
      );
      shader.setI(inputID, unit);
    }
  })();

  public static baseColorFactorUniform = new Uniform('u_BaseColorFactor', PBRColorAttribute.BaseColorFactor);
  public static baseColorFactorSetter = new (class extends LocalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      const attribute = combinedAttributes.get(PBRColorAttribute.BaseColorFactor) as PBRColorAttribute;
      const color = attribute == null ? Color.WHITE : attribute.color;
      shader.setColor(inputID, color);
    }
  })();

  public static emissiveTextureUniform = new Uniform('u_emissiveTexture', PBRTextureAttribute.EmissiveTexture);
  public static emissiveTextureSetter = new (class extends LocalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      const unit = shader.context.textureBinder.bindTexture(
        (combinedAttributes.get(PBRTextureAttribute.EmissiveTexture) as TextureAttribute).texture
      );
      shader.setI(inputID, unit);
    }
  })();

  public static normalTextureUniform = new Uniform('u_normalTexture', PBRTextureAttribute.NormalTexture);
  public static normalTextureSetter = new (class extends LocalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      const unit = shader.context.textureBinder.bindTexture(
        (combinedAttributes.get(PBRTextureAttribute.NormalTexture) as TextureAttribute).texture
      );
      shader.setI(inputID, unit);
    }
  })();

  public static metallicRoughnessTextureUniform = new Uniform(
    'u_MetallicRoughnessSampler',
    PBRTextureAttribute.MetallicRoughnessTexture
  );
  public static metallicRoughnessTextureSetter = new (class extends LocalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      const unit = shader.context.textureBinder.bindTexture(
        (combinedAttributes.get(PBRTextureAttribute.MetallicRoughnessTexture) as TextureAttribute).texture
      );
      shader.setI(inputID, unit);
    }
  })();

  public static metallicRoughnessUniform = new Uniform('u_MetallicRoughnessValues');
  public static metallicRoughnessSetter = new (class extends LocalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      const metallicAttribute = combinedAttributes.get(PBRFloatAttribute.Metallic) as PBRFloatAttribute;
      const roughnessAttribute = combinedAttributes.get(PBRFloatAttribute.Roughness) as PBRFloatAttribute;
      const metallic = metallicAttribute == null ? 1 : metallicAttribute.value;
      const roughness = roughnessAttribute == null ? 1 : roughnessAttribute.value;
      shader.set2f(inputID, metallic, roughness);
    }
  })();

  public static normalScaleUniform = new Uniform('u_NormalScale');
  public static normalScaleSetter = new (class extends LocalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      const normalScaleAttribute = combinedAttributes.get(PBRFloatAttribute.NormalScale) as PBRFloatAttribute;
      const normalScale = normalScaleAttribute == null ? 1 : normalScaleAttribute.value;
      shader.setF(inputID, normalScale);
    }
  })();

  public static occlusionStrengthUniform = new Uniform('u_OcclusionStrength');
  public static occlusionStrengthSetter = new (class extends LocalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      const occlusionStrengthAttribute = combinedAttributes.get(
        PBRFloatAttribute.OcclusionStrength
      ) as PBRFloatAttribute;
      const occlusionStrength = occlusionStrengthAttribute == null ? 1 : occlusionStrengthAttribute.value;
      shader.setF(inputID, occlusionStrength);
    }
  })();

  public static occlusionTextureUniform = new Uniform('u_OcclusionSampler', PBRTextureAttribute.OcclusionTexture);
  public static occlusionTextureSetter = new (class extends LocalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      const unit = shader.context.textureBinder.bindTexture(
        (combinedAttributes.get(PBRTextureAttribute.OcclusionTexture) as PBRTextureAttribute).texture
      );
      shader.setI(inputID, unit);
    }
  })();

  // public static diffuseEnvTextureUniform = new Uniform("u_DiffuseEnvSampler", PBRCubemapAttribute.DiffuseEnv);
  // public static diffuseEnvTextureSetter = new (class extends LocalSetter {
  //   set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
  //     PBRCubemapAttribute diffuseEnvAttribute = combinedAttributes.get(PBRCubemapAttribute.class, PBRCubemapAttribute.DiffuseEnv);
  // 		final int unit = shader.context.textureBinder.bind(diffuseEnvAttribute.textureDescription);
  // 		shader.set(inputID, unit);
  //   }
  // })();

  // public static specularEnvTextureUniform = new Uniform("u_SpecularEnvSampler", PBRCubemapAttribute.SpecularEnv);
  // public static specularEnvTextureSetter = new (class extends LocalSetter {
  //   set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
  //     PBRCubemapAttribute specularEnvAttribute = combinedAttributes.get(PBRCubemapAttribute.class, PBRCubemapAttribute.SpecularEnv);
  // 		final int unit = shader.context.textureBinder.bind(specularEnvAttribute.textureDescription);
  // 		shader.set(inputID, unit);
  //   }
  // })();

  public static envRotationUniform = new Uniform('u_envRotation', PBRMatrixAttribute.EnvRotation);
  public static envRotationSetter = new (class extends LocalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      const mat3 = new Matrix3();
      const attribute = combinedAttributes.get(PBRMatrixAttribute.EnvRotation) as PBRMatrixAttribute;
      shader.setMatrix3(inputID, mat3.setFromMatrix4(attribute.matrix));
    }
  })();

  public static brdfLUTTextureUniform = new Uniform('u_brdfLUT');
  public static brdfLUTTextureSetter = new (class extends LocalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      const attribute = combinedAttributes.get(PBRTextureAttribute.BRDFLUTTexture) as PBRTextureAttribute;
      if (attribute != null) {
        const unit = shader.context.textureBinder.bindTexture(attribute.texture);
        shader.setI(inputID, unit);
      }
    }
  })();

  public static shadowBiasUniform = new Uniform('u_shadowBias');
  public static shadowBiasSetter = new (class extends LocalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      const attribute = combinedAttributes.get(PBRFloatAttribute.ShadowBias) as PBRFloatAttribute;
      const value = attribute == null ? 0 : attribute.value;
      shader.setF(inputID, value);
    }
  })();

  public static fogEquationUniform = new Uniform('u_fogEquation');
  public static fogEquationSetter = new (class extends LocalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      const attribute = combinedAttributes.get(FogAttribute.FogEquation) as FogAttribute;
      const value = attribute == null ? Vector3.Zero : attribute.value;
      shader.set3f(inputID, value.x, value.y, value.z);
    }
  })();

  // override default setter in order to scale by emissive intensity
  public static emissiveScaledColor = new (class extends LocalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      const emissive = combinedAttributes.get(ColorAttribute3D.Emissive) as ColorAttribute3D;
      const emissiveIntensity = combinedAttributes.get(PBRFloatAttribute.EmissiveIntensity) as PBRFloatAttribute;
      if (emissiveIntensity != null) {
        shader.set4f(
          inputID,
          emissive.color.r * emissiveIntensity.value,
          emissive.color.g * emissiveIntensity.value,
          emissive.color.b * emissiveIntensity.value,
          emissive.color.a * emissiveIntensity.value
        );
      } else {
        shader.setColor(inputID, emissive.color);
      }
    }
  })();

  private static transformTexture: PBRTextureAttribute[] = [null, null];

  public u_metallicRoughness: number;
  public u_occlusionStrength: number;
  public u_metallicRoughnessTexture: number;
  public u_occlusionTexture: number;
  public u_DiffuseEnvSampler: number;
  public u_SpecularEnvSampler: number;
  public u_envRotation: number;
  public u_brdfLUTTexture: number;
  public u_NormalScale: number;
  public u_BaseColorTexture: number;
  public u_NormalTexture: number;
  public u_EmissiveTexture: number;
  public u_BaseColorFactor: number;
  public u_FogEquation: number;
  public u_ShadowBias: number;

  // morph targets
  private u_morphTargets1: WebGLUniformLocation;
  private u_morphTargets2: WebGLUniformLocation;
  private u_mipmapScale: WebGLUniformLocation;
  private u_texCoord0Transform: WebGLUniformLocation;
  private u_texCoord1Transform: WebGLUniformLocation;
  private u_ambientLight: WebGLUniformLocation;
  private textureCoordinateMapMask: number;
  private morphTargetsMask: number;
  private vertexColorLayers: number;
  public u_emissive: number;

  private static textureTransform = new Matrix3();

  constructor(gl: WebGLRenderingContext, renderable: Renderable, config: DefaultShaderConfig, prefix: string) {
    super(gl, renderable, config, prefix);

    this.textureCoordinateMapMask = PBRShader.getTextureCoordinateMapMask(renderable.material);

    this.morphTargetsMask = this.computeMorphTargetsMask(renderable);

    this.vertexColorLayers = this.computeVertexColorLayers(renderable);

    // base color
    this.u_BaseColorTexture = this.register(
      PBRShader.baseColorTextureUniform.alias,
      null,
      PBRShader.baseColorTextureSetter
    );
    this.u_BaseColorFactor = this.register(
      PBRShader.baseColorFactorUniform.alias,
      null,
      PBRShader.baseColorFactorSetter
    );

    // emissive
    this.u_EmissiveTexture = this.register(
      PBRShader.emissiveTextureUniform.alias,
      null,
      PBRShader.emissiveTextureSetter
    );

    // environment
    // this.u_DiffuseEnvSampler = this.register(PBRShader.diffuseEnvTextureUniform.alias,null, PBRShader.diffuseEnvTextureSetter);
    // this.u_SpecularEnvSampler = this.register(PBRShader.specularEnvTextureUniform.alias,null, PBRShader.specularEnvTextureSetter);
    this.u_envRotation = this.register(PBRShader.envRotationUniform.alias, null, PBRShader.envRotationSetter);

    // metallic roughness
    this.u_metallicRoughness = this.register(
      PBRShader.metallicRoughnessUniform.alias,
      null,
      PBRShader.metallicRoughnessSetter
    );
    this.u_metallicRoughnessTexture = this.register(
      PBRShader.metallicRoughnessTextureUniform.alias,
      null,
      PBRShader.metallicRoughnessTextureSetter
    );

    // occlusion
    this.u_occlusionTexture = this.register(
      PBRShader.occlusionTextureUniform.alias,
      null,
      PBRShader.occlusionTextureSetter
    );
    this.u_occlusionStrength = this.register(
      PBRShader.occlusionStrengthUniform.alias,
      null,
      PBRShader.occlusionStrengthSetter
    );

    this.u_brdfLUTTexture = this.register(PBRShader.brdfLUTTextureUniform.alias, null, PBRShader.brdfLUTTextureSetter);

    // normal map
    this.u_NormalTexture = this.register(PBRShader.normalTextureUniform.alias, null, PBRShader.normalTextureSetter);
    this.u_NormalScale = this.register(PBRShader.normalScaleUniform.alias, null, PBRShader.normalScaleSetter);

    this.u_ShadowBias = this.register(PBRShader.shadowBiasUniform.alias, null, PBRShader.shadowBiasSetter);

    this.u_FogEquation = this.register(PBRShader.fogEquationUniform.alias, null, PBRShader.fogEquationSetter);

    this.u_emissive = this.register(Inputs.emissiveColor.alias, null, PBRShader.emissiveScaledColor);
  }

  private computeVertexColorLayers(renderable: Renderable): number {
    let num = 0;
    const vertexAttributes = renderable.meshPart.mesh.getVertexAttributes();
    let n = vertexAttributes.size();
    for (let i = 0; i < n; i++) {
      const attr = vertexAttributes.get(i);
      if (attr.usage == Usage.ColorUnpacked) num++;
    }
    return num;
  }

  public canRender(renderable: Renderable): boolean {
    // TODO properly determine if current shader can render this renderable.

    // compare texture coordinates mapping
    const textureCoordinateMapMask = PBRShader.getTextureCoordinateMapMask(renderable.material);
    if (textureCoordinateMapMask != this.textureCoordinateMapMask) {
      return false;
    }

    // compare morph targets
    if (this.morphTargetsMask != this.computeMorphTargetsMask(renderable)) return false;

    // compare vertex colors count
    if (this.vertexColorLayers != this.computeVertexColorLayers(renderable)) return false;

    return super.canRender(renderable);
  }

  public computeMorphTargetsMask(renderable: Renderable): number {
    let morphTargetsFlag = 0;
    const vertexAttributes = renderable.meshPart.mesh.getVertexAttributes();
    const n = vertexAttributes.size();
    for (let i = 0; i < n; i++) {
      const attr = vertexAttributes.get(i);
      if (attr.usage == PBRUsage.PositionTarget) morphTargetsFlag |= 1 << attr.unit;
      if (attr.usage == PBRUsage.NormalTarget) morphTargetsFlag |= 1 << (attr.unit + 8);
      if (attr.usage == PBRUsage.TangentTarget) morphTargetsFlag |= 1 << (attr.unit + 16);
    }
    return morphTargetsFlag;
  }

  private static allTextureTypes: number[] = [
    PBRTextureAttribute.BaseColorTexture,
    PBRTextureAttribute.EmissiveTexture,
    PBRTextureAttribute.NormalTexture,
    PBRTextureAttribute.MetallicRoughnessTexture,
    PBRTextureAttribute.OcclusionTexture
  ];

  private static getTextureCoordinateMapMask(attributes: Attributes): number {
    // encode texture coordinate unit in a 5 bits integer.
    // 5 texture types with 1 bits per texture type.
    // 0 means no texture or unit 0
    // 1 means unit 1
    // only 2 units are supported.
    let mask = 0;
    let maskShift = 0;
    for (const textureType of PBRShader.allTextureTypes) {
      const attribute = attributes.get(textureType) as PBRTextureAttribute;
      if (attribute != null) {
        mask |= (attribute.uvIndex & 1) << maskShift;
      }
      maskShift++;
    }
    return mask;
  }

  public initWithVariables(program: Shader, renderable: Renderable) {
    super.initWithVariables(program, renderable);
    this.u_mipmapScale = program.getUniformLocation('u_mipmapScale', false);

    this.u_texCoord0Transform = program.getUniformLocation('u_texCoord0Transform', false);
    this.u_texCoord1Transform = program.getUniformLocation('u_texCoord1Transform', false);

    this.u_morphTargets1 = program.getUniformLocation('u_morphTargets1', false);
    this.u_morphTargets2 = program.getUniformLocation('u_morphTargets2', false);

    this.u_ambientLight = program.getUniformLocation('u_ambientLight', false);
  }

  protected bindMaterial(attributes: Attributes) {
    super.bindMaterial(attributes);

    // TODO texCoords should be mapped in vertex shader to allow separated UV transform

    PBRShader.transformTexture[0] = null;
    PBRShader.transformTexture[1] = null;

    for (const textureType of PBRShader.allTextureTypes) {
      const attribute = attributes.get(textureType) as PBRTextureAttribute;
      if (attribute != null) {
        PBRShader.transformTexture[attribute.uvIndex] = attribute;
      }
    }

    if (this.u_texCoord0Transform >= 0) {
      if (PBRShader.transformTexture[0] != null) {
        const attribute = PBRShader.transformTexture[0];
        PBRShader.textureTransform.idt();
        PBRShader.textureTransform.translate(attribute.offsetU, attribute.offsetV);
        PBRShader.textureTransform.rotateRad(-attribute.rotationUV);
        PBRShader.textureTransform.scale(attribute.scaleU, attribute.scaleV);
      } else {
        PBRShader.textureTransform.idt();
      }
      this.program.setUniform3x3fWithLocation(this.u_texCoord0Transform, PBRShader.textureTransform.getValues());
    }
    if (this.u_texCoord1Transform >= 0) {
      if (PBRShader.transformTexture[1] != null) {
        const attribute = PBRShader.transformTexture[1];
        PBRShader.textureTransform.setToTranslation(attribute.offsetU, attribute.offsetV);
        PBRShader.textureTransform.rotateRad(attribute.rotationUV);
        PBRShader.textureTransform.scale(attribute.scaleU, attribute.scaleV);
      } else {
        PBRShader.textureTransform.idt();
      }
      this.program.setUniform3x3fWithLocation(this.u_texCoord1Transform, PBRShader.textureTransform.getValues());
    }
  }

  public renderWithCombinedAttributes(renderable: Renderable, combinedAttributes: Attributes) {
    // if(this.u_mipmapScale >= 0){
    // 	const specularEnv = combinedAttributes.get(PBRCubemapAttribute.SpecularEnv) as PBRCubemapAttribute;
    // 	float mipmapFactor;
    // 	if(specularEnv != null){
    // 		mipmapFactor = (float)(Math.log(specularEnv.textureDescription.texture.getWidth()) / Math.log(2.0));
    // 	}else{
    // 		mipmapFactor = 1;
    // 	}
    // 	program.setUniformf(u_mipmapScale, mipmapFactor);
    // }

    if (this.u_morphTargets1 >= 0) {
      if (renderable.userData instanceof WeightVector) {
        const weightVector = renderable.userData as WeightVector;
        this.program.setUniform4fWithLocation(
          this.u_morphTargets1,
          weightVector[0],
          weightVector[1],
          weightVector[2],
          weightVector[3]
        );
      } else {
        this.program.setUniform4fWithLocation(this.u_morphTargets1, 0, 0, 0, 0);
      }
    }
    if (this.u_morphTargets2 >= 0) {
      if (renderable.userData instanceof WeightVector) {
        const weightVector = renderable.userData as WeightVector;
        this.program.setUniform4fWithLocation(
          this.u_morphTargets2,
          weightVector[4],
          weightVector[5],
          weightVector[6],
          weightVector[7]
        );
      } else {
        this.program.setUniform4fWithLocation(this.u_morphTargets2, 0, 0, 0, 0);
      }
    }

    super.renderWithCombinedAttributes(renderable, combinedAttributes);
  }

  protected bindLights(renderable: Renderable, attributes: Attributes) {
    // XXX update color (to apply intensity) before default binding
    const dla = attributes.get(DirectionalLightsAttribute.Type) as DirectionalLightsAttribute;
    if (dla != null) {
      for (const light of dla.lights) {
        if (light instanceof DirectionalLightEx) {
          light.updateColor();
        }
      }
    }

    super.bindLights(renderable, attributes);

    // XXX
    const ambiantLight = attributes.get(ColorAttribute3D.AmbientLight) as ColorAttribute3D;
    if (ambiantLight != null) {
      this.program.setUniform3fWithLocation(
        this.u_ambientLight,
        ambiantLight.color.r,
        ambiantLight.color.g,
        ambiantLight.color.b
      );
    }
  }
}
