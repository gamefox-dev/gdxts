import { Matrix4 } from "../Matrix4";
import { Vector3 } from "../Vector3";

export class PerspectiveCamera {
  far = 100;
  near = 1;
  fieldOfView = 67;
  viewportWidth = 0;
  viewportHeight = 0;
  up = new Vector3(0, 1, 0);
  position = new Vector3(0, 0, 0);
  direction = new Vector3(0, 0, -1);
  view = new Matrix4();
  combined = new Matrix4();
  projection = new Matrix4();
  invProjectionView = new Matrix4();

  constructor(
    fieldOfViewY: number,
    viewportWidth: number,
    viewportHeight: number
  ) {
    this.fieldOfView = fieldOfViewY;
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.update();
  }

  tmp3: Vector3 = new Vector3();
  update() {
    const aspect = this.viewportWidth / this.viewportHeight;
    this.projection.projection(
      Math.abs(this.near),
      Math.abs(this.far),
      this.fieldOfView,
      aspect
    );
    this.view.lookAt(
      this.position,
      this.tmp3
        .set(this.position.x, this.position.y, this.position.z)
        .add(this.direction),
      this.up
    );
    this.combined.set(this.projection.values);
    this.combined.multiply(this.view);

    this.invProjectionView.set(this.combined.values);
    this.invProjectionView.invert();
  }

  lookAt(x: number, y: number, z: number) {
    this.tmp3.set(x, y, z).sub(this.position).normalize();
    if (!this.tmp3.isZero()) {
      const dot = this.tmp3.dot(this.up); // up and direction must ALWAYS be orthonormal vectors
      if (Math.abs(dot - 1) < 0.000000001) {
        // Collinear
        this.up
          .set(this.direction.x, this.direction.y, this.direction.z)
          .scale(-1);
      } else if (Math.abs(dot + 1) < 0.000000001) {
        // Collinear opposite
        this.up.set(this.direction.x, this.direction.y, this.direction.z);
      }
      this.direction.set(this.tmp3.x, this.tmp3.y, this.tmp3.z);
      this.normalizeUp();
    }
  }

  normalizeUp() {
    this.tmp3
      .set(this.direction.x, this.direction.y, this.direction.z)
      .cross(this.up);
    this.up
      .set(this.tmp3.x, this.tmp3.y, this.tmp3.z)
      .cross(this.direction)
      .normalize();
  }
}
