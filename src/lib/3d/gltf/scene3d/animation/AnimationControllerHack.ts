import { Matrix4 } from '../../../../Matrix4';
import { Quaternion } from '../../../../Quaternion';
import { Pool, Poolable } from '../../../../Utils';
import { Vector3 } from '../../../../Vector3';
import { Animation3D, Node, NodeAnimation, NodeKeyframe } from '../../../model';
import { ModelInstance } from '../../../ModelInstance';
import { AnimationController, AnimationDesc } from '../../../utils';
import { Interpolation } from '../../loaders/shared/animation/Interpolation';
import { CubicQuaternion } from '../model/CubicQuaternion';
import { CubicVector3 } from '../model/CubicVector3';
import { CubicWeightVector } from '../model/CubicWeightVector';
import { NodePartPlus } from '../model/NodePartPlus';
import { NodePlus } from '../model/NodePlus';
import { WeightVector } from '../model/WeightVector';
import { NodeAnimationHack } from './NodeAnimationHack';

export class TransformPlus implements Poolable {
  public translation = new Vector3();
  public rotation = new Quaternion();
  public scale = new Vector3(1, 1, 1);
  public weights = new WeightVector();

  public idt(): TransformPlus {
    this.translation.set(0, 0, 0);
    this.rotation.idt();
    this.scale.set(1, 1, 1);
    this.weights.setEmpty();
    return this;
  }

  public set(t: Vector3, r: Quaternion, s: Vector3, w: WeightVector): TransformPlus {
    this.translation.setFrom(t);
    this.rotation.setFrom(r);
    this.scale.setFrom(s);
    if (w != null) this.weights.set(w);
    else this.weights.setEmpty();
    return this;
  }

  public setFromTransfrom(other: TransformPlus): TransformPlus {
    return this.set(other.translation, other.rotation, other.scale, other.weights);
  }

  public lerp(
    targetT: Vector3,
    targetR: Quaternion,
    targetS: Vector3,
    targetW: WeightVector,
    alpha: number
  ): TransformPlus {
    this.translation.lerp(targetT, alpha);
    this.rotation.slerp(targetR, alpha);
    this.scale.lerp(targetS, alpha);
    if (targetW != null) this.weights.lerp(targetW, alpha);
    return this;
  }

  public toMatrix4(out: Matrix4): Matrix4 {
    return out.setFromTranslationRotation(this.translation, this.rotation, this.scale);
  }

  public reset() {
    this.idt();
  }

  public toString(): string {
    return (
      this.translation.toString() +
      ' - ' +
      this.rotation.toString() +
      ' - ' +
      this.scale.toString() +
      ' - ' +
      this.weights.toString()
    );
  }
}

export class AnimationControllerHack extends AnimationController {
  constructor(target: ModelInstance) {
    super(target);
  }

  private transformPoolP = new Pool<TransformPlus>((): TransformPlus => {
    return new TransformPlus();
  });

  private static transformsP = new Map<Node, TransformPlus>();
  public calculateTransforms = true;

  /** Begin applying multiple animations to the instance, must followed by one or more calls to {
   * {@link #apply(Animation, float, float)} and finally {{@link #end()}. */

  protected begin() {
    if (this.applying) throw new Error('You must call end() after each call to being()');
    this.applying = true;
  }

  /** Apply an animation, must be called between {{@link #begin()} and {{@link #end()}.
   * @param weight The blend weight of this animation relative to the previous applied animations. */
  protected apply(animation: Animation3D, time: number, weight: number) {
    if (!this.applying) throw new Error('You must call begin() before adding an animation');
    AnimationControllerHack.applyAnimationPlus(
      AnimationControllerHack.transformsP,
      this.transformPoolP,
      weight,
      animation,
      time
    );
  }

  /** End applying multiple animations to the instance and update it to reflect the changes. */
  protected end() {
    if (!this.applying) throw new Error('You must call begin() first');
    for (const [key, value] of AnimationControllerHack.transformsP) {
      value.toMatrix4(key.localTransform);
      this.transformPoolP.free(value);
    }
    AnimationControllerHack.transformsP.clear();
    if (this.calculateTransforms) this.target.calculateTransforms();
    this.applying = false;
  }

