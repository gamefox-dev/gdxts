import { Vector3 } from '../Vector3';
import { Camera } from './Camera';

export class PerspectiveCamera extends Camera {
  /** the field of view of the height, in degrees **/
  public fieldOfView = 67;

  constructor(
    fieldOfViewY: number,
    viewportWidth: number,
    viewportHeight: number,
    screenWidth: number,
    screenHeight: number
  ) {
    super(viewportWidth, viewportHeight, screenWidth, screenHeight);
    this.fieldOfView = fieldOfViewY;
    this.update();
  }

  tmp = new Vector3();

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
}
