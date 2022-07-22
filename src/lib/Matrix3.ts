import { Matrix4 } from './Matrix4';
import { MathUtils } from './Utils';
import { Vector2 } from './Vector2';
import { Vector3 } from './Vector3';

export const M00 = 0;
export const M01 = 3;
export const M02 = 6;
export const M10 = 1;
export const M11 = 4;
export const M12 = 7;
export const M20 = 2;
export const M21 = 5;
export const M22 = 8;

export class Matrix3 {
  public static M00 = 0;
  public static M01 = 3;
  public static M02 = 6;
  public static M10 = 1;
  public static M11 = 4;
  public static M12 = 7;
  public static M20 = 2;
  public static M21 = 5;
  public static M22 = 8;
  public val: number[] = new Array<number>(9);
  private tmp: number[] = new Array<number>(9);

  constructor(matrix: Matrix3 = null) {
    if (matrix) {
      this.setByMatrix3(matrix);
    } else {
      this.idt();
    }
  }

  public idt(): Matrix3 {
    const val = this.val;
    val[M00] = 1;
    val[M10] = 0;
    val[M20] = 0;
    val[M01] = 0;
    val[M11] = 1;
    val[M21] = 0;
    val[M02] = 0;
    val[M12] = 0;
    val[M22] = 1;
    return this;
  }

  public mulWithMatrix3(m: Matrix3): Matrix3 {
    const val = this.val;

    const v00 = val[M00] * m.val[M00] + val[M01] * m.val[M10] + val[M02] * m.val[M20];
    const v01 = val[M00] * m.val[M01] + val[M01] * m.val[M11] + val[M02] * m.val[M21];
    const v02 = val[M00] * m.val[M02] + val[M01] * m.val[M12] + val[M02] * m.val[M22];

    const v10 = val[M10] * m.val[M00] + val[M11] * m.val[M10] + val[M12] * m.val[M20];
    const v11 = val[M10] * m.val[M01] + val[M11] * m.val[M11] + val[M12] * m.val[M21];
    const v12 = val[M10] * m.val[M02] + val[M11] * m.val[M12] + val[M12] * m.val[M22];

    const v20 = val[M20] * m.val[M00] + val[M21] * m.val[M10] + val[M22] * m.val[M20];
    const v21 = val[M20] * m.val[M01] + val[M21] * m.val[M11] + val[M22] * m.val[M21];
    const v22 = val[M20] * m.val[M02] + val[M21] * m.val[M12] + val[M22] * m.val[M22];

    val[M00] = v00;
    val[M10] = v10;
    val[M20] = v20;
    val[M01] = v01;
    val[M11] = v11;
    val[M21] = v21;
    val[M02] = v02;
    val[M12] = v12;
    val[M22] = v22;

    return this;
  }

  public mulLeft(m: Matrix3): Matrix3 {
    const val = this.val;

    const v00 = m.val[M00] * val[M00] + m.val[M01] * val[M10] + m.val[M02] * val[M20];
    const v01 = m.val[M00] * val[M01] + m.val[M01] * val[M11] + m.val[M02] * val[M21];
    const v02 = m.val[M00] * val[M02] + m.val[M01] * val[M12] + m.val[M02] * val[M22];

    const v10 = m.val[M10] * val[M00] + m.val[M11] * val[M10] + m.val[M12] * val[M20];
    const v11 = m.val[M10] * val[M01] + m.val[M11] * val[M11] + m.val[M12] * val[M21];
    const v12 = m.val[M10] * val[M02] + m.val[M11] * val[M12] + m.val[M12] * val[M22];

    const v20 = m.val[M20] * val[M00] + m.val[M21] * val[M10] + m.val[M22] * val[M20];
    const v21 = m.val[M20] * val[M01] + m.val[M21] * val[M11] + m.val[M22] * val[M21];
    const v22 = m.val[M20] * val[M02] + m.val[M21] * val[M12] + m.val[M22] * val[M22];

    val[M00] = v00;
    val[M10] = v10;
    val[M20] = v20;
    val[M01] = v01;
    val[M11] = v11;
    val[M21] = v21;
    val[M02] = v02;
    val[M12] = v12;
    val[M22] = v22;

    return this;
  }

  public setToRotation(degrees: number): Matrix3 {
    return this.setToRotationRad(MathUtils.degreesToRadians * degrees);
  }

  public setToRotationRad(radians: number): Matrix3 {
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const val = this.val;

    val[M00] = cos;
    val[M10] = sin;
    val[M20] = 0;

    val[M01] = -sin;
    val[M11] = cos;
    val[M21] = 0;

    val[M02] = 0;
    val[M12] = 0;
    val[M22] = 1;

    return this;
  }

