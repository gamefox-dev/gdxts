import { DirectionalLightsAttribute, PointLightsAttribute, SpotLightsAttribute } from '../../../attributes';
import { Environment } from '../../../environment';

export class EnvironmentUtil {
  public static getLightCount(environment: Environment): number {
    let count = 0;
    const dla = environment.get(DirectionalLightsAttribute.Type) as DirectionalLightsAttribute;
    if (dla != null) count += dla.lights.length;
    const pla = environment.get(PointLightsAttribute.Type) as PointLightsAttribute;
    if (pla != null) count += pla.lights.length;
    const sla = environment.get(SpotLightsAttribute.Type) as SpotLightsAttribute;
    if (sla != null) count += sla.lights.length;
    return count;
  }
}
