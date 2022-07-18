import { Matrix4 } from './Matrix4';
import { Vector3 } from './Vector3';

export class BoundingBox {
  static tmpVector = new Vector3();

  min = new Vector3();
  max = new Vector3();
  cnt = new Vector3();
  dim = new Vector3();

  public getCenter(out: Vector3): Vector3 {
    return out.setFrom(this.cnt);
  }

  public getCenterX(): number {
    return this.cnt.x;
  }

  public getCenterY(): number {
    return this.cnt.y;
  }

  public getCenterZ(): number {
    return this.cnt.z;
  }

  public getCorner000(out: Vector3): Vector3 {
    return out.set(this.min.x, this.min.y, this.min.z);
  }

  public getCorner001(out: Vector3): Vector3 {
    return out.set(this.min.x, this.min.y, this.max.z);
  }

  public getCorner010(out: Vector3): Vector3 {
    return out.set(this.min.x, this.max.y, this.min.z);
  }

  public getCorner011(out: Vector3): Vector3 {
    return out.set(this.min.x, this.max.y, this.max.z);
  }

  public getCorner100(out: Vector3): Vector3 {
    return out.set(this.max.x, this.min.y, this.min.z);
  }

  public getCorner101(out: Vector3): Vector3 {
    return out.set(this.max.x, this.min.y, this.max.z);
  }

  public getCorner110(out: Vector3): Vector3 {
    return out.set(this.max.x, this.max.y, this.min.z);
  }

  public getCorner111(out: Vector3): Vector3 {
    return out.set(this.max.x, this.max.y, this.max.z);
  }

