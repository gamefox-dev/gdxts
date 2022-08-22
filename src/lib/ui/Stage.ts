import { OrthoCamera } from '../Camera';
import { PolygonBatch } from '../PolygonBatcher';
import { Texture } from '../Texture';
import { Disposable } from '../Utils';
import { Vector2 } from '../Vector2';
import { Viewport } from '../Viewport';
import { Actor } from './Actor';
import { Group } from './Group';
import { Skin } from './Skin';

export class Stage implements Disposable {
  root: Group;
  camera: OrthoCamera;
  batch: PolygonBatch;
  worldSize: Vector2;
  whiteTexture: Texture;
  skin: Skin;

  constructor(private viewport: Viewport, skin?: Skin) {
    const viewportInfo = viewport.getViewportInfo();
    this.root = new Group(this);
    this.camera = new OrthoCamera(
      viewportInfo.worldWidth,
      viewportInfo.worldHeight,
      viewport.getCanvas().width,
      viewport.getCanvas().height
    );
    viewport.addCamera(this.camera);
    viewport.update();

    this.camera.setYDown(viewport.getCamera().getYDown());

    this.batch = new PolygonBatch(viewport.getContext());
    this.worldSize = new Vector2(viewportInfo.worldWidth, viewportInfo.worldHeight);

    this.whiteTexture = Texture.createWhiteTexture(viewport.getContext());

    if (skin) {
      this.skin = skin;
    } else {
      this.skin = {
        fonts: [],
        atlases: []
      };
    }
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
    this.whiteTexture.dispose();
  }
}
