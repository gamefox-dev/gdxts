import { Matrix3 } from './Matrix3';
import { Matrix4 } from './Matrix4';

export class Vector3 {
  x = 0;
  y = 0;
  z = 0;

  public static X = new Vector3(1, 0, 0);
  public static Y = new Vector3(0, 1, 0);
  public static Z = new Vector3(0, 0, 1);
  public static Zero = new Vector3(0, 0, 0);
  static tmpMat = new Matrix4();

  constructor(x: number = 0, y: number = 0, z: number = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  isZero() {
    return this.x === 0 && this.y === 0 && this.z === 0;
  }

  dst2(point: Vector3): number {
    const a = point.x - this.x;
    const b = point.y - this.y;
    const c = point.z - this.z;
    return a * a + b * b + c * c;
  }

  setFrom(v: Vector3): Vector3 {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }

  set(x: number, y: number, z: number): Vector3 {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  add(v: Vector3): Vector3 {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }

  sub(v: Vector3): Vector3 {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    return this;
  }

  scale(s: number): Vector3 {
    this.x *= s;
    this.y *= s;
    this.z *= s;
    return this;
  }

  normalize(): Vector3 {
    let len = this.length();
    if (len === 0) return this;
    len = 1 / len;
    this.x *= len;
    this.y *= len;
    this.z *= len;
    return this;
  }

  cross(v: Vector3): Vector3 {
    return this.set(this.y * v.z - this.z * v.y, this.z * v.x - this.x * v.z, this.x * v.y - this.y * v.x);
  }

  multiply(matrix: Matrix4): Vector3 {
    let l_mat = matrix.values;
    return this.set(
      this.x * l_mat[Matrix4.M00] + this.y * l_mat[Matrix4.M01] + this.z * l_mat[Matrix4.M02] + l_mat[Matrix4.M03],
      this.x * l_mat[Matrix4.M10] + this.y * l_mat[Matrix4.M11] + this.z * l_mat[Matrix4.M12] + l_mat[Matrix4.M13],
      this.x * l_mat[Matrix4.M20] + this.y * l_mat[Matrix4.M21] + this.z * l_mat[Matrix4.M22] + l_mat[Matrix4.M23]
    );
  }

  multiplyMat3(matrix: Matrix3): Vector3 {
    const l_mat = matrix.val;
    return this.set(
      this.x * l_mat[Matrix3.M00] + this.y * l_mat[Matrix3.M01] + this.z * l_mat[Matrix3.M02],
      this.x * l_mat[Matrix3.M10] + this.y * l_mat[Matrix3.M11] + this.z * l_mat[Matrix3.M12],
      this.x * l_mat[Matrix3.M20] + this.y * l_mat[Matrix3.M21] + this.z * l_mat[Matrix3.M22]
    );
  }

  multiplyMat4(matrix: Matrix4): Vector3 {
    const l_mat = matrix.values;
    return this.set(
      this.x * l_mat[Matrix4.M00] + this.y * l_mat[Matrix4.M01] + this.z * l_mat[Matrix4.M02] + l_mat[Matrix4.M03],
      this.x * l_mat[Matrix4.M10] + this.y * l_mat[Matrix4.M11] + this.z * l_mat[Matrix4.M12] + l_mat[Matrix4.M13],
      this.x * l_mat[Matrix4.M20] + this.y * l_mat[Matrix4.M21] + this.z * l_mat[Matrix4.M22] + l_mat[Matrix4.M23]
    );
  }

  public mulAdd(vec: Vector3, scalar: number): Vector3 {
    this.x += vec.x * scalar;
    this.y += vec.y * scalar;
    this.z += vec.z * scalar;
    return this;
  }

  project(matrix: Matrix4): Vector3 {
    let l_mat = matrix.values;
    let l_w =
      1 /
      (this.x * l_mat[Matrix4.M30] + this.y * l_mat[Matrix4.M31] + this.z * l_mat[Matrix4.M32] + l_mat[Matrix4.M33]);
    return this.set(
      (this.x * l_mat[Matrix4.M00] + this.y * l_mat[Matrix4.M01] + this.z * l_mat[Matrix4.M02] + l_mat[Matrix4.M03]) *
        l_w,
      (this.x * l_mat[Matrix4.M10] + this.y * l_mat[Matrix4.M11] + this.z * l_mat[Matrix4.M12] + l_mat[Matrix4.M13]) *
        l_w,
      (this.x * l_mat[Matrix4.M20] + this.y * l_mat[Matrix4.M21] + this.z * l_mat[Matrix4.M22] + l_mat[Matrix4.M23]) *
        l_w
    );
  }

  unproject(
    output: Vector3,
    invMatrix: Matrix4,
    viewX: number,
    viewY: number,
    viewWidth: number,
    viewHeight: number
  ): Vector3 {
    let { x, y, z } = this;
    x = x - viewX;
    y = viewHeight - y - 1;
    y = y - viewY;
    output.set((2 * x) / viewWidth - 1, (2 * y) / viewHeight - 1, 2 * z - 1);
    output.project(invMatrix);
    return output;
  }

  dot(v: Vector3): number {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  dotWithValue(x: number, y: number, z: number) {
    return this.x * x + this.y * y + this.z * z;
  }

  rotate(axis: Vector3, degrees: number) {
    Vector3.tmpMat.setToRotation(axis, degrees);
    return this.multiply(Vector3.tmpMat);
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  length2(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  distance(v: Vector3): number {
    let a = v.x - this.x;
    let b = v.y - this.y;
    let c = v.z - this.z;
    return Math.sqrt(a * a + b * b + c * c);
  }

  lerp(target: Vector3, alpha: number) {
    this.x += alpha * (target.x - this.x);
    this.y += alpha * (target.y - this.y);
    this.z += alpha * (target.z - this.z);
    return this;
  }

  equals(other: Vector3): boolean {
    if (this === other) return true;
    return this.x === other.x && this.y === other.y && this.z === other.z;
  }

  rot(matrix: Matrix4): Vector3 {
    return this.set(
      this.x * matrix.values[Matrix4.M00] + this.y * matrix.values[Matrix4.M01] + this.z * matrix.values[Matrix4.M02],
      this.x * matrix.values[Matrix4.M10] + this.y * matrix.values[Matrix4.M11] + this.z * matrix.values[Matrix4.M12],
      this.x * matrix.values[Matrix4.M20] + this.y * matrix.values[Matrix4.M21] + this.z * matrix.values[Matrix4.M22]
    );
  }

  unrotate(matrix: Matrix4) {
    return this.set(
      this.x * matrix.values[Matrix4.M00] + this.y * matrix.values[Matrix4.M10] + this.z * matrix.values[Matrix4.M20],
      this.x * matrix.values[Matrix4.M01] + this.y * matrix.values[Matrix4.M11] + this.z * matrix.values[Matrix4.M21],
      this.x * matrix.values[Matrix4.M02] + this.y * matrix.values[Matrix4.M12] + this.z * matrix.values[Matrix4.M22]
    );
  }
}
