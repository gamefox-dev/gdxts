import { DirectionalLightsAttribute, PointLightsAttribute, SpotLightsAttribute } from '../../../attributes';
import { Environment } from '../../../environment';

export class EnvironmentUtil {
  public static getLightCount(environment: Environment): number {
    let count = 0;
    const dla = environment.get(DirectionalLightsAttribute.Type) as DirectionalLightsAttribute;
    if (!!dla) count += dla.lights.length;
    const pla = environment.get(PointLightsAttribute.Type) as PointLightsAttribute;
    if (!!pla) count += pla.lights.length;
    const sla = environment.get(SpotLightsAttribute.Type) as SpotLightsAttribute;
    if (!!sla) count += sla.lights.length;
    return count;
  }
}
