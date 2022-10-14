import { Color, MathUtils } from '../../../../Utils';
import { BlendingAttribute, ColorAttribute3D, FloatAttribute, IntAttribute } from '../../../attributes';
import { Material } from '../../../Material';
import { KHRMaterialsPBRSpecularGlossiness } from '../../data/extensions/KHRMaterialsPBRSpecularGlossiness';
import { KHRMaterialsUnlit } from '../../data/extensions/KHRMaterialsUnlit';
import { KHRTextureTransform } from '../../data/extensions/KHRTextureTransform';
import { GLTFMaterial } from '../../data/material/GLTFMaterial';
import { GLTFTextureInfo } from '../../data/texture/GLTFTextureInfo';
import { PBRColorAttribute } from '../../scene3d/attributes/PBRColorAttribute';
import { PBRFlagAttribute } from '../../scene3d/attributes/PBRFlagAttribute';
import { PBRFloatAttribute } from '../../scene3d/attributes/PBRFloatAttribute';
import { PBRTextureAttribute } from '../../scene3d/attributes/PBRTextureAttribute';
import { GLTFTypes } from '../shared/GLTFTypes';
import { TextureResolver } from '../texture/TextureResolver';
import { MaterialLoaderBase } from './MaterialLoaderBase';

export class PBRMaterialLoader extends MaterialLoaderBase {
  constructor(textureResolver: TextureResolver) {
    const material = new Material();
    material.setAttribute(new PBRColorAttribute(PBRColorAttribute.BaseColorFactor, Color.WHITE));
    super(textureResolver, material);
  }

  public loadMaterial(glMaterial: GLTFMaterial): Material {
    const material = new Material();
    if (!!glMaterial.name) material.id = glMaterial.name;

    if (!!glMaterial.emissiveFactor) {
      material.set(
        new ColorAttribute3D(ColorAttribute3D.Emissive, GLTFTypes.mapColor(glMaterial.emissiveFactor, Color.BLACK))
      );
    }

    if (!!glMaterial.emissiveTexture) {
      material.set(this.getTexureMap(PBRTextureAttribute.EmissiveTexture, glMaterial.emissiveTexture));
    }

    if (glMaterial.doubleSided == true) {
      material.set(IntAttribute.createCullFace(0)); // 0 to disable culling
    }

    if (!!glMaterial.normalTexture) {
      material.set(this.getTexureMap(PBRTextureAttribute.NormalTexture, glMaterial.normalTexture));
      material.set(PBRFloatAttribute.createNormalScale(glMaterial.normalTexture.scale));
    }

    if (!!glMaterial.occlusionTexture) {
      material.set(this.getTexureMap(PBRTextureAttribute.OcclusionTexture, glMaterial.occlusionTexture));
      material.set(PBRFloatAttribute.createOcclusionStrength(glMaterial.occlusionTexture.strength));
    }

    let alphaBlend = false;
    if ('OPAQUE' === glMaterial.alphaMode) {
      // nothing to do
    } else if ('MASK' === glMaterial.alphaMode) {
      const value = !glMaterial.alphaCutoff ? 0.5 : glMaterial.alphaCutoff;
      material.set(FloatAttribute.createAlphaTest(value));
      material.set(new BlendingAttribute()); // necessary
    } else if ('BLEND' === glMaterial.alphaMode) {
      material.set(new BlendingAttribute()); // opacity is set by pbrMetallicRoughness below
      alphaBlend = true;
    } else if (!!glMaterial.alphaMode) {
      throw new Error('unknow alpha mode : ' + glMaterial.alphaMode);
    }

    if (!!glMaterial.pbrMetallicRoughness) {
      const p = glMaterial.pbrMetallicRoughness;

      const baseColorFactor = GLTFTypes.mapColor(p.baseColorFactor, Color.WHITE);

      material.set(new PBRColorAttribute(PBRColorAttribute.BaseColorFactor, baseColorFactor));

      material.set(PBRFloatAttribute.createMetallic(p.metallicFactor));
      material.set(PBRFloatAttribute.createRoughness(p.roughnessFactor));

      if (!!p.metallicRoughnessTexture) {
        material.set(this.getTexureMap(PBRTextureAttribute.MetallicRoughnessTexture, p.metallicRoughnessTexture));
      }

      if (!!p.baseColorTexture) {
        material.set(this.getTexureMap(PBRTextureAttribute.BaseColorTexture, p.baseColorTexture));
      }

      if (alphaBlend) {
        (material.get(BlendingAttribute.Type) as BlendingAttribute).opacity = baseColorFactor.a;
      }
    }

    // can have both PBR base and ext
    if (!!glMaterial.extensions) {
      {
        const ext = glMaterial.extensions.get(KHRMaterialsPBRSpecularGlossiness.EXT);
        if (ext != undefined) {
          console.error(
            'GLTF',
            KHRMaterialsPBRSpecularGlossiness.EXT +
              ' extension is deprecated by glTF 2.0 specification and not fully supported.'
          );

          material.set(
            new ColorAttribute3D(ColorAttribute3D.Diffuse, GLTFTypes.mapColor(ext.diffuseFactor, Color.WHITE))
          );
          material.set(
            new ColorAttribute3D(ColorAttribute3D.Specular, GLTFTypes.mapColor(ext.specularFactor, Color.WHITE))
          );

          // not sure how to map normalized gloss to exponent ...
          material.set(new FloatAttribute(FloatAttribute.Shininess, MathUtils.lerp(1, 100, ext.glossinessFactor)));
          if (!!ext.diffuseTexture) {
            material.set(this.getTexureMap(PBRTextureAttribute.Diffuse, ext.diffuseTexture));
          }
          if (!!ext.specularGlossinessTexture) {
            material.set(this.getTexureMap(PBRTextureAttribute.Specular, ext.specularGlossinessTexture));
          }
        }
      }
      {
        const ext = glMaterial.extensions.get(KHRMaterialsUnlit.EXT);
        if (ext != undefined) {
          material.set(new PBRFlagAttribute(PBRFlagAttribute.Unlit));
        }
      }
    }

    return material;
  }

  private getTexureMap(type: number, glMap: GLTFTextureInfo): PBRTextureAttribute {
    const texture = this.textureResolver.getTexture(glMap);

    const attribute = new PBRTextureAttribute(type);
    attribute.setTexture(texture);
    attribute.uvIndex = glMap.texCoord;

    if (!!glMap.extensions) {
      {
        const ext = glMap.extensions.get(KHRTextureTransform.EXT);
        if (!!ext) {
          attribute.offsetU = ext.offset[0];
          attribute.offsetV = ext.offset[1];
          attribute.scaleU = ext.scale[0];
          attribute.scaleV = ext.scale[1];
          attribute.rotationUV = ext.rotation;
          if (ext.texCoord != null) {
            attribute.uvIndex = ext.texCoord;
          }
        }
      }
    }

    return attribute;
  }
}
