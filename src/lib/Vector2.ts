import { Matrix3 } from "./3d/Matrix3";

export class Vector2 {
  x = 0;
  y = 0;
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  getX(): number {
    return this.x;
  }
  getY(): number {
    return this.y;
  }
  set(x: number, y: number): Vector2 {
    this.x = x;
    this.y = y;
    return this;
  }
  setVector(v: Vector2): Vector2 {
    return this.set(v.x, v.y);
  }
  add(x: number, y: number): Vector2 {
    this.x += x;
    this.y += y;
    return this;
  }
  addVector(v: Vector2): Vector2 {
    return this.add(v.x, v.y);
  }
  sub(x: number, y: number): Vector2 {
    return this.add(-x, -y);
  }
  subVector(v: Vector2): Vector2 {
    return this.sub(v.x, v.y);
  }
  scale(scalar: number): Vector2 {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }
  dot(v: Vector2): number {
    return this.x * v.x + this.y * v.y;
  }
  distanceSqr(v: Vector2): number {
    const deltaX = this.x - v.x;
    const deltaY = this.y - v.y;
    return deltaX * deltaX + deltaY * deltaY;
  }
  distance(v: Vector2): number {
    return Math.sqrt(this.distanceSqr(v));
  }
  angle(): number {
    return Math.atan2(this.y, this.x);
  }
  len2(): number {
    return this.x * this.x + this.y * this.y;
  }
  len(): number {
    return Math.sqrt(this.len2());
  }
  nor(): Vector2 {
    const len = this.len();
    if (len !== 0) {
      this.x /= len;
      this.y /= len;
    }
    return this;
  }
  rotateRad(rad: number): Vector2 {
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const newX = this.x * cos - this.y * sin;
    const newY = this.x * sin + this.y * cos;

    this.x = newX;
    this.y = newY;

    return this;
  }
  rotate(degrees: number): Vector2 {
    return this.rotateRad((degrees * Math.PI) / 180);
  }
  cpy() {
    return new Vector2(this.x, this.y);
  }
  mul(mat: Matrix3) {
    const x = this.x * mat.val[0] + this.y * mat.val[3] + mat.val[6];
    const y = this.x * mat.val[1] + this.y * mat.val[4] + mat.val[7];
    this.x = x;
    this.y = y;
    return this;
  }
}
