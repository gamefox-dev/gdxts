import { Attribute, FloatAttribute } from '../../../attributes';

export class PBRFloatAttribute extends FloatAttribute {
  public static MetallicAlias = 'Metallic';
  public static Metallic: number = this.register(PBRFloatAttribute.MetallicAlias);

  public static RoughnessAlias = 'Roughness';
  public static Roughness: number = this.register(PBRFloatAttribute.RoughnessAlias);

  public static NormalScaleAlias = 'NormalScale';
  public static NormalScale: number = this.register(PBRFloatAttribute.NormalScaleAlias);

  public static OcclusionStrengthAlias = 'OcclusionStrength';
  public static OcclusionStrength: number = this.register(PBRFloatAttribute.OcclusionStrengthAlias);

  public static ShadowBiasAlias = 'ShadowBias';
  public static ShadowBias: number = this.register(PBRFloatAttribute.ShadowBiasAlias);

  public static EmissiveIntensityAlias = 'EmissiveIntensity';
  public static EmissiveIntensity: number = this.register(PBRFloatAttribute.EmissiveIntensityAlias);

  constructor(type: number, value: number) {
    super(type, value);
  }

  public copy(): Attribute {
    return new PBRFloatAttribute(this.type, this.value);
  }

  public static createMetallic(value: number): Attribute {
    return new PBRFloatAttribute(PBRFloatAttribute.Metallic, value);
  }
  public static createRoughness(value: number): Attribute {
    return new PBRFloatAttribute(PBRFloatAttribute.Roughness, value);
  }
  public static createNormalScale(value: number): Attribute {
    return new PBRFloatAttribute(PBRFloatAttribute.NormalScale, value);
  }
  public static createOcclusionStrength(value: number): Attribute {
    return new PBRFloatAttribute(PBRFloatAttribute.OcclusionStrength, value);
  }
  public static createEmissiveIntensity(value: number): Attribute {
    return new PBRFloatAttribute(PBRFloatAttribute.EmissiveIntensity, value);
  }
}
