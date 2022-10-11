import { Matrix4 } from '../../Matrix4';
import { Vector3 } from '../../Vector3';

export class Ray {
  public origin = new Vector3();
  public direction = new Vector3();

  constructor(origin: Vector3 = null, direction: Vector3 = null) {
    if (!!origin) {
      this.origin.setFrom(origin);
    }
    if (!!direction) {
      this.direction.setFrom(direction).normalize();
    }
  }

  public cpy(): Ray {
    return new Ray(this.origin, this.direction);
  }

  public getEndPoint(out: Vector3, distance: number): Vector3 {
    return out.setFrom(this.direction).scale(distance).add(this.origin);
  }

  static tmp = new Vector3();

  /** Multiplies the ray by the given matrix. Use this to transform a ray into another coordinate system.
   *
   * @param matrix The matrix
   * @return This ray for chaining. */
  public mul(matrix: Matrix4): Ray {
    Ray.tmp.setFrom(this.origin).add(this.direction);
    Ray.tmp.multiply(matrix);
    this.origin.multiplyMat4(matrix);
    this.direction.setFrom(Ray.tmp.sub(this.origin)).normalize();
    return this;
  }

  /** {@inheritDoc} */
  public toString(): string {
    return 'ray [' + origin + ':' + this.direction + ']';
  }

  /** Sets this ray from the given starting position and direction.
   *
   * @param x The x-component of the starting position
   * @param y The y-component of the starting position
   * @param z The z-component of the starting position
   * @param dx The x-component of the direction
   * @param dy The y-component of the direction
   * @param dz The z-component of the direction
   * @return this ray for chaining */
  public set(x: number, y: number, z: number, dx: number, dy: number, dz: number): Ray {
    this.origin.set(x, y, z);
    this.direction.set(dx, dy, dz).normalize();
    return this;
  }

  /** Sets the starting position and direction from the given ray
   *
   * @param ray The ray
   * @return This ray for chaining */
  public setFrom(ray: Ray): Ray {
    this.origin.setFrom(ray.origin);
    this.direction.setFrom(ray.direction).normalize();
    return this;
  }

  public equals(o: Ray): boolean {
    if (o === this) return true;
    if (!o || o !== this) return false;

    return this.direction.equals(o.direction) && this.origin.equals(o.origin);
  }
}
