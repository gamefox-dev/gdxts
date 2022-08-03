import { Quaternion } from './Quaternion';
import { MathUtils } from './Utils';
import { Vector3 } from './Vector3';

export const M00 = 0;
export const M01 = 4;
export const M02 = 8;
export const M03 = 12;
export const M10 = 1;
export const M11 = 5;
export const M12 = 9;
export const M13 = 13;
export const M20 = 2;
export const M21 = 6;
export const M22 = 10;
export const M23 = 14;
export const M30 = 3;
export const M31 = 7;
export const M32 = 11;
export const M33 = 15;

export class Matrix4 {
  temp: Float32Array = new Float32Array(16);
  values: Float32Array = new Float32Array(16);

  public static M00 = 0;
  public static M01 = 4;
  public static M02 = 8;
  public static M03 = 12;
  public static M10 = 1;
  public static M11 = 5;
  public static M12 = 9;
  public static M13 = 13;
  public static M20 = 2;
  public static M21 = 6;
  public static M22 = 10;
  public static M23 = 14;
  public static M30 = 3;
  public static M31 = 7;
  public static M32 = 11;
  public static M33 = 15;

  private static xAxis: Vector3 = null;
  private static yAxis: Vector3 = null;
  private static zAxis: Vector3 = null;
  private static tempVec: Vector3 = null;
  private static tmpMatrix = new Matrix4();
  private static quat = new Quaternion();

  constructor() {
    let v = this.values;
    v[M00] = 1;
    v[M11] = 1;
    v[M22] = 1;
    v[M33] = 1;
  }

  set(values: ArrayLike<number>): Matrix4 {
    this.values.set(values);
    return this;
  }

  setFromQuaternion(quaternion: Quaternion): Matrix4 {
    const xs = quaternion.x * 2,
      ys = quaternion.y * 2,
      zs = quaternion.z * 2;
    const wx = quaternion.w * xs,
      wy = quaternion.w * ys,
      wz = quaternion.w * zs;
    const xx = quaternion.x * xs,
      xy = quaternion.x * ys,
      xz = quaternion.x * zs;
    const yy = quaternion.y * ys,
      yz = quaternion.y * zs,
      zz = quaternion.z * zs;

    const val = this.values;
    val[M00] = 1 - (yy + zz);
    val[M01] = xy - wz;
    val[M02] = xz + wy;
    val[M03] = 0;

    val[M10] = xy + wz;
    val[M11] = 1 - (xx + zz);
    val[M12] = yz - wx;
    val[M13] = 0;

    val[M20] = xz - wy;
    val[M21] = yz + wx;
    val[M22] = 1 - (xx + yy);
    val[M23] = 0;

    val[M30] = 0;
    val[M31] = 0;
    val[M32] = 0;
    val[M33] = 1;
    return this;
  }

  setFromTranslationRotation(position: Vector3, orientation: Quaternion, scale: Vector3) {
    const xs = orientation.x * 2,
      ys = orientation.y * 2,
      zs = orientation.z * 2;
    const wx = orientation.w * xs,
      wy = orientation.w * ys,
      wz = orientation.w * zs;
    const xx = orientation.x * xs,
      xy = orientation.x * ys,
      xz = orientation.x * zs;
    const yy = orientation.y * ys,
      yz = orientation.y * zs,
      zz = orientation.z * zs;

    let val = this.values;
    val[M00] = scale.x * (1.0 - (yy + zz));
    val[M01] = scale.y * (xy - wz);
    val[M02] = scale.z * (xz + wy);
    val[M03] = position.x;

    val[M10] = scale.x * (xy + wz);
    val[M11] = scale.y * (1.0 - (xx + zz));
    val[M12] = scale.z * (yz - wx);
    val[M13] = position.y;

    val[M20] = scale.x * (xz - wy);
    val[M21] = scale.y * (yz + wx);
    val[M22] = scale.z * (1.0 - (xx + yy));
    val[M23] = position.z;

    val[M30] = 0;
    val[M31] = 0;
    val[M32] = 0;
    val[M33] = 1;
    return this;
  }

