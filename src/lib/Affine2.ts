import { Matrix3 } from './Matrix3';
import { Matrix4 } from './Matrix4';
import { Vector2 } from './Vector2';

export class Affine2 {
  public m00 = 1;
  public m01 = 0;
  public m02 = 0;
  public m10 = 0;
  public m11 = 1;
  public m12 = 0;

  public idt(): Affine2 {
    this.m00 = 1;
    this.m01 = 0;
    this.m02 = 0;
    this.m10 = 0;
    this.m11 = 1;
    this.m12 = 0;
    return this;
  }

  public set(other: Affine2): Affine2 {
    this.m00 = other.m00;
    this.m01 = other.m01;
    this.m02 = other.m02;
    this.m10 = other.m10;
    this.m11 = other.m11;
    this.m12 = other.m12;
    return this;
  }

  public setMatrix3(matrix: Matrix3): Affine2 {
    const other = matrix.val;

    this.m00 = other[Matrix3.M00];
    this.m01 = other[Matrix3.M01];
    this.m02 = other[Matrix3.M02];
    this.m10 = other[Matrix3.M10];
    this.m11 = other[Matrix3.M11];
    this.m12 = other[Matrix3.M12];
    return this;
  }

  public setMatrix4(matrix: Matrix4): Affine2 {
    const other = matrix.values;

    this.m00 = other[Matrix4.M00];
    this.m01 = other[Matrix4.M01];
    this.m02 = other[Matrix4.M03];
    this.m10 = other[Matrix4.M10];
    this.m11 = other[Matrix4.M11];
    this.m12 = other[Matrix4.M13];
    return this;
  }

  public setToTranslation(x: number, y: number): Affine2 {
    this.m00 = 1;
    this.m01 = 0;
    this.m02 = x;
    this.m10 = 0;
    this.m11 = 1;
    this.m12 = y;
    return this;
  }

  public setToScaling(scaleX: number, scaleY: number): Affine2 {
    this.m00 = scaleX;
    this.m01 = 0;
    this.m02 = 0;
    this.m10 = 0;
    this.m11 = scaleY;
    this.m12 = 0;
    return this;
  }

  public setToRotation(degrees: number): Affine2 {
    const cos = Math.cos(degrees * (180 / Math.PI));
    const sin = Math.sin(degrees * (180 / Math.PI));

    this.m00 = cos;
    this.m01 = -sin;
    this.m02 = 0;
    this.m10 = sin;
    this.m11 = cos;
    this.m12 = 0;
    return this;
  }

  public setToRotationRad(radians: number): Affine2 {
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    this.m00 = cos;
    this.m01 = -sin;
    this.m02 = 0;
    this.m10 = sin;
    this.m11 = cos;
    this.m12 = 0;
    return this;
  }

  public setToShearing(shearX: number, shearY: number): Affine2 {
    this.m00 = 1;
    this.m01 = shearX;
    this.m02 = 0;
    this.m10 = shearY;
    this.m11 = 1;
    this.m12 = 0;
    return this;
  }

  public setToTrnRotScl(x: number, y: number, degrees: number, scaleX: number, scaleY: number): Affine2 {
    this.m02 = x;
    this.m12 = y;

    if (degrees === 0) {
      this.m00 = scaleX;
      this.m01 = 0;
      this.m10 = 0;
      this.m11 = scaleY;
    } else {
      const sin = Math.sin(degrees * (180 / Math.PI));
      const cos = Math.cos(degrees * (180 / Math.PI));

      this.m00 = cos * scaleX;
      this.m01 = -sin * scaleY;
      this.m10 = sin * scaleX;
      this.m11 = cos * scaleY;
    }
    return this;
  }

  public setToTrnRotRadScl(x: number, y: number, radians: number, scaleX: number, scaleY: number): Affine2 {
    this.m02 = x;
    this.m12 = y;

    if (radians === 0) {
      this.m00 = scaleX;
      this.m01 = 0;
      this.m10 = 0;
      this.m11 = scaleY;
    } else {
      const sin = Math.sin(radians);
      const cos = Math.cos(radians);

      this.m00 = cos * scaleX;
      this.m01 = -sin * scaleY;
      this.m10 = sin * scaleX;
      this.m11 = cos * scaleY;
    }
    return this;
  }

