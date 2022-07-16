import { Matrix4 } from "../Matrix4";
import { MathUtils } from "../Utils";
import { Vector3 } from "../Vector3";
import { Matrix3 } from "./Matrix3";

export class Quaternion {
  private static tmp1: Quaternion = new Quaternion(0, 0, 0, 0);
  private static tmp2: Quaternion = new Quaternion(0, 0, 0, 0);

  public x: number;
  public y: number;
  public z: number;
  public w: number;

  constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 1) {
    this.set(x, y, z, w);
  }

  public set(x: number, y: number, z: number, w: number): Quaternion {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    return this;
  }

  public static len(x: number, y: number, z: number, w: number): number {
    return Math.sqrt(x * x + y * y + z * z + w * w);
  }

  public len(): number {
    return Math.sqrt(
      this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w
    );
  }

  public toString(): string {
    return "[" + this.x + "|" + this.y + "|" + this.z + "|" + this.w + "]";
  }

  public setEulerAngles(yaw: number, pitch: number, roll: number): Quaternion {
    return this.setEulerAnglesRad(
      yaw * MathUtils.degreesToRadians,
      pitch * MathUtils.degreesToRadians,
      roll * MathUtils.degreesToRadians
    );
  }

  public setEulerAnglesRad(
    yaw: number,
    pitch: number,
    roll: number
  ): Quaternion {
    const hr = roll * 0.5;
    const shr = Math.sin(hr);
    const chr = Math.cos(hr);
    const hp = pitch * 0.5;
    const shp = Math.sin(hp);
    const chp = Math.cos(hp);
    const hy = yaw * 0.5;
    const shy = Math.sin(hy);
    const chy = Math.cos(hy);
    const chy_shp = chy * shp;
    const shy_chp = shy * chp;
    const chy_chp = chy * chp;
    const shy_shp = shy * shp;

    this.x = chy_shp * chr + shy_chp * shr; // cos(yaw/2) * sin(pitch/2) * cos(roll/2) + sin(yaw/2) * cos(pitch/2) * sin(roll/2)
    this.y = shy_chp * chr - chy_shp * shr; // sin(yaw/2) * cos(pitch/2) * cos(roll/2) - cos(yaw/2) * sin(pitch/2) * sin(roll/2)
    this.z = chy_chp * shr - shy_shp * chr; // cos(yaw/2) * cos(pitch/2) * sin(roll/2) - sin(yaw/2) * sin(pitch/2) * cos(roll/2)
    this.w = chy_chp * chr + shy_shp * shr; // cos(yaw/2) * cos(pitch/2) * cos(roll/2) + sin(yaw/2) * sin(pitch/2) * sin(roll/2)
    return this;
  }

  public getGimbalPole(): number {
    const t = this.y * this.x + this.z * this.w;
    return t > 0.499 ? 1 : t < -0.499 ? -1 : 0;
  }

  public getRollRad(): number {
    const pole = this.getGimbalPole();
    return pole === 0
      ? Math.atan2(
          2 * (this.w * this.z + this.y * this.x),
          1 - 2 * (this.x * this.x + this.z * this.z)
        )
      : pole * 2 * Math.atan2(this.y, this.w);
  }

  public getRoll(): number {
    return this.getRollRad() * MathUtils.radiansToDegrees;
  }

  public getPitchRad(): number {
    const pole = this.getGimbalPole();
    return pole === 0
      ? Math.asin(
          MathUtils.clamp(2 * (this.w * this.x - this.z * this.y), -1, 1)
        )
      : pole * MathUtils.PI * 0.5;
  }

  public getPitch(): number {
    return this.getPitchRad() * MathUtils.radiansToDegrees;
  }

  public getYawRad(): number {
    return this.getGimbalPole() === 0
      ? Math.atan2(
          2 * (this.y * this.w + this.x * this.z),
          1 - 2 * (this.y * this.y + this.x * this.x)
        )
      : 0;
  }

  public getYaw(): number {
    return this.getYawRad() * MathUtils.radiansToDegrees;
  }

  public static len2(x: number, y: number, z: number, w: number): number {
    return x * x + y * y + z * z + w * w;
  }

  public len2(): number {
    return (
      this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w
    );
  }
  public nor(): Quaternion {
    let len = this.len2();
    if (len !== 0 && !MathUtils.isEqual(len, 1)) {
      len = Math.sqrt(len);
      this.w /= len;
      this.x /= len;
      this.y /= len;
      this.z /= len;
    }
    return this;
  }

  public conjugate(): Quaternion {
    this.x = -this.x;
    this.y = -this.y;
    this.z = -this.z;
    return this;
  }

  public transform(v: Vector3): Vector3 {
    Quaternion.tmp2.set(this.x, this.y, this.z, this.w);
    Quaternion.tmp2.conjugate();

    const quaternion = Quaternion.tmp1.set(v.x, v.y, v.z, 0);
    Quaternion.tmp2
      .mulLeft(quaternion.x, quaternion.y, quaternion.z, quaternion.w)
      .mulLeft(this.x, this.y, this.z, this.w);

    v.x = Quaternion.tmp2.x;
    v.y = Quaternion.tmp2.y;
    v.z = Quaternion.tmp2.z;
    return v;
  }

  public mul(x: number, y: number, z: number, w: number): Quaternion {
    const newX = this.w * x + this.x * w + this.y * z - this.z * y;
    const newY = this.w * y + this.y * w + this.z * x - this.x * z;
    const newZ = this.w * z + this.z * w + this.x * y - this.y * x;
    const newW = this.w * w - this.x * x - this.y * y - this.z * z;
    this.x = newX;
    this.y = newY;
    this.z = newZ;
    this.w = newW;
    return this;
  }

  public mulLeft(x: number, y: number, z: number, w: number): Quaternion {
    const newX = w * this.x + x * this.w + y * this.z - z * this.y;
    const newY = w * this.y + y * this.w + z * this.x - x * this.z;
    const newZ = w * this.z + z * this.w + x * this.y - y * this.x;
    const newW = w * this.w - x * this.x - y * this.y - z * this.z;
    this.x = newX;
    this.y = newY;
    this.z = newZ;
    this.w = newW;
    return this;
  }

  public add(qx: number, qy: number, qz: number, qw: number): Quaternion {
    this.x += qx;
    this.y += qy;
    this.z += qz;
    this.w += qw;
    return this;
  }
  public toMatrix(matrix: number[]) {
    const xx = this.x * this.x;
    const xy = this.x * this.y;
    const xz = this.x * this.z;
    const xw = this.x * this.w;
    const yy = this.y * this.y;
    const yz = this.y * this.z;
    const yw = this.y * this.w;
    const zz = this.z * this.z;
    const zw = this.z * this.w;
    matrix[Matrix4.M00] = 1 - 2 * (yy + zz);
    matrix[Matrix4.M01] = 2 * (xy - zw);
    matrix[Matrix4.M02] = 2 * (xz + yw);
    matrix[Matrix4.M03] = 0;
    matrix[Matrix4.M10] = 2 * (xy + zw);
    matrix[Matrix4.M11] = 1 - 2 * (xx + zz);
    matrix[Matrix4.M12] = 2 * (yz - xw);
    matrix[Matrix4.M13] = 0;
    matrix[Matrix4.M20] = 2 * (xz - yw);
    matrix[Matrix4.M21] = 2 * (yz + xw);
    matrix[Matrix4.M22] = 1 - 2 * (xx + yy);
    matrix[Matrix4.M23] = 0;
    matrix[Matrix4.M30] = 0;
    matrix[Matrix4.M31] = 0;
    matrix[Matrix4.M32] = 0;
    matrix[Matrix4.M33] = 1;
  }

  public idt(): Quaternion {
    return this.set(0, 0, 0, 1);
  }

  public isIdentity(): boolean {
    return (
      MathUtils.isZero(this.x) &&
      MathUtils.isZero(this.y) &&
      MathUtils.isZero(this.z) &&
      MathUtils.isEqual(this.w, 1)
    );
  }

  public setFromAxis(
    x: number,
    y: number,
    z: number,
    degrees: number
  ): Quaternion {
    return this.setFromAxisRad(x, y, z, degrees * MathUtils.degreesToRadians);
  }

  public setFromAxisRad(
    x: number,
    y: number,
    z: number,
    radians: number
  ): Quaternion {
    let d = new Vector3(x, y, z).length();
    if (d === 0) return this.idt();
    d = 1 / d;
    const l_ang =
      radians < 0
        ? MathUtils.PI2 - (-radians % MathUtils.PI2)
        : radians % MathUtils.PI2;
    const l_sin = Math.sin(l_ang / 2);
    const l_cos = Math.cos(l_ang / 2);
    return this.set(d * x * l_sin, d * y * l_sin, d * z * l_sin, l_cos).nor();
  }

  public setFromMatrix4(
    matrix: Matrix4,
    normalizeAxes: boolean = false
  ): Quaternion {
    return this.setFromAxes(
      matrix.values[Matrix4.M00],
      matrix.values[Matrix4.M01],
      matrix.values[Matrix4.M02],
      matrix.values[Matrix4.M10],
      matrix.values[Matrix4.M11],
      matrix.values[Matrix4.M12],
      matrix.values[Matrix4.M20],
      matrix.values[Matrix4.M21],
      matrix.values[Matrix4.M22],
      normalizeAxes
    );
  }

  public setFromMatrix3(matrix: Matrix3, normalizeAxes: boolean): Quaternion {
    return this.setFromAxes(
      matrix.val[Matrix3.M00],
      matrix.val[Matrix3.M01],
      matrix.val[Matrix3.M02],
      matrix.val[Matrix3.M10],
      matrix.val[Matrix3.M11],
      matrix.val[Matrix3.M12],
      matrix.val[Matrix3.M20],
      matrix.val[Matrix3.M21],
      matrix.val[Matrix3.M22],
      normalizeAxes
    );
  }

  public setFromAxes(
    xx: number,
    xy: number,
    xz: number,
    yx: number,
    yy: number,
    yz: number,
    zx: number,
    zy: number,
    zz: number,
    normalizeAxes: boolean = false
  ): Quaternion {
    if (normalizeAxes) {
      const lx = 1 / new Vector3(xx, xy, xz).length();
      const ly = 1 / new Vector3(yx, yy, yz).length();
      const lz = 1 / new Vector3(zx, zy, zz).length();
      xx *= lx;
      xy *= lx;
      xz *= lx;
      yx *= ly;
      yy *= ly;
      yz *= ly;
      zx *= lz;
      zy *= lz;
      zz *= lz;
    }
    const t = xx + yy + zz;

    if (t >= 0) {
      let s = Math.sqrt(t + 1);
      this.w = 0.5 * s;
      s = 0.5 / s;
      this.x = (zy - yz) * s;
      this.y = (xz - zx) * s;
      this.z = (yx - xy) * s;
    } else if (xx > yy && xx > zz) {
      let s = Math.sqrt(1.0 + xx - yy - zz); // |s|>=1
      this.x = s * 0.5; // |x| >= .5
      s = 0.5 / s;
      this.y = (yx + xy) * s;
      this.z = (xz + zx) * s;
      this.w = (zy - yz) * s;
    } else if (yy > zz) {
      let s = Math.sqrt(1.0 + yy - xx - zz); // |s|>=1
      this.y = s * 0.5; // |y| >= .5
      s = 0.5 / s;
      this.x = (yx + xy) * s;
      this.z = (zy + yz) * s;
      this.w = (xz - zx) * s;
    } else {
      let s = Math.sqrt(1.0 + zz - xx - yy); // |s|>=1
      this.z = s * 0.5; // |z| >= .5
      s = 0.5 / s;
      this.x = (xz + zx) * s;
      this.y = (zy + yz) * s;
      this.w = (yx - xy) * s;
    }

    return this;
  }

  public setFromCross(v1: Vector3, v2: Vector3): Quaternion {
    const dot = MathUtils.clamp(v1.dot(v2), -1, 1);
    const angle = Math.acos(dot);
    return this.setFromAxisRad(
      v1.y * v2.z - v1.z * v2.y,
      v1.z * v2.x - v1.x * v2.z,
      v1.x * v2.y - v1.y * v2.x,
      angle
    );
  }

  public slerp(end: Quaternion, alpha: number): Quaternion {
    const d = this.x * end.x + this.y * end.y + this.z * end.z + this.w * end.w;
    const absDot = d < 0 ? -d : d;

    let scale0 = 1 - alpha;
    let scale1 = alpha;

    if (1 - absDot > 0.1) {
      const angle = Math.acos(absDot);
      const invSinTheta = 1 / Math.sin(angle);
      scale0 = Math.sin((1 - alpha) * angle) * invSinTheta;
      scale1 = Math.sin(alpha * angle) * invSinTheta;
    }

    if (d < 0) scale1 = -scale1;

    this.x = scale0 * this.x + scale1 * end.x;
    this.y = scale0 * this.y + scale1 * end.y;
    this.z = scale0 * this.z + scale1 * end.z;
    this.w = scale0 * this.w + scale1 * end.w;

    return this;
  }

  public slerpWithQuaternions(q: Quaternion[]): Quaternion {
    const w = 1.0 / q.length;
    this.set(q[0].x, q[0].y, q[0].z, q[0].w).exp(w);
    for (let i = 1; i < q.length; i++) {
      const quat = Quaternion.tmp1.set(q[i].x, q[i].y, q[i].z, q[i].w).exp(w);
      this.mul(quat.x, quat.y, quat.z, quat.w);
    }
    this.nor();
    return this;
  }

  public exp(alpha: number): Quaternion {
    const norm = this.len();
    const normExp = Math.pow(norm, alpha);

    const theta = Math.acos(this.w / norm);
    let coeff = 0;
    if (Math.abs(theta) < 0.001) coeff = (normExp * alpha) / norm;
    else coeff = (normExp * Math.sin(alpha * theta)) / (norm * Math.sin(theta));

    this.w = normExp * Math.cos(alpha * theta);
    this.x *= coeff;
    this.y *= coeff;
    this.z *= coeff;
    this.nor();

    return this;
  }

  public static dot(
    x1: number,
    y1: number,
    z1: number,
    w1: number,
    x2: number,
    y2: number,
    z2: number,
    w2: number
  ): number {
    return x1 * x2 + y1 * y2 + z1 * z2 + w1 * w2;
  }

  public dot(x: number, y: number, z: number, w: number) {
    return this.x * x + this.y * y + this.z * z + this.w * w;
  }

  public mulByScalar(scalar: number) {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
    this.w *= scalar;
    return this;
  }

  public getAxisAngle(axis: Vector3): number {
    return (
      this.getAxisAngleRad(axis.x, axis.y, axis.z) * MathUtils.radiansToDegrees
    );
  }

  public getAxisAngleRad(x: number, y: number, z: number) {
    if (this.w > 1) this.nor();
    const angle = 2.0 * Math.acos(this.w);
    const s = Math.sqrt(1 - this.w * this.w);
    if (s < MathUtils.FLOAT_ROUNDING_ERROR) {
      x = this.x;
      y = this.y;
      z = this.z;
    } else {
      x = this.x / s;
      y = this.y / s;
      z = this.z / s;
    }

    return angle;
  }

  public getAngleRad() {
    return 2.0 * Math.acos(this.w > 1 ? this.w / this.len() : this.w);
  }

  public getAngle() {
    return this.getAngleRad() * MathUtils.radiansToDegrees;
  }
}
