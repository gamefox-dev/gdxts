import { Attribute } from './Attribute';

export class FloatAttribute extends Attribute {
  public static ShininessAlias: string = 'shininess';
  public static Shininess: number = this.register(this.ShininessAlias);

  public static createShininess(value: number): FloatAttribute {
    return new FloatAttribute(FloatAttribute.Shininess, value);
  }

  public static AlphaTestAlias: string = 'alphaTest';
  public static AlphaTest: number = this.register(FloatAttribute.AlphaTestAlias);

  public static createAlphaTest(value: number): FloatAttribute {
    return new FloatAttribute(FloatAttribute.AlphaTest, value);
  }

  public value: number;
  constructor(type: number, value: number) {
    super();
    this.Attribute(type);
    this.value = value;
  }

  public copy(): Attribute {
    return new FloatAttribute(this.type, this.value);
  }
}