  transpose(): Matrix4 {
    let t = this.temp;
    let v = this.values;
    t[M00] = v[M00];
    t[M01] = v[M10];
    t[M02] = v[M20];
    t[M03] = v[M30];
    t[M10] = v[M01];
    t[M11] = v[M11];
    t[M12] = v[M21];
    t[M13] = v[M31];
    t[M20] = v[M02];
    t[M21] = v[M12];
    t[M22] = v[M22];
    t[M23] = v[M32];
    t[M30] = v[M03];
    t[M31] = v[M13];
    t[M32] = v[M23];
    t[M33] = v[M33];
    return this.set(t);
  }

  identity(): Matrix4 {
    let v = this.values;
    v[M00] = 1;
    v[M01] = 0;
    v[M02] = 0;
    v[M03] = 0;
    v[M10] = 0;
    v[M11] = 1;
    v[M12] = 0;
    v[M13] = 0;
    v[M20] = 0;
    v[M21] = 0;
    v[M22] = 1;
    v[M23] = 0;
    v[M30] = 0;
    v[M31] = 0;
    v[M32] = 0;
    v[M33] = 1;
    return this;
  }

  invert(): Matrix4 {
    let v = this.values;
    let t = this.temp;
    let l_det =
      v[M30] * v[M21] * v[M12] * v[M03] -
      v[M20] * v[M31] * v[M12] * v[M03] -
      v[M30] * v[M11] * v[M22] * v[M03] +
      v[M10] * v[M31] * v[M22] * v[M03] +
      v[M20] * v[M11] * v[M32] * v[M03] -
      v[M10] * v[M21] * v[M32] * v[M03] -
      v[M30] * v[M21] * v[M02] * v[M13] +
      v[M20] * v[M31] * v[M02] * v[M13] +
      v[M30] * v[M01] * v[M22] * v[M13] -
      v[M00] * v[M31] * v[M22] * v[M13] -
      v[M20] * v[M01] * v[M32] * v[M13] +
      v[M00] * v[M21] * v[M32] * v[M13] +
      v[M30] * v[M11] * v[M02] * v[M23] -
      v[M10] * v[M31] * v[M02] * v[M23] -
      v[M30] * v[M01] * v[M12] * v[M23] +
      v[M00] * v[M31] * v[M12] * v[M23] +
      v[M10] * v[M01] * v[M32] * v[M23] -
      v[M00] * v[M11] * v[M32] * v[M23] -
      v[M20] * v[M11] * v[M02] * v[M33] +
      v[M10] * v[M21] * v[M02] * v[M33] +
      v[M20] * v[M01] * v[M12] * v[M33] -
      v[M00] * v[M21] * v[M12] * v[M33] -
      v[M10] * v[M01] * v[M22] * v[M33] +
      v[M00] * v[M11] * v[M22] * v[M33];
    if (l_det === 0) throw new Error('non-invertible matrix');
    let inv_det = 1.0 / l_det;
    t[M00] =
      v[M12] * v[M23] * v[M31] -
      v[M13] * v[M22] * v[M31] +
      v[M13] * v[M21] * v[M32] -
      v[M11] * v[M23] * v[M32] -
      v[M12] * v[M21] * v[M33] +
      v[M11] * v[M22] * v[M33];
    t[M01] =
      v[M03] * v[M22] * v[M31] -
      v[M02] * v[M23] * v[M31] -
      v[M03] * v[M21] * v[M32] +
      v[M01] * v[M23] * v[M32] +
      v[M02] * v[M21] * v[M33] -
      v[M01] * v[M22] * v[M33];
    t[M02] =
      v[M02] * v[M13] * v[M31] -
      v[M03] * v[M12] * v[M31] +
      v[M03] * v[M11] * v[M32] -
      v[M01] * v[M13] * v[M32] -
      v[M02] * v[M11] * v[M33] +
      v[M01] * v[M12] * v[M33];
    t[M03] =
      v[M03] * v[M12] * v[M21] -
      v[M02] * v[M13] * v[M21] -
      v[M03] * v[M11] * v[M22] +
      v[M01] * v[M13] * v[M22] +
      v[M02] * v[M11] * v[M23] -
      v[M01] * v[M12] * v[M23];
    t[M10] =
      v[M13] * v[M22] * v[M30] -
      v[M12] * v[M23] * v[M30] -
      v[M13] * v[M20] * v[M32] +
      v[M10] * v[M23] * v[M32] +
      v[M12] * v[M20] * v[M33] -
      v[M10] * v[M22] * v[M33];
    t[M11] =
      v[M02] * v[M23] * v[M30] -
      v[M03] * v[M22] * v[M30] +
      v[M03] * v[M20] * v[M32] -
      v[M00] * v[M23] * v[M32] -
      v[M02] * v[M20] * v[M33] +
      v[M00] * v[M22] * v[M33];
    t[M12] =
      v[M03] * v[M12] * v[M30] -
      v[M02] * v[M13] * v[M30] -
      v[M03] * v[M10] * v[M32] +
      v[M00] * v[M13] * v[M32] +
      v[M02] * v[M10] * v[M33] -
      v[M00] * v[M12] * v[M33];
    t[M13] =
      v[M02] * v[M13] * v[M20] -
      v[M03] * v[M12] * v[M20] +
      v[M03] * v[M10] * v[M22] -
      v[M00] * v[M13] * v[M22] -
      v[M02] * v[M10] * v[M23] +
      v[M00] * v[M12] * v[M23];
    t[M20] =
      v[M11] * v[M23] * v[M30] -
      v[M13] * v[M21] * v[M30] +
      v[M13] * v[M20] * v[M31] -
      v[M10] * v[M23] * v[M31] -
      v[M11] * v[M20] * v[M33] +
      v[M10] * v[M21] * v[M33];
    t[M21] =
      v[M03] * v[M21] * v[M30] -
      v[M01] * v[M23] * v[M30] -
      v[M03] * v[M20] * v[M31] +
      v[M00] * v[M23] * v[M31] +
      v[M01] * v[M20] * v[M33] -
      v[M00] * v[M21] * v[M33];
    t[M22] =
      v[M01] * v[M13] * v[M30] -
      v[M03] * v[M11] * v[M30] +
      v[M03] * v[M10] * v[M31] -
      v[M00] * v[M13] * v[M31] -
      v[M01] * v[M10] * v[M33] +
      v[M00] * v[M11] * v[M33];
    t[M23] =
      v[M03] * v[M11] * v[M20] -
      v[M01] * v[M13] * v[M20] -
      v[M03] * v[M10] * v[M21] +
      v[M00] * v[M13] * v[M21] +
      v[M01] * v[M10] * v[M23] -
      v[M00] * v[M11] * v[M23];
    t[M30] =
      v[M12] * v[M21] * v[M30] -
      v[M11] * v[M22] * v[M30] -
      v[M12] * v[M20] * v[M31] +
      v[M10] * v[M22] * v[M31] +
      v[M11] * v[M20] * v[M32] -
      v[M10] * v[M21] * v[M32];
    t[M31] =
      v[M01] * v[M22] * v[M30] -
      v[M02] * v[M21] * v[M30] +
      v[M02] * v[M20] * v[M31] -
      v[M00] * v[M22] * v[M31] -
      v[M01] * v[M20] * v[M32] +
      v[M00] * v[M21] * v[M32];
    t[M32] =
      v[M02] * v[M11] * v[M30] -
      v[M01] * v[M12] * v[M30] -
      v[M02] * v[M10] * v[M31] +
      v[M00] * v[M12] * v[M31] +
      v[M01] * v[M10] * v[M32] -
      v[M00] * v[M11] * v[M32];
    t[M33] =
      v[M01] * v[M12] * v[M20] -
      v[M02] * v[M11] * v[M20] +
      v[M02] * v[M10] * v[M21] -
      v[M00] * v[M12] * v[M21] -
      v[M01] * v[M10] * v[M22] +
      v[M00] * v[M11] * v[M22];
    v[M00] = t[M00] * inv_det;
    v[M01] = t[M01] * inv_det;
    v[M02] = t[M02] * inv_det;
    v[M03] = t[M03] * inv_det;
    v[M10] = t[M10] * inv_det;
    v[M11] = t[M11] * inv_det;
    v[M12] = t[M12] * inv_det;
    v[M13] = t[M13] * inv_det;
    v[M20] = t[M20] * inv_det;
    v[M21] = t[M21] * inv_det;
    v[M22] = t[M22] * inv_det;
    v[M23] = t[M23] * inv_det;
    v[M30] = t[M30] * inv_det;
    v[M31] = t[M31] * inv_det;
    v[M32] = t[M32] * inv_det;
    v[M33] = t[M33] * inv_det;
    return this;
  }

