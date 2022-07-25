import { Matrix4 } from '../Matrix4';
import { Vector3 } from '../Vector3';
import { Frustum } from './math/Fustrum';

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
  frustum = new Frustum();

  constructor(fieldOfViewY: number, viewportWidth: number, viewportHeight: number) {
    this.fieldOfView = fieldOfViewY;
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.update();
  }

  tmp: Vector3 = new Vector3();
  public update(updateFrustum: boolean = true) {
    const aspect = this.viewportWidth / this.viewportHeight;
    this.projection.projection(Math.abs(this.near), Math.abs(this.far), this.fieldOfView, aspect);
    this.tmp.set(this.position.x, this.position.y, this.position.z);
    this.tmp.add(this.direction);
    this.view.setToLookAt(this.position, this.tmp, this.up);
    this.combined.set(this.projection.values);
    this.combined.multiply(this.view);

    if (updateFrustum) {
      this.invProjectionView.set(this.combined.values);
      this.invProjectionView.invert();
      this.frustum.update(this.invProjectionView);
    }
  }

  tmpVec: Vector3 = new Vector3();
  public lookAt(x: number, y: number, z: number) {
    this.tmpVec.set(x, y, z).sub(this.position).normalize();
    if (!this.tmpVec.isZero()) {
      const dot = this.tmpVec.dot(this.up); // up and direction must ALWAYS be orthonormal vectors
      if (Math.abs(dot - 1) < 0.000000001) {
        // Collinear
        this.up.set(this.direction.x, this.direction.y, this.direction.z).scale(-1);
      } else if (Math.abs(dot + 1) < 0.000000001) {
        // Collinear opposite
        this.up.set(this.direction.x, this.direction.y, this.direction.z);
      }
      this.direction.set(this.tmpVec.x, this.tmpVec.y, this.tmpVec.z);
      this.normalizeUp();
    }
  }

  public normalizeUp() {
    this.tmpVec.set(this.direction.x, this.direction.y, this.direction.z).cross(this.up);
    this.up.set(this.tmpVec.x, this.tmpVec.y, this.tmpVec.z).cross(this.direction).normalize();
  }

  public translate(vec: Vector3) {
    this.position.add(vec);
  }

  public rotate(axis: Vector3, angle: number) {
    this.direction.rotate(axis, angle);
    this.up.rotate(axis, angle);
  }

  public rotateAround(point: Vector3, axis: Vector3, angle: number) {
    this.tmpVec.set(point.x, point.y, point.z);
    this.tmpVec.sub(this.position);
    this.translate(this.tmpVec);
    this.rotate(axis, angle);
    this.tmpVec.rotate(axis, angle);
    this.translate(new Vector3(-this.tmpVec.x, -this.tmpVec.y, -this.tmpVec.z));

    this.update();
  }
}
