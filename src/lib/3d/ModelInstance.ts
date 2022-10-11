import { BoundingBox } from '../BoundingBox';
import { Matrix4 } from '../Matrix4';
import { Quaternion } from '../Quaternion';
import { Pool } from '../Utils';
import { Vector3 } from '../Vector3';
import { Material } from './Material';
import { Animation3D } from './model/Animation';
import { Model } from './model/Model';
import { Node } from './model/Node';
import { NodeAnimation } from './model/NodeAnimation';
import { NodeKeyframe } from './model/NodeKeyframe';
import { NodePart } from './model/NodePart';
import { Renderable } from './Renderable';
import { RenderableProvider } from './RenderableProvider';

export class ModelInstance extends RenderableProvider {
  public static defaultShareKeyframes = true;
  public materials: Material[] = [];
  public nodes: Node[] = [];
  public animations: Animation3D[] = [];
  public model: Model;
  public transform: Matrix4;

  public constructor(model: Model, transform: Matrix4 = null, rootNodeIds: string[] = null) {
    super();
    this.model = model;
    this.transform = !transform ? new Matrix4() : transform;
    if (!rootNodeIds) this.copyNodes(model.nodes);
    else this.copyNodes(model.nodes, rootNodeIds);
    this.copyAnimations(model.animations, ModelInstance.defaultShareKeyframes);
    this.calculateTransforms();
  }

  private copyNodes(nodes: Node[], nodeIds: string[] = null) {
    for (let i = 0, n = nodes.length; i < n; ++i) {
      const node = nodes[i];
      if (!nodeIds) {
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
      if (!!bindPose) {
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

  public copyAnimations(source: Animation3D[], shareKeyframes: boolean) {
    for (const anim of source) {
      this.copyAnimation(anim, shareKeyframes);
    }
  }

  public copyAnimation(sourceAnim: Animation3D, shareKeyframes: boolean) {
    const animation = new Animation3D();
    animation.id = sourceAnim.id;
    animation.duration = sourceAnim.duration;
    for (const nanim of sourceAnim.nodeAnimations) {
      const node = this.getNode(nanim.node.id);
      if (!node) continue;
      const nodeAnim = new NodeAnimation();
      nodeAnim.node = node;
      if (shareKeyframes) {
        nodeAnim.translation = nanim.translation;
        nodeAnim.rotation = nanim.rotation;
        nodeAnim.scaling = nanim.scaling;
      } else {
        if (!!nanim.translation) {
          nodeAnim.translation = new Array<NodeKeyframe<Vector3>>();
          for (const kf of nanim.translation)
            nodeAnim.translation.push(new NodeKeyframe<Vector3>(kf.keytime, kf.value));
        }
        if (!!nanim.rotation) {
          nodeAnim.rotation = new Array<NodeKeyframe<Quaternion>>();
          for (const kf of nanim.rotation) nodeAnim.rotation.push(new NodeKeyframe<Quaternion>(kf.keytime, kf.value));
        }
        if (!!nanim.scaling) {
          nodeAnim.scaling = new Array<NodeKeyframe<Vector3>>();
          for (const kf of nanim.scaling) nodeAnim.scaling.push(new NodeKeyframe<Vector3>(kf.keytime, kf.value));
        }
      }
      if (!!nodeAnim.translation || !!nodeAnim.rotation || !!nodeAnim.scaling) animation.nodeAnimations.push(nodeAnim);
    }
    if (animation.nodeAnimations.length > 0) this.animations.push(animation);
  }

  public getRenderable(out: Renderable, node: Node, nodePart: NodePart): Renderable {
    nodePart.setRenderable(out);
    if (!nodePart.bones && !!this.transform) {
      out.worldTransform.set(this.transform.values).multiply(node.globalTransform);
    } else if (!!this.transform) {
      out.worldTransform.set(this.transform.values);
    } else {
      out.worldTransform.idt();
    }
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

  public getAnimation(id: string, ignoreCase: boolean = false): Animation3D {
    const n = this.animations.length;
    let animation: Animation3D;
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
