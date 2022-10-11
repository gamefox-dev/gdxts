import { Color } from '../../../../Utils';
import { Vector3 } from '../../../../Vector3';
import { PointLight } from '../../../environment/PointLight';

export class PointLightEx extends PointLight {
  public range: number;

  public setFrom(copyFrom: PointLight): PointLight {
    if (copyFrom instanceof PointLightEx) {
      return this.setWithRange(copyFrom.color, copyFrom.position, copyFrom.intensity, (copyFrom as PointLightEx).range);
    } else {
      return this.set(copyFrom.color, copyFrom.position, copyFrom.intensity);
    }
  }

  public setWithRange(color: Color, position: Vector3, intensity: number, range: number): PointLightEx {
    super.set(color, position, intensity);
    this.range = range;
    return this;
  }
}
