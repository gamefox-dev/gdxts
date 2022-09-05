import { Color, MathUtils } from '../../Utils';
import { Vector3 } from '../../Vector3';
import { BaseLight } from './BaseLight';

export class SpotLight extends BaseLight {
  public position = new Vector3();
  public direction = new Vector3();
  public intensity: number;
  public cutoffAngle: number;
  public exponent: number;

  public setPosition(positionX: number, positionY: number, positionZ: number): SpotLight {
    this.position.set(positionX, positionY, positionZ);
    return this;
  }

  public setDirection(directionX: number, directionY: number, directionZ: number): SpotLight {
    this.direction.set(directionX, directionY, directionZ);
    return this;
  }

  public setIntensity(intensity: number): SpotLight {
    this.intensity = intensity;
    return this;
  }

  public setCutoffAngle(cutoffAngle: number): SpotLight {
    this.cutoffAngle = cutoffAngle;
    return this;
  }

  public setExponent(exponent: number): SpotLight {
    this.exponent = exponent;
    return this;
  }

  public set(
    color: Color,
    position: Vector3,
    direction: Vector3,
    intensity: number,
    cutoffAngle: number,
    exponent: number
  ): SpotLight {
    if (!!color) this.color.setFromColor(color);
    if (!!position) this.position.setFrom(position);
    if (!!direction) this.direction.setFrom(direction).normalize();
    this.intensity = intensity;
    this.cutoffAngle = cutoffAngle;
    this.exponent = exponent;
    return this;
  }

  public setFromValue(
    r: number,
    g: number,
    b: number,
    posX: number,
    posY: number,
    posZ: number,
    dirX: number,
    dirY: number,
    dirZ: number,
    intensity: number,
    cutoffAngle: number,
    exponent
  ): SpotLight {
    this.color.set(r, g, b, 1);
    this.position.set(posX, posY, posZ);
    this.direction.set(dirX, dirY, dirZ).normalize();
    this.intensity = intensity;
    this.cutoffAngle = cutoffAngle;
    this.exponent = exponent;
    return this;
  }

  public setFrom(copyFrom: SpotLight): SpotLight {
    return this.set(
      copyFrom.color,
      copyFrom.position,
      copyFrom.direction,
      copyFrom.intensity,
      copyFrom.cutoffAngle,
      copyFrom.exponent
    );
  }

  public setTarget(target: Vector3): SpotLight {
    this.direction.set(target.x, target.y, target.z).sub(this.position).normalize();
    return this;
  }

  public equals(other: SpotLight): boolean {
    return (
      !!other &&
      (other === this ||
        (this.color.equals(other.color) &&
          this.position.equals(other.position) &&
          this.direction.equals(other.direction) &&
          MathUtils.isEqual(this.intensity, other.intensity) &&
          MathUtils.isEqual(this.cutoffAngle, other.cutoffAngle) &&
          MathUtils.isEqual(this.exponent, other.exponent)))
    );
  }
}
