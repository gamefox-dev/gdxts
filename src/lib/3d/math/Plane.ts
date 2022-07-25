import { Vector3 } from '../../Vector3';

export enum PlaneSide {
  OnPlane,
  Back,
  Front
}
export class Plane {
  public normal = new Vector3();
  public d = 0;

  constructor(normal: Vector3 = null, d: number = 0) {
    if (normal !== null) {
      this.normal.setFrom(normal).normalize();
      this.d = d;
    }
  }

  public set(point1: Vector3, point2: Vector3, point3: Vector3) {
    this.normal
      .set(point1.x, point1.y, point1.z)
      .sub(point2)
      .cross(new Vector3(point2.x - point3.x, point2.y - point3.y, point2.z - point3.z))
      .normalize();
    this.d = -point1.dot(this.normal);
  }

  public setByValue(pointX: number, pointY: number, pointZ: number, norX: number, norY: number, norZ: number) {
    this.normal.set(norX, norY, norZ);
    this.d = -(pointX * norX + pointY * norY + pointZ * norZ);
  }

  public distance(point: Vector3): number {
    return this.normal.dot(point) + this.d;
  }

  public testPoint(x: number, y: number, z: number): PlaneSide {
    const dist = this.normal.dotWithValue(x, y, z) + this.d;

    if (dist == 0) return PlaneSide.OnPlane;
    else if (dist < 0) return PlaneSide.Back;
    else return PlaneSide.Front;
  }

  public isFrontFacing(direction: Vector3): boolean {
    const dot = this.normal.dot(direction);
    return dot <= 0;
  }

  public getNormal(): Vector3 {
    return this.normal;
  }

  public getD(): number {
    return this.d;
  }

  public setFromPlane(plane: Plane) {
    this.normal.setFrom(plane.normal);
    this.d = plane.d;
  }

  public toString(): string {
    return this.normal.toString() + ', ' + this.d;
  }
}
