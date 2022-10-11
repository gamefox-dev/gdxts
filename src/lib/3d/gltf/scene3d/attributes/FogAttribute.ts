import { Vector3 } from '../../../../Vector3';
import { Attribute } from '../../../attributes/Attribute';

export class FogAttribute extends Attribute {
  public static FogEquationAlias = 'fogEquation';
  public static FogEquation = this.register(FogAttribute.FogEquationAlias);

  public static createFog(near: number, far: number, exponent: number): FogAttribute {
    return new FogAttribute(FogAttribute.FogEquation).set(near, far, exponent);
  }

  public value = new Vector3();

  constructor(type: number) {
    super();
    this.setType(type);
  }

  public set(near: number, far: number, exponent: number): FogAttribute {
    this.value.set(near, far, exponent);
    return this;
  }

  public copy(): Attribute {
    return new FogAttribute(this.type).set(this.value.x, this.value.y, this.value.z);
  }

  public compareTo(o: Attribute): number {
    return this.type - o.type;
  }
}
