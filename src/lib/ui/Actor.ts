import { PolygonBatch } from '../PolygonBatcher';
import Yoga, { YogaNode } from 'yoga-layout-prebuilt';
import { Group } from './Group';
import { Vector2 } from '../Vector2';
import { Disposable } from '../Utils';
import { ActorStyle, applyStyleToNode } from './ActorStyle';
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

  setStyle(style: ActorStyle) {
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

  constructor(private stage: Stage) {
    this.yogaNode = Yoga.Node.create();
  }

  dispose(): void {}
  public draw(batch: PolygonBatch): void {}
}
