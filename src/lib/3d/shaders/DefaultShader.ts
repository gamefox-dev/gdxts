import { Matrix4 } from '../../Matrix4';
import { Shader } from '../../Shader';
import { Vector3 } from '../../Vector3';
import { Attributes } from '../attributes/Attributes';
import { BaseShader, GlobalSetter, LocalSetter, Uniform } from './BaseShader';
import { BlendingAttribute } from '../attributes/BlendingAttribute';
import { ColorAttribute } from '../attributes/ColorAttribute';
import { FloatAttribute } from '../attributes/FloatAttribute';
import { GL20 } from '../GL20';
import { IntAttribute } from '../attributes/IntAttribute';
import { Matrix3 } from '../../Matrix3';
import { PerspectiveCamera } from '../PerspectiveCamera';
import { Renderable } from '../Renderable';
import { RenderContext } from '../RenderContext';
import { TextureAttribute } from '../attributes/TextureAttribute';
import { Usage } from '../attributes/VertexAttribute';
import { DirectionalLight } from '../environment/DirectionalLight';
import { DirectionalLightsAttribute } from '../attributes/DirectionalLightsAttribute';
import { AmbientCubemap } from '../environment/AmbientCubemap';

export class Config {
  vertexShader: string = null;
  fragmentShader: string = null;
  numDirectionalLights = 2;
  numPointLights = 5;
  numSpotLights = 0;
  numBones = 12;
  ignoreUnimplemented = true;
  defaultCullFace = -1;
  defaultDepthFunc = -1;

  constructor(vertexShader: string = '', fragmentShader: string = '') {
    this.vertexShader = vertexShader;
    this.fragmentShader = fragmentShader;
  }
}

export class ACubemap extends LocalSetter {
  private static ones: number[] = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
  private cacheAmbientCubemap = new AmbientCubemap();
  private static tmpV1 = new Vector3();
  public dirLightsOffset: number;
  public pointLightsOffset: number;

  constructor(dirLightsOffset: number, pointLightsOffset: number) {
    super();
    this.dirLightsOffset = dirLightsOffset;
    this.pointLightsOffset = pointLightsOffset;
  }

  public set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
    if (renderable.environment == null) shader.program.setUniform3fv(shader.getUniformAlias(inputID), ACubemap.ones);
    else {
      renderable.worldTransform.getTranslation(ACubemap.tmpV1);
      if (combinedAttributes.has(ColorAttribute.AmbientLight)) {
        const color = (combinedAttributes.get(ColorAttribute.AmbientLight) as ColorAttribute).color;
        this.cacheAmbientCubemap.setColor(color.r, color.g, color.b);
      }

      if (combinedAttributes.has(DirectionalLightsAttribute.Type)) {
        const att = combinedAttributes.get(DirectionalLightsAttribute.Type) as DirectionalLightsAttribute;
        const lights = att.lights;
        for (let i = this.dirLightsOffset; i < lights.length; i++)
          this.cacheAmbientCubemap.addWithColorAndDirection(lights[i].color, lights[i].direction);
      }

      // if (combinedAttributes.has(PointLightsAttribute.Type)) {
      //   Array<PointLight> lights = ((PointLightsAttribute)combinedAttributes.get(PointLightsAttribute.Type)).lights;
      //   for (int i = pointLightsOffset; i < lights.size; i++)
      //     cacheAmbientCubemap.add(lights.get(i).color, lights.get(i).position, tmpV1, lights.get(i).intensity);
      // }

      this.cacheAmbientCubemap.clamp();
      shader.program.setUniform3fv(shader.getUniformAlias(inputID), this.cacheAmbientCubemap.data);
    }
  }
}

export class Inputs {
  public static projTrans: Uniform = new Uniform('u_projTrans');
  public static viewTrans: Uniform = new Uniform('u_viewTrans');
  public static projViewTrans: Uniform = new Uniform('u_projViewTrans');
  public static cameraPosition: Uniform = new Uniform('u_cameraPosition');
  public static cameraDirection: Uniform = new Uniform('u_cameraDirection');
  public static cameraUp: Uniform = new Uniform('u_cameraUp');
  public static cameraNearFar: Uniform = new Uniform('u_cameraNearFar');

  public static worldTrans: Uniform = new Uniform('u_worldTrans');
  public static viewWorldTrans: Uniform = new Uniform('u_viewWorldTrans');
  public static projViewWorldTrans: Uniform = new Uniform('u_projViewWorldTrans');
  public static normalMatrix: Uniform = new Uniform('u_normalMatrix');
  public static bones: Uniform = new Uniform('u_bones');

  public static shininess: Uniform = new Uniform('u_shininess', FloatAttribute.Shininess);
  public static opacity: Uniform = new Uniform('u_opacity', BlendingAttribute.Type);
  public static diffuseColor: Uniform = new Uniform('u_diffuseColor', ColorAttribute.Diffuse);
  public static diffuseTexture: Uniform = new Uniform('u_diffuseTexture', TextureAttribute.Diffuse);
  public static diffuseUVTransform: Uniform = new Uniform('u_diffuseUVTransform', TextureAttribute.Diffuse);
  public static specularColor: Uniform = new Uniform('u_specularColor', ColorAttribute.Specular);
  public static specularTexture: Uniform = new Uniform('u_specularTexture', TextureAttribute.Specular);
  public static specularUVTransform: Uniform = new Uniform('u_specularUVTransform', TextureAttribute.Specular);
  public static emissiveColor: Uniform = new Uniform('u_emissiveColor', ColorAttribute.Emissive);
  public static emissiveTexture: Uniform = new Uniform('u_emissiveTexture', TextureAttribute.Emissive);
  public static emissiveUVTransform: Uniform = new Uniform('u_emissiveUVTransform', TextureAttribute.Emissive);
  public static reflectionColor: Uniform = new Uniform('u_reflectionColor', ColorAttribute.Reflection);
  public static reflectionTexture: Uniform = new Uniform('u_reflectionTexture', TextureAttribute.Reflection);
  public static reflectionUVTransform: Uniform = new Uniform('u_reflectionUVTransform', TextureAttribute.Reflection);
  public static normalTexture: Uniform = new Uniform('u_normalTexture', TextureAttribute.Normal);
  public static normalUVTransform: Uniform = new Uniform('u_normalUVTransform', TextureAttribute.Normal);
  public static ambientTexture: Uniform = new Uniform('u_ambientTexture', TextureAttribute.Ambient);
  public static ambientUVTransform: Uniform = new Uniform('u_ambientUVTransform', TextureAttribute.Ambient);
  public static alphaTest: Uniform = new Uniform('u_alphaTest');

  public static ambientCube: Uniform = new Uniform('u_ambientCubemap');
  public static dirLights: Uniform = new Uniform('u_dirLights');
  public static pointLights: Uniform = new Uniform('u_pointLights');
  public static spotLights: Uniform = new Uniform('u_spotLights');
  public static environmentCubemap: Uniform = new Uniform('u_environmentCubemap');
}

