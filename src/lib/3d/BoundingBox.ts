import { Matrix4 } from '../Matrix4';
import { Vector3 } from '../Vector3';

export class BoundingBox {
  tmpVector = new Vector3();
  min = new Vector3();
  max = new Vector3();
  cnt = new Vector3();
  dim = new Vector3();

  public getCenter(out: Vector3) {
    return out.set(this.cnt.x, this.cnt.y, this.cnt.z);
  }

  public getCenterX() {
    return this.cnt.x;
  }

  public getCenterY() {
    return this.cnt.y;
  }

  public getCenterZ() {
    return this.cnt.z;
  }

  public getCorner000(out: Vector3) {
    return out.set(this.min.x, this.min.y, this.min.z);
  }

  public getCorner001(out: Vector3) {
    return out.set(this.min.x, this.min.y, this.max.z);
  }

  public getCorner010(out: Vector3) {
    return out.set(this.min.x, this.max.y, this.min.z);
  }

  public getCorner011(out: Vector3) {
    return out.set(this.min.x, this.max.y, this.max.z);
  }

  public getCorner100(out: Vector3) {
    return out.set(this.max.x, this.min.y, this.min.z);
  }

  public getCorner101(out: Vector3) {
    return out.set(this.max.x, this.min.y, this.max.z);
  }

  public getCorner110(out: Vector3) {
    return out.set(this.max.x, this.max.y, this.min.z);
  }

  public getCorner111(out: Vector3) {
    return out.set(this.max.x, this.max.y, this.max.z);
  }

  public getDimensions(out: Vector3) {
    return out.set(this.dim.x, this.dim.y, this.dim.z);
  }

  public getWidth() {
    return this.dim.x;
  }

  public getHeight() {
    return this.dim.y;
  }

  public getDepth() {
    return this.dim.z;
  }

  public getMin(out: Vector3) {
    return out.set(this.min.x, this.min.y, this.min.z);
  }

  public getMax(out: Vector3) {
    return out.set(this.max.x, this.max.y, this.max.z);
  }

  public setByBoundingBox(bounds: BoundingBox): BoundingBox {
    return this.setByMinMax(bounds.min, bounds.max);
  }

  public setByMinMax(minimum: Vector3, maximum: Vector3): BoundingBox {
    this.min.set(
      minimum.x < maximum.x ? minimum.x : maximum.x,
      minimum.y < maximum.y ? minimum.y : maximum.y,
      minimum.z < maximum.z ? minimum.z : maximum.z
    );
    this.max.set(
      minimum.x > maximum.x ? minimum.x : maximum.x,
      minimum.y > maximum.y ? minimum.y : maximum.y,
      minimum.z > maximum.z ? minimum.z : maximum.z
    );
    this.update();
    return this;
  }

  public update() {
    this.cnt.set(this.min.x, this.min.y, this.min.z).add(this.max).scale(0.5);
    this.dim.set(this.max.x, this.max.y, this.max.z).sub(this.min);
  }

  public setByArrayVector3(points: Vector3[]) {
    this.inf();
    for (const l_point of points) this.extByVector3(l_point);
    return this;
  }

  public inf(): BoundingBox {
    this.min.set(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY);
    this.max.set(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY);
    this.cnt.set(0, 0, 0);
    this.dim.set(0, 0, 0);
    return this;
  }

  public extByVector3(point: Vector3): BoundingBox {
    return this.setByMinMax(
      this.min.set(this.MIN(this.min.x, point.x), this.MIN(this.min.y, point.y), this.MIN(this.min.z, point.z)),
      this.max.set(Math.max(this.max.x, point.x), Math.max(this.max.y, point.y), Math.max(this.max.z, point.z))
    );
  }

  public clr(): BoundingBox {
    return this.setByMinMax(this.min.set(0, 0, 0), this.max.set(0, 0, 0));
  }

  public isValid(): boolean {
    return this.min.x <= this.max.x && this.min.y <= this.max.y && this.min.z <= this.max.z;
  }

  public extByBoundingBox(a_bounds: BoundingBox): BoundingBox {
    return this.setByMinMax(
      this.min.set(
        this.MIN(this.min.x, a_bounds.min.x),
        this.MIN(this.min.y, a_bounds.min.y),
        this.MIN(this.min.z, a_bounds.min.z)
      ),
      this.max.set(
        this.MAX(this.max.x, a_bounds.max.x),
        this.MAX(this.max.y, a_bounds.max.y),
        this.MAX(this.max.z, a_bounds.max.z)
      )
    );
  }

