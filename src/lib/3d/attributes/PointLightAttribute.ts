import { PointLight } from '../environment/PointLight';
import { Attribute } from './Attribute';

export class PointLightsAttribute extends Attribute {
  public static Alias = 'pointLights';
  public static Type = this.register(PointLightsAttribute.Alias);

  public static is(mask: number): boolean {
    return (mask & PointLightsAttribute.Type) === mask;
  }

  public lights: PointLight[];
  constructor() {
    super();
    this.setType(PointLightsAttribute.Type);
    this.lights = new Array<PointLight>();
  }

  public set(copyFrom: PointLightsAttribute) {
    for (let i = 0; i < copyFrom.lights.length; i++) {
      this.lights[i] = copyFrom.lights[i];
    }
  }

  public copy(): PointLightsAttribute {
    const att = new PointLightsAttribute();
    att.set(this);
    return att;
  }

  public compareTo(other: Attribute): number {
    if (this.type !== other.type) return this.type < other.type ? -1 : 1;
    return 0;
  }
}