export class Setters {
  public static projTrans = new (class extends GlobalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      shader.setMatrix4(inputID, shader.camera.projection);
    }
  })();
  public static viewTrans = new (class extends GlobalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      shader.setMatrix4(inputID, shader.camera.view);
    }
  })();
  public static projViewTrans = new (class extends GlobalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      shader.setMatrix4(inputID, shader.camera.combined);
    }
  })();
  public static cameraPosition = new (class extends GlobalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      shader.set4f(
        inputID,
        shader.camera.position.x,
        shader.camera.position.y,
        shader.camera.position.y,
        1.1881 / (shader.camera.far * shader.camera.far)
      );
    }
  })();
  public static cameraDirection = new (class extends GlobalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      shader.setVector3(inputID, shader.camera.direction);
    }
  })();
  public static cameraUp = new (class extends GlobalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      shader.setVector3(inputID, shader.camera.up);
    }
  })();
  public static cameraNearFar = new (class extends GlobalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      shader.set2f(inputID, shader.camera.near, shader.camera.far);
    }
  })();
  public static worldTrans = new (class extends LocalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      shader.setMatrix4(inputID, renderable.worldTransform);
    }
  })();
  public static viewWorldTrans = new (class extends LocalSetter {
    public temp = new Matrix4();
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      shader.setMatrix4(inputID, this.temp.set(shader.camera.view.values).multiply(renderable.worldTransform));
    }
  })();
  public static projViewWorldTrans = new (class extends LocalSetter {
    public temp = new Matrix4();
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      shader.setMatrix4(inputID, this.temp.set(shader.camera.combined.values).multiply(renderable.worldTransform));
    }
  })();
  public static normalMatrix = new (class extends LocalSetter {
    public tmpM = new Matrix3();
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      shader.setMatrix3(inputID, this.tmpM.setByMatrix4(renderable.worldTransform).inv().transpose());
    }
  })();
  public static shininess = new (class extends LocalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      shader.setF(inputID, (combinedAttributes.get(FloatAttribute.Shininess) as FloatAttribute).value);
    }
  })();
  public static diffuseColor = new (class extends LocalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      shader.setColor(inputID, (combinedAttributes.get(ColorAttribute.Diffuse) as ColorAttribute).color);
    }
  })();
  public static diffuseTexture = new (class extends LocalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      const unit = shader.context.textureBinder.bindTexture(
        (combinedAttributes.get(TextureAttribute.Diffuse) as TextureAttribute).texture
      );
      shader.setI(inputID, unit);
    }
  })();
  public static diffuseUVTransform = new (class extends LocalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      const ta = combinedAttributes.get(TextureAttribute.Diffuse) as TextureAttribute;
      shader.set4f(inputID, ta.offsetU, ta.offsetV, ta.scaleU, ta.scaleV);
    }
  })();
  public static specularColor = new (class extends LocalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      shader.setColor(inputID, (combinedAttributes.get(ColorAttribute.Specular) as ColorAttribute).color);
    }
  })();
  public static specularTexture = new (class extends LocalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      const unit = shader.context.textureBinder.bindTexture(
        (combinedAttributes.get(TextureAttribute.Specular) as TextureAttribute).texture
      );
      shader.setI(inputID, unit);
    }
  })();
  public static specularUVTransform = new (class extends LocalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      const ta = combinedAttributes.get(TextureAttribute.Specular) as TextureAttribute;
      shader.set4f(inputID, ta.offsetU, ta.offsetV, ta.scaleU, ta.scaleV);
    }
  })();
  public static emissiveColor = new (class extends LocalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      shader.setColor(inputID, (combinedAttributes.get(ColorAttribute.Emissive) as ColorAttribute).color);
    }
  })();
  public static emissiveTexture = new (class extends LocalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      const unit = shader.context.textureBinder.bindTexture(
        (combinedAttributes.get(TextureAttribute.Emissive) as TextureAttribute).texture
      );
      shader.setI(inputID, unit);
    }
  })();
  public static emissiveUVTransform = new (class extends LocalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      const ta = combinedAttributes.get(TextureAttribute.Emissive) as TextureAttribute;
      shader.set4f(inputID, ta.offsetU, ta.offsetV, ta.scaleU, ta.scaleV);
    }
  })();
  public static reflectionColor = new (class extends LocalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      shader.setColor(inputID, (combinedAttributes.get(ColorAttribute.Reflection) as ColorAttribute).color);
    }
  })();
  public static reflectionTexture = new (class extends LocalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      const unit = shader.context.textureBinder.bindTexture(
        (combinedAttributes.get(TextureAttribute.Reflection) as TextureAttribute).texture
      );
      shader.setI(inputID, unit);
    }
  })();
  public static reflectionUVTransform = new (class extends LocalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      const ta = combinedAttributes.get(TextureAttribute.Reflection) as TextureAttribute;
      shader.set4f(inputID, ta.offsetU, ta.offsetV, ta.scaleU, ta.scaleV);
    }
  })();
  public static normalTexture = new (class extends LocalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      const unit = shader.context.textureBinder.bindTexture(
        (combinedAttributes.get(TextureAttribute.Normal) as TextureAttribute).texture
      );
      shader.setI(inputID, unit);
    }
  })();
  public static normalUVTransform = new (class extends LocalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      const ta = combinedAttributes.get(TextureAttribute.Normal) as TextureAttribute;
      shader.set4f(inputID, ta.offsetU, ta.offsetV, ta.scaleU, ta.scaleV);
    }
  })();
  public static ambientTexture = new (class extends LocalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      const unit = shader.context.textureBinder.bindTexture(
        (combinedAttributes.get(TextureAttribute.Ambient) as TextureAttribute).texture
      );
      shader.setI(inputID, unit);
    }
  })();
  public static ambientUVTransform = new (class extends LocalSetter {
    set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes) {
      const ta = combinedAttributes.get(TextureAttribute.Ambient) as TextureAttribute;
      shader.set4f(inputID, ta.offsetU, ta.offsetV, ta.scaleU, ta.scaleV);
    }
  })();
}

