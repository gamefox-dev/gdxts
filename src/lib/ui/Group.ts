import { PolygonBatch } from '../PolygonBatcher';
import { Actor } from './Actor';

export class Group extends Actor {
  children: Actor[] = [];

  public addActor(actor: Actor, index?: number) {
    if (index === undefined) {
      this.children.push(actor);
    } else {
      this.children.splice(index, 0, actor);
    }
  }
  public removeActor(actor: Actor) {
    const index = this.children.indexOf(actor);
    if (index >= 0) {
      this.children.splice(index, 1);
    }
  }
  public draw(batch: PolygonBatch): void {
    for (let child of this.children) {
      child.draw(batch);
    }
  }
}
