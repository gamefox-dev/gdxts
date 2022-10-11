import { Matrix4 } from '../Matrix4';
import { Quaternion } from '../Quaternion';
import { Vector3 } from '../Vector3';
import { Frustum } from './math';
import { Ray } from './math/Ray';

export abstract class Camera {
  /** the position of the camera **/
  public position = new Vector3();
  /** the unit length direction vector of the camera **/
  public direction = new Vector3(0, 0, -1);
  /** the unit length up vector of the camera **/
  public up = new Vector3(0, 1, 0);

  /** the projection matrix **/
  public projection = new Matrix4();
  /** the view matrix **/
  public view = new Matrix4();
  /** the combined projection and view matrix **/
  public combined = new Matrix4();
  /** the inverse combined projection and view matrix **/
  public invProjectionView = new Matrix4();

  /** the near clipping plane distance, has to be positive **/
  public near = 1;
  /** the far clipping plane distance, has to be positive **/
  public far = 100;

  /** the viewport width **/
  public viewportWidth = 0;
  /** the viewport height **/
  public viewportHeight = 0;

  /** the frustum **/
  public frustum = new Frustum();

  private tmpVec = new Vector3();
  private ray = new Ray(new Vector3(), new Vector3());

  screenWidth: number;
  screenHeight: number;
  constructor(viewportWidth: number, viewportHeight: number, screenWidth: number, screenHeight: number) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
  }

  /** Recalculates the projection and view matrix of this camera and the {@link Frustum} planes. Use this after you've
   * manipulated any of the attributes of the camera. */
  public abstract update();

  /** Recalculates the projection and view matrix of this camera and the {@link Frustum} planes if <code>updateFrustum</code> is
   * true. Use this after you've manipulated any of the attributes of the camera. */
  public abstract update(updateFrustum: boolean);

  /** Recalculates the direction of the camera to look at the point (x, y, z). This function assumes the up vector is normalized.
   * @param x the x-coordinate of the point to look at
   * @param y the y-coordinate of the point to look at
   * @param z the z-coordinate of the point to look at */
  public lookAt(x: number, y: number, z: number) {
    this.tmpVec.set(x, y, z).sub(this.position).normalize();
    if (!this.tmpVec.isZero()) {
      const dot = this.tmpVec.dot(this.up); // up and direction must ALWAYS be orthonormal vectors
      if (Math.abs(dot - 1) < 0.000000001) {
        // Collinear
        this.up.setFrom(this.direction).scale(-1);
      } else if (Math.abs(dot + 1) < 0.000000001) {
        // Collinear opposite
        this.up.setFrom(this.direction);
      }
      this.direction.setFrom(this.tmpVec);
      this.normalizeUp();
    }
  }

  /** Normalizes the up vector by first calculating the right vector via a cross product between direction and up, and then
   * recalculating the up vector via a cross product between right and direction. */
  public normalizeUp() {
    this.tmpVec.setFrom(this.direction).cross(this.up);
    this.up.setFrom(this.tmpVec).cross(this.direction).normalize();
  }

  /** Rotates the direction and up vector of this camera by the given angle around the given axis. The direction and up vector
   * will not be orthogonalized.
   *
   * @param angle the angle
   * @param axisX the x-component of the axis
   * @param axisY the y-component of the axis
   * @param axisZ the z-component of the axis */
  public rotate(angle: number, axisX: number, axisY: number, axisZ: number) {
    this.tmpVec.set(axisX, axisY, axisZ);
    this.direction.rotate(this.tmpVec, angle);
    this.up.rotate(this.tmpVec, angle);
  }

  /** Rotates the direction and up vector of this camera by the given rotation matrix. The direction and up vector will not be
   * orthogonalized.
   *
   * @param transform The rotation matrix */
  public rotateWithTransform(transform: Matrix4) {
    this.direction.rot(transform);
    this.up.rot(transform);
  }

  /** Rotates the direction and up vector of this camera by the given {@link Quaternion}. The direction and up vector will not be
   * orthogonalized.
   *
   * @param quat The quaternion */
  public rotateWithQuaternion(quat: Quaternion) {
    quat.transform(this.direction);
    quat.transform(this.up);
  }

  /** Rotates the direction and up vector of this camera by the given angle around the given axis, with the axis attached to
   * given point. The direction and up vector will not be orthogonalized.
   *
   * @param point the point to attach the axis to
   * @param axis the axis to rotate around
   * @param angle the angle, in degrees */
  public rotateAround(point: Vector3, axis: Vector3, angle: number) {
    this.tmpVec.setFrom(point);
    this.tmpVec.sub(this.position);
    this.translate(this.tmpVec.x, this.tmpVec.y, this.tmpVec.z);
    this.rotate(angle, axis.x, axis.y, axis.z);
    this.tmpVec.rotate(axis, angle);
    this.translate(-this.tmpVec.x, -this.tmpVec.y, -this.tmpVec.z);
  }

  /** Transform the position, direction and up vector by the given matrix
   *
   * @param transform The transform matrix */
  public transform(transform: Matrix4) {
    this.position.multiplyMat4(transform);
    this.rotateWithTransform(transform);
  }

  /** Moves the camera by the given amount on each axis.
   * @param x the displacement on the x-axis
   * @param y the displacement on the y-axis
   * @param z the displacement on the z-axis */
  public translate(x: number, y: number, z: number) {
    this.tmpVec.set(x, y, z);
    this.position.add(this.tmpVec);
  }

  /** Function to translate a point given in screen coordinates to world space. It's the same as GLU gluUnProject, but does not
   * rely on OpenGL. The x- and y-coordinate of vec are assumed to be in screen coordinates (origin is the top left corner, y
   * pointing down, x pointing to the right) as reported by the touch methods in {@link Input}. A z-coordinate of 0 will return a
   * point on the near plane, a z-coordinate of 1 will return a point on the far plane. This method allows you to specify the
   * viewport position and dimensions in the coordinate system expected by {@link GL20#glViewport(int, int, int, int)}, with the
   * origin in the bottom left corner of the screen.
   * @param screenCoords the point in screen coordinates (origin top left)
   * @param viewportX the coordinate of the bottom left corner of the viewport in glViewport coordinates.
   * @param viewportY the coordinate of the bottom left corner of the viewport in glViewport coordinates.
   * @param viewportWidth the width of the viewport in pixels
   * @param viewportHeight the height of the viewport in pixels
   * @return the mutated and unprojected screenCoords {@link Vector3} */
  public unproject(
    screenCoords: Vector3,
    viewportX: number,
    viewportY: number,
    viewportWidth: number,
    viewportHeight: number
  ): Vector3 {
    const x = screenCoords.x - viewportX,
      y = this.screenHeight - screenCoords.y - viewportY;
    screenCoords.x = (2 * x) / viewportWidth - 1;
    screenCoords.y = (2 * y) / viewportHeight - 1;
    screenCoords.z = 2 * screenCoords.z - 1;
    screenCoords.project(this.invProjectionView);
    return screenCoords;
  }

  /** Projects the {@link Vector3} given in world space to screen coordinates. It's the same as GLU gluProject with one small
   * deviation: The viewport is assumed to span the whole screen. The screen coordinate system has its origin in the
   * <b>bottom</b> left, with the y-axis pointing <b>upwards</b> and the x-axis pointing to the right. This makes it easily
   * useable in conjunction with {@link Batch} and similar classes. This method allows you to specify the viewport position and
   * dimensions in the coordinate system expected by {@link GL20#glViewport(int, int, int, int)}, with the origin in the bottom
   * left corner of the screen.
   * @param viewportX the coordinate of the bottom left corner of the viewport in glViewport coordinates.
   * @param viewportY the coordinate of the bottom left corner of the viewport in glViewport coordinates.
   * @param viewportWidth the width of the viewport in pixels
   * @param viewportHeight the height of the viewport in pixels
   * @return the mutated and projected worldCoords {@link Vector3} */
  public project(
    worldCoords: Vector3,
    viewportX: number,
    viewportY: number,
    viewportWidth: number,
    viewportHeight: number
  ): Vector3 {
    worldCoords.project(this.combined);
    worldCoords.x = (viewportWidth * (worldCoords.x + 1)) / 2 + viewportX;
    worldCoords.y = (viewportHeight * (worldCoords.y + 1)) / 2 + viewportY;
    worldCoords.z = (worldCoords.z + 1) / 2;
    return worldCoords;
  }

  /** Creates a picking {@link Ray} from the coordinates given in screen coordinates. It is assumed that the viewport spans the
   * whole screen. The screen coordinates origin is assumed to be in the top left corner, its y-axis pointing down, the x-axis
   * pointing to the right. The returned instance is not a new instance but an internal member only accessible via this function.
   * @param viewportX the coordinate of the bottom left corner of the viewport in glViewport coordinates.
   * @param viewportY the coordinate of the bottom left corner of the viewport in glViewport coordinates.
   * @param viewportWidth the width of the viewport in pixels
   * @param viewportHeight the height of the viewport in pixels
   * @return the picking Ray. */
  public getPickRay(
    screenX: number,
    screenY: number,
    viewportX: number,
    viewportY: number,
    viewportWidth: number,
    viewportHeight: number
  ): Ray {
    this.unproject(this.ray.origin.set(screenX, screenY, 0), viewportX, viewportY, viewportWidth, viewportHeight);
    this.unproject(this.ray.direction.set(screenX, screenY, 1), viewportX, viewportY, viewportWidth, viewportHeight);
    this.ray.direction.sub(this.ray.origin).normalize();
    return this.ray;
  }
}