  determinant(): number {
    let v = this.values;
    return (
      v[M30] * v[M21] * v[M12] * v[M03] -
      v[M20] * v[M31] * v[M12] * v[M03] -
      v[M30] * v[M11] * v[M22] * v[M03] +
      v[M10] * v[M31] * v[M22] * v[M03] +
      v[M20] * v[M11] * v[M32] * v[M03] -
      v[M10] * v[M21] * v[M32] * v[M03] -
      v[M30] * v[M21] * v[M02] * v[M13] +
      v[M20] * v[M31] * v[M02] * v[M13] +
      v[M30] * v[M01] * v[M22] * v[M13] -
      v[M00] * v[M31] * v[M22] * v[M13] -
      v[M20] * v[M01] * v[M32] * v[M13] +
      v[M00] * v[M21] * v[M32] * v[M13] +
      v[M30] * v[M11] * v[M02] * v[M23] -
      v[M10] * v[M31] * v[M02] * v[M23] -
      v[M30] * v[M01] * v[M12] * v[M23] +
      v[M00] * v[M31] * v[M12] * v[M23] +
      v[M10] * v[M01] * v[M32] * v[M23] -
      v[M00] * v[M11] * v[M32] * v[M23] -
      v[M20] * v[M11] * v[M02] * v[M33] +
      v[M10] * v[M21] * v[M02] * v[M33] +
      v[M20] * v[M01] * v[M12] * v[M33] -
      v[M00] * v[M21] * v[M12] * v[M33] -
      v[M10] * v[M01] * v[M22] * v[M33] +
      v[M00] * v[M11] * v[M22] * v[M33]
    );
  }