export class DefaultShader extends BaseShader {
  public static defaultVertexShader = `
  #if defined(diffuseTextureFlag) || defined(specularTextureFlag) || defined(emissiveTextureFlag)
  #define textureFlag
  #endif

  #if defined(specularTextureFlag) || defined(specularColorFlag)
  #define specularFlag
  #endif

  #if defined(specularFlag) || defined(fogFlag)
  #define cameraPositionFlag
  #endif

  attribute vec3 a_position;
  uniform mat4 u_projViewTrans;

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
  attribute vec2 a_texCoord0;
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
  #endif //boneWeight0Flag

  #ifdef boneWeight1Flag
  #ifndef boneWeightsFlag
  #define boneWeightsFlag
  #endif
  attribute vec2 a_boneWeight1;
  #endif //boneWeight1Flag

  #ifdef boneWeight2Flag
  #ifndef boneWeightsFlag
  #define boneWeightsFlag
  #endif
  attribute vec2 a_boneWeight2;
  #endif //boneWeight2Flag

  #ifdef boneWeight3Flag
  #ifndef boneWeightsFlag
  #define boneWeightsFlag
  #endif
  attribute vec2 a_boneWeight3;
  #endif //boneWeight3Flag

  #ifdef boneWeight4Flag
  #ifndef boneWeightsFlag
  #define boneWeightsFlag
  #endif
  attribute vec2 a_boneWeight4;
  #endif //boneWeight4Flag

  #ifdef boneWeight5Flag
  #ifndef boneWeightsFlag
  #define boneWeightsFlag
  #endif
  attribute vec2 a_boneWeight5;
  #endif //boneWeight5Flag

  #ifdef boneWeight6Flag
  #ifndef boneWeightsFlag
  #define boneWeightsFlag
  #endif
  attribute vec2 a_boneWeight6;
  #endif //boneWeight6Flag

  #ifdef boneWeight7Flag
  #ifndef boneWeightsFlag
  #define boneWeightsFlag
  #endif
  attribute vec2 a_boneWeight7;
  #endif //boneWeight7Flag

  #if defined(numBones) && defined(boneWeightsFlag)
  #if (numBones > 0) 
  #define skinningFlag
  #endif
  #endif

  uniform mat4 u_worldTrans;

  #if defined(numBones)
  #if numBones > 0
  uniform mat4 u_bones[numBones];
  #endif //numBones
  #endif

  #ifdef shininessFlag
  uniform float u_shininess;
  #else
  const float u_shininess = 20.0;
  #endif // shininessFlag

  #ifdef blendedFlag
  uniform float u_opacity;
  varying float v_opacity;

  #ifdef alphaTestFlag
  uniform float u_alphaTest;
  varying float v_alphaTest;
  #endif //alphaTestFlag
  #endif // blendedFlag

  #ifdef lightingFlag
  varying vec3 v_lightDiffuse;

  #ifdef ambientLightFlag
  uniform vec3 u_ambientLight;
  #endif // ambientLightFlag

  #ifdef ambientCubemapFlag
  uniform vec3 u_ambientCubemap[6];
  #endif // ambientCubemapFlag 

  #ifdef sphericalHarmonicsFlag
  uniform vec3 u_sphericalHarmonics[9];
  #endif //sphericalHarmonicsFlag

  #ifdef specularFlag
  varying vec3 v_lightSpecular;
  #endif // specularFlag

  #ifdef cameraPositionFlag
  uniform vec4 u_cameraPosition;
  #endif // cameraPositionFlag

  #ifdef fogFlag
  varying float v_fog;
  #endif // fogFlag


  #if numDirectionalLights > 0
  struct DirectionalLight
  {
    vec3 color;
    vec3 direction;
  };
  uniform DirectionalLight u_dirLights[numDirectionalLights];
  #endif // numDirectionalLights

  #if numPointLights > 0
  struct PointLight
  {
    vec3 color;
    vec3 position;
  };
  uniform PointLight u_pointLights[numPointLights];
  #endif // numPointLights

  #if	defined(ambientLightFlag) || defined(ambientCubemapFlag) || defined(sphericalHarmonicsFlag)
  #define ambientFlag
  #endif //ambientFlag

  #ifdef shadowMapFlag
  uniform mat4 u_shadowMapProjViewTrans;
  varying vec3 v_shadowMapUv;
  #define separateAmbientFlag
  #endif //shadowMapFlag

  #if defined(ambientFlag) && defined(separateAmbientFlag)
  varying vec3 v_ambientLight;
  #endif //separateAmbientFlag

  #endif // lightingFlag

  void main() {
    #ifdef diffuseTextureFlag
      v_diffuseUV = u_diffuseUVTransform.xy + a_texCoord0 * u_diffuseUVTransform.zw;
    #endif //diffuseTextureFlag
    
    #ifdef emissiveTextureFlag
      v_emissiveUV = u_emissiveUVTransform.xy + a_texCoord0 * u_emissiveUVTransform.zw;
    #endif //emissiveTextureFlag

    #ifdef specularTextureFlag
      v_specularUV = u_specularUVTransform.xy + a_texCoord0 * u_specularUVTransform.zw;
    #endif //specularTextureFlag
    
    #if defined(colorFlag)
      v_color = a_color;
    #endif // colorFlag
      
    #ifdef blendedFlag
      v_opacity = u_opacity;
      #ifdef alphaTestFlag
        v_alphaTest = u_alphaTest;
      #endif //alphaTestFlag
    #endif // blendedFlag
    
    #ifdef skinningFlag
      mat4 skinning = mat4(0.0);
      #ifdef boneWeight0Flag
        skinning += (a_boneWeight0.y) * u_bones[int(a_boneWeight0.x)];
      #endif //boneWeight0Flag
      #ifdef boneWeight1Flag				
        skinning += (a_boneWeight1.y) * u_bones[int(a_boneWeight1.x)];
      #endif //boneWeight1Flag
      #ifdef boneWeight2Flag		
        skinning += (a_boneWeight2.y) * u_bones[int(a_boneWeight2.x)];
      #endif //boneWeight2Flag
      #ifdef boneWeight3Flag
        skinning += (a_boneWeight3.y) * u_bones[int(a_boneWeight3.x)];
      #endif //boneWeight3Flag
      #ifdef boneWeight4Flag
        skinning += (a_boneWeight4.y) * u_bones[int(a_boneWeight4.x)];
      #endif //boneWeight4Flag
      #ifdef boneWeight5Flag
        skinning += (a_boneWeight5.y) * u_bones[int(a_boneWeight5.x)];
      #endif //boneWeight5Flag
      #ifdef boneWeight6Flag
        skinning += (a_boneWeight6.y) * u_bones[int(a_boneWeight6.x)];
      #endif //boneWeight6Flag
      #ifdef boneWeight7Flag
        skinning += (a_boneWeight7.y) * u_bones[int(a_boneWeight7.x)];
      #endif //boneWeight7Flag
    #endif //skinningFlag

    #ifdef skinningFlag
      vec4 pos = u_worldTrans * skinning * vec4(a_position, 1.0);
    #else
      vec4 pos = u_worldTrans * vec4(a_position, 1.0);
    #endif
      
    gl_Position = u_projViewTrans * pos;
      
    #ifdef shadowMapFlag
      vec4 spos = u_shadowMapProjViewTrans * pos;
      v_shadowMapUv.xyz = (spos.xyz / spos.w) * 0.5 + 0.5;
      v_shadowMapUv.z = min(v_shadowMapUv.z, 0.998);
    #endif //shadowMapFlag
    
    #if defined(normalFlag)
      #if defined(skinningFlag)
        vec3 normal = normalize((u_worldTrans * skinning * vec4(a_normal, 0.0)).xyz);
      #else
        vec3 normal = normalize(u_normalMatrix * a_normal);
      #endif
      v_normal = normal;
    #endif // normalFlag

      #ifdef fogFlag
          vec3 flen = u_cameraPosition.xyz - pos.xyz;
          float fog = dot(flen, flen) * u_cameraPosition.w;
          v_fog = min(fog, 1.0);
      #endif

    #ifdef lightingFlag
      #if	defined(ambientLightFlag)
            vec3 ambientLight = u_ambientLight;
      #elif defined(ambientFlag)
            vec3 ambientLight = vec3(0.0);
      #endif
        
      #ifdef ambientCubemapFlag 		
        vec3 squaredNormal = normal * normal;
        vec3 isPositive  = step(0.0, normal);
        ambientLight += squaredNormal.x * mix(u_ambientCubemap[0], u_ambientCubemap[1], isPositive.x) +
            squaredNormal.y * mix(u_ambientCubemap[2], u_ambientCubemap[3], isPositive.y) +
            squaredNormal.z * mix(u_ambientCubemap[4], u_ambientCubemap[5], isPositive.z);
      #endif // ambientCubemapFlag

      #ifdef sphericalHarmonicsFlag
        ambientLight += u_sphericalHarmonics[0];
        ambientLight += u_sphericalHarmonics[1] * normal.x;
        ambientLight += u_sphericalHarmonics[2] * normal.y;
        ambientLight += u_sphericalHarmonics[3] * normal.z;
        ambientLight += u_sphericalHarmonics[4] * (normal.x * normal.z);
        ambientLight += u_sphericalHarmonics[5] * (normal.z * normal.y);
        ambientLight += u_sphericalHarmonics[6] * (normal.y * normal.x);
        ambientLight += u_sphericalHarmonics[7] * (3.0 * normal.z * normal.z - 1.0);
        ambientLight += u_sphericalHarmonics[8] * (normal.x * normal.x - normal.y * normal.y);			
      #endif // sphericalHarmonicsFlag

      #ifdef ambientFlag
        #ifdef separateAmbientFlag
          v_ambientLight = ambientLight;
          v_lightDiffuse = vec3(0.0);
        #else
          v_lightDiffuse = ambientLight;
        #endif //separateAmbientFlag
      #else
            v_lightDiffuse = vec3(0.0);
      #endif //ambientFlag

        
      #ifdef specularFlag
        v_lightSpecular = vec3(0.0);
        vec3 viewVec = normalize(u_cameraPosition.xyz - pos.xyz);
      #endif // specularFlag
        
      #if (numDirectionalLights > 0) && defined(normalFlag)
        for (int i = 0; i < numDirectionalLights; i++) {
          vec3 lightDir = -u_dirLights[i].direction;
          float NdotL = clamp(dot(normal, lightDir), 0.0, 1.0);
          vec3 value = u_dirLights[i].color * NdotL;
          v_lightDiffuse += value;
          #ifdef specularFlag
            float halfDotView = max(0.0, dot(normal, normalize(lightDir + viewVec)));
            v_lightSpecular += value * pow(halfDotView, u_shininess);
          #endif // specularFlag
        }
      #endif // numDirectionalLights

      #if (numPointLights > 0) && defined(normalFlag)
        for (int i = 0; i < numPointLights; i++) {
          vec3 lightDir = u_pointLights[i].position - pos.xyz;
          float dist2 = dot(lightDir, lightDir);
          lightDir *= inversesqrt(dist2);
          float NdotL = clamp(dot(normal, lightDir), 0.0, 1.0);
          vec3 value = u_pointLights[i].color * (NdotL / (1.0 + dist2));
          v_lightDiffuse += value;
          #ifdef specularFlag
            float halfDotView = max(0.0, dot(normal, normalize(lightDir + viewVec)));
            v_lightSpecular += value * pow(halfDotView, u_shininess);
          #endif // specularFlag
        }
      #endif // numPointLights
    #endif // lightingFlag
  }
  `;

