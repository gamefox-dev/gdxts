import { Quaternion } from '../../../../Quaternion';
import { Vector3 } from '../../../../Vector3';
import { Animation3D, Model, Node, NodeKeyframe } from '../../../model';
import { NodePart } from '../../../model/NodePart';
import { ModelInstance } from '../../../ModelInstance';
import { Renderable } from '../../../Renderable';
import { NodeAnimationHack } from '../animation/NodeAnimationHack';
import { NodePartPlus } from './NodePartPlus';
import { WeightVector } from './WeightVector';

export class ModelInstanceHack extends ModelInstance {
  constructor(model: Model, rootNodeIds: string[] = null) {
    super(model, null, rootNodeIds);
  }

  public copyAnimation(anim: Animation3D, shareKeyframes: boolean) {
    const animation = new Animation3D();
    animation.id = anim.id;
    animation.duration = anim.duration;
    for (const nanim of anim.nodeAnimations) {
      const node = this.getNode(nanim.node.id);
      if (!node) continue;
      const nodeAnim = new NodeAnimationHack();
      nodeAnim.node = node;

      nodeAnim.translationMode = (nanim as NodeAnimationHack).translationMode;
      nodeAnim.rotationMode = (nanim as NodeAnimationHack).rotationMode;
      nodeAnim.scalingMode = (nanim as NodeAnimationHack).scalingMode;
      nodeAnim.weightsMode = (nanim as NodeAnimationHack).weightsMode;

      if (shareKeyframes) {
        nodeAnim.translation = nanim.translation;
        nodeAnim.rotation = nanim.rotation;
        nodeAnim.scaling = nanim.scaling;
        nodeAnim.weights = (nanim as NodeAnimationHack).weights;
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
        if (!!(nanim as NodeAnimationHack).weights) {
          (nanim as NodeAnimationHack).weights = new Array<NodeKeyframe<WeightVector>>();
          for (const kf of (nanim as NodeAnimationHack).weights)
            (nanim as NodeAnimationHack).weights.push(new NodeKeyframe<WeightVector>(kf.keytime, kf.value));
        }
      }
      if (!!nodeAnim.translation || !!nodeAnim.rotation || !!nodeAnim.scaling || !!(nanim as NodeAnimationHack).weights)
        animation.nodeAnimations.push(nodeAnim);
    }
    if (animation.nodeAnimations.length > 0) this.animations.push(animation);
  }

  public getRenderable(out: Renderable, node: Node, nodePart: NodePart): Renderable {
    super.getRenderable(out, node, nodePart);
    if (nodePart instanceof NodePartPlus) {
      out.userData = (nodePart as NodePartPlus).morphTargets;
    }
    return out;
  }
}
