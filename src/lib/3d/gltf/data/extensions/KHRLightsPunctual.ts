import { Color } from '../../../../Utils';
import { BaseLight } from '../../../environment/BaseLight';
import { GLTFTypes } from '../../loaders/shared/GLTFTypes';
import { DirectionalLightEx } from '../../scene3d/lights/DirectionalLightEx';
import { PointLightEx } from '../../scene3d/lights/PointLightEx';
import { SpotLightEx } from '../../scene3d/lights/SpotlightEx';
import { GLTFObject } from '../GLTFObject';

export class GLTFSpotLight {
  public innerConeAngle = 0;
  public outerConeAngle = Math.PI / 4;
}

export class GLTFLight extends GLTFObject {
  public static TYPE_DIRECTIONAL = 'directional';
  public static TYPE_POINT = 'point';
  public static TYPE_SPOT = 'spot';

  public name = '';
  public color: number[] = [1, 1, 1];

  /**
   * in Candela for point/spot lights : Ev(lx) = Iv(cd) / (d(m))2
   * in Lux for directional lights : Ev(lx)
   */
  public intensity = 1;
  public type: string;

  /**
   * Hint defining a distance cutoff at which the light's intensity may be considered to have reached zero.
   * When null, range is assumed to be infinite.
   */
  public range: number;

  public spot: GLTFSpotLight;
}

export class GLTFLights {
  public lights: GLTFLight[];
}

export class GLTFLightNode {
  public light: number;
}

export abstract class KHRLightsPunctual {
  public static EXT = 'KHR_lights_punctual';

  public static map(light: GLTFLight): BaseLight {
    if (GLTFLight.TYPE_DIRECTIONAL === light.type) {
      const dl = new DirectionalLightEx();
      dl.baseColor.setFromColor(GLTFTypes.mapColor(light.color, Color.WHITE));
      dl.intensity = light.intensity;
      return dl;
    } else if (GLTFLight.TYPE_POINT === light.type) {
      const pl = new PointLightEx();
      pl.color.setFromColor(GLTFTypes.mapColor(light.color, Color.WHITE));
      // Blender exported intensity is the raw value in Watts
      // GLTF spec. states it's in Candela which is lumens per square radian (lm/sr).
      // adjustement is made empirically here (comparing with Blender rendering)
      // TODO find if it's a GLTF Blender exporter issue and find the right conversion.
      pl.intensity = light.intensity / 10;
      pl.range = light.range;
      return pl;
    } else if (GLTFLight.TYPE_SPOT === light.type) {
      const sl = new SpotLightEx();
      if (!light.spot) throw new Error('spot property required for spot light type');
      sl.color.setFromColor(GLTFTypes.mapColor(light.color, Color.WHITE));

      // same hack as point lights (see point light above)
      sl.intensity = light.intensity / 10;
      sl.range = light.range;

      sl.setConeRad(light.spot.outerConeAngle, light.spot.innerConeAngle);

      return sl;
    } else {
      throw new Error('unsupported light type ' + light.type);
    }
  }
}