  public setToRotationWithAxis(axis: Vector3, degrees: number): Matrix3 {
    const cos = Math.cos(degrees);
    const sin = Math.sin(degrees);

    const val = this.val;
    const oc = 1.0 - cos;
    val[M00] = oc * axis.x * axis.x + cos;
    val[M01] = oc * axis.x * axis.y - axis.z * sin;
    val[M02] = oc * axis.z * axis.x + axis.y * sin;
    val[M10] = oc * axis.x * axis.y + axis.z * sin;
    val[M11] = oc * axis.y * axis.y + cos;
    val[M12] = oc * axis.y * axis.z - axis.x * sin;
    val[M20] = oc * axis.z * axis.x - axis.y * sin;
    val[M21] = oc * axis.y * axis.z + axis.x * sin;
    val[M22] = oc * axis.z * axis.z + cos;
    return this;
  }

  public setToTranslation(x: number, y: number): Matrix3 {
    const val = this.val;

    val[M00] = 1;
    val[M10] = 0;
    val[M20] = 0;

    val[M01] = 0;
    val[M11] = 1;
    val[M21] = 0;

    val[M02] = x;
    val[M12] = y;
    val[M22] = 1;

    return this;
  }

  public setToScaling(scaleX: number, scaleY: number): Matrix3 {
    const val = this.val;
    val[M00] = scaleX;
    val[M10] = 0;
    val[M20] = 0;
    val[M01] = 0;
    val[M11] = scaleY;
    val[M21] = 0;
    val[M02] = 0;
    val[M12] = 0;
    val[M22] = 1;
    return this;
  }

  public toString(): string {
    const val = this.val;
    return (
      '[' +
      val[M00] +
      '|' +
      val[M01] +
      '|' +
      val[M02] +
      ']\n' +
      '[' +
      val[M10] +
      '|' +
      val[M11] +
      '|' +
      val[M12] +
      ']\n' +
      '[' +
      val[M20] +
      '|' +
      val[M21] +
      '|' +
      val[M22] +
      ']'
    );
  }

  public det() {
    const val = this.val;
    return (
      val[M00] * val[M11] * val[M22] +
      val[M01] * val[M12] * val[M20] +
      val[M02] * val[M10] * val[M21] -
      val[M00] * val[M12] * val[M21] -
      val[M01] * val[M10] * val[M22] -
      val[M02] * val[M11] * val[M20]
    );
  }

  public inv(): Matrix3 {
    const det = this.det();
    if (det === 0) throw new Error("Can't invert a singular matrix");

    const inv_det = 1.0 / det;
    const tmp = this.tmp,
      val = this.val;

    tmp[M00] = val[M11] * val[M22] - val[M21] * val[M12];
    tmp[M10] = val[M20] * val[M12] - val[M10] * val[M22];
    tmp[M20] = val[M10] * val[M21] - val[M20] * val[M11];
    tmp[M01] = val[M21] * val[M02] - val[M01] * val[M22];
    tmp[M11] = val[M00] * val[M22] - val[M20] * val[M02];
    tmp[M21] = val[M20] * val[M01] - val[M00] * val[M21];
    tmp[M02] = val[M01] * val[M12] - val[M11] * val[M02];
    tmp[M12] = val[M10] * val[M02] - val[M00] * val[M12];
    tmp[M22] = val[M00] * val[M11] - val[M10] * val[M01];

    val[M00] = inv_det * tmp[M00];
    val[M10] = inv_det * tmp[M10];
    val[M20] = inv_det * tmp[M20];
    val[M01] = inv_det * tmp[M01];
    val[M11] = inv_det * tmp[M11];
    val[M21] = inv_det * tmp[M21];
    val[M02] = inv_det * tmp[M02];
    val[M12] = inv_det * tmp[M12];
    val[M22] = inv_det * tmp[M22];

    return this;
  }

  public setByMatrix3(mat: Matrix3): Matrix3 {
    for (const v of mat.val) {
      this.val.push(v);
    }
    return this;
  }

  public setByMatrix4(mat: Matrix4): Matrix3 {
    const val = this.val;
    val[M00] = mat.values[Matrix4.M00];
    val[M10] = mat.values[Matrix4.M10];
    val[M20] = mat.values[Matrix4.M20];
    val[M01] = mat.values[Matrix4.M01];
    val[M11] = mat.values[Matrix4.M11];
    val[M21] = mat.values[Matrix4.M21];
    val[M02] = mat.values[Matrix4.M02];
    val[M12] = mat.values[Matrix4.M12];
    val[M22] = mat.values[Matrix4.M22];
    return this;
  }

  public trnByVector2(vector: Vector2): Matrix3 {
    const val = this.val;
    val[M02] += vector.x;
    val[M12] += vector.y;
    return this;
  }

  public trnByMatrix3(x: number, y: number): Matrix3 {
    const val = this.val;
    val[M02] += x;
    val[M12] += y;
    return this;
  }

