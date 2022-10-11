import { Color, MathUtils } from '../../../../Utils';
import { Vector3 } from '../../../../Vector3';
import { SpotLight } from '../../../environment/SpotLight';

export class SpotLightEx extends SpotLight {
  public range: number;

  public setFrom(copyFrom: SpotLight): SpotLight {
    if (copyFrom instanceof SpotLightEx) {
      const s = (copyFrom as SpotLightEx).range;
      return this.setWithRange(
        copyFrom.color,
        copyFrom.position,
        copyFrom.direction,
        copyFrom.intensity,
        copyFrom.cutoffAngle,
        copyFrom.exponent,
        (copyFrom as SpotLightEx).range
      );
    } else {
      return this.set(
        copyFrom.color,
        copyFrom.position,
        copyFrom.direction,
        copyFrom.intensity,
        copyFrom.cutoffAngle,
        copyFrom.exponent
      );
    }
  }

  public setWithRange(
    color: Color,
    position: Vector3,
    direction: Vector3,
    intensity: number,
    cutoffAngle: number,
    exponent: number,
    range: number
  ): SpotLightEx {
    super.set(color, position, direction, intensity, cutoffAngle, exponent);
    this.range = range;
    return this;
  }

  public setRad(
    color: Color,
    position: Vector3,
    direction: Vector3,
    intensity: number,
    outerConeAngleRad: number,
    innerConeAngleRad: number,
    range: number
  ): SpotLightEx {
    if (!!color) this.color.setFromColor(color);
    if (!!position) this.position.setFrom(position);
    if (!!direction) this.direction.setFrom(direction).normalize();
    this.intensity = intensity;
    this.setConeRad(outerConeAngleRad, innerConeAngleRad);
    this.range = range;
    return this;
  }

  public setDeg(
    color: Color,
    position: Vector3,
    direction: Vector3,
    intensity: number,
    outerConeAngleDeg: number,
    innerConeAngleDeg: number,
    range: number
  ): SpotLightEx {
    return this.setRad(
      color,
      position,
      direction,
      intensity,
      outerConeAngleDeg * MathUtils.degreesToRadians,
      innerConeAngleDeg * MathUtils.degreesToRadians,
      range
    );
  }

  public setConeRad(outerConeAngleRad: number, innerConeAngleRad: number): SpotLightEx {
    // from https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_lights_punctual/README.md#inner-and-outer-cone-angles
    const cosOuterAngle = Math.cos(outerConeAngleRad);
    const cosInnerAngle = Math.cos(innerConeAngleRad);
    const lightAngleScale = 1 / Math.max(0.001, cosInnerAngle - cosOuterAngle);
    const lightAngleOffset = -cosOuterAngle * lightAngleScale;

    // XXX we hack libgdx cutoffAngle and exponent variables to store cached scale/offset values.
    // it's not an issue since libgdx default shader doesn't implement spot lights.

    this.cutoffAngle = lightAngleOffset;
    this.exponent = lightAngleScale;

    return this;
  }

  public setConeDeg(outerConeAngleDeg: number, innerConeAngleDeg: number): SpotLightEx {
    return this.setConeRad(
      outerConeAngleDeg * MathUtils.degreesToRadians,
      innerConeAngleDeg * MathUtils.degreesToRadians
    );
  }
}
