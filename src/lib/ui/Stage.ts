import { OrthoCamera } from '../Camera';
import { PolygonBatch } from '../PolygonBatcher';
import { Disposable } from '../Utils';
import { Vector2 } from '../Vector2';
import { Viewport } from '../Viewport';
import { Actor } from './Actor';
import { Group } from './Group';

export class Stage implements Disposable {
  root: Group;
  camera: OrthoCamera;
  batch: PolygonBatch;
  worldSize: Vector2;

  constructor(private viewport: Viewport, yDown = true) {
    const viewportInfo = viewport.getViewportInfo();
    this.root = new Group();
    this.camera = new OrthoCamera(
      viewportInfo.worldWidth,
      viewportInfo.worldHeight,
      viewport.getCanvas().width,
      viewport.getCanvas().height
    );
    viewport.addCamera(this.camera);
    viewport.update();

    this.camera.setYDown(yDown);

    this.batch = new PolygonBatch(viewport.getContext());
    this.worldSize = new Vector2(viewportInfo.worldWidth, viewportInfo.worldHeight);
  }

  addActor(actor: Actor, index?: number) {
    this.root.addActor(actor, index);
  }

  removeActor(actor: Actor) {
    this.root.removeActor(actor);
  }

  draw() {
    if (this.root.isDirty()) {
      this.root.yogaNode.calculateLayout(this.worldSize.x, this.worldSize.y);
      this.root.updateLayout();
    }

    this.batch.setProjection(this.camera.combined);
    this.batch.begin();
    this.root.draw(this.batch);
    this.batch.end();
  }

  dispose() {
    this.root.dispose();
    this.batch.dispose();
  }
}
