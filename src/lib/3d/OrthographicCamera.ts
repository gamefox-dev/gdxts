import { Vector3 } from '../Vector3';
import { Camera } from './Camera';

export class OrthographicCamera extends Camera {
  /** the zoom of the camera **/
  public zoom = 1;

  constructor(viewportWidth: number, viewportHeight: number, screenWidth: number, screenHeight: number) {
    super(viewportWidth, viewportHeight, screenWidth, screenHeight);
    this.near = 0;
    this.update();
  }

  private tmp = new Vector3();

  public update(updateFrustum: boolean = true) {
    this.projection.setToOrtho(
      (this.zoom * -this.viewportWidth) / 2,
      this.zoom * (this.viewportWidth / 2),
      this.zoom * -(this.viewportHeight / 2),
      (this.zoom * this.viewportHeight) / 2,
      this.near,
      this.far
    );
    this.view.setToLookAt(this.position, this.tmp.setFrom(this.position).add(this.direction), this.up);
    this.combined.set(this.projection.values);
    this.combined.multiply(this.view);

    if (updateFrustum) {
      this.invProjectionView.set(this.combined.values);
      this.invProjectionView.invert();
      this.frustum.update(this.invProjectionView);
    }
  }

  /** Sets this camera to an orthographic projection, centered at (viewportWidth/2, viewportHeight/2), with the y-axis pointing
   * up or down.
   * @param yDown whether y should be pointing down.
   * @param viewportWidth
   * @param viewportHeight */
  public setToOrtho(
    yDown: boolean,
    viewportWidth: number = this.screenWidth,
    viewportHeight: number = this.screenHeight
  ) {
    if (yDown) {
      this.up.set(0, -1, 0);
      this.direction.set(0, 0, 1);
    } else {
      this.up.set(0, 1, 0);
      this.direction.set(0, 0, -1);
    }
    this.position.set((this.zoom * viewportWidth) / 2.0, (this.zoom * viewportHeight) / 2.0, 0);
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.update();
  }

  public rotateByAngle(angle: number) {
    this.rotate(angle, this.direction.x, this.direction.y, this.direction.z);
  }
}