  public static defaultFragmentShader = `
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
  #endif //normalFlag

  #if defined(colorFlag)
  varying vec4 v_color;
  #endif

  #ifdef blendedFlag
  varying float v_opacity;
  #ifdef alphaTestFlag
  varying float v_alphaTest;
  #endif //alphaTestFlag
  #endif //blendedFlag

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

  #ifdef normalTextureFlag
  uniform sampler2D u_normalTexture;
  #endif

  #ifdef emissiveColorFlag
  uniform vec4 u_emissiveColor;
  #endif

  #ifdef emissiveTextureFlag
  uniform sampler2D u_emissiveTexture;
  #endif

  #ifdef lightingFlag
  varying vec3 v_lightDiffuse;

  #if	defined(ambientLightFlag) || defined(ambientCubemapFlag) || defined(sphericalHarmonicsFlag)
  #define ambientFlag
  #endif //ambientFlag

  #ifdef specularFlag
  varying vec3 v_lightSpecular;
  #endif //specularFlag

  #ifdef shadowMapFlag
  uniform sampler2D u_shadowTexture;
  uniform float u_shadowPCFOffset;
  varying vec3 v_shadowMapUv;
  #define separateAmbientFlag

  float getShadowness(vec2 offset)
  {
      const vec4 bitShifts = vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0);
      return step(v_shadowMapUv.z, dot(texture2D(u_shadowTexture, v_shadowMapUv.xy + offset), bitShifts));//+(1.0/255.0));
  }

  float getShadow()
  {
    return (//getShadowness(vec2(0,0)) +
        getShadowness(vec2(u_shadowPCFOffset, u_shadowPCFOffset)) +
        getShadowness(vec2(-u_shadowPCFOffset, u_shadowPCFOffset)) +
        getShadowness(vec2(u_shadowPCFOffset, -u_shadowPCFOffset)) +
        getShadowness(vec2(-u_shadowPCFOffset, -u_shadowPCFOffset))) * 0.25;
  }
  #endif //shadowMapFlag

  #if defined(ambientFlag) && defined(separateAmbientFlag)
  varying vec3 v_ambientLight;
  #endif //separateAmbientFlag

  #endif //lightingFlag

  #ifdef fogFlag
  uniform vec4 u_fogColor;
  varying float v_fog;
  #endif // fogFlag

  void main() {
    #if defined(normalFlag)
      vec3 normal = v_normal;
    #endif // normalFlag

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

    #if defined(emissiveTextureFlag) && defined(emissiveColorFlag)
      vec4 emissive = texture2D(u_emissiveTexture, v_emissiveUV) * u_emissiveColor;
    #elif defined(emissiveTextureFlag)
      vec4 emissive = texture2D(u_emissiveTexture, v_emissiveUV);
    #elif defined(emissiveColorFlag)
      vec4 emissive = u_emissiveColor;
    #else
      vec4 emissive = vec4(0.0);
    #endif

    #if (!defined(lightingFlag))
      gl_FragColor.rgb = diffuse.rgb + emissive.rgb;
    #elif (!defined(specularFlag))
      #if defined(ambientFlag) && defined(separateAmbientFlag)
        #ifdef shadowMapFlag
          gl_FragColor.rgb = (diffuse.rgb * (v_ambientLight + getShadow() * v_lightDiffuse)) + emissive.rgb;
          //gl_FragColor.rgb = texture2D(u_shadowTexture, v_shadowMapUv.xy);
        #else
          gl_FragColor.rgb = (diffuse.rgb * (v_ambientLight + v_lightDiffuse)) + emissive.rgb;
        #endif //shadowMapFlag
      #else
        #ifdef shadowMapFlag
          gl_FragColor.rgb = getShadow() * (diffuse.rgb * v_lightDiffuse) + emissive.rgb;
        #else
          gl_FragColor.rgb = (diffuse.rgb * v_lightDiffuse) + emissive.rgb;
        #endif //shadowMapFlag
      #endif
    #else
      #if defined(specularTextureFlag) && defined(specularColorFlag)
        vec3 specular = texture2D(u_specularTexture, v_specularUV).rgb * u_specularColor.rgb * v_lightSpecular;
      #elif defined(specularTextureFlag)
        vec3 specular = texture2D(u_specularTexture, v_specularUV).rgb * v_lightSpecular;
      #elif defined(specularColorFlag)
        vec3 specular = u_specularColor.rgb * v_lightSpecular;
      #else
        vec3 specular = v_lightSpecular;
      #endif

      #if defined(ambientFlag) && defined(separateAmbientFlag)
        #ifdef shadowMapFlag
        gl_FragColor.rgb = (diffuse.rgb * (getShadow() * v_lightDiffuse + v_ambientLight)) + specular + emissive.rgb;
          //gl_FragColor.rgb = texture2D(u_shadowTexture, v_shadowMapUv.xy);
        #else
          gl_FragColor.rgb = (diffuse.rgb * (v_lightDiffuse + v_ambientLight)) + specular + emissive.rgb;
        #endif //shadowMapFlag
      #else
        #ifdef shadowMapFlag
          gl_FragColor.rgb = getShadow() * ((diffuse.rgb * v_lightDiffuse) + specular) + emissive.rgb;
        #else
          gl_FragColor.rgb = (diffuse.rgb * v_lightDiffuse) + specular + emissive.rgb;
        #endif //shadowMapFlag
      #endif
    #endif //lightingFlag

    #ifdef fogFlag
      gl_FragColor.rgb = mix(gl_FragColor.rgb, u_fogColor.rgb, v_fog);
    #endif // end fogFlag

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

  protected static implementedFlags: number =
    BlendingAttribute.Type |
    TextureAttribute.Diffuse |
    ColorAttribute.Diffuse |
    ColorAttribute.Specular |
    FloatAttribute.Shininess;

  public static defaultCullFace: number = GL20.GL_BACK;

  public static defaultDepthFunc: number = GL20.GL_LEQUAL;

  public u_projTrans: number;
  public u_viewTrans: number;
  public u_projViewTrans: number;
  public u_cameraPosition: number;
  public u_cameraDirection: number;
  public u_cameraUp: number;
  public u_cameraNearFar: number;
  public u_time: number;
  // Object uniforms
  public u_worldTrans: number;
  public u_viewWorldTrans: number;
  public u_projViewWorldTrans: number;
  public u_normalMatrix: number;
  public u_bones: number;
  // Material uniforms
  public u_shininess: number;
  public u_opacity: number;
  public u_diffuseColor: number;
  public u_diffuseTexture: number;
  public u_diffuseUVTransform: number;
  public u_specularColor: number;
  public u_specularTexture: number;
  public u_specularUVTransform: number;
  public u_emissiveColor: number;
  public u_emissiveTexture: number;
  public u_emissiveUVTransform: number;
  public u_reflectionColor: number;
  public u_reflectionTexture: number;
  public u_reflectionUVTransform: number;
  public u_normalTexture: number;
  public u_normalUVTransform: number;
  public u_ambientTexture: number;
  public u_ambientUVTransform: number;
  public u_alphaTest: number;

  protected u_ambientCubemap;
  protected u_environmentCubemap;
  protected u_dirLights0color = this.register('u_dirLights[0].color');
  protected u_dirLights0direction = this.register('u_dirLights[0].direction');
  protected u_dirLights1color = this.register('u_dirLights[1].color');
  protected u_pointLights0color = this.register('u_pointLights[0].color');
  protected u_pointLights0position = this.register('u_pointLights[0].position');
  protected u_pointLights0intensity = this.register('u_pointLights[0].intensity');
  protected u_pointLights1color = this.register('u_pointLights[1].color');
  protected u_spotLights0color = this.register('u_spotLights[0].color');
  protected u_spotLights0position = this.register('u_spotLights[0].position');
  protected u_spotLights0intensity = this.register('u_spotLights[0].intensity');
  protected u_spotLights0direction = this.register('u_spotLights[0].direction');
  protected u_spotLights0cutoffAngle = this.register('u_spotLights[0].cutoffAngle');
  protected u_spotLights0exponent = this.register('u_spotLights[0].exponent');
  protected u_spotLights1color = this.register('u_spotLights[1].color');
  protected u_fogColor = this.register('u_fogColor');
  protected u_shadowMapProjViewTrans = this.register('u_shadowMapProjViewTrans');
  protected u_shadowTexture = this.register('u_shadowTexture');
  protected u_shadowPCFOffset = this.register('u_shadowPCFOffset');

  protected dirLightsLoc: number;
  protected dirLightsColorOffset: number;
  protected dirLightsDirectionOffset: number;
  protected dirLightsSize: number;
  protected pointLightsLoc: number;
  protected pointLightsColorOffset: number;
  protected pointLightsPositionOffset: number;
  protected pointLightsIntensityOffset: number;
  protected pointLightsSize: number;
  protected spotLightsLoc: number;
  protected spotLightsColorOffset: number;
  protected spotLightsPositionOffset: number;
  protected spotLightsDirectionOffset: number;
  protected spotLightsIntensityOffset: number;
  protected spotLightsCutoffAngleOffset: number;
  protected spotLightsExponentOffset: number;
  protected spotLightsSize: number;

  protected lighting: boolean;
  protected environmentCubemap: boolean;
  protected shadowMap: boolean;
  protected ambientCubemap = new AmbientCubemap();
  protected directionalLights: DirectionalLight[];
  // protected final PointLight pointLights[];
  // protected final SpotLight spotLights[];

  private renderable: Renderable;
  protected attributesMask: number;
  private vertexMask: number;
  protected config: Config;

  //private static optionalAttributes: number = IntAttribute.CullFace | DepthTestAttribute.Type;
  private static optionalAttributes: number = IntAttribute.CullFace;

  constructor(
    private gl: WebGLRenderingContext,
    renderable: Renderable,
    config: Config = null,
    prefix: string = '',
    vertexShader: string = '',
    fragmentShader: string = ''
  ) {
    super();
    if (vertexShader.length === 0) vertexShader = DefaultShader.defaultVertexShader;
    if (fragmentShader.length === 0) fragmentShader = DefaultShader.defaultFragmentShader;
    if (config === null) {
      config = new Config();
    } else {
      prefix = DefaultShader.createPrefix(renderable, config);
    }

    this.createShader(renderable, config, new Shader(this.gl, prefix + vertexShader, prefix + fragmentShader));
  }

  public createShader(renderable: Renderable, config: Config, shaderProgram: Shader) {
    const attributes = DefaultShader.combineAttributes(renderable);
    this.config = config;
    this.program = shaderProgram;

    this.lighting = renderable.environment != null;
    // this.environmentCubemap = attributes.has(CubemapAttribute.EnvironmentMap)
    //     || (lighting && attributes.has(CubemapAttribute.EnvironmentMap));
    this.environmentCubemap = false;

    //this.shadowMap = lighting && renderable.environment.shadowMap != null;
    this.shadowMap = false;

    this.renderable = renderable;
    this.attributesMask = attributes.getMask() | DefaultShader.optionalAttributes;
    // this.vertexMask = renderable.meshPart.mesh.getVertexAttributes().getMaskWithSizePacked();

    this.directionalLights = new Array<DirectionalLight>(
      this.lighting && config.numDirectionalLights > 0 ? config.numDirectionalLights : 0
    );
    for (let i = 0; i < this.directionalLights.length; i++) {
      this.directionalLights[i] = new DirectionalLight();
    }
    // this.pointLights = new PointLight[lighting && config.numPointLights > 0 ? config.numPointLights : 0];
    // for (int i = 0; i < pointLights.length; i++)
    //     pointLights[i] = new PointLight();
    // this.spotLights = new SpotLight[lighting && config.numSpotLights > 0 ? config.numSpotLights : 0];
    // for (int i = 0; i < spotLights.length; i++)
    //     spotLights[i] = new SpotLight();

    // if (!config.ignoreUnimplemented && (implementedFlags & attributesMask) != attributesMask)
    //     throw new Error("Some attributes not implemented yet (" + attributesMask + ")");

    // if (renderable.bones != null && renderable.bones.length > config.numBones) {
    //     throw new Error("too many bones: " + renderable.bones.length + ", max configured: " + config.numBones);
    // }

    // Global uniforms
    this.u_projTrans = this.register(Inputs.projTrans.alias, null, Setters.projTrans);
    this.u_viewTrans = this.register(Inputs.viewTrans.alias, null, Setters.viewTrans);
    this.u_projViewTrans = this.register(Inputs.projViewTrans.alias, null, Setters.projViewTrans);
    this.u_cameraPosition = this.register(Inputs.cameraPosition.alias, null, Setters.cameraPosition);
    this.u_cameraDirection = this.register(Inputs.cameraDirection.alias, null, Setters.cameraDirection);
    this.u_cameraUp = this.register(Inputs.cameraUp.alias, null, Setters.cameraUp);
    this.u_cameraNearFar = this.register(Inputs.cameraNearFar.alias, null, Setters.cameraNearFar);
    const timeUniform = new Uniform('u_time');
    this.u_time = this.register(timeUniform.alias, timeUniform);
    // Object uniforms
    this.u_worldTrans = this.register(Inputs.worldTrans.alias, null, Setters.worldTrans);
    this.u_viewWorldTrans = this.register(Inputs.viewWorldTrans.alias, null, Setters.viewWorldTrans);
    this.u_projViewWorldTrans = this.register(Inputs.projViewWorldTrans.alias, null, Setters.projViewWorldTrans);
    this.u_normalMatrix = this.register(Inputs.normalMatrix.alias, null, Setters.normalMatrix);
    // u_bones = (renderable.bones != null && config.numBones > 0) ? register(Inputs.bones, new Setters.Bones(config.numBones))
    //     : -1;

    this.u_shininess = this.register(Inputs.shininess.alias, null, Setters.shininess);
    this.u_opacity = this.register(Inputs.opacity.alias);
    this.u_diffuseColor = this.register(Inputs.diffuseColor.alias, null, Setters.diffuseColor);
    this.u_diffuseTexture = this.register(Inputs.diffuseTexture.alias, null, Setters.diffuseTexture);
    this.u_diffuseUVTransform = this.register(Inputs.diffuseUVTransform.alias, null, Setters.diffuseUVTransform);
    this.u_specularColor = this.register(Inputs.specularColor.alias, null, Setters.specularColor);
    this.u_specularTexture = this.register(Inputs.specularTexture.alias, null, Setters.specularTexture);
    this.u_specularUVTransform = this.register(Inputs.specularUVTransform.alias, null, Setters.specularUVTransform);
    this.u_emissiveColor = this.register(Inputs.emissiveColor.alias, null, Setters.emissiveColor);
    this.u_emissiveTexture = this.register(Inputs.emissiveTexture.alias, null, Setters.emissiveTexture);
    this.u_emissiveUVTransform = this.register(Inputs.emissiveUVTransform.alias, null, Setters.emissiveUVTransform);
    this.u_reflectionColor = this.register(Inputs.reflectionColor.alias, null, Setters.reflectionColor);
    this.u_reflectionTexture = this.register(Inputs.reflectionTexture.alias, null, Setters.reflectionTexture);
    this.u_reflectionUVTransform = this.register(
      Inputs.reflectionUVTransform.alias,
      null,
      Setters.reflectionUVTransform
    );
    this.u_normalTexture = this.register(Inputs.normalTexture.alias, null, Setters.normalTexture);
    this.u_normalUVTransform = this.register(Inputs.normalUVTransform.alias, null, Setters.normalUVTransform);
    this.u_ambientTexture = this.register(Inputs.ambientTexture.alias, null, Setters.ambientTexture);
    this.u_ambientUVTransform = this.register(Inputs.ambientUVTransform.alias, null, Setters.ambientUVTransform);
    this.u_alphaTest = this.register(Inputs.alphaTest.alias);

    this.u_ambientCubemap = this.lighting
      ? this.register(Inputs.ambientCube.alias, null, new ACubemap(config.numDirectionalLights, config.numPointLights))
      : -1;
    //u_environmentCubemap = environmentCubemap ? register(Inputs.environmentCubemap, Setters.environmentCubemap) : -1;
  }

  public init() {
    const program = this.program;
    this.program = null;
    this.initWithVariables(program, this.renderable);
    this.renderable = null;

    this.dirLightsLoc = this.loc(this.u_dirLights0color) as number;
    this.dirLightsColorOffset = (this.loc(this.u_dirLights0color) as number) - this.dirLightsLoc;
    this.dirLightsDirectionOffset = (this.loc(this.u_dirLights0direction) as number) - this.dirLightsLoc;
    this.dirLightsSize = (this.loc(this.u_dirLights1color) as number) - this.dirLightsLoc;
    if (this.dirLightsSize < 0) this.dirLightsSize = 0;

    // this.pointLightsLoc = this.loc(this.u_pointLights0color) as number;
    // this.pointLightsColorOffset = (this.loc(this.u_pointLights0color) as number) - this.pointLightsLoc;
    // this.pointLightsPositionOffset = (this.loc(this.u_pointLights0position) as number) - this.pointLightsLoc;
    // this.pointLightsIntensityOffset = this.has(this.u_pointLights0intensity)
    //   ? (this.loc(this.u_pointLights0intensity) as number) - this.pointLightsLoc
    //   : -1;
    // this.pointLightsSize = (this.loc(this.u_pointLights1color) as number) - this.pointLightsLoc;
    // if (this.pointLightsSize < 0) this.pointLightsSize = 0;

    // this.spotLightsLoc = this.loc(this.u_spotLights0color) as number;
    // this.spotLightsColorOffset = (this.loc(this.u_spotLights0color) as number) - this.spotLightsLoc;
    // this.spotLightsPositionOffset = (this.loc(this.u_spotLights0position) as number) - this.spotLightsLoc;
    // this.spotLightsDirectionOffset = (this.loc(this.u_spotLights0direction) as number) - this.spotLightsLoc;
    // this.spotLightsIntensityOffset = this.has(this.u_spotLights0intensity)
    //   ? (this.loc(this.u_spotLights0intensity) as number) - this.spotLightsLoc
    //   : -1;
    // this.spotLightsCutoffAngleOffset = (this.loc(this.u_spotLights0cutoffAngle) as number) - this.spotLightsLoc;
    // this.spotLightsExponentOffset = (this.loc(this.u_spotLights0exponent) as number) - this.spotLightsLoc;
    // this.spotLightsSize = (this.loc(this.u_spotLights1color) as number) - this.spotLightsLoc;
    // if (this.spotLightsSize < 0) this.spotLightsSize = 0;
  }

  private static and(mask: number, flag: number): boolean {
    return (mask & flag) === flag;
  }

  private static or(mask: number, flag: number): boolean {
    return (mask & flag) !== 0;
  }

  private static tmpAttributes: Attributes = new Attributes();

  private static combineAttributes(renderable: Renderable): Attributes {
    this.tmpAttributes.clear();
    // if (renderable.environment != null) tmpAttributes.set(renderable.environment);
    if (renderable.material != null) this.tmpAttributes.setAttributes(renderable.material.getAttributes());
    return this.tmpAttributes;
  }

  private static combineAttributeMasks(renderable: Renderable): number {
    let mask = 0;
    //if (renderable.environment != null) mask |= renderable.environment.getMask();
    if (renderable.material != null) mask |= renderable.material.getMask();
    return mask;
  }

  public static createPrefix(renderable: Renderable, config: Config): string {
    const attributes = this.combineAttributes(renderable);
    let prefix = '';
    const attributesMask = attributes.getMask();
    const vertexMask = renderable.meshPart.mesh.getVertexAttributes().getMask();
    if (this.and(vertexMask, Usage.Position)) prefix += '#define positionFlag\n';
    if (this.or(vertexMask, Usage.ColorUnpacked | Usage.ColorPacked)) prefix += '#define colorFlag\n';
    if (this.and(vertexMask, Usage.BiNormal)) prefix += '#define binormalFlag\n';
    if (this.and(vertexMask, Usage.Tangent)) prefix += '#define tangentFlag\n';
    if (this.and(vertexMask, Usage.Normal)) prefix += '#define normalFlag\n';
    if (this.and(vertexMask, Usage.Normal) || this.and(vertexMask, Usage.Tangent | Usage.BiNormal)) {
      if (renderable.environment != null) {
        prefix += '#define lightingFlag\n';
        prefix += '#define ambientCubemapFlag\n';
        prefix += '#define numDirectionalLights ' + config.numDirectionalLights + '\n';
        prefix += '#define numPointLights ' + config.numPointLights + '\n';
        prefix += '#define numSpotLights ' + config.numSpotLights + '\n';
        if (attributes.has(ColorAttribute.Fog)) {
          prefix += '#define fogFlag\n';
        }
        // if (renderable.environment.shadowMap != null) prefix += "#define shadowMapFlag\n";
        // if (attributes.has(CubemapAttribute.EnvironmentMap)) prefix += "#define environmentCubemapFlag\n";
      }
    }
    const n = renderable.meshPart.mesh.getVertexAttributes().size();
    for (let i = 0; i < n; i++) {
      const attr = renderable.meshPart.mesh.getVertexAttributes().get(i);
      if (attr.usage === Usage.BoneWeight) prefix += '#define boneWeight' + attr.unit + 'Flag\n';
      else if (attr.usage === Usage.TextureCoordinates) prefix += '#define texCoord' + attr.unit + 'Flag\n';
    }
    if ((attributesMask & BlendingAttribute.Type) === BlendingAttribute.Type)
      prefix += '#define ' + BlendingAttribute.Alias + 'Flag\n';
    if ((attributesMask & TextureAttribute.Diffuse) === TextureAttribute.Diffuse) {
      prefix += '#define ' + TextureAttribute.DiffuseAlias + 'Flag\n';
      prefix += '#define ' + TextureAttribute.DiffuseAlias + 'Coord texCoord0\n'; // FIXME implement UV mapping
    }
    if ((attributesMask & TextureAttribute.Specular) === TextureAttribute.Specular) {
      prefix += '#define ' + TextureAttribute.SpecularAlias + 'Flag\n';
      prefix += '#define ' + TextureAttribute.SpecularAlias + 'Coord texCoord0\n'; // FIXME implement UV mapping
    }
    if ((attributesMask & TextureAttribute.Normal) === TextureAttribute.Normal) {
      prefix += '#define ' + TextureAttribute.NormalAlias + 'Flag\n';
      prefix += '#define ' + TextureAttribute.NormalAlias + 'Coord texCoord0\n'; // FIXME implement UV mapping
    }
    if ((attributesMask & TextureAttribute.Emissive) === TextureAttribute.Emissive) {
      prefix += '#define ' + TextureAttribute.EmissiveAlias + 'Flag\n';
      prefix += '#define ' + TextureAttribute.EmissiveAlias + 'Coord texCoord0\n'; // FIXME implement UV mapping
    }
    if ((attributesMask & TextureAttribute.Reflection) === TextureAttribute.Reflection) {
      prefix += '#define ' + TextureAttribute.ReflectionAlias + 'Flag\n';
      prefix += '#define ' + TextureAttribute.ReflectionAlias + 'Coord texCoord0\n'; // FIXME implement UV mapping
    }
    if ((attributesMask & TextureAttribute.Ambient) === TextureAttribute.Ambient) {
      prefix += '#define ' + TextureAttribute.AmbientAlias + 'Flag\n';
      prefix += '#define ' + TextureAttribute.AmbientAlias + 'Coord texCoord0\n'; // FIXME implement UV mapping
    }
    if ((attributesMask & ColorAttribute.Diffuse) === ColorAttribute.Diffuse)
      prefix += '#define ' + ColorAttribute.DiffuseAlias + 'Flag\n';
    if ((attributesMask & ColorAttribute.Specular) === ColorAttribute.Specular)
      prefix += '#define ' + ColorAttribute.SpecularAlias + 'Flag\n';
    if ((attributesMask & ColorAttribute.Emissive) === ColorAttribute.Emissive)
      prefix += '#define ' + ColorAttribute.EmissiveAlias + 'Flag\n';
    if ((attributesMask & ColorAttribute.Reflection) === ColorAttribute.Reflection)
      prefix += '#define ' + ColorAttribute.ReflectionAlias + 'Flag\n';
    if ((attributesMask & FloatAttribute.Shininess) === FloatAttribute.Shininess)
      prefix += '#define ' + FloatAttribute.ShininessAlias + 'Flag\n';
    if ((attributesMask & FloatAttribute.AlphaTest) === FloatAttribute.AlphaTest)
      prefix += '#define ' + FloatAttribute.AlphaTestAlias + 'Flag\n';
    if (renderable.bones != null && config.numBones > 0) prefix += '#define numBones ' + config.numBones + '\n';
    return prefix;
  }

  public canRender(renderable: Renderable): boolean {
    if (renderable.bones != null && renderable.bones.length > this.config.numBones) return false;
    const renderableMask = DefaultShader.combineAttributeMasks(renderable);

    return (
      this.attributesMask === (renderableMask | DefaultShader.optionalAttributes)
      // && this.vertexMask == renderable.meshPart.mesh.getVertexAttributes().getMaskWithSizePacked() &&
      // (renderable.environment != null) == this.lighting
    );
  }

  private normalMatrix: Matrix3 = new Matrix3();
  private time: number;
  private lightsSet: boolean;

  public begin(camera: PerspectiveCamera, context: RenderContext) {
    super.begin(camera, context);

    for (const dirLight of this.directionalLights) dirLight.set(0, 0, 0, 0, -1, 0);
    // for (final PointLight pointLight : pointLights)
    //     pointLight.set(0, 0, 0, 0, 0, 0, 0);
    // for (final SpotLight spotLight : spotLights)
    //     spotLight.set(0, 0, 0, 0, 0, 0, 0, -1, 0, 0, 1, 0);
    // lightsSet = false;

    // if (has(u_time)) set(u_time, time += Gdx.graphics.getDeltaTime());
  }

  public renderWithCombinedAttributes(renderable: Renderable, combinedAttributes: Attributes) {
    if (!combinedAttributes.has(BlendingAttribute.Type))
      this.context.setBlending(false, GL20.GL_SRC_ALPHA, GL20.GL_ONE_MINUS_SRC_ALPHA);
    this.bindMaterial(combinedAttributes);
    if (this.lighting) this.bindLights(renderable, combinedAttributes);
    super.renderWithCombinedAttributes(renderable, combinedAttributes);
  }

  public end() {
    super.end();
  }

  protected bindMaterial(attributes: Attributes) {
    let cullFace = this.config.defaultCullFace === -1 ? DefaultShader.defaultCullFace : this.config.defaultCullFace;
    const depthFunc =
      this.config.defaultDepthFunc === -1 ? DefaultShader.defaultDepthFunc : this.config.defaultDepthFunc;
    const depthRangeNear = 0;
    const depthRangeFar = 1;
    const depthMask = true;

    for (const attr of attributes.getAttributes()) {
      const t = attr.type;
      if (BlendingAttribute.is(t)) {
        this.context.setBlending(
          true,
          (attr as BlendingAttribute).sourceFunction,
          (attr as BlendingAttribute).destFunction
        );
        this.setF(this.u_opacity, (attr as BlendingAttribute).opacity);
      } else if ((t & IntAttribute.CullFace) === IntAttribute.CullFace) cullFace = (attr as IntAttribute).value;
      else if ((t & FloatAttribute.AlphaTest) === FloatAttribute.AlphaTest)
        this.setF(this.u_alphaTest, (attr as FloatAttribute).value);
      // else if ((t & DepthTestAttribute.Type) === DepthTestAttribute.Type) {
      //     DepthTestAttribute dta = (DepthTestAttribute)attr;
      //     depthFunc = dta.depthFunc;
      //     depthRangeNear = dta.depthRangeNear;
      //     depthRangeFar = dta.depthRangeFar;
      //     depthMask = dta.depthMask;
      // }
      else if (!this.config.ignoreUnimplemented) throw new Error('Unknown material attribute: ' + attr.toString());
    }

    this.context.setCullFace(cullFace);
    this.context.setDepthTest(depthFunc, depthRangeNear, depthRangeFar);
    this.context.setDepthMask(depthMask);
  }

  private tmpV1: Vector3 = new Vector3();

  protected bindLights(renderable: Renderable, attributes: Attributes) {
    const lights = renderable.environment;
    const dla = attributes.get(DirectionalLightsAttribute.Type) as DirectionalLightsAttribute;
    const dirs = dla === null ? null : dla.lights;
    // const pla = attributes.get(PointLightsAttribute.class, PointLightsAttribute.Type);
    // const points = pla === null ? null : pla.lights;
    // const sla = attributes.get(SpotLightsAttribute.class, SpotLightsAttribute.Type);
    // const spots = sla === null ? null : sla.lights;
    if (this.dirLightsLoc >= 0) {
      for (let i = 0; i < this.directionalLights.length; i++) {
        if (dirs === null || i >= dirs.length) {
          if (
            this.lightsSet &&
            this.directionalLights[i].color.r === 0 &&
            this.directionalLights[i].color.g === 0 &&
            this.directionalLights[i].color.b === 0
          )
            continue;
          this.directionalLights[i].color.set(0, 0, 0, 1);
        } else if (this.lightsSet && this.directionalLights[i].equals(dirs[i])) continue;
        else this.directionalLights[i].setFrom(dirs[i].color, dirs[i].direction);
        const idx = this.dirLightsLoc + i * this.dirLightsSize;
        this.program.setUniform3fWithLocation(
          idx + this.dirLightsColorOffset,
          this.directionalLights[i].color.r,
          this.directionalLights[i].color.g,
          this.directionalLights[i].color.b
        );
        this.program.setUniform3fWithLocation(
          idx + this.dirLightsDirectionOffset,
          this.directionalLights[i].direction.x,
          this.directionalLights[i].direction.y,
          this.directionalLights[i].direction.z
        );
        if (this.dirLightsSize <= 0) break;
      }
    }
    // if (pointLightsLoc >= 0) {
    //     for (let i = 0; i < pointLights.length; i++) {
    //         if (points === null || i >= points.size) {
    //             if (lightsSet && pointLights[i].intensity === 0) continue;
    //             pointLights[i].intensity = 0;
    //         } else if (lightsSet && pointLights[i].equals(points.get(i)))
    //             continue;
    //         else
    //             pointLights[i].set(points.get(i));
    //         let idx = pointLightsLoc + i * pointLightsSize;
    //         program.setUniformf(idx + pointLightsColorOffset, pointLights[i].color.r * pointLights[i].intensity,
    //             pointLights[i].color.g * pointLights[i].intensity, pointLights[i].color.b * pointLights[i].intensity);
    //         program.setUniformf(idx + pointLightsPositionOffset, pointLights[i].position.x, pointLights[i].position.y,
    //             pointLights[i].position.z);
    //         if (pointLightsIntensityOffset >= 0) program.setUniformf(idx + pointLightsIntensityOffset, pointLights[i].intensity);
    //         if (pointLightsSize <= 0) break;
    //     }
    // }
    // if (spotLightsLoc >= 0) {
    //     for (let i = 0; i < spotLights.length; i++) {
    //         if (spots === null || i >= spots.size) {
    //             if (lightsSet && spotLights[i].intensity === 0) continue;
    //             spotLights[i].intensity = 0;
    //         } else if (lightsSet && spotLights[i].equals(spots.get(i)))
    //             continue;
    //         else
    //             spotLights[i].set(spots.get(i));
    //         let idx = spotLightsLoc + i * spotLightsSize;
    //         program.setUniformf(idx + spotLightsColorOffset, spotLights[i].color.r * spotLights[i].intensity,
    //             spotLights[i].color.g * spotLights[i].intensity, spotLights[i].color.b * spotLights[i].intensity);
    //         program.setUniformf(idx + spotLightsPositionOffset, spotLights[i].position);
    //         program.setUniformf(idx + spotLightsDirectionOffset, spotLights[i].direction);
    //         program.setUniformf(idx + spotLightsCutoffAngleOffset, spotLights[i].cutoffAngle);
    //         program.setUniformf(idx + spotLightsExponentOffset, spotLights[i].exponent);
    //         if (spotLightsIntensityOffset >= 0) program.setUniformf(idx + spotLightsIntensityOffset, spotLights[i].intensity);
    //         if (spotLightsSize <= 0) break;
    //     }
    // }
    // if (attributes.has(ColorAttribute.Fog)) {
    //     set(u_fogColor, (attributes.get(ColorAttribute.Fog) as ColorAttribute).color);
    // }
    // if (lights != null && lights.shadowMap != null) {
    //     set(u_shadowMapProjViewTrans, lights.shadowMap.getProjViewTrans());
    //     set(u_shadowTexture, lights.shadowMap.getDepthMap());
    //     set(u_shadowPCFOffset, 1 / (2 * lights.shadowMap.getDepthMap().texture.getWidth()));
    // }
    this.lightsSet = true;
  }

  public dispose() {
    this.program.dispose();
    super.dispose();
  }

  public getDefaultCullFace() {
    return this.config.defaultCullFace === -1 ? DefaultShader.defaultCullFace : this.config.defaultCullFace;
  }

  public setDefaultCullFace(cullFace: number) {
    this.config.defaultCullFace = cullFace;
  }

  public getDefaultDepthFunc() {
    return this.config.defaultDepthFunc === -1 ? DefaultShader.defaultDepthFunc : this.config.defaultDepthFunc;
  }

  public setDefaultDepthFunc(depthFunc: number) {
    this.config.defaultDepthFunc = depthFunc;
  }
}
