import { Texture } from '../../../../Texture';
import { TextureRegion } from '../../../../TextureRegion';
import { Attribute, TextureAttribute } from '../../../attributes';

export class PBRTextureAttribute extends TextureAttribute {
  public static BaseColorTextureAlias = 'diffuseTexture';
  public static BaseColorTexture: number = this.register(PBRTextureAttribute.BaseColorTextureAlias);

  public static EmissiveTextureAlias = 'emissiveTexture';
  public static EmissiveTexture: number = this.register(PBRTextureAttribute.EmissiveTextureAlias);

  public static NormalTextureAlias = 'normalTexture';
  public static NormalTexture: number = this.register(PBRTextureAttribute.NormalTextureAlias);

  public static MetallicRoughnessTextureAlias = 'MetallicRoughnessSampler';
  public static MetallicRoughnessTexture: number = this.register(PBRTextureAttribute.MetallicRoughnessTextureAlias);

  public static OcclusionTextureAlias = 'OcclusionSampler';
  public static OcclusionTexture: number = this.register(PBRTextureAttribute.OcclusionTextureAlias);

  // IBL environnement only
  public static BRDFLUTTextureAlias = 'brdfLUTSampler';
  public static BRDFLUTTexture: number = this.register(PBRTextureAttribute.BRDFLUTTextureAlias);

  static {
    PBRTextureAttribute.Mask |=
      PBRTextureAttribute.MetallicRoughnessTexture |
      PBRTextureAttribute.OcclusionTexture |
      PBRTextureAttribute.BaseColorTexture |
      PBRTextureAttribute.NormalTexture |
      PBRTextureAttribute.EmissiveTexture |
      PBRTextureAttribute.BRDFLUTTexture;
  }

  public rotationUV = 0;

  public setFromTexture(type: number, texture: Texture) {
    this.setType(type);
    this.setTexture(texture);
  }

  public setFromTextureRegion(type: number, region: TextureRegion) {
    this.setType(type);
    this.setTextureRegion(region);
  }

  setFromTextureAttribute(attribute: PBRTextureAttribute) {
    this.set(attribute.type, attribute.offsetU, attribute.offsetV, attribute.scaleU, attribute.scaleV);
    this.rotationUV = attribute.rotationUV;
  }

  public static createBaseColorTexture(texture: Texture): PBRTextureAttribute {
    const attr = new PBRTextureAttribute(PBRTextureAttribute.BaseColorTexture);
    attr.setTexture(texture);
    return attr;
  }
  public static createEmissiveTexture(texture: Texture): PBRTextureAttribute {
    const attr = new PBRTextureAttribute(PBRTextureAttribute.EmissiveTexture);
    attr.setTexture(texture);
    return attr;
  }
  public static createNormalTexture(texture: Texture): PBRTextureAttribute {
    const attr = new PBRTextureAttribute(PBRTextureAttribute.NormalTexture);
    attr.setTexture(texture);
    return attr;
  }
  public static createMetallicRoughnessTexture(texture: Texture): PBRTextureAttribute {
    const attr = new PBRTextureAttribute(PBRTextureAttribute.MetallicRoughnessTexture);
    attr.setTexture(texture);
    return attr;
  }
  public static createOcclusionTexture(texture: Texture): PBRTextureAttribute {
    const attr = new PBRTextureAttribute(PBRTextureAttribute.OcclusionTexture);
    attr.setTexture(texture);
    return attr;
  }
  public static createBRDFLookupTexture(texture: Texture): PBRTextureAttribute {
    const attr = new PBRTextureAttribute(PBRTextureAttribute.BRDFLUTTexture);
    attr.setTexture(texture);
    return attr;
  }

  // public static createBaseColorTexture(region: TextureRegion): PBRTextureAttribute {
  //   return new PBRTextureAttribute(PBRTextureAttribute.BaseColorTexture, region);
  // }
  // public static createEmissiveTexture(region: TextureRegion): PBRTextureAttribute {
  //   return new PBRTextureAttribute(PBRTextureAttribute.EmissiveTexture, region);
  // }
  // public static createNormalTexture(region: TextureRegion): PBRTextureAttribute {
  //   return new PBRTextureAttribute(PBRTextureAttribute.NormalTexture, region);
  // }
  // public static createMetallicRoughnessTexture(region: TextureRegion): PBRTextureAttribute {
  //   return new PBRTextureAttribute(PBRTextureAttribute.MetallicRoughnessTexture, region);
  // }
  // public static createOcclusionTexture(region: TextureRegion): PBRTextureAttribute {
  //   return new PBRTextureAttribute(PBRTextureAttribute.OcclusionTexture, region);
  // }
  // public static createBRDFLookupTexture(region: TextureRegion): PBRTextureAttribute {
  //   return new PBRTextureAttribute(PBRTextureAttribute.BRDFLUTTexture, region);
  // }

  public copy(): Attribute {
    const att = new PBRTextureAttribute(this.type);
    att.setFromTextureAttribute(this);
    return att;
  }
}