  translate(x: number, y: number, z: number): Matrix4 {
    let v = this.values;
    v[M03] += x;
    v[M13] += y;
    v[M23] += z;
    return this;
  }

  setTranslation(x: number, y: number, z: number): Matrix4 {
    let v = this.values;
    v[M03] = x;
    v[M13] = y;
    v[M23] = z;
    return this;
  }

  getTranslation(position: Vector3): Vector3 {
    let v = this.values;
    position.x = v[M03];
    position.y = v[M13];
    position.z = v[M23];
    return position;
  }

  hasRotationOrScaling(): boolean {
    let val = this.values;
    return !(
      MathUtils.isEqual(val[M00], 1) &&
      MathUtils.isEqual(val[M11], 1) &&
      MathUtils.isEqual(val[M22], 1) &&
      MathUtils.isZero(val[M01]) &&
      MathUtils.isZero(val[M02]) &&
      MathUtils.isZero(val[M10]) &&
      MathUtils.isZero(val[M12]) &&
      MathUtils.isZero(val[M20]) &&
      MathUtils.isZero(val[M21])
    );
  }

  det3x3(): number {
    let val = this.values;
    return (
      val[M00] * val[M11] * val[M22] +
      val[M01] * val[M12] * val[M20] +
      val[M02] * val[M10] * val[M21] -
      val[M00] * val[M12] * val[M21] -
      val[M01] * val[M10] * val[M22] -
      val[M02] * val[M11] * val[M20]
    );
  }

  copy(): Matrix4 {
    return new Matrix4().set(this.values);
  }

  projection(near: number, far: number, fovy: number, aspectRatio: number): Matrix4 {
    this.identity();
    let l_fd = 1.0 / Math.tan((fovy * (Math.PI / 180)) / 2.0);
    let l_a1 = (far + near) / (near - far);
    let l_a2 = (2 * far * near) / (near - far);
    let v = this.values;
    v[M00] = l_fd / aspectRatio;
    v[M10] = 0;
    v[M20] = 0;
    v[M30] = 0;
    v[M01] = 0;
    v[M11] = l_fd;
    v[M21] = 0;
    v[M31] = 0;
    v[M02] = 0;
    v[M12] = 0;
    v[M22] = l_a1;
    v[M32] = -1;
    v[M03] = 0;
    v[M13] = 0;
    v[M23] = l_a2;
    v[M33] = 0;
    return this;
  }

