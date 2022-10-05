import { Color } from '../../Utils';
import { Vector3 } from '../../Vector3';
import { BaseLight } from './BaseLight';

export class DirectionalLight extends BaseLight {
  public direction: Vector3 = new Vector3();

  public setDirection(directionX: number, directionY: number, directionZ: number): DirectionalLight {
    this.direction.set(directionX, directionY, directionZ);
    return this;
  }

  public setFrom(color: Color, direction: Vector3) {
    if (!!color) this.color.set(color.r, color.g, color.b, color.a);
    if (!!direction) this.direction.setFrom(direction).normalize();
    return this;
  }

  public set(r: number, g: number, b: number, dirX: number, dirY: number, dirZ: number): DirectionalLight {
    this.color.set(r, g, b, 1);
    this.direction.set(dirX, dirY, dirZ).normalize();
    return this;
  }

  public equals(other: DirectionalLight) {
    return !!other && (other === this || (this.color.equals(other.color) && this.direction.equals(other.direction)));
  }
}
