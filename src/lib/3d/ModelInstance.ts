import { Matrix4 } from '../Matrix4';
import { Pool } from '../Utils';
import { BoundingBox } from './BoundingBox';
import { Material } from './Material';
import { Model } from './model/Model';
import { Node } from './model/Node';
import { NodePart } from './model/NodePart';
import { Renderable } from './Renderable';

export class ModelInstance {
  public static defaultShareKeyframes = true;
  public materials: Material[] = [];
  public nodes: Node[] = [];
  public model: Model;
  public transform: Matrix4;

  public constructor(model: Model) {
    this.ModelInstance(model, null, null);
  }

  public ModelInstance(model: Model, transform: Matrix4, rootNodeIds: string[]) {
    this.model = model;
    this.transform = transform == null ? new Matrix4() : transform;
    if (rootNodeIds == null) this.copyNodes(model.nodes);
    else this.copyNodes(model.nodes, rootNodeIds);
    //copyAnimations(model.animations, defaultShareKeyframes);
    this.calculateTransforms();
  }

  private copyNodes(nodes: Node[], nodeIds: string[] = null) {
    for (let i = 0, n = nodes.length; i < n; ++i) {
      const node = nodes[i];
      if (nodeIds === null) {
        this.nodes.push(node.copy());
      } else {
        for (const nodeId of nodeIds) {
          if (nodeId === node.id) {
            this.nodes.push(node.copy());
            break;
          }
        }
      }
    }
    this.invalidate();
  }

  private invalidateNode(node: Node) {
    for (let i = 0, n = node.parts.length; i < n; ++i) {
      const part = node.parts[i];
      const bindPose = part.invBoneBindTransforms;
      if (bindPose != null) {
        for (let j = 0; j < bindPose.size; ++j) {
          bindPose.keys[j] = this.getNode(bindPose.keys[j].id);
        }
      }
      if (!this.materials.includes(part.material)) {
        const midx = this.materials.findIndex(m => m.id === part.material.id);
        if (midx < 0) this.materials.push((part.material = part.material.copy()));
        else part.material = this.materials[midx];
      }
    }
    for (let i = 0, n = node.getChildCount(); i < n; ++i) {
      this.invalidateNode(node.getChildByIndex(i));
    }
  }

  public getNode(id: string, recursive: boolean = true, ignoreCase: boolean = false): Node {
    return Node.getNode(this.nodes, id, recursive, ignoreCase);
  }

  private invalidate() {
    for (let i = 0, n = this.nodes.length; i < n; ++i) {
      this.invalidateNode(this.nodes[i]);
    }
  }

  public getRenderable(out: Renderable, node: Node, nodePart: NodePart): Renderable {
    nodePart.setRenderable(out);
    if (nodePart.bones == null && this.transform != null)
      out.worldTransform.set(this.transform.values).multiply(node.globalTransform);
    else if (this.transform != null) out.worldTransform.set(this.transform.values);
    else out.worldTransform.idt();
    //out.userData = userData;
    return out;
  }

  public getRenderables(renderables: Renderable[], pool: Pool<Renderable>) {
    for (const node of this.nodes) {
      this.getRenderablesWithNode(node, renderables, pool);
    }
  }

  protected getRenderablesWithNode(node: Node, renderables: Renderable[], pool: Pool<Renderable>) {
    if (node.parts.length > 0) {
      for (const nodePart of node.parts) {
        if (nodePart.enabled) renderables.push(this.getRenderable(pool.obtain(), node, nodePart));
      }
    }

    for (const child of node.getChildren()) {
      this.getRenderablesWithNode(child, renderables, pool);
    }
  }

  public calculateTransforms() {
    const n = this.nodes.length;
    for (let i = 0; i < n; i++) {
      this.nodes[i].calculateTransforms(true);
    }
    for (let i = 0; i < n; i++) {
      this.nodes[i].calculateBoneTransforms(true);
    }
  }

  public calculateBoundingBox(out: BoundingBox): BoundingBox {
    out.inf();
    return this.extendBoundingBox(out);
  }

  public extendBoundingBox(out: BoundingBox): BoundingBox {
    const n = this.nodes.length;
    for (let i = 0; i < n; i++) this.nodes[i].extendBoundingBox(out);
    return out;
  }

  public getMaterial(id: string, ignoreCase: boolean = true) {
    const n = this.materials.length;
    let material: Material;
    if (ignoreCase) {
      for (let i = 0; i < n; i++)
        if ((material = this.materials[i]).id.toUpperCase() === id.toUpperCase()) return material;
    } else {
      for (let i = 0; i < n; i++) if ((material = this.materials[i]).id === id) return material;
    }
    return null;
  }
}