  ortho2d(x: number, y: number, width: number, height: number): Matrix4 {
    return this.ortho(x, x + width, y, y + height, 0, 1);
  }

  ortho(left: number, right: number, bottom: number, top: number, near: number, far: number): Matrix4 {
    this.identity();
    let x_orth = 2 / (right - left);
    let y_orth = 2 / (top - bottom);
    let z_orth = -2 / (far - near);

    let tx = -(right + left) / (right - left);
    let ty = -(top + bottom) / (top - bottom);
    let tz = -(far + near) / (far - near);

    let v = this.values;
    v[M00] = x_orth;
    v[M10] = 0;
    v[M20] = 0;
    v[M30] = 0;
    v[M01] = 0;
    v[M11] = y_orth;
    v[M21] = 0;
    v[M31] = 0;
    v[M02] = 0;
    v[M12] = 0;
    v[M22] = z_orth;
    v[M32] = 0;
    v[M03] = tx;
    v[M13] = ty;
    v[M23] = tz;
    v[M33] = 1;
    return this;
  }

  multiply(matrix: Matrix4): Matrix4 {
    let t = this.temp;
    let v = this.values;
    let m = matrix.values;
    t[M00] = v[M00] * m[M00] + v[M01] * m[M10] + v[M02] * m[M20] + v[M03] * m[M30];
    t[M01] = v[M00] * m[M01] + v[M01] * m[M11] + v[M02] * m[M21] + v[M03] * m[M31];
    t[M02] = v[M00] * m[M02] + v[M01] * m[M12] + v[M02] * m[M22] + v[M03] * m[M32];
    t[M03] = v[M00] * m[M03] + v[M01] * m[M13] + v[M02] * m[M23] + v[M03] * m[M33];
    t[M10] = v[M10] * m[M00] + v[M11] * m[M10] + v[M12] * m[M20] + v[M13] * m[M30];
    t[M11] = v[M10] * m[M01] + v[M11] * m[M11] + v[M12] * m[M21] + v[M13] * m[M31];
    t[M12] = v[M10] * m[M02] + v[M11] * m[M12] + v[M12] * m[M22] + v[M13] * m[M32];
    t[M13] = v[M10] * m[M03] + v[M11] * m[M13] + v[M12] * m[M23] + v[M13] * m[M33];
    t[M20] = v[M20] * m[M00] + v[M21] * m[M10] + v[M22] * m[M20] + v[M23] * m[M30];
    t[M21] = v[M20] * m[M01] + v[M21] * m[M11] + v[M22] * m[M21] + v[M23] * m[M31];
    t[M22] = v[M20] * m[M02] + v[M21] * m[M12] + v[M22] * m[M22] + v[M23] * m[M32];
    t[M23] = v[M20] * m[M03] + v[M21] * m[M13] + v[M22] * m[M23] + v[M23] * m[M33];
    t[M30] = v[M30] * m[M00] + v[M31] * m[M10] + v[M32] * m[M20] + v[M33] * m[M30];
    t[M31] = v[M30] * m[M01] + v[M31] * m[M11] + v[M32] * m[M21] + v[M33] * m[M31];
    t[M32] = v[M30] * m[M02] + v[M31] * m[M12] + v[M32] * m[M22] + v[M33] * m[M32];
    t[M33] = v[M30] * m[M03] + v[M31] * m[M13] + v[M32] * m[M23] + v[M33] * m[M33];
    return this.set(this.temp);
  }