  public trnByVector3(vector: Vector3): Matrix3 {
    const val = this.val;
    val[M02] += vector.x;
    val[M12] += vector.y;
    return this;
  }

  public translate(x: number, y: number): Matrix3 {
    const val = this.val;
    this.tmp[M00] = 1;
    this.tmp[M10] = 0;
    this.tmp[M20] = 0;

    this.tmp[M01] = 0;
    this.tmp[M11] = 1;
    this.tmp[M21] = 0;

    this.tmp[M02] = x;
    this.tmp[M12] = y;
    this.tmp[M22] = 1;
    Matrix3.mul(val, this.tmp);
    return this;
  }

  public rotate(degrees: number): Matrix3 {
    return this.rotateRad(MathUtils.degreesToRadians * degrees);
  }

  public rotateRad(radians: number): Matrix3 {
    if (radians === 0) return this;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const tmp = this.tmp;

    tmp[M00] = cos;
    tmp[M10] = sin;
    tmp[M20] = 0;

    tmp[M01] = -sin;
    tmp[M11] = cos;
    tmp[M21] = 0;

    tmp[M02] = 0;
    tmp[M12] = 0;
    tmp[M22] = 1;
    Matrix3.mul(this.val, tmp);
    return this;
  }

  public scale(scaleX: number, scaleY: number): Matrix3 {
    const tmp = this.tmp;
    tmp[M00] = scaleX;
    tmp[M10] = 0;
    tmp[M20] = 0;
    tmp[M01] = 0;
    tmp[M11] = scaleY;
    tmp[M21] = 0;
    tmp[M02] = 0;
    tmp[M12] = 0;
    tmp[M22] = 1;
    Matrix3.mul(this.val, tmp);
    return this;
  }

  public getValues() {
    return this.val;
  }

  public getTranslation(position: Vector2): Vector2 {
    position.x = this.val[M02];
    position.y = this.val[M12];
    return position;
  }

  public getScale(scale: Vector2): Vector2 {
    const val = this.val;
    scale.x = Math.sqrt(val[M00] * val[M00] + val[M01] * val[M01]);
    scale.y = Math.sqrt(val[M10] * val[M10] + val[M11] * val[M11]);
    return scale;
  }

  public getRotation() {
    return MathUtils.radiansToDegrees * Math.atan2(this.val[M10], this.val[M00]);
  }

  public getRotationRad() {
    return Math.atan2(this.val[M10], this.val[M00]);
  }

  public sclByNumber(scale: number): Matrix3 {
    this.val[M00] *= scale;
    this.val[M11] *= scale;
    return this;
  }

  public sclByVector2(scale: Vector2): Matrix3 {
    this.val[M00] *= scale.x;
    this.val[M11] *= scale.y;
    return this;
  }

  public scl(scale: Vector3): Matrix3 {
    this.val[M00] *= scale.x;
    this.val[M11] *= scale.y;
    return this;
  }

  public transpose(): Matrix3 {
    const val = this.val;
    const v01 = val[M10];
    const v02 = val[M20];
    const v10 = val[M01];
    const v12 = val[M21];
    const v20 = val[M02];
    const v21 = val[M12];
    val[M01] = v01;
    val[M02] = v02;
    val[M10] = v10;
    val[M12] = v12;
    val[M20] = v20;
    val[M21] = v21;
    return this;
  }

  private static mul(mata: number[], matb: number[]) {
    const v00 = mata[M00] * matb[M00] + mata[M01] * matb[M10] + mata[M02] * matb[M20];
    const v01 = mata[M00] * matb[M01] + mata[M01] * matb[M11] + mata[M02] * matb[M21];
    const v02 = mata[M00] * matb[M02] + mata[M01] * matb[M12] + mata[M02] * matb[M22];

    const v10 = mata[M10] * matb[M00] + mata[M11] * matb[M10] + mata[M12] * matb[M20];
    const v11 = mata[M10] * matb[M01] + mata[M11] * matb[M11] + mata[M12] * matb[M21];
    const v12 = mata[M10] * matb[M02] + mata[M11] * matb[M12] + mata[M12] * matb[M22];

    const v20 = mata[M20] * matb[M00] + mata[M21] * matb[M10] + mata[M22] * matb[M20];
    const v21 = mata[M20] * matb[M01] + mata[M21] * matb[M11] + mata[M22] * matb[M21];
    const v22 = mata[M20] * matb[M02] + mata[M21] * matb[M12] + mata[M22] * matb[M22];

    mata[M00] = v00;
    mata[M10] = v10;
    mata[M20] = v20;
    mata[M01] = v01;
    mata[M11] = v11;
    mata[M21] = v21;
    mata[M02] = v02;
    mata[M12] = v12;
    mata[M22] = v22;
  }
}
