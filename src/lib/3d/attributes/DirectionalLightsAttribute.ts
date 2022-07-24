import { DirectionalLight } from '../environment/DirectionalLight';
import { Attribute } from './Attribute';

export class DirectionalLightsAttribute extends Attribute {
  public static Alias = 'directionalLights';
  public static Type = this.register(DirectionalLightsAttribute.Alias);

  public static is(mask: number): boolean {
    return (mask & DirectionalLightsAttribute.Type) === mask;
  }

  public lights: DirectionalLight[];
  constructor() {
    super();
    this.Attribute(DirectionalLightsAttribute.Type);
    this.lights = new Array<DirectionalLight>();
  }

  public set(copyFrom: DirectionalLightsAttribute) {
    for (let i = 0; i < copyFrom.lights.length; i++) {
      this.lights[i] = copyFrom.lights[i];
    }
  }

  public copy(): DirectionalLightsAttribute {
    const att = new DirectionalLightsAttribute();
    att.set(this);
    return att;
  }

  public compareTo(other: Attribute): number {
    if (this.type !== other.type) return this.type < other.type ? -1 : 1;
    return 0;
  }
}