  multiplyLeft(matrix: Matrix4): Matrix4 {
    let t = this.temp;
    let v = this.values;
    let m = matrix.values;
    t[M00] = m[M00] * v[M00] + m[M01] * v[M10] + m[M02] * v[M20] + m[M03] * v[M30];
    t[M01] = m[M00] * v[M01] + m[M01] * v[M11] + m[M02] * v[M21] + m[M03] * v[M31];
    t[M02] = m[M00] * v[M02] + m[M01] * v[M12] + m[M02] * v[M22] + m[M03] * v[M32];
    t[M03] = m[M00] * v[M03] + m[M01] * v[M13] + m[M02] * v[M23] + m[M03] * v[M33];
    t[M10] = m[M10] * v[M00] + m[M11] * v[M10] + m[M12] * v[M20] + m[M13] * v[M30];
    t[M11] = m[M10] * v[M01] + m[M11] * v[M11] + m[M12] * v[M21] + m[M13] * v[M31];
    t[M12] = m[M10] * v[M02] + m[M11] * v[M12] + m[M12] * v[M22] + m[M13] * v[M32];
    t[M13] = m[M10] * v[M03] + m[M11] * v[M13] + m[M12] * v[M23] + m[M13] * v[M33];
    t[M20] = m[M20] * v[M00] + m[M21] * v[M10] + m[M22] * v[M20] + m[M23] * v[M30];
    t[M21] = m[M20] * v[M01] + m[M21] * v[M11] + m[M22] * v[M21] + m[M23] * v[M31];
    t[M22] = m[M20] * v[M02] + m[M21] * v[M12] + m[M22] * v[M22] + m[M23] * v[M32];
    t[M23] = m[M20] * v[M03] + m[M21] * v[M13] + m[M22] * v[M23] + m[M23] * v[M33];
    t[M30] = m[M30] * v[M00] + m[M31] * v[M10] + m[M32] * v[M20] + m[M33] * v[M30];
    t[M31] = m[M30] * v[M01] + m[M31] * v[M11] + m[M32] * v[M21] + m[M33] * v[M31];
    t[M32] = m[M30] * v[M02] + m[M31] * v[M12] + m[M32] * v[M22] + m[M33] * v[M32];
    t[M33] = m[M30] * v[M03] + m[M31] * v[M13] + m[M32] * v[M23] + m[M33] * v[M33];
    return this.set(this.temp);
  }

  public idt(): Matrix4 {
    const val = this.values;
    val[M00] = 1;
    val[M01] = 0;
    val[M02] = 0;
    val[M03] = 0;
    val[M10] = 0;
    val[M11] = 1;
    val[M12] = 0;
    val[M13] = 0;
    val[M20] = 0;
    val[M21] = 0;
    val[M22] = 1;
    val[M23] = 0;
    val[M30] = 0;
    val[M31] = 0;
    val[M32] = 0;
    val[M33] = 1;
    return this;
  }

  lookAt(position: Vector3, direction: Vector3, up: Vector3) {
    Matrix4.initTemps();
    let xAxis = Matrix4.xAxis,
      yAxis = Matrix4.yAxis,
      zAxis = Matrix4.zAxis;
    zAxis.setFrom(direction).normalize();
    xAxis.setFrom(direction).normalize();
    xAxis.cross(up).normalize();
    yAxis.setFrom(xAxis).cross(zAxis).normalize();
    this.identity();
    let val = this.values;
    val[M00] = xAxis.x;
    val[M01] = xAxis.y;
    val[M02] = xAxis.z;
    val[M10] = yAxis.x;
    val[M11] = yAxis.y;
    val[M12] = yAxis.z;
    val[M20] = -zAxis.x;
    val[M21] = -zAxis.y;
    val[M22] = -zAxis.z;

    Matrix4.tmpMatrix.identity();
    Matrix4.tmpMatrix.values[M03] = -position.x;
    Matrix4.tmpMatrix.values[M13] = -position.y;
    Matrix4.tmpMatrix.values[M23] = -position.z;
    this.multiply(Matrix4.tmpMatrix);

    return this;
  }

  setToLookAt(position: Vector3, target: Vector3, up: Vector3) {
    if (Matrix4.tempVec === null) Matrix4.tempVec = new Vector3();
    let vec = Matrix4.tempVec;
    vec.setFrom(target).sub(position);
    this.lookAt(position, Matrix4.tempVec, up);
    return this;
  }

