import { Matrix4 } from './Matrix4';
import { MathUtils } from './Utils';
import { Vector2 } from './Vector2';
import { Vector3 } from './Vector3';

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
      this.setFromMatrix3(matrix);
    } else {
      this.idt();
    }
  }

  public idt(): Matrix3 {
    const val = this.val;
    val[Matrix3.M00] = 1;
    val[Matrix3.M10] = 0;
    val[Matrix3.M20] = 0;
    val[Matrix3.M01] = 0;
    val[Matrix3.M11] = 1;
    val[Matrix3.M21] = 0;
    val[Matrix3.M02] = 0;
    val[Matrix3.M12] = 0;
    val[Matrix3.M22] = 1;
    return this;
  }

  public mulWithMatrix3(m: Matrix3): Matrix3 {
    const val = this.val;

    const v00 =
      val[Matrix3.M00] * m.val[Matrix3.M00] +
      val[Matrix3.M01] * m.val[Matrix3.M10] +
      val[Matrix3.M02] * m.val[Matrix3.M20];
    const v01 =
      val[Matrix3.M00] * m.val[Matrix3.M01] +
      val[Matrix3.M01] * m.val[Matrix3.M11] +
      val[Matrix3.M02] * m.val[Matrix3.M21];
    const v02 =
      val[Matrix3.M00] * m.val[Matrix3.M02] +
      val[Matrix3.M01] * m.val[Matrix3.M12] +
      val[Matrix3.M02] * m.val[Matrix3.M22];

    const v10 =
      val[Matrix3.M10] * m.val[Matrix3.M00] +
      val[Matrix3.M11] * m.val[Matrix3.M10] +
      val[Matrix3.M12] * m.val[Matrix3.M20];
    const v11 =
      val[Matrix3.M10] * m.val[Matrix3.M01] +
      val[Matrix3.M11] * m.val[Matrix3.M11] +
      val[Matrix3.M12] * m.val[Matrix3.M21];
    const v12 =
      val[Matrix3.M10] * m.val[Matrix3.M02] +
      val[Matrix3.M11] * m.val[Matrix3.M12] +
      val[Matrix3.M12] * m.val[Matrix3.M22];

    const v20 =
      val[Matrix3.M20] * m.val[Matrix3.M00] +
      val[Matrix3.M21] * m.val[Matrix3.M10] +
      val[Matrix3.M22] * m.val[Matrix3.M20];
    const v21 =
      val[Matrix3.M20] * m.val[Matrix3.M01] +
      val[Matrix3.M21] * m.val[Matrix3.M11] +
      val[Matrix3.M22] * m.val[Matrix3.M21];
    const v22 =
      val[Matrix3.M20] * m.val[Matrix3.M02] +
      val[Matrix3.M21] * m.val[Matrix3.M12] +
      val[Matrix3.M22] * m.val[Matrix3.M22];

    val[Matrix3.M00] = v00;
    val[Matrix3.M10] = v10;
    val[Matrix3.M20] = v20;
    val[Matrix3.M01] = v01;
    val[Matrix3.M11] = v11;
    val[Matrix3.M21] = v21;
    val[Matrix3.M02] = v02;
    val[Matrix3.M12] = v12;
    val[Matrix3.M22] = v22;

    return this;
  }

  public mulLeft(m: Matrix3): Matrix3 {
    const val = this.val;

    const v00 =
      m.val[Matrix3.M00] * val[Matrix3.M00] +
      m.val[Matrix3.M01] * val[Matrix3.M10] +
      m.val[Matrix3.M02] * val[Matrix3.M20];
    const v01 =
      m.val[Matrix3.M00] * val[Matrix3.M01] +
      m.val[Matrix3.M01] * val[Matrix3.M11] +
      m.val[Matrix3.M02] * val[Matrix3.M21];
    const v02 =
      m.val[Matrix3.M00] * val[Matrix3.M02] +
      m.val[Matrix3.M01] * val[Matrix3.M12] +
      m.val[Matrix3.M02] * val[Matrix3.M22];

    const v10 =
      m.val[Matrix3.M10] * val[Matrix3.M00] +
      m.val[Matrix3.M11] * val[Matrix3.M10] +
      m.val[Matrix3.M12] * val[Matrix3.M20];
    const v11 =
      m.val[Matrix3.M10] * val[Matrix3.M01] +
      m.val[Matrix3.M11] * val[Matrix3.M11] +
      m.val[Matrix3.M12] * val[Matrix3.M21];
    const v12 =
      m.val[Matrix3.M10] * val[Matrix3.M02] +
      m.val[Matrix3.M11] * val[Matrix3.M12] +
      m.val[Matrix3.M12] * val[Matrix3.M22];

    const v20 =
      m.val[Matrix3.M20] * val[Matrix3.M00] +
      m.val[Matrix3.M21] * val[Matrix3.M10] +
      m.val[Matrix3.M22] * val[Matrix3.M20];
    const v21 =
      m.val[Matrix3.M20] * val[Matrix3.M01] +
      m.val[Matrix3.M21] * val[Matrix3.M11] +
      m.val[Matrix3.M22] * val[Matrix3.M21];
    const v22 =
      m.val[Matrix3.M20] * val[Matrix3.M02] +
      m.val[Matrix3.M21] * val[Matrix3.M12] +
      m.val[Matrix3.M22] * val[Matrix3.M22];

    val[Matrix3.M00] = v00;
    val[Matrix3.M10] = v10;
    val[Matrix3.M20] = v20;
    val[Matrix3.M01] = v01;
    val[Matrix3.M11] = v11;
    val[Matrix3.M21] = v21;
    val[Matrix3.M02] = v02;
    val[Matrix3.M12] = v12;
    val[Matrix3.M22] = v22;

    return this;
  }

  public setToRotation(degrees: number): Matrix3 {
    return this.setToRotationRad(MathUtils.degreesToRadians * degrees);
  }

  public setToRotationRad(radians: number): Matrix3 {
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const val = this.val;

    val[Matrix3.M00] = cos;
    val[Matrix3.M10] = sin;
    val[Matrix3.M20] = 0;

    val[Matrix3.M01] = -sin;
    val[Matrix3.M11] = cos;
    val[Matrix3.M21] = 0;

    val[Matrix3.M02] = 0;
    val[Matrix3.M12] = 0;
    val[Matrix3.M22] = 1;

    return this;
  }

  public setToRotationWithAxis(axis: Vector3, degrees: number): Matrix3 {
    const cos = Math.cos(degrees);
    const sin = Math.sin(degrees);

    const val = this.val;
    const oc = 1.0 - cos;
    val[Matrix3.M00] = oc * axis.x * axis.x + cos;
    val[Matrix3.M01] = oc * axis.x * axis.y - axis.z * sin;
    val[Matrix3.M02] = oc * axis.z * axis.x + axis.y * sin;
    val[Matrix3.M10] = oc * axis.x * axis.y + axis.z * sin;
    val[Matrix3.M11] = oc * axis.y * axis.y + cos;
    val[Matrix3.M12] = oc * axis.y * axis.z - axis.x * sin;
    val[Matrix3.M20] = oc * axis.z * axis.x - axis.y * sin;
    val[Matrix3.M21] = oc * axis.y * axis.z + axis.x * sin;
    val[Matrix3.M22] = oc * axis.z * axis.z + cos;
    return this;
  }

  public setToTranslation(x: number, y: number): Matrix3 {
    const val = this.val;

    val[Matrix3.M00] = 1;
    val[Matrix3.M10] = 0;
    val[Matrix3.M20] = 0;

    val[Matrix3.M01] = 0;
    val[Matrix3.M11] = 1;
    val[Matrix3.M21] = 0;

    val[Matrix3.M02] = x;
    val[Matrix3.M12] = y;
    val[Matrix3.M22] = 1;

    return this;
  }

  public setToScaling(scaleX: number, scaleY: number): Matrix3 {
    const val = this.val;
    val[Matrix3.M00] = scaleX;
    val[Matrix3.M10] = 0;
    val[Matrix3.M20] = 0;
    val[Matrix3.M01] = 0;
    val[Matrix3.M11] = scaleY;
    val[Matrix3.M21] = 0;
    val[Matrix3.M02] = 0;
    val[Matrix3.M12] = 0;
    val[Matrix3.M22] = 1;
    return this;
  }

  public toString(): string {
    const val = this.val;
    return (
      '[' +
      val[Matrix3.M00] +
      '|' +
      val[Matrix3.M01] +
      '|' +
      val[Matrix3.M02] +
      ']\n' +
      '[' +
      val[Matrix3.M10] +
      '|' +
      val[Matrix3.M11] +
      '|' +
      val[Matrix3.M12] +
      ']\n' +
      '[' +
      val[Matrix3.M20] +
      '|' +
      val[Matrix3.M21] +
      '|' +
      val[Matrix3.M22] +
      ']'
    );
  }

  public det() {
    const val = this.val;
    return (
      val[Matrix3.M00] * val[Matrix3.M11] * val[Matrix3.M22] +
      val[Matrix3.M01] * val[Matrix3.M12] * val[Matrix3.M20] +
      val[Matrix3.M02] * val[Matrix3.M10] * val[Matrix3.M21] -
      val[Matrix3.M00] * val[Matrix3.M12] * val[Matrix3.M21] -
      val[Matrix3.M01] * val[Matrix3.M10] * val[Matrix3.M22] -
      val[Matrix3.M02] * val[Matrix3.M11] * val[Matrix3.M20]
    );
  }

  public inv(): Matrix3 {
    const det = this.det();
    if (det === 0) throw new Error("Can't invert a singular matrix");

    const inv_det = 1.0 / det;
    const tmp = this.tmp,
      val = this.val;

    tmp[Matrix3.M00] = val[Matrix3.M11] * val[Matrix3.M22] - val[Matrix3.M21] * val[Matrix3.M12];
    tmp[Matrix3.M10] = val[Matrix3.M20] * val[Matrix3.M12] - val[Matrix3.M10] * val[Matrix3.M22];
    tmp[Matrix3.M20] = val[Matrix3.M10] * val[Matrix3.M21] - val[Matrix3.M20] * val[Matrix3.M11];
    tmp[Matrix3.M01] = val[Matrix3.M21] * val[Matrix3.M02] - val[Matrix3.M01] * val[Matrix3.M22];
    tmp[Matrix3.M11] = val[Matrix3.M00] * val[Matrix3.M22] - val[Matrix3.M20] * val[Matrix3.M02];
    tmp[Matrix3.M21] = val[Matrix3.M20] * val[Matrix3.M01] - val[Matrix3.M00] * val[Matrix3.M21];
    tmp[Matrix3.M02] = val[Matrix3.M01] * val[Matrix3.M12] - val[Matrix3.M11] * val[Matrix3.M02];
    tmp[Matrix3.M12] = val[Matrix3.M10] * val[Matrix3.M02] - val[Matrix3.M00] * val[Matrix3.M12];
    tmp[Matrix3.M22] = val[Matrix3.M00] * val[Matrix3.M11] - val[Matrix3.M10] * val[Matrix3.M01];

    val[Matrix3.M00] = inv_det * tmp[Matrix3.M00];
    val[Matrix3.M10] = inv_det * tmp[Matrix3.M10];
    val[Matrix3.M20] = inv_det * tmp[Matrix3.M20];
    val[Matrix3.M01] = inv_det * tmp[Matrix3.M01];
    val[Matrix3.M11] = inv_det * tmp[Matrix3.M11];
    val[Matrix3.M21] = inv_det * tmp[Matrix3.M21];
    val[Matrix3.M02] = inv_det * tmp[Matrix3.M02];
    val[Matrix3.M12] = inv_det * tmp[Matrix3.M12];
    val[Matrix3.M22] = inv_det * tmp[Matrix3.M22];

    return this;
  }

  public setFromMatrix3(mat: Matrix3): Matrix3 {
    for (const v of mat.val) {
      this.val.push(v);
    }
    return this;
  }

  public setFromMatrix4(mat: Matrix4): Matrix3 {
    const val = this.val;
    val[Matrix3.M00] = mat.values[Matrix4.M00];
    val[Matrix3.M10] = mat.values[Matrix4.M10];
    val[Matrix3.M20] = mat.values[Matrix4.M20];
    val[Matrix3.M01] = mat.values[Matrix4.M01];
    val[Matrix3.M11] = mat.values[Matrix4.M11];
    val[Matrix3.M21] = mat.values[Matrix4.M21];
    val[Matrix3.M02] = mat.values[Matrix4.M02];
    val[Matrix3.M12] = mat.values[Matrix4.M12];
    val[Matrix3.M22] = mat.values[Matrix4.M22];
    return this;
  }

  public trnByVector2(vector: Vector2): Matrix3 {
    const val = this.val;
    val[Matrix3.M02] += vector.x;
    val[Matrix3.M12] += vector.y;
    return this;
  }

  public trnByMatrix3(x: number, y: number): Matrix3 {
    const val = this.val;
    val[Matrix3.M02] += x;
    val[Matrix3.M12] += y;
    return this;
  }

  public trnByVector3(vector: Vector3): Matrix3 {
    const val = this.val;
    val[Matrix3.M02] += vector.x;
    val[Matrix3.M12] += vector.y;
    return this;
  }

  public translate(x: number, y: number): Matrix3 {
    const val = this.val;
    this.tmp[Matrix3.M00] = 1;
    this.tmp[Matrix3.M10] = 0;
    this.tmp[Matrix3.M20] = 0;

    this.tmp[Matrix3.M01] = 0;
    this.tmp[Matrix3.M11] = 1;
    this.tmp[Matrix3.M21] = 0;

    this.tmp[Matrix3.M02] = x;
    this.tmp[Matrix3.M12] = y;
    this.tmp[Matrix3.M22] = 1;
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

    tmp[Matrix3.M00] = cos;
    tmp[Matrix3.M10] = sin;
    tmp[Matrix3.M20] = 0;

    tmp[Matrix3.M01] = -sin;
    tmp[Matrix3.M11] = cos;
    tmp[Matrix3.M21] = 0;

    tmp[Matrix3.M02] = 0;
    tmp[Matrix3.M12] = 0;
    tmp[Matrix3.M22] = 1;
    Matrix3.mul(this.val, tmp);
    return this;
  }

  public scale(scaleX: number, scaleY: number): Matrix3 {
    const tmp = this.tmp;
    tmp[Matrix3.M00] = scaleX;
    tmp[Matrix3.M10] = 0;
    tmp[Matrix3.M20] = 0;
    tmp[Matrix3.M01] = 0;
    tmp[Matrix3.M11] = scaleY;
    tmp[Matrix3.M21] = 0;
    tmp[Matrix3.M02] = 0;
    tmp[Matrix3.M12] = 0;
    tmp[Matrix3.M22] = 1;
    Matrix3.mul(this.val, tmp);
    return this;
  }

  public getValues() {
    return this.val;
  }

  public getTranslation(position: Vector2): Vector2 {
    position.x = this.val[Matrix3.M02];
    position.y = this.val[Matrix3.M12];
    return position;
  }

  public getScale(scale: Vector2): Vector2 {
    const val = this.val;
    scale.x = Math.sqrt(val[Matrix3.M00] * val[Matrix3.M00] + val[Matrix3.M01] * val[Matrix3.M01]);
    scale.y = Math.sqrt(val[Matrix3.M10] * val[Matrix3.M10] + val[Matrix3.M11] * val[Matrix3.M11]);
    return scale;
  }

  public getRotation() {
    return MathUtils.radiansToDegrees * Math.atan2(this.val[Matrix3.M10], this.val[Matrix3.M00]);
  }

  public getRotationRad() {
    return Math.atan2(this.val[Matrix3.M10], this.val[Matrix3.M00]);
  }

  public sclByNumber(scale: number): Matrix3 {
    this.val[Matrix3.M00] *= scale;
    this.val[Matrix3.M11] *= scale;
    return this;
  }

  public sclByVector2(scale: Vector2): Matrix3 {
    this.val[Matrix3.M00] *= scale.x;
    this.val[Matrix3.M11] *= scale.y;
    return this;
  }

  public scl(scale: Vector3): Matrix3 {
    this.val[Matrix3.M00] *= scale.x;
    this.val[Matrix3.M11] *= scale.y;
    return this;
  }

  public transpose(): Matrix3 {
    const val = this.val;
    const v01 = val[Matrix3.M10];
    const v02 = val[Matrix3.M20];
    const v10 = val[Matrix3.M01];
    const v12 = val[Matrix3.M21];
    const v20 = val[Matrix3.M02];
    const v21 = val[Matrix3.M12];
    val[Matrix3.M01] = v01;
    val[Matrix3.M02] = v02;
    val[Matrix3.M10] = v10;
    val[Matrix3.M12] = v12;
    val[Matrix3.M20] = v20;
    val[Matrix3.M21] = v21;
    return this;
  }

  private static mul(mata: number[], matb: number[]) {
    const v00 =
      mata[Matrix3.M00] * matb[Matrix3.M00] +
      mata[Matrix3.M01] * matb[Matrix3.M10] +
      mata[Matrix3.M02] * matb[Matrix3.M20];
    const v01 =
      mata[Matrix3.M00] * matb[Matrix3.M01] +
      mata[Matrix3.M01] * matb[Matrix3.M11] +
      mata[Matrix3.M02] * matb[Matrix3.M21];
    const v02 =
      mata[Matrix3.M00] * matb[Matrix3.M02] +
      mata[Matrix3.M01] * matb[Matrix3.M12] +
      mata[Matrix3.M02] * matb[Matrix3.M22];

    const v10 =
      mata[Matrix3.M10] * matb[Matrix3.M00] +
      mata[Matrix3.M11] * matb[Matrix3.M10] +
      mata[Matrix3.M12] * matb[Matrix3.M20];
    const v11 =
      mata[Matrix3.M10] * matb[Matrix3.M01] +
      mata[Matrix3.M11] * matb[Matrix3.M11] +
      mata[Matrix3.M12] * matb[Matrix3.M21];
    const v12 =
      mata[Matrix3.M10] * matb[Matrix3.M02] +
      mata[Matrix3.M11] * matb[Matrix3.M12] +
      mata[Matrix3.M12] * matb[Matrix3.M22];

    const v20 =
      mata[Matrix3.M20] * matb[Matrix3.M00] +
      mata[Matrix3.M21] * matb[Matrix3.M10] +
      mata[Matrix3.M22] * matb[Matrix3.M20];
    const v21 =
      mata[Matrix3.M20] * matb[Matrix3.M01] +
      mata[Matrix3.M21] * matb[Matrix3.M11] +
      mata[Matrix3.M22] * matb[Matrix3.M21];
    const v22 =
      mata[Matrix3.M20] * matb[Matrix3.M02] +
      mata[Matrix3.M21] * matb[Matrix3.M12] +
      mata[Matrix3.M22] * matb[Matrix3.M22];

    mata[Matrix3.M00] = v00;
    mata[Matrix3.M10] = v10;
    mata[Matrix3.M20] = v20;
    mata[Matrix3.M01] = v01;
    mata[Matrix3.M11] = v11;
    mata[Matrix3.M21] = v21;
    mata[Matrix3.M02] = v02;
    mata[Matrix3.M12] = v12;
    mata[Matrix3.M22] = v22;
  }
}