  /** @param out The {@link Vector3} to receive the dimensions of this bounding box on all three axis.
   * @return The vector specified with the out argument */
  public getDimensions(out: Vector3): Vector3 {
    return out.setFrom(this.dim);
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

  /** @param out The {@link Vector3} to receive the minimum values.
   * @return The vector specified with the out argument */
  public getMin(out: Vector3): Vector3 {
    return out.setFrom(this.min);
  }

  /** @param out The {@link Vector3} to receive the maximum values.
   * @return The vector specified with the out argument */
  public getMax(out: Vector3): Vector3 {
    return out.setFrom(this.max);
  }

  /** Constructs a new bounding box with the minimum and maximum vector set to zeros. */
  constructor() {
    this.clr();
  }

  /** Sets the given bounding box.
   *
   * @param bounds The bounds.
   * @return This bounding box for chaining. */
  public setFromBounds(bounds: BoundingBox): BoundingBox {
    return this.set(bounds.min, bounds.max);
  }

  /** Sets the given minimum and maximum vector.
   *
   * @param minimum The minimum vector
   * @param maximum The maximum vector
   * @return This bounding box for chaining. */
  public set(minimum: Vector3, maximum: Vector3): BoundingBox {
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
    this.cnt.setFrom(this.min).add(this.max).scale(0.5);
    this.dim.setFrom(this.max).sub(this.min);
  }

  /** Sets the bounding box minimum and maximum vector from the given points.
   *
   * @param points The points.
   * @return This bounding box for chaining. */
  public setFromPoints(points: Vector3[]): BoundingBox {
    this.inf();
    for (let l_point of points) this.extPoint(l_point);
    return this;
  }

  /** Sets the minimum and maximum vector to positive and negative infinity.
   *
   * @return This bounding box for chaining. */
  public inf(): BoundingBox {
    this.min.set(Infinity, Infinity, Infinity);
    this.max.set(-Infinity, -Infinity, -Infinity);
    this.cnt.set(0, 0, 0);
    this.dim.set(0, 0, 0);
    return this;
  }

  /** Extends the bounding box to incorporate the given {@link Vector3}.
   * @param point The vector
   * @return This bounding box for chaining. */
  public extPoint(point: Vector3): BoundingBox {
    return this.set(
      this.min.set(Math.min(this.min.x, point.x), Math.min(this.min.y, point.y), Math.min(this.min.z, point.z)),
      this.max.set(Math.max(this.max.x, point.x), Math.max(this.max.y, point.y), Math.max(this.max.z, point.z))
    );
  }

  /** Sets the minimum and maximum vector to zeros.
   * @return This bounding box for chaining. */
  public clr(): BoundingBox {
    return this.set(this.min.set(0, 0, 0), this.max.set(0, 0, 0));
  }

  /** Returns whether this bounding box is valid. This means that {@link #max} is greater than or equal to {@link #min}.
   * @return True in case the bounding box is valid, false otherwise */
  public isValid(): boolean {
    return this.min.x <= this.max.x && this.min.y <= this.max.y && this.min.z <= this.max.z;
  }

  /** Extends this bounding box by the given bounding box.
   *
   * @param a_bounds The bounding box
   * @return This bounding box for chaining. */
  public extBounds(a_bounds: BoundingBox): BoundingBox {
    return this.set(
      this.min.set(
        Math.min(this.min.x, a_bounds.min.x),
        Math.min(this.min.y, a_bounds.min.y),
        Math.min(this.min.z, a_bounds.min.z)
      ),
      this.max.set(
        Math.max(this.max.x, a_bounds.max.x),
        Math.max(this.max.y, a_bounds.max.y),
        Math.max(this.max.z, a_bounds.max.z)
      )
    );
  }

  /** Extends this bounding box by the given sphere.
   *
   * @param center Sphere center
   * @param radius Sphere radius
   * @return This bounding box for chaining. */
  public extSphere(center: Vector3, radius: number): BoundingBox {
    return this.set(
      this.min.set(
        Math.min(this.min.x, center.x - radius),
        Math.min(this.min.y, center.y - radius),
        Math.min(this.min.z, center.z - radius)
      ),
      this.max.set(
        Math.max(this.max.x, center.x + radius),
        Math.max(this.max.y, center.y + radius),
        Math.max(this.max.z, center.z + radius)
      )
    );
  }

  /** Extends this bounding box by the given transformed bounding box.
   *
   * @param bounds The bounding box
   * @param transform The transformation matrix to apply to bounds, before using it to extend this bounding box.
   * @return This bounding box for chaining. */
  public extTransformedBox(bounds: BoundingBox, transform: Matrix4): BoundingBox {
    this.extPoint(BoundingBox.tmpVector.set(bounds.min.x, bounds.min.y, bounds.min.z).multiply(transform));
    this.extPoint(BoundingBox.tmpVector.set(bounds.min.x, bounds.min.y, bounds.max.z).multiply(transform));
    this.extPoint(BoundingBox.tmpVector.set(bounds.min.x, bounds.max.y, bounds.min.z).multiply(transform));
    this.extPoint(BoundingBox.tmpVector.set(bounds.min.x, bounds.max.y, bounds.max.z).multiply(transform));
    this.extPoint(BoundingBox.tmpVector.set(bounds.max.x, bounds.min.y, bounds.min.z).multiply(transform));
    this.extPoint(BoundingBox.tmpVector.set(bounds.max.x, bounds.min.y, bounds.max.z).multiply(transform));
    this.extPoint(BoundingBox.tmpVector.set(bounds.max.x, bounds.max.y, bounds.min.z).multiply(transform));
    this.extPoint(BoundingBox.tmpVector.set(bounds.max.x, bounds.max.y, bounds.max.z).multiply(transform));
    return this;
  }

  /** Multiplies the bounding box by the given matrix. This is achieved by multiplying the 8 corner points and then calculating
   * the minimum and maximum vectors from the transformed points.
   *
   * @param transform The matrix
   * @return This bounding box for chaining. */
  public mul(transform: Matrix4): BoundingBox {
    let x0 = this.min.x,
      y0 = this.min.y,
      z0 = this.min.z,
      x1 = this.max.x,
      y1 = this.max.y,
      z1 = this.max.z;
    this.inf();
    this.extPoint(BoundingBox.tmpVector.set(x0, y0, z0).multiply(transform));
    this.extPoint(BoundingBox.tmpVector.set(x0, y0, z1).multiply(transform));
    this.extPoint(BoundingBox.tmpVector.set(x0, y1, z0).multiply(transform));
    this.extPoint(BoundingBox.tmpVector.set(x0, y1, z1).multiply(transform));
    this.extPoint(BoundingBox.tmpVector.set(x1, y0, z0).multiply(transform));
    this.extPoint(BoundingBox.tmpVector.set(x1, y0, z1).multiply(transform));
    this.extPoint(BoundingBox.tmpVector.set(x1, y1, z0).multiply(transform));
    this.extPoint(BoundingBox.tmpVector.set(x1, y1, z1).multiply(transform));
    return this;
  }

  /** Returns whether the given bounding box is contained in this bounding box.
   * @param b The bounding box
   * @return Whether the given bounding box is contained */
  public containsBounds(b: BoundingBox): boolean {
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

  /** Returns whether the given bounding box is intersecting this bounding box (at least one point in).
   * @param b The bounding box
   * @return Whether the given bounding box is intersected */
  public intersects(b: BoundingBox): boolean {
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

  /** Returns whether the given vector is contained in this bounding box.
   * @param v The vector
   * @return Whether the vector is contained or not. */
  public containsPoint(v: Vector3): boolean {
    return (
      this.min.x <= v.x &&
      this.max.x >= v.x &&
      this.min.y <= v.y &&
      this.max.y >= v.y &&
      this.min.z <= v.z &&
      this.max.z >= v.z
    );
  }

  /** Extends the bounding box by the given vector.
   *
   * @param x The x-coordinate
   * @param y The y-coordinate
   * @param z The z-coordinate
   * @return This bounding box for chaining. */
  public ext(x: number, y: number, z: number): BoundingBox {
    return this.set(
      this.min.set(Math.min(this.min.x, x), Math.min(this.min.y, y), Math.min(this.min.z, z)),
      this.max.set(Math.max(this.max.x, x), Math.max(this.max.y, y), Math.max(this.max.z, z))
    );
  }
}
