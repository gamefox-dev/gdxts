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
    index = this.children.indexOf(actor);
    this.yogaNode.insertChild(actor.yogaNode, index);
    actor.parent = this;
  }

  updateLayout(): void {
    super.updateLayout();
    for (let child of this.children) {
      child.updateLayout();
    }
  }

  isDirty(): boolean {
    if (super.isDirty()) return true;
    for (let child of this.children) {
      if (child.isDirty()) return true;
    }
    return false;
  }

  dispose(): void {
    super.dispose();
    for (let child of this.children) {
      child.dispose();
    }
  }

  public removeActor(actor: Actor) {
    const index = this.children.indexOf(actor);
    if (index >= 0) {
      this.children.splice(index, 1);
    }
    actor.parent = undefined;
  }

  public draw(batch: PolygonBatch): void {
    super.draw(batch);
    for (let child of this.children) {
      child.draw(batch);
    }
  }
}
