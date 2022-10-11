import { Attribute } from '../../../attributes';

export class PBRFlagAttribute extends Attribute {
  public static UnlitAlias = 'unlit';
  public static Unlit: number = this.register(PBRFlagAttribute.UnlitAlias);

  constructor(type: number) {
    super();
    this.setType(type);
  }

  public copy(): Attribute {
    return new PBRFlagAttribute(this.type);
  }

  public compareTo(o: Attribute): number {
    return this.type - o.type;
  }
}