  public extByRadius(center: Vector3, radius: number): BoundingBox {
    return this.setByMinMax(
      this.min.set(
        this.MIN(this.min.x, center.x - radius),
        this.MIN(this.min.y, center.y - radius),
        this.MIN(this.min.z, center.z - radius)
      ),
      this.max.set(
        this.MAX(this.max.x, center.x + radius),
        this.MAX(this.max.y, center.y + radius),
        this.MAX(this.max.z, center.z + radius)
      )
    );
  }

  public extByBoundingBoxAndTransform(bounds: BoundingBox, transform: Matrix4): BoundingBox {
    this.extByVector3(this.tmpVector.set(bounds.min.x, bounds.min.y, bounds.min.z).multiply(transform));
    this.extByVector3(this.tmpVector.set(bounds.min.x, bounds.min.y, bounds.max.z).multiply(transform));
    this.extByVector3(this.tmpVector.set(bounds.min.x, bounds.max.y, bounds.min.z).multiply(transform));
    this.extByVector3(this.tmpVector.set(bounds.min.x, bounds.max.y, bounds.max.z).multiply(transform));
    this.extByVector3(this.tmpVector.set(bounds.max.x, bounds.min.y, bounds.min.z).multiply(transform));
    this.extByVector3(this.tmpVector.set(bounds.max.x, bounds.min.y, bounds.max.z).multiply(transform));
    this.extByVector3(this.tmpVector.set(bounds.max.x, bounds.max.y, bounds.min.z).multiply(transform));
    this.extByVector3(this.tmpVector.set(bounds.max.x, bounds.max.y, bounds.max.z).multiply(transform));
    return this;
  }

  public multiply(transform: Matrix4): BoundingBox {
    const x0 = this.min.x,
      y0 = this.min.y,
      z0 = this.min.z,
      x1 = this.max.x,
      y1 = this.max.y,
      z1 = this.max.z;
    this.inf();
    this.extByVector3(this.tmpVector.set(x0, y0, z0).multiply(transform));
    this.extByVector3(this.tmpVector.set(x0, y0, z1).multiply(transform));
    this.extByVector3(this.tmpVector.set(x0, y1, z0).multiply(transform));
    this.extByVector3(this.tmpVector.set(x0, y1, z1).multiply(transform));
    this.extByVector3(this.tmpVector.set(x1, y0, z0).multiply(transform));
    this.extByVector3(this.tmpVector.set(x1, y0, z1).multiply(transform));
    this.extByVector3(this.tmpVector.set(x1, y1, z0).multiply(transform));
    this.extByVector3(this.tmpVector.set(x1, y1, z1).multiply(transform));
    return this;
  }

  public containsBoundingBox(b: BoundingBox): boolean {
    return (
      !this.isValid() ||
      (this.min.x <= b.min.x &&
        this.min.y <= b.min.y &&
        this.min.z <= b.min.z &&
        this.max.x >= b.max.x &&
        this.max.y >= b.max.y &&
        this.max.z >= b.max.z)
    );
  }

  public intersects(b: BoundingBox) {
    if (!this.isValid()) return false;

    // test using SAT (separating axis theorem)

    const lx = Math.abs(this.cnt.x - b.cnt.x);
    const sumx = this.dim.x / 2.0 + b.dim.x / 2.0;

    const ly = Math.abs(this.cnt.y - b.cnt.y);
    const sumy = this.dim.y / 2.0 + b.dim.y / 2.0;

    const lz = Math.abs(this.cnt.z - b.cnt.z);
    const sumz = this.dim.z / 2.0 + b.dim.z / 2.0;

    return lx <= sumx && ly <= sumy && lz <= sumz;
  }

  public contains(v: Vector3) {
    return (
      this.min.x <= v.x &&
      this.max.x >= v.x &&
      this.min.y <= v.y &&
      this.max.y >= v.y &&
      this.min.z <= v.z &&
      this.max.z >= v.z
    );
  }

  public toString(): string {
    return '[' + this.min + '|' + this.max + ']';
  }

  public ext(x: number, y: number, z: number): BoundingBox {
    return this.setByMinMax(
      this.min.set(this.MIN(this.min.x, x), this.MIN(this.min.y, y), this.MIN(this.min.z, z)),
      this.max.set(this.MAX(this.max.x, x), this.MAX(this.max.y, y), this.MAX(this.max.z, z))
    );
  }

  public MIN(a: number, b: number) {
    return a > b ? b : a;
  }

  public MAX(a: number, b: number) {
    return a > b ? a : b;
  }
}
