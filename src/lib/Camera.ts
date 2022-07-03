import { Matrix4 } from "./Matrix4";
import { Vector2 } from "./Utils";
import { Vector3 } from "./Vector3";

export class OrthoCamera {
  position = new Vector3(0, 0, 0);
  direction = new Vector3(0, 0, -1);
  up = new Vector3(0, 1, 0);
  near = 0;
  far = 100;
  zoom = 1;
  viewportWidth = 0;
  viewportHeight = 0;
  projectionView = new Matrix4();
  inverseProjectionView = new Matrix4();
  projection = new Matrix4();
  view = new Matrix4();

  screenWidth: number;
  screenHeight: number;

  constructor(
    viewportWidth: number,
    viewportHeight: number,
    screenWidth: number,
    screenHeight: number
  ) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;

    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    this.position.set(viewportWidth / 2, viewportHeight / 2, 0);

    this.update();
  }

  update() {
    let projection = this.projection;
    let view = this.view;
    let projectionView = this.projectionView;
    let inverseProjectionView = this.inverseProjectionView;
    let zoom = this.zoom,
      viewportWidth = this.viewportWidth,
      viewportHeight = this.viewportHeight;
    projection.ortho(
      zoom * (-viewportWidth / 2),
      zoom * (viewportWidth / 2),
      zoom * (-viewportHeight / 2),
      zoom * (viewportHeight / 2),
      this.near,
      this.far
    );
    view.lookAt(this.position, this.direction, this.up);
    projectionView.set(projection.values);
    projectionView.multiply(view);
    inverseProjectionView.set(projectionView.values).invert();
  }

  screenToWorld(
    screenCoords: Vector3,
    screenWidth?: number,
    screenHeight?: number
  ) {
    screenWidth = screenWidth || this.screenWidth;
    screenHeight = screenHeight || this.screenHeight;
    let x = screenCoords.x,
      y = screenHeight - screenCoords.y - 1;
    screenCoords.x = (2 * x) / screenWidth - 1;
    screenCoords.y = (2 * y) / screenHeight - 1;
    screenCoords.z = 2 * screenCoords.z - 1;
    screenCoords.project(this.inverseProjectionView);
    return screenCoords;
  }

  worldToScreen(
    worldCoords: Vector3,
    screenWidth?: number,
    screenHeight?: number
  ) {
    screenWidth = screenWidth || this.screenWidth;
    screenHeight = screenHeight || this.screenHeight;
    worldCoords.project(this.projectionView);
    worldCoords.x = (screenWidth * (worldCoords.x + 1)) / 2;
    worldCoords.y = (screenHeight * (worldCoords.y + 1)) / 2;
    worldCoords.z = (worldCoords.z + 1) / 2;
    return worldCoords;
  }

  tmp3: Vector3 = new Vector3();
  unprojectVector2(worldCoord: Vector2, screenCoord: Vector2) {
    this.tmp3.set(screenCoord.x, screenCoord.y, 0);
    this.screenToWorld(this.tmp3);
    worldCoord.set(this.tmp3.x, this.tmp3.y);
  }

  setViewport(viewportWidth: number, viewportHeight: number) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
  }
}