  public setToTrnScl(x: number, y: number, scaleX: number, scaleY: number): Affine2 {
    this.m00 = scaleX;
    this.m01 = 0;
    this.m02 = x;
    this.m10 = 0;
    this.m11 = scaleY;
    this.m12 = y;
    return this;
  }

  public setToProduct(l: Affine2, r: Affine2): Affine2 {
    this.m00 = l.m00 * r.m00 + l.m01 * r.m10;
    this.m01 = l.m00 * r.m01 + l.m01 * r.m11;
    this.m02 = l.m00 * r.m02 + l.m01 * r.m12 + l.m02;
    this.m10 = l.m10 * r.m00 + l.m11 * r.m10;
    this.m11 = l.m10 * r.m01 + l.m11 * r.m11;
    this.m12 = l.m10 * r.m02 + l.m11 * r.m12 + l.m12;
    return this;
  }

  public inv(): Affine2 {
    const det = this.det();
    if (det === 0) throw new Error("Can't invert a singular affine matrix");

    const invDet = 1 / det;

    const tmp00 = this.m11;
    const tmp01 = -this.m01;
    const tmp02 = this.m01 * this.m12 - this.m11 * this.m02;
    const tmp10 = -this.m10;
    const tmp11 = this.m00;
    const tmp12 = this.m10 * this.m02 - this.m00 * this.m12;

    this.m00 = invDet * tmp00;
    this.m01 = invDet * tmp01;
    this.m02 = invDet * tmp02;
    this.m10 = invDet * tmp10;
    this.m11 = invDet * tmp11;
    this.m12 = invDet * tmp12;
    return this;
  }

  public mul(other: Affine2): Affine2 {
    const tmp00 = this.m00 * other.m00 + this.m01 * other.m10;
    const tmp01 = this.m00 * other.m01 + this.m01 * other.m11;
    const tmp02 = this.m00 * other.m02 + this.m01 * other.m12 + this.m02;
    const tmp10 = this.m10 * other.m00 + this.m11 * other.m10;
    const tmp11 = this.m10 * other.m01 + this.m11 * other.m11;
    const tmp12 = this.m10 * other.m02 + this.m11 * other.m12 + this.m12;

    this.m00 = tmp00;
    this.m01 = tmp01;
    this.m02 = tmp02;
    this.m10 = tmp10;
    this.m11 = tmp11;
    this.m12 = tmp12;
    return this;
  }

  public preMul(other: Affine2): Affine2 {
    const tmp00 = other.m00 * this.m00 + other.m01 * this.m10;
    const tmp01 = other.m00 * this.m01 + other.m01 * this.m11;
    const tmp02 = other.m00 * this.m02 + other.m01 * this.m12 + other.m02;
    const tmp10 = other.m10 * this.m00 + other.m11 * this.m10;
    const tmp11 = other.m10 * this.m01 + other.m11 * this.m11;
    const tmp12 = other.m10 * this.m02 + other.m11 * this.m12 + other.m12;

    this.m00 = tmp00;
    this.m01 = tmp01;
    this.m02 = tmp02;
    this.m10 = tmp10;
    this.m11 = tmp11;
    this.m12 = tmp12;
    return this;
  }

  public translate(x: number, y: number): Affine2 {
    this.m02 += this.m00 * x + this.m01 * y;
    this.m12 += this.m10 * x + this.m11 * y;
    return this;
  }

  public preTranslate(x: number, y: number): Affine2 {
    this.m02 += x;
    this.m12 += y;
    return this;
  }

  public scale(scaleX: number, scaleY: number): Affine2 {
    this.m00 *= scaleX;
    this.m01 *= scaleY;
    this.m10 *= scaleX;
    this.m11 *= scaleY;
    return this;
  }

  public preScale(scaleX: number, scaleY: number): Affine2 {
    this.m00 *= scaleX;
    this.m01 *= scaleX;
    this.m02 *= scaleX;
    this.m10 *= scaleY;
    this.m11 *= scaleY;
    this.m12 *= scaleY;
    return this;
  }

