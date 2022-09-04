import { Matrix4 } from '../Matrix4';
import { Pool } from '../Utils';
import { BoundingBox } from './BoundingBox';
import { Material } from './Material';
import { Model } from './model/Model';
import { Node } from './model/Node';
import { NodePart } from './model/NodePart';
import { Renderable } from './Renderable';
import { Animation } from './model/Animation';
import { NodeAnimation } from './model/NodeAnimation';
import { Vector3 } from '../Vector3';
import { NodeKeyframe } from './model/NodeKeyframe';
import { Quaternion } from '../Quaternion';

export class ModelInstance {
  public static defaultShareKeyframes = true;
  public materials: Material[] = [];
  public nodes: Node[] = [];
  public animations: Animation[] = [];
  public model: Model;
  public transform: Matrix4;

  public constructor(model: Model, transform: Matrix4 = null, rootNodeIds: string[] = null) {
    this.model = model;
    this.transform = transform === null ? new Matrix4() : transform;
    if (rootNodeIds === null) this.copyNodes(model.nodes);
    else this.copyNodes(model.nodes, rootNodeIds);
    this.copyAnimations(model.animations, ModelInstance.defaultShareKeyframes);
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
        const oldKeys: Node[] = [];
        for (const [key, value] of bindPose) {
          const newKey = this.getNode(key.id);
          if (newKey === key) {
            oldKeys.push(key);
          }
          bindPose.set(newKey, value);
        }

        for (const key of oldKeys) {
          bindPose.delete(key);
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

  public copyAnimations(source: Animation[], shareKeyframes: boolean) {
    for (const anim of source) {
      this.copyAnimation(anim, shareKeyframes);
    }
  }

  public copyAnimation(sourceAnim: Animation, shareKeyframes: boolean) {
    const animation = new Animation();
    animation.id = sourceAnim.id;
    animation.duration = sourceAnim.duration;
    for (const nanim of sourceAnim.nodeAnimations) {
      const node = this.getNode(nanim.node.id);
      if (node == null) continue;
      const nodeAnim = new NodeAnimation();
      nodeAnim.node = node;
      if (shareKeyframes) {
        nodeAnim.translation = nanim.translation;
        nodeAnim.rotation = nanim.rotation;
        nodeAnim.scaling = nanim.scaling;
      } else {
        if (nanim.translation != null) {
          nodeAnim.translation = new Array<NodeKeyframe<Vector3>>();
          for (const kf of nanim.translation)
            nodeAnim.translation.push(new NodeKeyframe<Vector3>(kf.keytime, kf.value));
        }
        if (nanim.rotation != null) {
          nodeAnim.rotation = new Array<NodeKeyframe<Quaternion>>();
          for (const kf of nanim.rotation) nodeAnim.rotation.push(new NodeKeyframe<Quaternion>(kf.keytime, kf.value));
        }
        if (nanim.scaling != null) {
          nodeAnim.scaling = new Array<NodeKeyframe<Vector3>>();
          for (const kf of nanim.scaling) nodeAnim.scaling.push(new NodeKeyframe<Vector3>(kf.keytime, kf.value));
        }
      }
      if (nodeAnim.translation != null || nodeAnim.rotation != null || nodeAnim.scaling != null)
        animation.nodeAnimations.push(nodeAnim);
    }
    if (animation.nodeAnimations.length > 0) this.animations.push(animation);
  }

  public getRenderable(out: Renderable, node: Node, nodePart: NodePart): Renderable {
    nodePart.setRenderable(out);
    if (!nodePart.bones && !!this.transform)
      out.worldTransform.set(this.transform.values).multiply(node.globalTransform);
    else if (!!this.transform) out.worldTransform.set(this.transform.values);
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

  public getAnimation(id: string, ignoreCase: boolean = false): Animation {
    const n = this.animations.length;
    let animation: Animation;
    if (ignoreCase) {
      for (let i = 0; i < n; i++)
        if ((animation = this.animations[i]).id.toUpperCase() === id.toUpperCase()) return animation;
    } else {
      for (let i = 0; i < n; i++) if ((animation = this.animations[i]).id === id) return animation;
    }
    return null;
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
