import { Attribute } from './Attribute';

export class IntAttribute extends Attribute {
  public static CullFaceAlias = 'cullface';
  public static CullFace: number = this.register(IntAttribute.CullFaceAlias);

  public static createCullFace(value: number): IntAttribute {
    return new IntAttribute(IntAttribute.CullFace, value);
  }

  public value: number;

  constructor(type: number, value: number = 0) {
    super();
    this.setType(type);
    this.value = value;
  }

  public copy(): Attribute {
    return new IntAttribute(this.type, this.value);
  }
}
