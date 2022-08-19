import { PolygonBatch } from '../PolygonBatcher';
import Yoga, { YogaNode } from 'yoga-layout-prebuilt';
import { Group } from './Group';
import { Vector2 } from '../Vector2';
import { Disposable } from '../Utils';

export class Actor implements Disposable {
  parent?: Group;
  style: YogaNode;
  dirty = true;

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

  isDirty(): boolean {
    if (this.dirty) return true;
  }

  updateLayout() {
    if (!this.isDirty()) return;
    let x = this.style.getComputedLeft();
    let y = this.style.getComputedTop();
    const w = this.style.getComputedWidth();
    const h = this.style.getComputedHeight();
    if (this.parent !== undefined) {
      const { x: pX, y: pY } = this.parent.displayPosition;
      x += pX;
      y += pY;
    }
    this.setPosition(x, y);
    this.setSize(w, h);
    this.dirty = false;
  }

  constructor() {
    this.style = new Proxy(Yoga.Node.create(), {
      get: (target: YogaNode, propKey: string, receiver) => {
        var propValue = (target as any)[propKey];
        if (typeof propValue !== 'function' || propKey.startsWith('get')) {
          return propValue;
        } else {
          return (...args: any[]) => {
            this.dirty = true;
            return propValue.apply(target, args);
          };
        }
      }
    });
  }

  dispose(): void {}
  public draw(batch: PolygonBatch): void {}
}