  /** Apply a single animation to the {@link ModelInstance} and update the it to reflect the changes. */
  protected applyAnimation(animation: Animation3D, time: number) {
    if (this.applying) throw new Error('Call end() first');
    AnimationControllerHack.applyAnimationPlus(null, null, 1, animation, time);
    if (this.calculateTransforms) this.target.calculateTransforms();
  }

  /** Apply two animations, blending the second onto to first using weight. */
  protected applyAnimations(anim1: Animation3D, time1: number, anim2: Animation3D, time2: number, weight: number) {
    if (anim2 == null || weight == 0) this.applyAnimation(anim1, time1);
    else if (anim1 == null || weight == 1) this.applyAnimation(anim2, time2);
    else if (this.applying) throw new Error('Call end() first');
    else {
      this.begin();
      this.apply(anim1, time1, 1);
      this.apply(anim2, time2, weight);
      this.end();
    }
  }

  private static tmpTP = new TransformPlus();

  public static getFirstKeyframeIndexAtTime<T>(arr: NodeKeyframe<T>[], time: number): number {
    const n = arr.length - 1;
    for (let i = 0; i < n; i++) {
      if (time >= arr[i].keytime && time <= arr[i + 1].keytime) {
        return i;
      }
    }
    return n;
  }

  private static getTranslationAtTimePlus(nodeAnim: NodeAnimation, time: number, out: Vector3): Vector3 {
    if (!nodeAnim.translation) return out.setFrom(nodeAnim.node.translation);
    if (nodeAnim.translation.length === 1) return out.setFrom(nodeAnim.translation[0].value);

    let index = this.getFirstKeyframeIndexAtTime(nodeAnim.translation, time);

    let interpolation: Interpolation = null;
    if (nodeAnim instanceof NodeAnimationHack) {
      interpolation = nodeAnim.translationMode;
    }

    if (interpolation == Interpolation.STEP) {
      const firstKeyframe = nodeAnim.translation[index];
      out.setFrom(firstKeyframe.value);
    } else if (interpolation == Interpolation.LINEAR) {
      const firstKeyframe = nodeAnim.translation[index];
      out.setFrom(firstKeyframe.value);
      if (++index < nodeAnim.translation.length) {
        const secondKeyframe = nodeAnim.translation[index];
        const t = (time - firstKeyframe.keytime) / (secondKeyframe.keytime - firstKeyframe.keytime);
        out.lerp(secondKeyframe.value, t);
      } else {
        out.setFrom(firstKeyframe.value);
      }
    } else if (interpolation == Interpolation.CUBICSPLINE) {
      const firstKeyframe = nodeAnim.translation[index];
      if (++index < nodeAnim.translation.length) {
        const secondKeyframe = nodeAnim.translation[index];
        const t = (time - firstKeyframe.keytime) / (secondKeyframe.keytime - firstKeyframe.keytime);

        const firstCV = firstKeyframe.value as CubicVector3;
        const secondCV = secondKeyframe.value as CubicVector3;

        this.cubic(out, t, firstCV, firstCV.tangentOut, secondCV, secondCV.tangentIn);
      } else {
        out.setFrom(firstKeyframe.value);
      }
    }

    return out;
  }

  /** https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#appendix-c-spline-interpolation */
  private static cubic(out: Vector3, t: number, p0: Vector3, m0: Vector3, p1: Vector3, m1: Vector3) {
    // p(t) = (2t3 - 3t2 + 1)p0 + (t3 - 2t2 + t)m0 + (-2t3 + 3t2)p1 + (t3 - t2)m1
    const t2 = t * t;
    const t3 = t2 * t;
    out
      .setFrom(p0)
      .scale(2 * t3 - 3 * t2 + 1)
      .mulAdd(m0, t3 - 2 * t2 + t)
      .mulAdd(p1, -2 * t3 + 3 * t2)
      .mulAdd(m1, t3 - t2);
  }

