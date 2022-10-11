import { Color } from '../../../../Utils';
import { Attribute, ColorAttribute3D } from '../../../attributes';

export class PBRColorAttribute extends ColorAttribute3D {
  public static BaseColorFactorAlias = 'BaseColorFactor';
  public static BaseColorFactor: number = this.register(PBRColorAttribute.BaseColorFactorAlias);

  public static createBaseColorFactor(color: Color): PBRColorAttribute {
    return new PBRColorAttribute(PBRColorAttribute.BaseColorFactor, color);
  }

  static {
    PBRColorAttribute.Mask |= PBRColorAttribute.BaseColorFactor;
  }

  public constructor(type: number, color: Color) {
    super(type, color);
  }

  public copy(): Attribute {
    return new PBRColorAttribute(this.type, this.color);
  }
}
