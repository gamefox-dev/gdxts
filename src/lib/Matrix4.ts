import { Quaternion } from './Quaternion';
import { MathUtils } from './Utils';
import { Vector3 } from './Vector3';

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
    v[Matrix4.M00] = 1;
    v[Matrix4.M11] = 1;
    v[Matrix4.M22] = 1;
    v[Matrix4.M33] = 1;
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
    val[Matrix4.M00] = 1 - (yy + zz);
    val[Matrix4.M01] = xy - wz;
    val[Matrix4.M02] = xz + wy;
    val[Matrix4.M03] = 0;

    val[Matrix4.M10] = xy + wz;
    val[Matrix4.M11] = 1 - (xx + zz);
    val[Matrix4.M12] = yz - wx;
    val[Matrix4.M13] = 0;

    val[Matrix4.M20] = xz - wy;
    val[Matrix4.M21] = yz + wx;
    val[Matrix4.M22] = 1 - (xx + yy);
    val[Matrix4.M23] = 0;

    val[Matrix4.M30] = 0;
    val[Matrix4.M31] = 0;
    val[Matrix4.M32] = 0;
    val[Matrix4.M33] = 1;
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
    val[Matrix4.M00] = scale.x * (1.0 - (yy + zz));
    val[Matrix4.M01] = scale.y * (xy - wz);
    val[Matrix4.M02] = scale.z * (xz + wy);
    val[Matrix4.M03] = position.x;

    val[Matrix4.M10] = scale.x * (xy + wz);
    val[Matrix4.M11] = scale.y * (1.0 - (xx + zz));
    val[Matrix4.M12] = scale.z * (yz - wx);
    val[Matrix4.M13] = position.y;

    val[Matrix4.M20] = scale.x * (xz - wy);
    val[Matrix4.M21] = scale.y * (yz + wx);
    val[Matrix4.M22] = scale.z * (1.0 - (xx + yy));
    val[Matrix4.M23] = position.z;

    val[Matrix4.M30] = 0;
    val[Matrix4.M31] = 0;
    val[Matrix4.M32] = 0;
    val[Matrix4.M33] = 1;
    return this;
  }

  transpose(): Matrix4 {
    let t = this.temp;
    let v = this.values;
    t[Matrix4.M00] = v[Matrix4.M00];
    t[Matrix4.M01] = v[Matrix4.M10];
    t[Matrix4.M02] = v[Matrix4.M20];
    t[Matrix4.M03] = v[Matrix4.M30];
    t[Matrix4.M10] = v[Matrix4.M01];
    t[Matrix4.M11] = v[Matrix4.M11];
    t[Matrix4.M12] = v[Matrix4.M21];
    t[Matrix4.M13] = v[Matrix4.M31];
    t[Matrix4.M20] = v[Matrix4.M02];
    t[Matrix4.M21] = v[Matrix4.M12];
    t[Matrix4.M22] = v[Matrix4.M22];
    t[Matrix4.M23] = v[Matrix4.M32];
    t[Matrix4.M30] = v[Matrix4.M03];
    t[Matrix4.M31] = v[Matrix4.M13];
    t[Matrix4.M32] = v[Matrix4.M23];
    t[Matrix4.M33] = v[Matrix4.M33];
    return this.set(t);
  }

  identity(): Matrix4 {
    let v = this.values;
    v[Matrix4.M00] = 1;
    v[Matrix4.M01] = 0;
    v[Matrix4.M02] = 0;
    v[Matrix4.M03] = 0;
    v[Matrix4.M10] = 0;
    v[Matrix4.M11] = 1;
    v[Matrix4.M12] = 0;
    v[Matrix4.M13] = 0;
    v[Matrix4.M20] = 0;
    v[Matrix4.M21] = 0;
    v[Matrix4.M22] = 1;
    v[Matrix4.M23] = 0;
    v[Matrix4.M30] = 0;
    v[Matrix4.M31] = 0;
    v[Matrix4.M32] = 0;
    v[Matrix4.M33] = 1;
    return this;
  }

  invert(): Matrix4 {
    let v = this.values;
    let t = this.temp;
    let l_det =
      v[Matrix4.M30] * v[Matrix4.M21] * v[Matrix4.M12] * v[Matrix4.M03] -
      v[Matrix4.M20] * v[Matrix4.M31] * v[Matrix4.M12] * v[Matrix4.M03] -
      v[Matrix4.M30] * v[Matrix4.M11] * v[Matrix4.M22] * v[Matrix4.M03] +
      v[Matrix4.M10] * v[Matrix4.M31] * v[Matrix4.M22] * v[Matrix4.M03] +
      v[Matrix4.M20] * v[Matrix4.M11] * v[Matrix4.M32] * v[Matrix4.M03] -
      v[Matrix4.M10] * v[Matrix4.M21] * v[Matrix4.M32] * v[Matrix4.M03] -
      v[Matrix4.M30] * v[Matrix4.M21] * v[Matrix4.M02] * v[Matrix4.M13] +
      v[Matrix4.M20] * v[Matrix4.M31] * v[Matrix4.M02] * v[Matrix4.M13] +
      v[Matrix4.M30] * v[Matrix4.M01] * v[Matrix4.M22] * v[Matrix4.M13] -
      v[Matrix4.M00] * v[Matrix4.M31] * v[Matrix4.M22] * v[Matrix4.M13] -
      v[Matrix4.M20] * v[Matrix4.M01] * v[Matrix4.M32] * v[Matrix4.M13] +
      v[Matrix4.M00] * v[Matrix4.M21] * v[Matrix4.M32] * v[Matrix4.M13] +
      v[Matrix4.M30] * v[Matrix4.M11] * v[Matrix4.M02] * v[Matrix4.M23] -
      v[Matrix4.M10] * v[Matrix4.M31] * v[Matrix4.M02] * v[Matrix4.M23] -
      v[Matrix4.M30] * v[Matrix4.M01] * v[Matrix4.M12] * v[Matrix4.M23] +
      v[Matrix4.M00] * v[Matrix4.M31] * v[Matrix4.M12] * v[Matrix4.M23] +
      v[Matrix4.M10] * v[Matrix4.M01] * v[Matrix4.M32] * v[Matrix4.M23] -
      v[Matrix4.M00] * v[Matrix4.M11] * v[Matrix4.M32] * v[Matrix4.M23] -
      v[Matrix4.M20] * v[Matrix4.M11] * v[Matrix4.M02] * v[Matrix4.M33] +
      v[Matrix4.M10] * v[Matrix4.M21] * v[Matrix4.M02] * v[Matrix4.M33] +
      v[Matrix4.M20] * v[Matrix4.M01] * v[Matrix4.M12] * v[Matrix4.M33] -
      v[Matrix4.M00] * v[Matrix4.M21] * v[Matrix4.M12] * v[Matrix4.M33] -
      v[Matrix4.M10] * v[Matrix4.M01] * v[Matrix4.M22] * v[Matrix4.M33] +
      v[Matrix4.M00] * v[Matrix4.M11] * v[Matrix4.M22] * v[Matrix4.M33];
    if (l_det === 0) throw new Error('non-invertible matrix');
    let inv_det = 1.0 / l_det;
    t[Matrix4.M00] =
      v[Matrix4.M12] * v[Matrix4.M23] * v[Matrix4.M31] -
      v[Matrix4.M13] * v[Matrix4.M22] * v[Matrix4.M31] +
      v[Matrix4.M13] * v[Matrix4.M21] * v[Matrix4.M32] -
      v[Matrix4.M11] * v[Matrix4.M23] * v[Matrix4.M32] -
      v[Matrix4.M12] * v[Matrix4.M21] * v[Matrix4.M33] +
      v[Matrix4.M11] * v[Matrix4.M22] * v[Matrix4.M33];
    t[Matrix4.M01] =
      v[Matrix4.M03] * v[Matrix4.M22] * v[Matrix4.M31] -
      v[Matrix4.M02] * v[Matrix4.M23] * v[Matrix4.M31] -
      v[Matrix4.M03] * v[Matrix4.M21] * v[Matrix4.M32] +
      v[Matrix4.M01] * v[Matrix4.M23] * v[Matrix4.M32] +
      v[Matrix4.M02] * v[Matrix4.M21] * v[Matrix4.M33] -
      v[Matrix4.M01] * v[Matrix4.M22] * v[Matrix4.M33];
    t[Matrix4.M02] =
      v[Matrix4.M02] * v[Matrix4.M13] * v[Matrix4.M31] -
      v[Matrix4.M03] * v[Matrix4.M12] * v[Matrix4.M31] +
      v[Matrix4.M03] * v[Matrix4.M11] * v[Matrix4.M32] -
      v[Matrix4.M01] * v[Matrix4.M13] * v[Matrix4.M32] -
      v[Matrix4.M02] * v[Matrix4.M11] * v[Matrix4.M33] +
      v[Matrix4.M01] * v[Matrix4.M12] * v[Matrix4.M33];
    t[Matrix4.M03] =
      v[Matrix4.M03] * v[Matrix4.M12] * v[Matrix4.M21] -
      v[Matrix4.M02] * v[Matrix4.M13] * v[Matrix4.M21] -
      v[Matrix4.M03] * v[Matrix4.M11] * v[Matrix4.M22] +
      v[Matrix4.M01] * v[Matrix4.M13] * v[Matrix4.M22] +
      v[Matrix4.M02] * v[Matrix4.M11] * v[Matrix4.M23] -
      v[Matrix4.M01] * v[Matrix4.M12] * v[Matrix4.M23];
    t[Matrix4.M10] =
      v[Matrix4.M13] * v[Matrix4.M22] * v[Matrix4.M30] -
      v[Matrix4.M12] * v[Matrix4.M23] * v[Matrix4.M30] -
      v[Matrix4.M13] * v[Matrix4.M20] * v[Matrix4.M32] +
      v[Matrix4.M10] * v[Matrix4.M23] * v[Matrix4.M32] +
      v[Matrix4.M12] * v[Matrix4.M20] * v[Matrix4.M33] -
      v[Matrix4.M10] * v[Matrix4.M22] * v[Matrix4.M33];
    t[Matrix4.M11] =
      v[Matrix4.M02] * v[Matrix4.M23] * v[Matrix4.M30] -
      v[Matrix4.M03] * v[Matrix4.M22] * v[Matrix4.M30] +
      v[Matrix4.M03] * v[Matrix4.M20] * v[Matrix4.M32] -
      v[Matrix4.M00] * v[Matrix4.M23] * v[Matrix4.M32] -
      v[Matrix4.M02] * v[Matrix4.M20] * v[Matrix4.M33] +
      v[Matrix4.M00] * v[Matrix4.M22] * v[Matrix4.M33];
    t[Matrix4.M12] =
      v[Matrix4.M03] * v[Matrix4.M12] * v[Matrix4.M30] -
      v[Matrix4.M02] * v[Matrix4.M13] * v[Matrix4.M30] -
      v[Matrix4.M03] * v[Matrix4.M10] * v[Matrix4.M32] +
      v[Matrix4.M00] * v[Matrix4.M13] * v[Matrix4.M32] +
      v[Matrix4.M02] * v[Matrix4.M10] * v[Matrix4.M33] -
      v[Matrix4.M00] * v[Matrix4.M12] * v[Matrix4.M33];
    t[Matrix4.M13] =
      v[Matrix4.M02] * v[Matrix4.M13] * v[Matrix4.M20] -
      v[Matrix4.M03] * v[Matrix4.M12] * v[Matrix4.M20] +
      v[Matrix4.M03] * v[Matrix4.M10] * v[Matrix4.M22] -
      v[Matrix4.M00] * v[Matrix4.M13] * v[Matrix4.M22] -
      v[Matrix4.M02] * v[Matrix4.M10] * v[Matrix4.M23] +
      v[Matrix4.M00] * v[Matrix4.M12] * v[Matrix4.M23];
    t[Matrix4.M20] =
      v[Matrix4.M11] * v[Matrix4.M23] * v[Matrix4.M30] -
      v[Matrix4.M13] * v[Matrix4.M21] * v[Matrix4.M30] +
      v[Matrix4.M13] * v[Matrix4.M20] * v[Matrix4.M31] -
      v[Matrix4.M10] * v[Matrix4.M23] * v[Matrix4.M31] -
      v[Matrix4.M11] * v[Matrix4.M20] * v[Matrix4.M33] +
      v[Matrix4.M10] * v[Matrix4.M21] * v[Matrix4.M33];
    t[Matrix4.M21] =
      v[Matrix4.M03] * v[Matrix4.M21] * v[Matrix4.M30] -
      v[Matrix4.M01] * v[Matrix4.M23] * v[Matrix4.M30] -
      v[Matrix4.M03] * v[Matrix4.M20] * v[Matrix4.M31] +
      v[Matrix4.M00] * v[Matrix4.M23] * v[Matrix4.M31] +
      v[Matrix4.M01] * v[Matrix4.M20] * v[Matrix4.M33] -
      v[Matrix4.M00] * v[Matrix4.M21] * v[Matrix4.M33];
    t[Matrix4.M22] =
      v[Matrix4.M01] * v[Matrix4.M13] * v[Matrix4.M30] -
      v[Matrix4.M03] * v[Matrix4.M11] * v[Matrix4.M30] +
      v[Matrix4.M03] * v[Matrix4.M10] * v[Matrix4.M31] -
      v[Matrix4.M00] * v[Matrix4.M13] * v[Matrix4.M31] -
      v[Matrix4.M01] * v[Matrix4.M10] * v[Matrix4.M33] +
      v[Matrix4.M00] * v[Matrix4.M11] * v[Matrix4.M33];
    t[Matrix4.M23] =
      v[Matrix4.M03] * v[Matrix4.M11] * v[Matrix4.M20] -
      v[Matrix4.M01] * v[Matrix4.M13] * v[Matrix4.M20] -
      v[Matrix4.M03] * v[Matrix4.M10] * v[Matrix4.M21] +
      v[Matrix4.M00] * v[Matrix4.M13] * v[Matrix4.M21] +
      v[Matrix4.M01] * v[Matrix4.M10] * v[Matrix4.M23] -
      v[Matrix4.M00] * v[Matrix4.M11] * v[Matrix4.M23];
    t[Matrix4.M30] =
      v[Matrix4.M12] * v[Matrix4.M21] * v[Matrix4.M30] -
      v[Matrix4.M11] * v[Matrix4.M22] * v[Matrix4.M30] -
      v[Matrix4.M12] * v[Matrix4.M20] * v[Matrix4.M31] +
      v[Matrix4.M10] * v[Matrix4.M22] * v[Matrix4.M31] +
      v[Matrix4.M11] * v[Matrix4.M20] * v[Matrix4.M32] -
      v[Matrix4.M10] * v[Matrix4.M21] * v[Matrix4.M32];
    t[Matrix4.M31] =
      v[Matrix4.M01] * v[Matrix4.M22] * v[Matrix4.M30] -
      v[Matrix4.M02] * v[Matrix4.M21] * v[Matrix4.M30] +
      v[Matrix4.M02] * v[Matrix4.M20] * v[Matrix4.M31] -
      v[Matrix4.M00] * v[Matrix4.M22] * v[Matrix4.M31] -
      v[Matrix4.M01] * v[Matrix4.M20] * v[Matrix4.M32] +
      v[Matrix4.M00] * v[Matrix4.M21] * v[Matrix4.M32];
    t[Matrix4.M32] =
      v[Matrix4.M02] * v[Matrix4.M11] * v[Matrix4.M30] -
      v[Matrix4.M01] * v[Matrix4.M12] * v[Matrix4.M30] -
      v[Matrix4.M02] * v[Matrix4.M10] * v[Matrix4.M31] +
      v[Matrix4.M00] * v[Matrix4.M12] * v[Matrix4.M31] +
      v[Matrix4.M01] * v[Matrix4.M10] * v[Matrix4.M32] -
      v[Matrix4.M00] * v[Matrix4.M11] * v[Matrix4.M32];
    t[Matrix4.M33] =
      v[Matrix4.M01] * v[Matrix4.M12] * v[Matrix4.M20] -
      v[Matrix4.M02] * v[Matrix4.M11] * v[Matrix4.M20] +
      v[Matrix4.M02] * v[Matrix4.M10] * v[Matrix4.M21] -
      v[Matrix4.M00] * v[Matrix4.M12] * v[Matrix4.M21] -
      v[Matrix4.M01] * v[Matrix4.M10] * v[Matrix4.M22] +
      v[Matrix4.M00] * v[Matrix4.M11] * v[Matrix4.M22];
    v[Matrix4.M00] = t[Matrix4.M00] * inv_det;
    v[Matrix4.M01] = t[Matrix4.M01] * inv_det;
    v[Matrix4.M02] = t[Matrix4.M02] * inv_det;
    v[Matrix4.M03] = t[Matrix4.M03] * inv_det;
    v[Matrix4.M10] = t[Matrix4.M10] * inv_det;
    v[Matrix4.M11] = t[Matrix4.M11] * inv_det;
    v[Matrix4.M12] = t[Matrix4.M12] * inv_det;
    v[Matrix4.M13] = t[Matrix4.M13] * inv_det;
    v[Matrix4.M20] = t[Matrix4.M20] * inv_det;
    v[Matrix4.M21] = t[Matrix4.M21] * inv_det;
    v[Matrix4.M22] = t[Matrix4.M22] * inv_det;
    v[Matrix4.M23] = t[Matrix4.M23] * inv_det;
    v[Matrix4.M30] = t[Matrix4.M30] * inv_det;
    v[Matrix4.M31] = t[Matrix4.M31] * inv_det;
    v[Matrix4.M32] = t[Matrix4.M32] * inv_det;
    v[Matrix4.M33] = t[Matrix4.M33] * inv_det;
    return this;
  }

  determinant(): number {
    let v = this.values;
    return (
      v[Matrix4.M30] * v[Matrix4.M21] * v[Matrix4.M12] * v[Matrix4.M03] -
      v[Matrix4.M20] * v[Matrix4.M31] * v[Matrix4.M12] * v[Matrix4.M03] -
      v[Matrix4.M30] * v[Matrix4.M11] * v[Matrix4.M22] * v[Matrix4.M03] +
      v[Matrix4.M10] * v[Matrix4.M31] * v[Matrix4.M22] * v[Matrix4.M03] +
      v[Matrix4.M20] * v[Matrix4.M11] * v[Matrix4.M32] * v[Matrix4.M03] -
      v[Matrix4.M10] * v[Matrix4.M21] * v[Matrix4.M32] * v[Matrix4.M03] -
      v[Matrix4.M30] * v[Matrix4.M21] * v[Matrix4.M02] * v[Matrix4.M13] +
      v[Matrix4.M20] * v[Matrix4.M31] * v[Matrix4.M02] * v[Matrix4.M13] +
      v[Matrix4.M30] * v[Matrix4.M01] * v[Matrix4.M22] * v[Matrix4.M13] -
      v[Matrix4.M00] * v[Matrix4.M31] * v[Matrix4.M22] * v[Matrix4.M13] -
      v[Matrix4.M20] * v[Matrix4.M01] * v[Matrix4.M32] * v[Matrix4.M13] +
      v[Matrix4.M00] * v[Matrix4.M21] * v[Matrix4.M32] * v[Matrix4.M13] +
      v[Matrix4.M30] * v[Matrix4.M11] * v[Matrix4.M02] * v[Matrix4.M23] -
      v[Matrix4.M10] * v[Matrix4.M31] * v[Matrix4.M02] * v[Matrix4.M23] -
      v[Matrix4.M30] * v[Matrix4.M01] * v[Matrix4.M12] * v[Matrix4.M23] +
      v[Matrix4.M00] * v[Matrix4.M31] * v[Matrix4.M12] * v[Matrix4.M23] +
      v[Matrix4.M10] * v[Matrix4.M01] * v[Matrix4.M32] * v[Matrix4.M23] -
      v[Matrix4.M00] * v[Matrix4.M11] * v[Matrix4.M32] * v[Matrix4.M23] -
      v[Matrix4.M20] * v[Matrix4.M11] * v[Matrix4.M02] * v[Matrix4.M33] +
      v[Matrix4.M10] * v[Matrix4.M21] * v[Matrix4.M02] * v[Matrix4.M33] +
      v[Matrix4.M20] * v[Matrix4.M01] * v[Matrix4.M12] * v[Matrix4.M33] -
      v[Matrix4.M00] * v[Matrix4.M21] * v[Matrix4.M12] * v[Matrix4.M33] -
      v[Matrix4.M10] * v[Matrix4.M01] * v[Matrix4.M22] * v[Matrix4.M33] +
      v[Matrix4.M00] * v[Matrix4.M11] * v[Matrix4.M22] * v[Matrix4.M33]
    );
  }

  translate(x: number, y: number, z: number): Matrix4 {
    let v = this.values;
    v[Matrix4.M03] += x;
    v[Matrix4.M13] += y;
    v[Matrix4.M23] += z;
    return this;
  }

  setTranslation(x: number, y: number, z: number): Matrix4 {
    let v = this.values;
    v[Matrix4.M03] = x;
    v[Matrix4.M13] = y;
    v[Matrix4.M23] = z;
    return this;
  }

  getTranslation(position: Vector3): Vector3 {
    let v = this.values;
    position.x = v[Matrix4.M03];
    position.y = v[Matrix4.M13];
    position.z = v[Matrix4.M23];
    return position;
  }

  hasRotationOrScaling(): boolean {
    let val = this.values;
    return !(
      MathUtils.isEqual(val[Matrix4.M00], 1) &&
      MathUtils.isEqual(val[Matrix4.M11], 1) &&
      MathUtils.isEqual(val[Matrix4.M22], 1) &&
      MathUtils.isZero(val[Matrix4.M01]) &&
      MathUtils.isZero(val[Matrix4.M02]) &&
      MathUtils.isZero(val[Matrix4.M10]) &&
      MathUtils.isZero(val[Matrix4.M12]) &&
      MathUtils.isZero(val[Matrix4.M20]) &&
      MathUtils.isZero(val[Matrix4.M21])
    );
  }

  det3x3(): number {
    let val = this.values;
    return (
      val[Matrix4.M00] * val[Matrix4.M11] * val[Matrix4.M22] +
      val[Matrix4.M01] * val[Matrix4.M12] * val[Matrix4.M20] +
      val[Matrix4.M02] * val[Matrix4.M10] * val[Matrix4.M21] -
      val[Matrix4.M00] * val[Matrix4.M12] * val[Matrix4.M21] -
      val[Matrix4.M01] * val[Matrix4.M10] * val[Matrix4.M22] -
      val[Matrix4.M02] * val[Matrix4.M11] * val[Matrix4.M20]
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
    v[Matrix4.M00] = l_fd / aspectRatio;
    v[Matrix4.M10] = 0;
    v[Matrix4.M20] = 0;
    v[Matrix4.M30] = 0;
    v[Matrix4.M01] = 0;
    v[Matrix4.M11] = l_fd;
    v[Matrix4.M21] = 0;
    v[Matrix4.M31] = 0;
    v[Matrix4.M02] = 0;
    v[Matrix4.M12] = 0;
    v[Matrix4.M22] = l_a1;
    v[Matrix4.M32] = -1;
    v[Matrix4.M03] = 0;
    v[Matrix4.M13] = 0;
    v[Matrix4.M23] = l_a2;
    v[Matrix4.M33] = 0;
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
    v[Matrix4.M00] = x_orth;
    v[Matrix4.M10] = 0;
    v[Matrix4.M20] = 0;
    v[Matrix4.M30] = 0;
    v[Matrix4.M01] = 0;
    v[Matrix4.M11] = y_orth;
    v[Matrix4.M21] = 0;
    v[Matrix4.M31] = 0;
    v[Matrix4.M02] = 0;
    v[Matrix4.M12] = 0;
    v[Matrix4.M22] = z_orth;
    v[Matrix4.M32] = 0;
    v[Matrix4.M03] = tx;
    v[Matrix4.M13] = ty;
    v[Matrix4.M23] = tz;
    v[Matrix4.M33] = 1;
    return this;
  }

  multiply(matrix: Matrix4): Matrix4 {
    let t = this.temp;
    let v = this.values;
    let m = matrix.values;
    t[Matrix4.M00] =
      v[Matrix4.M00] * m[Matrix4.M00] +
      v[Matrix4.M01] * m[Matrix4.M10] +
      v[Matrix4.M02] * m[Matrix4.M20] +
      v[Matrix4.M03] * m[Matrix4.M30];
    t[Matrix4.M01] =
      v[Matrix4.M00] * m[Matrix4.M01] +
      v[Matrix4.M01] * m[Matrix4.M11] +
      v[Matrix4.M02] * m[Matrix4.M21] +
      v[Matrix4.M03] * m[Matrix4.M31];
    t[Matrix4.M02] =
      v[Matrix4.M00] * m[Matrix4.M02] +
      v[Matrix4.M01] * m[Matrix4.M12] +
      v[Matrix4.M02] * m[Matrix4.M22] +
      v[Matrix4.M03] * m[Matrix4.M32];
    t[Matrix4.M03] =
      v[Matrix4.M00] * m[Matrix4.M03] +
      v[Matrix4.M01] * m[Matrix4.M13] +
      v[Matrix4.M02] * m[Matrix4.M23] +
      v[Matrix4.M03] * m[Matrix4.M33];
    t[Matrix4.M10] =
      v[Matrix4.M10] * m[Matrix4.M00] +
      v[Matrix4.M11] * m[Matrix4.M10] +
      v[Matrix4.M12] * m[Matrix4.M20] +
      v[Matrix4.M13] * m[Matrix4.M30];
    t[Matrix4.M11] =
      v[Matrix4.M10] * m[Matrix4.M01] +
      v[Matrix4.M11] * m[Matrix4.M11] +
      v[Matrix4.M12] * m[Matrix4.M21] +
      v[Matrix4.M13] * m[Matrix4.M31];
    t[Matrix4.M12] =
      v[Matrix4.M10] * m[Matrix4.M02] +
      v[Matrix4.M11] * m[Matrix4.M12] +
      v[Matrix4.M12] * m[Matrix4.M22] +
      v[Matrix4.M13] * m[Matrix4.M32];
    t[Matrix4.M13] =
      v[Matrix4.M10] * m[Matrix4.M03] +
      v[Matrix4.M11] * m[Matrix4.M13] +
      v[Matrix4.M12] * m[Matrix4.M23] +
      v[Matrix4.M13] * m[Matrix4.M33];
    t[Matrix4.M20] =
      v[Matrix4.M20] * m[Matrix4.M00] +
      v[Matrix4.M21] * m[Matrix4.M10] +
      v[Matrix4.M22] * m[Matrix4.M20] +
      v[Matrix4.M23] * m[Matrix4.M30];
    t[Matrix4.M21] =
      v[Matrix4.M20] * m[Matrix4.M01] +
      v[Matrix4.M21] * m[Matrix4.M11] +
      v[Matrix4.M22] * m[Matrix4.M21] +
      v[Matrix4.M23] * m[Matrix4.M31];
    t[Matrix4.M22] =
      v[Matrix4.M20] * m[Matrix4.M02] +
      v[Matrix4.M21] * m[Matrix4.M12] +
      v[Matrix4.M22] * m[Matrix4.M22] +
      v[Matrix4.M23] * m[Matrix4.M32];
    t[Matrix4.M23] =
      v[Matrix4.M20] * m[Matrix4.M03] +
      v[Matrix4.M21] * m[Matrix4.M13] +
      v[Matrix4.M22] * m[Matrix4.M23] +
      v[Matrix4.M23] * m[Matrix4.M33];
    t[Matrix4.M30] =
      v[Matrix4.M30] * m[Matrix4.M00] +
      v[Matrix4.M31] * m[Matrix4.M10] +
      v[Matrix4.M32] * m[Matrix4.M20] +
      v[Matrix4.M33] * m[Matrix4.M30];
    t[Matrix4.M31] =
      v[Matrix4.M30] * m[Matrix4.M01] +
      v[Matrix4.M31] * m[Matrix4.M11] +
      v[Matrix4.M32] * m[Matrix4.M21] +
      v[Matrix4.M33] * m[Matrix4.M31];
    t[Matrix4.M32] =
      v[Matrix4.M30] * m[Matrix4.M02] +
      v[Matrix4.M31] * m[Matrix4.M12] +
      v[Matrix4.M32] * m[Matrix4.M22] +
      v[Matrix4.M33] * m[Matrix4.M32];
    t[Matrix4.M33] =
      v[Matrix4.M30] * m[Matrix4.M03] +
      v[Matrix4.M31] * m[Matrix4.M13] +
      v[Matrix4.M32] * m[Matrix4.M23] +
      v[Matrix4.M33] * m[Matrix4.M33];
    return this.set(this.temp);
  }

  multiplyLeft(matrix: Matrix4): Matrix4 {
    let t = this.temp;
    let v = this.values;
    let m = matrix.values;
    t[Matrix4.M00] =
      m[Matrix4.M00] * v[Matrix4.M00] +
      m[Matrix4.M01] * v[Matrix4.M10] +
      m[Matrix4.M02] * v[Matrix4.M20] +
      m[Matrix4.M03] * v[Matrix4.M30];
    t[Matrix4.M01] =
      m[Matrix4.M00] * v[Matrix4.M01] +
      m[Matrix4.M01] * v[Matrix4.M11] +
      m[Matrix4.M02] * v[Matrix4.M21] +
      m[Matrix4.M03] * v[Matrix4.M31];
    t[Matrix4.M02] =
      m[Matrix4.M00] * v[Matrix4.M02] +
      m[Matrix4.M01] * v[Matrix4.M12] +
      m[Matrix4.M02] * v[Matrix4.M22] +
      m[Matrix4.M03] * v[Matrix4.M32];
    t[Matrix4.M03] =
      m[Matrix4.M00] * v[Matrix4.M03] +
      m[Matrix4.M01] * v[Matrix4.M13] +
      m[Matrix4.M02] * v[Matrix4.M23] +
      m[Matrix4.M03] * v[Matrix4.M33];
    t[Matrix4.M10] =
      m[Matrix4.M10] * v[Matrix4.M00] +
      m[Matrix4.M11] * v[Matrix4.M10] +
      m[Matrix4.M12] * v[Matrix4.M20] +
      m[Matrix4.M13] * v[Matrix4.M30];
    t[Matrix4.M11] =
      m[Matrix4.M10] * v[Matrix4.M01] +
      m[Matrix4.M11] * v[Matrix4.M11] +
      m[Matrix4.M12] * v[Matrix4.M21] +
      m[Matrix4.M13] * v[Matrix4.M31];
    t[Matrix4.M12] =
      m[Matrix4.M10] * v[Matrix4.M02] +
      m[Matrix4.M11] * v[Matrix4.M12] +
      m[Matrix4.M12] * v[Matrix4.M22] +
      m[Matrix4.M13] * v[Matrix4.M32];
    t[Matrix4.M13] =
      m[Matrix4.M10] * v[Matrix4.M03] +
      m[Matrix4.M11] * v[Matrix4.M13] +
      m[Matrix4.M12] * v[Matrix4.M23] +
      m[Matrix4.M13] * v[Matrix4.M33];
    t[Matrix4.M20] =
      m[Matrix4.M20] * v[Matrix4.M00] +
      m[Matrix4.M21] * v[Matrix4.M10] +
      m[Matrix4.M22] * v[Matrix4.M20] +
      m[Matrix4.M23] * v[Matrix4.M30];
    t[Matrix4.M21] =
      m[Matrix4.M20] * v[Matrix4.M01] +
      m[Matrix4.M21] * v[Matrix4.M11] +
      m[Matrix4.M22] * v[Matrix4.M21] +
      m[Matrix4.M23] * v[Matrix4.M31];
    t[Matrix4.M22] =
      m[Matrix4.M20] * v[Matrix4.M02] +
      m[Matrix4.M21] * v[Matrix4.M12] +
      m[Matrix4.M22] * v[Matrix4.M22] +
      m[Matrix4.M23] * v[Matrix4.M32];
    t[Matrix4.M23] =
      m[Matrix4.M20] * v[Matrix4.M03] +
      m[Matrix4.M21] * v[Matrix4.M13] +
      m[Matrix4.M22] * v[Matrix4.M23] +
      m[Matrix4.M23] * v[Matrix4.M33];
    t[Matrix4.M30] =
      m[Matrix4.M30] * v[Matrix4.M00] +
      m[Matrix4.M31] * v[Matrix4.M10] +
      m[Matrix4.M32] * v[Matrix4.M20] +
      m[Matrix4.M33] * v[Matrix4.M30];
    t[Matrix4.M31] =
      m[Matrix4.M30] * v[Matrix4.M01] +
      m[Matrix4.M31] * v[Matrix4.M11] +
      m[Matrix4.M32] * v[Matrix4.M21] +
      m[Matrix4.M33] * v[Matrix4.M31];
    t[Matrix4.M32] =
      m[Matrix4.M30] * v[Matrix4.M02] +
      m[Matrix4.M31] * v[Matrix4.M12] +
      m[Matrix4.M32] * v[Matrix4.M22] +
      m[Matrix4.M33] * v[Matrix4.M32];
    t[Matrix4.M33] =
      m[Matrix4.M30] * v[Matrix4.M03] +
      m[Matrix4.M31] * v[Matrix4.M13] +
      m[Matrix4.M32] * v[Matrix4.M23] +
      m[Matrix4.M33] * v[Matrix4.M33];
    return this.set(this.temp);
  }

  public idt(): Matrix4 {
    const val = this.values;
    val[Matrix4.M00] = 1;
    val[Matrix4.M01] = 0;
    val[Matrix4.M02] = 0;
    val[Matrix4.M03] = 0;
    val[Matrix4.M10] = 0;
    val[Matrix4.M11] = 1;
    val[Matrix4.M12] = 0;
    val[Matrix4.M13] = 0;
    val[Matrix4.M20] = 0;
    val[Matrix4.M21] = 0;
    val[Matrix4.M22] = 1;
    val[Matrix4.M23] = 0;
    val[Matrix4.M30] = 0;
    val[Matrix4.M31] = 0;
    val[Matrix4.M32] = 0;
    val[Matrix4.M33] = 1;
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
    val[Matrix4.M00] = xAxis.x;
    val[Matrix4.M01] = xAxis.y;
    val[Matrix4.M02] = xAxis.z;
    val[Matrix4.M10] = yAxis.x;
    val[Matrix4.M11] = yAxis.y;
    val[Matrix4.M12] = yAxis.z;
    val[Matrix4.M20] = -zAxis.x;
    val[Matrix4.M21] = -zAxis.y;
    val[Matrix4.M22] = -zAxis.z;

    Matrix4.tmpMatrix.identity();
    Matrix4.tmpMatrix.values[Matrix4.M03] = -position.x;
    Matrix4.tmpMatrix.values[Matrix4.M13] = -position.y;
    Matrix4.tmpMatrix.values[Matrix4.M23] = -position.z;
    this.multiply(Matrix4.tmpMatrix);

    return this;
  }

  setToOrtho(left: number, right: number, bottom: number, top: number, near: number, far: number): Matrix4 {
    this.idt();
    const x_orth = 2 / (right - left);
    const y_orth = 2 / (top - bottom);
    const z_orth = -2 / (far - near);

    const tx = -(right + left) / (right - left);
    const ty = -(top + bottom) / (top - bottom);
    const tz = -(far + near) / (far - near);

    this.values[Matrix4.M00] = x_orth;
    this.values[Matrix4.M10] = 0;
    this.values[Matrix4.M20] = 0;
    this.values[Matrix4.M30] = 0;
    this.values[Matrix4.M01] = 0;
    this.values[Matrix4.M11] = y_orth;
    this.values[Matrix4.M21] = 0;
    this.values[Matrix4.M31] = 0;
    this.values[Matrix4.M02] = 0;
    this.values[Matrix4.M12] = 0;
    this.values[Matrix4.M22] = z_orth;
    this.values[Matrix4.M32] = 0;
    this.values[Matrix4.M03] = tx;
    this.values[Matrix4.M13] = ty;
    this.values[Matrix4.M23] = tz;
    this.values[Matrix4.M33] = 1;

    return this;
  }

  getScaleXSquared() {
    return (
      this.values[Matrix4.M00] * this.values[Matrix4.M00] +
      this.values[Matrix4.M01] * this.values[Matrix4.M01] +
      this.values[Matrix4.M02] * this.values[Matrix4.M02]
    );
  }

  getScaleYSquared() {
    return (
      this.values[Matrix4.M10] * this.values[Matrix4.M10] +
      this.values[Matrix4.M11] * this.values[Matrix4.M11] +
      this.values[Matrix4.M12] * this.values[Matrix4.M12]
    );
  }

  getScaleZSquared() {
    return (
      this.values[Matrix4.M20] * this.values[Matrix4.M20] +
      this.values[Matrix4.M21] * this.values[Matrix4.M21] +
      this.values[Matrix4.M22] * this.values[Matrix4.M22]
    );
  }

  getScale(scale: Vector3): Vector3 {
    return scale.set(this.getScaleX(), this.getScaleY(), this.getScaleZ());
  }

  getScaleX(): number {
    return MathUtils.isZero(this.values[Matrix4.M01]) && MathUtils.isZero(this.values[Matrix4.M02])
      ? Math.abs(this.values[Matrix4.M00])
      : Math.sqrt(this.getScaleXSquared());
  }

  getScaleY(): number {
    return MathUtils.isZero(this.values[Matrix4.M10]) && MathUtils.isZero(this.values[Matrix4.M12])
      ? Math.abs(this.values[Matrix4.M11])
      : Math.sqrt(this.getScaleYSquared());
  }

  getScaleZ(): number {
    return MathUtils.isZero(this.values[Matrix4.M20]) && MathUtils.isZero(this.values[Matrix4.M21])
      ? Math.abs(this.values[Matrix4.M22])
      : Math.sqrt(this.getScaleZSquared());
  }

  public getRotation(rotation: Quaternion, normalizeAxes = false): Quaternion {
    return rotation.setFromMatrix4(this, normalizeAxes);
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
    const m00 = val[Matrix4.M00] * r00 + val[Matrix4.M01] * r10 + val[Matrix4.M02] * r20;
    const m01 = val[Matrix4.M00] * r01 + val[Matrix4.M01] * r11 + val[Matrix4.M02] * r21;
    const m02 = val[Matrix4.M00] * r02 + val[Matrix4.M01] * r12 + val[Matrix4.M02] * r22;
    const m10 = val[Matrix4.M10] * r00 + val[Matrix4.M11] * r10 + val[Matrix4.M12] * r20;
    const m11 = val[Matrix4.M10] * r01 + val[Matrix4.M11] * r11 + val[Matrix4.M12] * r21;
    const m12 = val[Matrix4.M10] * r02 + val[Matrix4.M11] * r12 + val[Matrix4.M12] * r22;
    const m20 = val[Matrix4.M20] * r00 + val[Matrix4.M21] * r10 + val[Matrix4.M22] * r20;
    const m21 = val[Matrix4.M20] * r01 + val[Matrix4.M21] * r11 + val[Matrix4.M22] * r21;
    const m22 = val[Matrix4.M20] * r02 + val[Matrix4.M21] * r12 + val[Matrix4.M22] * r22;
    const m30 = val[Matrix4.M30] * r00 + val[Matrix4.M31] * r10 + val[Matrix4.M32] * r20;
    const m31 = val[Matrix4.M30] * r01 + val[Matrix4.M31] * r11 + val[Matrix4.M32] * r21;
    const m32 = val[Matrix4.M30] * r02 + val[Matrix4.M31] * r12 + val[Matrix4.M32] * r22;
    val[Matrix4.M00] = m00;
    val[Matrix4.M10] = m10;
    val[Matrix4.M20] = m20;
    val[Matrix4.M30] = m30;
    val[Matrix4.M01] = m01;
    val[Matrix4.M11] = m11;
    val[Matrix4.M21] = m21;
    val[Matrix4.M31] = m31;
    val[Matrix4.M02] = m02;
    val[Matrix4.M12] = m12;
    val[Matrix4.M22] = m22;
    val[Matrix4.M32] = m32;
    return this;
  }

  public scale(scaleX: number, scaleY: number, scaleZ: number): Matrix4 {
    const val = this.values;
    val[Matrix4.M00] *= scaleX;
    val[Matrix4.M01] *= scaleY;
    val[Matrix4.M02] *= scaleZ;
    val[Matrix4.M10] *= scaleX;
    val[Matrix4.M11] *= scaleY;
    val[Matrix4.M12] *= scaleZ;
    val[Matrix4.M20] *= scaleX;
    val[Matrix4.M21] *= scaleY;
    val[Matrix4.M22] *= scaleZ;
    val[Matrix4.M30] *= scaleX;
    val[Matrix4.M31] *= scaleY;
    val[Matrix4.M32] *= scaleZ;
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
    const inv_w =
      1.0 / (vec[0] * mat[Matrix4.M30] + vec[1] * mat[Matrix4.M31] + vec[2] * mat[Matrix4.M32] + mat[Matrix4.M33]);
    const x =
      (vec[0] * mat[Matrix4.M00] + vec[1] * mat[Matrix4.M01] + vec[2] * mat[Matrix4.M02] + mat[Matrix4.M03]) * inv_w;
    const y =
      (vec[0] * mat[Matrix4.M10] + vec[1] * mat[Matrix4.M11] + vec[2] * mat[Matrix4.M12] + mat[Matrix4.M13]) * inv_w;
    const z =
      (vec[0] * mat[Matrix4.M20] + vec[1] * mat[Matrix4.M21] + vec[2] * mat[Matrix4.M22] + mat[Matrix4.M23]) * inv_w;
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