  private static q1 = new Quaternion();
  private static q2 = new Quaternion();
  private static q3 = new Quaternion();
  private static q4 = new Quaternion();

  /** https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#appendix-c-spline-interpolation
   *
   * https://github.com/KhronosGroup/glTF-Sample-Viewer/blob/6a862d2607fb47ac48f54786b04e40be2ad866a4/src/interpolator.js
   * */
  private static cubicQuaternion(
    out: Quaternion,
    t: number,
    delta: number,
    p0: Quaternion,
    m0: Quaternion,
    p1: Quaternion,
    m1: Quaternion
  ) {
    // XXX not good, see https://github.com/KhronosGroup/glTF-Sample-Viewer/blob/master/src/interpolator.js#L42
    delta = -delta;

    // p(t) = (2t3 - 3t2 + 1)p0 + (t3 - 2t2 + t)m0 + (-2t3 + 3t2)p1 + (t3 - t2)m1
    const t2 = t * t;
    const t3 = t2 * t;
    this.q1.setFrom(p0).mulByScalar(2 * t3 - 3 * t2 + 1);
    this.q2
      .setFrom(m0)
      .mulByScalar(delta)
      .mulByScalar(t3 - 2 * t2 + t);
    this.q3.setFrom(p1).mulByScalar(-2 * t3 + 3 * t2);
    this.q4
      .setFrom(m1)
      .mulByScalar(delta)
      .mulByScalar(t3 - t2);

    out
      .setFrom(AnimationControllerHack.q1)
      .add(
        AnimationControllerHack.q2.x,
        AnimationControllerHack.q2.y,
        AnimationControllerHack.q2.z,
        AnimationControllerHack.q2.w
      )
      .add(
        AnimationControllerHack.q3.x,
        AnimationControllerHack.q3.y,
        AnimationControllerHack.q3.z,
        AnimationControllerHack.q3.w
      )
      .add(
        AnimationControllerHack.q4.x,
        AnimationControllerHack.q4.y,
        AnimationControllerHack.q4.z,
        AnimationControllerHack.q4.w
      )
      .nor();
  }

  private static cubicWeightVector(
    out: WeightVector,
    t: number,
    p0: WeightVector,
    m0: WeightVector,
    p1: WeightVector,
    m1: WeightVector
  ) {
    // p(t) = (2t3 - 3t2 + 1)p0 + (t3 - 2t2 + t)m0 + (-2t3 + 3t2)p1 + (t3 - t2)m1
    const t2 = t * t;
    const t3 = t2 * t;
    out
      .set(p0)
      .scl(2 * t3 - 3 * t2 + 1)
      .mulAdd(m0, t3 - 2 * t2 + t)
      .mulAdd(p1, -2 * t3 + 3 * t2)
      .mulAdd(m1, t3 - t2);
  }

  private static getRotationAtTimePlus(nodeAnim: NodeAnimation, time: number, out: Quaternion): Quaternion {
    if (nodeAnim.rotation == null) return out.setFrom(nodeAnim.node.rotation);
    if (nodeAnim.rotation.length == 1) return out.setFrom(nodeAnim.rotation[0].value);

    let index = this.getFirstKeyframeIndexAtTime(nodeAnim.rotation, time);

    let interpolation: Interpolation = null;
    if (nodeAnim instanceof NodeAnimationHack) {
      interpolation = nodeAnim.rotationMode;
    }

    if (interpolation == Interpolation.STEP) {
      const firstKeyframe = nodeAnim.rotation[index];
      out.setFrom(firstKeyframe.value);
    } else if (interpolation == Interpolation.LINEAR) {
      const firstKeyframe = nodeAnim.rotation[index];
      out.setFrom(firstKeyframe.value);
      if (++index < nodeAnim.rotation.length) {
        const secondKeyframe = nodeAnim.rotation[index];
        const t = (time - firstKeyframe.keytime) / (secondKeyframe.keytime - firstKeyframe.keytime);
        out.slerp(secondKeyframe.value, t);
      } else {
        out.setFrom(firstKeyframe.value);
      }
    } else if (interpolation == Interpolation.CUBICSPLINE) {
      const firstKeyframe = nodeAnim.rotation[index];
      if (++index < nodeAnim.rotation.length) {
        const secondKeyframe = nodeAnim.rotation[index];
        const t = (time - firstKeyframe.keytime) / (secondKeyframe.keytime - firstKeyframe.keytime);

        const firstCV = firstKeyframe.value as CubicQuaternion;
        const secondCV = secondKeyframe.value as CubicQuaternion;

        this.cubicQuaternion(
          out,
          t,
          secondKeyframe.keytime - firstKeyframe.keytime,
          firstCV,
          firstCV.tangentOut,
          secondCV,
          secondCV.tangentIn
        );
      } else {
        out.setFrom(firstKeyframe.value);
      }
    }

    return out;
  }

