import Yoga, { YogaNode } from 'yoga-layout-prebuilt';
import { PolygonBatch } from '../PolygonBatcher';
import { Disposable } from '../Utils';
import { Vector2 } from '../Vector2';
import { ActorStyle, applyStyleToNode } from './ActorStyle';
import { Group } from './Group';
import { Stage } from './Stage';

export class Actor implements Disposable {
  parent?: Group;
  style: ActorStyle = {};
  dirty = true;
  yogaNode: YogaNode;

  displayPosition: Vector2 = new Vector2(0, 0);
  displaySize: Vector2 = new Vector2(0, 0);

  private setPosition(x: number, y: number): Actor {
    this.displayPosition.set(x, y);
    return this;
  }

  private setSize(x: number, y: number): Actor {
    this.displaySize.set(x, y);
    return this;
  }

  setStyle(style: ActorStyle): Actor {
    for (let propName in style) {
      if (
        this.style[propName] === undefined ||
        (this.style[propName] !== undefined && this.style[propName] !== style[propName])
      ) {
        this.dirty = true;
        this.style[propName] = style[propName];
        applyStyleToNode(this.yogaNode, propName as keyof ActorStyle, style[propName]);
      }
    }
    return this;
  }

  isDirty(): boolean {
    if (this.dirty) return true;
  }

  updateLayout() {
    let x = this.yogaNode.getComputedLeft();
    let y = this.yogaNode.getComputedTop();
    const w = this.yogaNode.getComputedWidth();
    const h = this.yogaNode.getComputedHeight();
    if (this.parent !== undefined) {
      const { x: pX, y: pY } = this.parent.displayPosition;
      x += pX;
      y += pY;
    }
    this.setPosition(x, y);
    this.setSize(w, h);
    this.dirty = false;
  }

  constructor(protected stage: Stage) {
    this.yogaNode = Yoga.Node.create();
  }

  dispose(): void {}
  public draw(batch: PolygonBatch): void {
    if (this.style.backgroundColor) {
      const prevColor = batch.color;
      batch.setColor(this.style.backgroundColor);
      batch.draw(
        this.stage.whiteTexture,
        this.displayPosition.x,
        this.displayPosition.y,
        this.displaySize.x,
        this.displaySize.y
      );
      batch.setColor(prevColor);
    }
  }
}
