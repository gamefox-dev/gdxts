import { Matrix4 } from '../../Matrix4';
import { Vector3 } from '../../Vector3';
import { BoundingBox } from '../BoundingBox';
import { NodePart } from './NodePart';
import { Quaternion } from '../../Quaternion';

export class Node {
  public id: string;
  public inheritTransform = true;
  public isAnimated: boolean = false;
  public translation: Vector3 = new Vector3();
  public rotation = new Quaternion(0, 0, 0, 1);
  public scale = new Vector3(1, 1, 1);
  public localTransform = new Matrix4();
  public globalTransform = new Matrix4();

  public parts = new Array<NodePart>();

  protected parent: Node = null;
  private children = new Array<Node>();

  public calculateLocalTransform(): Matrix4 {
    if (!this.isAnimated) this.localTransform.setFromTranslationRotation(this.translation, this.rotation, this.scale);
    return this.localTransform;
  }

  public calculateWorldTransform(): Matrix4 {
    if (this.inheritTransform && this.parent != null) {
      this.globalTransform.set(this.parent.globalTransform.values).multiply(this.localTransform);
    } else {
      this.globalTransform.set(this.localTransform.values);
    }
    return this.globalTransform;
  }

  public calculateTransforms(recursive: boolean) {
    this.calculateLocalTransform();
    this.calculateWorldTransform();

    if (recursive) {
      for (const child of this.children) {
        child.calculateTransforms(true);
      }
    }
  }

  public calculateBoneTransforms(recursive: boolean) {
    for (const part of this.parts) {
      if (
        part.invBoneBindTransforms == null ||
        part.bones == null ||
        part.invBoneBindTransforms.size !== part.bones.length
      )
        continue;
      let i = 0;
      for (const [key, value] of part.invBoneBindTransforms) {
        part.bones[i].set(key.globalTransform.values).multiply(value);
        i++;
      }
    }
    if (recursive) {
      for (const child of this.children) {
        child.calculateBoneTransforms(true);
      }
    }
  }

  public calculateBoundingBox(out: BoundingBox, transform: boolean = true): BoundingBox {
    out.inf();
    return this.extendBoundingBox(out, transform);
  }

  public extendBoundingBox(out: BoundingBox, transform: boolean = true): BoundingBox {
    const partCount = this.parts.length;
    for (let i = 0; i < partCount; i++) {
      const part = this.parts[i];
      if (part.enabled) {
        const meshPart = part.meshPart;
        if (transform) meshPart.mesh.extendBoundingBox(out, meshPart.offset, meshPart.size, this.globalTransform);
        else meshPart.mesh.extendBoundingBox(out, meshPart.offset, meshPart.size, null);
      }
    }
    const childCount = this.children.length;
    for (let i = 0; i < childCount; i++) this.children[i].extendBoundingBox(out);
    return out;
  }

  public attachTo(parent: Node) {
    this.parent.addChild(this);
  }

  public detach() {
    if (this.parent != null) {
      this.parent.removeChild(this);
      this.parent = null;
    }
  }

  public hasChildren(): boolean {
    return this.children != null && this.children.length > 0;
  }

  public getChildCount(): number {
    return this.children.length;
  }

  public getChildByIndex(index: number): Node {
    return this.children[index];
  }

  public getChild(id: string, recursive: boolean, ignoreCase: boolean): Node {
    return Node.getNode(this.children, id, recursive, ignoreCase);
  }

  public addChild(child: Node): number {
    return this.insertChild(-1, child);
  }

  public insertChild(index: number, child: Node): number {
    for (let p: Node = this; p != null; p = p.getParent()) {
      if (p === child) throw new Error('Cannot add a parent as a child');
    }
    const p = child.getParent();
    if (p != null && !p.removeChild(child)) throw new Error('Could not remove child from its current parent');
    if (index < 0 || index >= this.children.length) {
      index = this.children.length;
      this.children.push(child);
    } else this.children.splice(index, 0, child);
    child.parent = this;
    return index;
  }

  //  public <T extends Node> int insertChildren (int index, final Iterable<T> nodes) {
  //      if (index < 0 || index > children.size) index = children.size;
  //      int i = index;
  //      for (T child : nodes)
  //          insertChild(i++, child);
  //      return index;
  //  }

  public removeChild(child: Node): boolean {
    const index = this.children.indexOf(child);
    if (index === -1) return false;

    child.parent = null;
    this.children.splice(index, 1);
    return true;
  }

  public getChildren(): Node[] {
    return this.children;
  }

  public getParent(): Node {
    return this.parent;
  }

  public hasParent(): boolean {
    return this.parent != null;
  }

  public copy(): Node {
    return new Node().set(this);
  }

  protected set(other: Node): Node {
    this.detach();
    this.id = other.id;
    this.isAnimated = other.isAnimated;
    this.inheritTransform = other.inheritTransform;
    this.translation.set(other.translation.x, other.translation.y, other.translation.z);
    this.rotation.set(other.rotation.x, other.rotation.y, other.rotation.z, other.rotation.w);
    this.scale.set(other.scale.x, other.scale.y, other.scale.z);
    this.localTransform.set(other.localTransform.values);
    this.globalTransform.set(other.globalTransform.values);
    this.parts.length = 0;
    for (const nodePart of other.parts) {
      this.parts.push(nodePart.copy());
    }
    this.children.length = 0;
    for (const child of other.getChildren()) {
      this.addChild(child.copy());
    }
    return this;
  }

  public static getNode(nodes: Node[], id: string, recursive: boolean, ignoreCase: boolean): Node {
    const n = nodes.length;
    let node: Node;
    if (ignoreCase) {
      for (let i = 0; i < n; i++) if ((node = nodes[i]).id.toUpperCase() === id.toUpperCase()) return node;
    } else {
      for (let i = 0; i < n; i++) if ((node = nodes[i]).id === id) return node;
    }
    if (recursive) {
      for (let i = 0; i < n; i++)
        if ((node = this.getNode(nodes[i].children, id, true, ignoreCase)) != null) return node;
    }
    return null;
  }
}
