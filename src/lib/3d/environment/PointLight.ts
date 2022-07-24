import { Color } from '../../Utils';
import { Vector3 } from '../../Vector3';
import { BaseLight } from './BaseLight';

export class PointLight extends BaseLight {
  public position = new Vector3();
  public intensity: number;

  public setPosition(positionX: number, positionY: number, positionZ: number): PointLight {
    this.position.set(positionX, positionY, positionZ);
    return this;
  }

  public setIntensity(intensity: number): PointLight {
    this.intensity = intensity;
    return this;
  }

  public setFrom(copyFrom: PointLight): PointLight {
    return this.set(copyFrom.color, copyFrom.position, copyFrom.intensity);
  }

  public set(color: Color, position: Vector3, intensity: number): PointLight {
    if (color != null) this.color.setFromColor(color);
    if (position != null) this.position.setFrom(position);
    this.intensity = intensity;
    return this;
  }

  public setFromValue(r: number, g: number, b: number, x: number, y: number, z: number, intensity: number): PointLight {
    this.color.set(r, g, b, 1);
    this.position.set(x, y, z);
    this.intensity = intensity;
    return this;
  }

  public equals(other: PointLight): boolean {
    return (
      other !== null &&
      (other === this ||
        (this.color.equals(other.color) && this.position.equals(other.position) && this.intensity === other.intensity))
    );
  }
}
