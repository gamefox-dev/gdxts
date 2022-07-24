import { SpotLight } from '../environment/SpotLight';
import { Attribute } from './Attribute';

export class SpotLightsAttribute extends Attribute {
  public static Alias = 'spotLights';
  public static Type = this.register(SpotLightsAttribute.Alias);

  public static is(mask: number): boolean {
    return (mask & SpotLightsAttribute.Type) === mask;
  }

  public lights: SpotLight[];
  constructor() {
    super();
    this.Attribute(SpotLightsAttribute.Type);
    this.lights = new Array<SpotLight>();
  }

  public set(copyFrom: SpotLightsAttribute) {
    for (let i = 0; i < copyFrom.lights.length; i++) {
      this.lights[i] = copyFrom.lights[i];
    }
  }

  public copy(): SpotLightsAttribute {
    const att = new SpotLightsAttribute();
    att.set(this);
    return att;
  }

  public compareTo(other: Attribute): number {
    if (this.type !== other.type) return this.type < other.type ? -1 : 1;
    return 0;
  }
}