  private static getScalingAtTimePlus(nodeAnim: NodeAnimation, time: number, out: Vector3): Vector3 {
    if (!nodeAnim.scaling) return out.setFrom(nodeAnim.node.scale);
    if (nodeAnim.scaling.length === 1) return out.setFrom(nodeAnim.scaling[0].value);

    let index = this.getFirstKeyframeIndexAtTime(nodeAnim.scaling, time);

    let interpolation: Interpolation = null;
    if (nodeAnim instanceof NodeAnimationHack) {
      interpolation = nodeAnim.scalingMode;
    }

    if (interpolation == Interpolation.STEP) {
      const firstKeyframe = nodeAnim.scaling[index];
      out.setFrom(firstKeyframe.value);
    } else if (interpolation == Interpolation.LINEAR) {
      const firstKeyframe = nodeAnim.scaling[index];
      out.setFrom(firstKeyframe.value);
      if (++index < nodeAnim.scaling.length) {
        const secondKeyframe = nodeAnim.scaling[index];
        const t = (time - firstKeyframe.keytime) / (secondKeyframe.keytime - firstKeyframe.keytime);
        out.lerp(secondKeyframe.value, t);
      } else {
        out.setFrom(firstKeyframe.value);
      }
    } else if (interpolation == Interpolation.CUBICSPLINE) {
      const firstKeyframe = nodeAnim.scaling[index];
      if (++index < nodeAnim.scaling.length) {
        const secondKeyframe = nodeAnim.scaling[index];
        const t = (time - firstKeyframe.keytime) / (secondKeyframe.keytime - firstKeyframe.keytime);

        const firstCV = firstKeyframe.value as CubicVector3;
        const secondCV = secondKeyframe.value as CubicVector3;

        this.cubic(out, t, firstCV, firstCV.tangentOut, secondCV, secondCV.tangentIn);
      } else {
        out.setFrom(firstKeyframe.value);
      }
    }
    return out;
  }

  private static getMorphTargetAtTime(nodeAnim: NodeAnimationHack, time: number, out: WeightVector): WeightVector {
    if (!nodeAnim.weights) return out.setEmpty();
    if (nodeAnim.weights.length === 1) return out.set(nodeAnim.weights[0].value);

    let index = this.getFirstKeyframeIndexAtTime(nodeAnim.weights, time);

    let interpolation: Interpolation = null;
    if (nodeAnim instanceof NodeAnimationHack) {
      interpolation = nodeAnim.weightsMode;
    }

    if (interpolation == Interpolation.STEP) {
      const firstKeyframe = nodeAnim.weights[index];
      out.set(firstKeyframe.value);
    } else if (interpolation == Interpolation.LINEAR) {
      const firstKeyframe = nodeAnim.weights[index];
      out.set(firstKeyframe.value);
      if (++index < nodeAnim.weights.length) {
        const secondKeyframe = nodeAnim.weights[index];
        const t = (time - firstKeyframe.keytime) / (secondKeyframe.keytime - firstKeyframe.keytime);
        out.lerp(secondKeyframe.value, t);
      } else {
        out.set(firstKeyframe.value);
      }
    } else if (interpolation == Interpolation.CUBICSPLINE) {
      const firstKeyframe = nodeAnim.weights[index];
      if (++index < nodeAnim.weights.length) {
        const secondKeyframe = nodeAnim.weights[index];
        const t = (time - firstKeyframe.keytime) / (secondKeyframe.keytime - firstKeyframe.keytime);

        const firstCV = firstKeyframe.value as CubicWeightVector;
        const secondCV = secondKeyframe.value as CubicWeightVector;

        this.cubicWeightVector(out, t, firstCV, firstCV.tangentOut, secondCV, secondCV.tangentIn);
      } else {
        out.set(firstKeyframe.value);
      }
    }

    return out;
  }