  public rotate(rotation: Quaternion): Matrix4 {
    const x = rotation.x,
      y = rotation.y,
      z = rotation.z,
      w = rotation.w;
    const xx = x * x;
    const xy = x * y;
    const xz = x * z;
    const xw = x * w;
    const yy = y * y;
    const yz = y * z;
    const yw = y * w;
    const zz = z * z;
    const zw = z * w;
    const r00 = 1 - 2 * (yy + zz);
    const r01 = 2 * (xy - zw);
    const r02 = 2 * (xz + yw);
    const r10 = 2 * (xy + zw);
    const r11 = 1 - 2 * (xx + zz);
    const r12 = 2 * (yz - xw);
    const r20 = 2 * (xz - yw);
    const r21 = 2 * (yz + xw);
    const r22 = 1 - 2 * (xx + yy);
    const val = this.values;
    const m00 = val[M00] * r00 + val[M01] * r10 + val[M02] * r20;
    const m01 = val[M00] * r01 + val[M01] * r11 + val[M02] * r21;
    const m02 = val[M00] * r02 + val[M01] * r12 + val[M02] * r22;
    const m10 = val[M10] * r00 + val[M11] * r10 + val[M12] * r20;
    const m11 = val[M10] * r01 + val[M11] * r11 + val[M12] * r21;
    const m12 = val[M10] * r02 + val[M11] * r12 + val[M12] * r22;
    const m20 = val[M20] * r00 + val[M21] * r10 + val[M22] * r20;
    const m21 = val[M20] * r01 + val[M21] * r11 + val[M22] * r21;
    const m22 = val[M20] * r02 + val[M21] * r12 + val[M22] * r22;
    const m30 = val[M30] * r00 + val[M31] * r10 + val[M32] * r20;
    const m31 = val[M30] * r01 + val[M31] * r11 + val[M32] * r21;
    const m32 = val[M30] * r02 + val[M31] * r12 + val[M32] * r22;
    val[M00] = m00;
    val[M10] = m10;
    val[M20] = m20;
    val[M30] = m30;
    val[M01] = m01;
    val[M11] = m11;
    val[M21] = m21;
    val[M31] = m31;
    val[M02] = m02;
    val[M12] = m12;
    val[M22] = m22;
    val[M32] = m32;
    return this;
  }

  public scale(scaleX: number, scaleY: number, scaleZ: number): Matrix4 {
    const val = this.values;
    val[M00] *= scaleX;
    val[M01] *= scaleY;
    val[M02] *= scaleZ;
    val[M10] *= scaleX;
    val[M11] *= scaleY;
    val[M12] *= scaleZ;
    val[M20] *= scaleX;
    val[M21] *= scaleY;
    val[M22] *= scaleZ;
    val[M30] *= scaleX;
    val[M31] *= scaleY;
    val[M32] *= scaleZ;
    return this;
  }

  public setToRotation(axis: Vector3, degrees: number): Matrix4 {
    if (degrees === 0) {
      this.idt();
      return this;
    }
    return this.setFromQuaternion(Matrix4.quat.setFromAxis(axis.x, axis.y, axis.z, degrees));
  }

  static initTemps() {
    if (Matrix4.xAxis === null) Matrix4.xAxis = new Vector3();
    if (Matrix4.yAxis === null) Matrix4.yAxis = new Vector3();
    if (Matrix4.zAxis === null) Matrix4.zAxis = new Vector3();
  }

  static tmpArrayForVec = [];
  static matrix4_proj(mat: Float32Array, vec: number[]) {
    const inv_w = 1.0 / (vec[0] * mat[M30] + vec[1] * mat[M31] + vec[2] * mat[M32] + mat[M33]);
    const x = (vec[0] * mat[M00] + vec[1] * mat[M01] + vec[2] * mat[M02] + mat[M03]) * inv_w;
    const y = (vec[0] * mat[M10] + vec[1] * mat[M11] + vec[2] * mat[M12] + mat[M13]) * inv_w;
    const z = (vec[0] * mat[M20] + vec[1] * mat[M21] + vec[2] * mat[M22] + mat[M23]) * inv_w;
    vec[0] = x;
    vec[1] = y;
    vec[2] = z;
  }

  static prj(mat: Matrix4, vecs: number[], offset: number, numVecs: number, stride: number) {
    const vec = Matrix4.tmpArrayForVec;
    for (let i = 0; i < numVecs; i++) {
      const start = offset + i * stride;
      let idx = 0;
      vec[idx] = vecs[start + idx++];
      vec[idx] = vecs[start + idx++];
      vec[idx] = vecs[start + idx++];

      idx = 0;
      Matrix4.matrix4_proj(mat.values, vec);
      vecs[i * stride + idx] = vec[idx++];
      vecs[i * stride + idx] = vec[idx++];
      vecs[i * stride + idx] = vec[idx++];
    }
  }
}
