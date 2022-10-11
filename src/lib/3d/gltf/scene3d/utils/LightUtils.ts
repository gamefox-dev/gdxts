import { DirectionalLightsAttribute, PointLightsAttribute, SpotLightsAttribute } from '../../../attributes';
import { BaseLight, DirectionalLight, Environment, PointLight, SpotLight } from '../../../environment';

export class LightsInfo {
  public dirLights = 0;
  public pointLights = 0;
  public spotLights = 0;
  public miscLights = 0;

  public reset() {
    this.dirLights = 0;
    this.pointLights = 0;
    this.spotLights = 0;
    this.miscLights = 0;
  }
}

export class LightUtils {
  public static getLightsInfoFromEnvironment(info: LightsInfo, environment: Environment): LightsInfo {
    info.reset();
    const dla = environment.get(DirectionalLightsAttribute.Type) as DirectionalLightsAttribute;
    if (dla != null) info.dirLights = dla.lights.length;
    const pla = environment.get(PointLightsAttribute.Type) as PointLightsAttribute;
    if (pla != null) info.pointLights = pla.lights.length;
    const sla = environment.get(SpotLightsAttribute.Type) as SpotLightsAttribute;
    if (sla != null) info.spotLights = sla.lights.length;
    return info;
  }

  public static getLightsInfo(info: LightsInfo, lights: BaseLight[]): LightsInfo {
    info.reset();
    for (const light of lights) {
      if (light instanceof DirectionalLight) {
        info.dirLights++;
      } else if (light instanceof PointLight) {
        info.pointLights++;
      } else if (light instanceof SpotLight) {
        info.spotLights++;
      } else {
        info.miscLights++;
      }
    }
    return info;
  }
}