  private static getNodeAnimationTransformPlus(nodeAnim: NodeAnimation, time: number): TransformPlus {
    const transform = this.tmpTP;
    this.getTranslationAtTimePlus(nodeAnim, time, transform.translation);
    this.getRotationAtTimePlus(nodeAnim, time, transform.rotation);
    this.getScalingAtTimePlus(nodeAnim, time, transform.scale);
    if (nodeAnim instanceof NodeAnimationHack) this.getMorphTargetAtTime(nodeAnim, time, transform.weights);
    return transform;
  }

  private static applyNodeAnimationDirectlyPlus(nodeAnim: NodeAnimation, time: number) {
    const node = nodeAnim.node;
    node.isAnimated = true;
    const transform = this.getNodeAnimationTransformPlus(nodeAnim, time);
    transform.toMatrix4(node.localTransform);
    if (node instanceof NodePlus) {
      if (node.weights != null) {
        node.weights.set(transform.weights);
        for (const part of node.parts) {
          (part as NodePartPlus).morphTargets.set(transform.weights);
        }
      }
    }
  }

  private static applyNodeAnimationBlendingPlus(
    nodeAnim: NodeAnimation,
    out: Map<Node, TransformPlus>,
    pool: Pool<TransformPlus>,
    alpha: number,
    time: number
  ) {
    const node = nodeAnim.node;
    node.isAnimated = true;
    const transform = this.getNodeAnimationTransformPlus(nodeAnim, time);

    const t = out.get(node);
    if (!!t) {
      if (alpha > 0.999999) t.setFromTransfrom(transform);
      else t.lerp(transform.translation, transform.rotation, transform.scale, transform.weights, alpha);
    } else {
      if (alpha > 0.999999) out.set(node, pool.obtain().setFromTransfrom(transform));
      else
        out.set(
          node,
          pool
            .obtain()
            .set(node.translation, node.rotation, node.scale, (node as NodePlus).weights)
            .lerp(transform.translation, transform.rotation, transform.scale, transform.weights, alpha)
        );
    }
  }

  /** Helper method to apply one animation to either an objectmap for blending or directly to the bones. */
  protected static applyAnimationPlus(
    out: Map<Node, TransformPlus>,
    pool: Pool<TransformPlus>,
    alpha: number,
    animation: Animation3D,
    time: number
  ) {
    if (out == null) {
      for (const nodeAnim of animation.nodeAnimations) this.applyNodeAnimationDirectlyPlus(nodeAnim, time);
    } else {
      for (const [key] of out) key.isAnimated = false;
      for (const nodeAnim of animation.nodeAnimations)
        this.applyNodeAnimationBlendingPlus(nodeAnim, out, pool, alpha, time);
      for (const [key, value] of out) {
        if (!key.isAnimated) {
          key.isAnimated = true;
          value.lerp(key.translation, key.rotation, key.scale, (key as NodePlus).weights, alpha);
        }
      }
    }
  }

  public setAnimationDesc(anim: AnimationDesc) {
    this.setAnimationWithAnimation(
      anim.animation,
      anim.offset,
      anim.duration,
      anim.loopCount,
      anim.speed,
      anim.listener
    );
  }

  public setAnimationWithLoop(animation: Animation3D, loopCount = 1) {
    this.setAnimationWithAnimation(animation, 0, animation.duration, loopCount, 1, null); // loop count: 0 paused, -1 infinite
  }
}