  public rotate(degrees: number): Affine2 {
    if (degrees === 0) return this;

    const cos = Math.cos(degrees * (180 / Math.PI));
    const sin = Math.sin(degrees * (180 / Math.PI));

    const tmp00 = this.m00 * cos + this.m01 * sin;
    const tmp01 = this.m00 * -sin + this.m01 * cos;
    const tmp10 = this.m10 * cos + this.m11 * sin;
    const tmp11 = this.m10 * -sin + this.m11 * cos;

    this.m00 = tmp00;
    this.m01 = tmp01;
    this.m10 = tmp10;
    this.m11 = tmp11;
    return this;
  }

  public rotateRad(radians: number): Affine2 {
    if (radians === 0) return this;

    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    const tmp00 = this.m00 * cos + this.m01 * sin;
    const tmp01 = this.m00 * -sin + this.m01 * cos;
    const tmp10 = this.m10 * cos + this.m11 * sin;
    const tmp11 = this.m10 * -sin + this.m11 * cos;

    this.m00 = tmp00;
    this.m01 = tmp01;
    this.m10 = tmp10;
    this.m11 = tmp11;
    return this;
  }

  public preRotate(degrees: number): Affine2 {
    if (degrees === 0) return this;

    const cos = Math.cos(degrees * (180 / Math.PI));
    const sin = Math.sin(degrees * (180 / Math.PI));

    const tmp00 = cos * this.m00 - sin * this.m10;
    const tmp01 = cos * this.m01 - sin * this.m11;
    const tmp02 = cos * this.m02 - sin * this.m12;
    const tmp10 = sin * this.m00 + cos * this.m10;
    const tmp11 = sin * this.m01 + cos * this.m11;
    const tmp12 = sin * this.m02 + cos * this.m12;

    this.m00 = tmp00;
    this.m01 = tmp01;
    this.m02 = tmp02;
    this.m10 = tmp10;
    this.m11 = tmp11;
    this.m12 = tmp12;
    return this;
  }

  public preRotateRad(radians: number): Affine2 {
    if (radians === 0) return this;

    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    const tmp00 = cos * this.m00 - sin * this.m10;
    const tmp01 = cos * this.m01 - sin * this.m11;
    const tmp02 = cos * this.m02 - sin * this.m12;
    const tmp10 = sin * this.m00 + cos * this.m10;
    const tmp11 = sin * this.m01 + cos * this.m11;
    const tmp12 = sin * this.m02 + cos * this.m12;

    this.m00 = tmp00;
    this.m01 = tmp01;
    this.m02 = tmp02;
    this.m10 = tmp10;
    this.m11 = tmp11;
    this.m12 = tmp12;
    return this;
  }

  public shear(shearX: number, shearY: number): Affine2 {
    let tmp0 = this.m00 + shearY * this.m01;
    let tmp1 = this.m01 + shearX * this.m00;
    this.m00 = tmp0;
    this.m01 = tmp1;

    tmp0 = this.m10 + shearY * this.m11;
    tmp1 = this.m11 + shearX * this.m10;
    this.m10 = tmp0;
    this.m11 = tmp1;
    return this;
  }

  public preShear(shearX: number, shearY: number): Affine2 {
    const tmp00 = this.m00 + shearX * this.m10;
    const tmp01 = this.m01 + shearX * this.m11;
    const tmp02 = this.m02 + shearX * this.m12;
    const tmp10 = this.m10 + shearY * this.m00;
    const tmp11 = this.m11 + shearY * this.m01;
    const tmp12 = this.m12 + shearY * this.m02;

    this.m00 = tmp00;
    this.m01 = tmp01;
    this.m02 = tmp02;
    this.m10 = tmp10;
    this.m11 = tmp11;
    this.m12 = tmp12;
    return this;
  }

  public det(): number {
    return this.m00 * this.m11 - this.m01 * this.m10;
  }

  public getTranslation(position: Vector2): Vector2 {
    position.x = this.m02;
    position.y = this.m12;
    return position;
  }

  public isTranslation(): boolean {
    return this.m00 === 1 && this.m11 === 1 && this.m01 === 0 && this.m10 === 0;
  }

  public isIdt(): boolean {
    return this.m00 === 1 && this.m02 === 0 && this.m12 === 0 && this.m11 === 1 && this.m01 === 0 && this.m10 === 0;
  }

  public applyTo(point: Vector2) {
    const x = point.x;
    const y = point.y;
    point.x = this.m00 * x + this.m01 * y + this.m02;
    point.y = this.m10 * x + this.m11 * y + this.m12;
  }
}
