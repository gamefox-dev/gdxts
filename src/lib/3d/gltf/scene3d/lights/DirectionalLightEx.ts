import { Color } from '../../../../Utils';
import { Vector3 } from '../../../../Vector3';
import { DirectionalLight } from '../../../environment/DirectionalLight';

export class DirectionalLightEx extends DirectionalLight {
  /** base color clamped */
  public baseColor = Color.WHITE;

  /** light intensity in lux (lm/m2) */
  public intensity = 1;

  public setFrom(copyFrom: DirectionalLight): DirectionalLight {
    if (copyFrom instanceof DirectionalLightEx) {
      return this.setWithInstensity(
        (copyFrom as DirectionalLightEx).baseColor,
        copyFrom.direction,
        (copyFrom as DirectionalLightEx).intensity
      );
    } else {
      return this.setWithInstensity(copyFrom.color, copyFrom.direction, 1);
    }
  }

  public setWithInstensity(baseColor: Color, direction: Vector3, intensity: number): DirectionalLightEx {
    this.intensity = intensity;
    this.baseColor.setFromColor(baseColor);
    this.direction.setFrom(direction);
    this.updateColor();
    return this;
  }

  public setFromValues(r: number, g: number, b: number, dirX: number, dirY: number, dirZ: number): DirectionalLightEx {
    this.baseColor.set(r, g, b, 1).clamp();
    this.direction.set(dirX, dirY, dirZ).normalize();
    return this;
  }

  public updateColor() {
    this.color.r = this.baseColor.r * this.intensity;
    this.color.g = this.baseColor.g * this.intensity;
    this.color.b = this.baseColor.b * this.intensity;
  }

  public equals(other: DirectionalLightEx): boolean {
    return (
      !!other &&
      (other === this ||
        (this.baseColor.equals(other.baseColor) &&
          this.intensity === other.intensity &&
          this.direction.equals(other.direction)))
    );
  }
}
