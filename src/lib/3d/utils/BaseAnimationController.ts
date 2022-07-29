import { Matrix4 } from '../../Matrix4';
import { Quaternion } from '../../Quaternion';
import { Pool, Poolable } from '../../Utils';
import { Vector3 } from '../../Vector3';
import { ModelInstance } from '../ModelInstance';
import { Node } from '../model/Node';
import { Animation } from '../model/Animation';
import { NodeKeyframe } from '../model/NodeKeyframe';
import { NodeAnimation } from '../model/NodeAnimation';

export class Transform implements Poolable {
  public translation = new Vector3();
  public rotation = new Quaternion();
  public scale = new Vector3(1, 1, 1);

  public idt(): Transform {
    this.translation.set(0, 0, 0);
    this.rotation.idt();
    this.scale.set(1, 1, 1);
    return this;
  }

  public set(t: Vector3, r: Quaternion, s: Vector3): Transform {
    this.translation.setFrom(t);
    this.rotation.setFrom(r);
    this.scale.setFrom(s);
    return this;
  }

  public setFrom(other: Transform): Transform {
    return this.set(other.translation, other.rotation, other.scale);
  }

  public lerpWithTranform(target: Transform, alpha: number): Transform {
    return this.lerp(target.translation, target.rotation, target.scale, alpha);
  }

  public lerp(targetT: Vector3, targetR: Quaternion, targetS: Vector3, alpha: number): Transform {
    this.translation.lerp(targetT, alpha);
    this.rotation.slerp(targetR, alpha);
    this.scale.lerp(targetS, alpha);
    return this;
  }

  public toMatrix4(out: Matrix4): Matrix4 {
    return out.setFromTranslationRotation(this.translation, this.rotation, this.scale);
  }

  public reset() {
    this.idt();
  }

  public toString(): string {
    return this.translation.toString() + ' - ' + this.rotation.toString() + ' - ' + this.scale.toString();
  }
}

export class BaseAnimationController {
  protected transformPool = new Pool<Transform>((): Transform => {
    return new Transform();
  });

  private static transforms = new Map<Node, Transform>();
  private applying = false;
  public target: ModelInstance;

  constructor(target: ModelInstance) {
    this.target = target;
  }

  protected begin() {
    if (this.applying) throw new Error('You must call end() after each call to being()');
    this.applying = true;
  }

  protected apply(animation: Animation, time: number, weight: number) {
    if (!this.applying) throw new Error('You must call begin() before adding an animation');
    BaseAnimationController.applyAnimation(
      BaseAnimationController.transforms,
      this.transformPool,
      weight,
      animation,
      time
    );
  }

  protected end() {
    if (!this.applying) throw new Error('You must call begin() first');
    BaseAnimationController.transforms.forEach((value: Transform, key: Node) => {
      value.toMatrix4(key.localTransform);
    });
    BaseAnimationController.transforms.clear();
    this.target.calculateTransforms();
    this.applying = false;
  }

  protected applyAnimation(animation: Animation, time: number) {
    if (this.applying) throw new Error('Call end() first');
    BaseAnimationController.applyAnimation(null, null, 1, animation, time);
    this.target.calculateTransforms();
  }

  protected applyAnimations(anim1: Animation, time1: number, anim2: Animation, time2: number, weight: number) {
    if (anim2 === null || weight === 0) this.applyAnimation(anim1, time1);
    else if (anim1 === null || weight === 1) this.applyAnimation(anim2, time2);
    else if (this.applying) throw new Error('Call end() first');
    else {
      this.begin();
      this.apply(anim1, time1, 1);
      this.apply(anim2, time2, weight);
      this.end();
    }
  }

  private static tmpT = new Transform();
  public static getFirstKeyframeIndexAtTime<T>(arr: NodeKeyframe<T>[], time: number): number {
    const lastIndex = arr.length - 1;
    if (lastIndex <= 0 || time < arr[0].keytime || time > arr[lastIndex].keytime) {
      return 0;
    }

    let minIndex = 0;
    let maxIndex = lastIndex;

    while (minIndex < maxIndex) {
      let i = (minIndex + maxIndex) / 2;
      if (time > arr[i + 1].keytime) {
        minIndex = i + 1;
      } else if (time < arr[i].keytime) {
        maxIndex = i - 1;
      } else {
        return i;
      }
    }
    return minIndex;
  }

  private static getTranslationAtTime(nodeAnim: NodeAnimation, time: number, out: Vector3): Vector3 {
    if (nodeAnim.translation === null) return out.setFrom(nodeAnim.node.translation);
    if (nodeAnim.translation.length === 1) return out.setFrom(nodeAnim.translation[0].value);

    let index = this.getFirstKeyframeIndexAtTime(nodeAnim.translation, time);
    const firstKeyframe = nodeAnim.translation[index];
    out.setFrom(firstKeyframe.value);

    if (++index < nodeAnim.translation.length) {
      const secondKeyframe = nodeAnim.translation[index];
      const t = (time - firstKeyframe.keytime) / (secondKeyframe.keytime - firstKeyframe.keytime);
      out.lerp(secondKeyframe.value, t);
    }
    return out;
  }

  private static getRotationAtTime(nodeAnim: NodeAnimation, time: number, out: Quaternion): Quaternion {
    if (nodeAnim.rotation === null) return out.setFrom(nodeAnim.node.rotation);
    if (nodeAnim.rotation.length === 1) return out.setFrom(nodeAnim.rotation[0].value);

    let index = this.getFirstKeyframeIndexAtTime(nodeAnim.rotation, time);
    const firstKeyframe = nodeAnim.rotation[index];
    out.setFrom(firstKeyframe.value);

    if (++index < nodeAnim.rotation.length) {
      const secondKeyframe = nodeAnim.rotation[index];
      const t = (time - firstKeyframe.keytime) / (secondKeyframe.keytime - firstKeyframe.keytime);
      out.slerp(secondKeyframe.value, t);
    }
    return out;
  }

  private static getScalingAtTime(nodeAnim: NodeAnimation, time: number, out: Vector3): Vector3 {
    if (nodeAnim.scaling === null) return out.setFrom(nodeAnim.node.scale);
    if (nodeAnim.scaling.length === 1) return out.setFrom(nodeAnim.scaling[0].value);

    let index = this.getFirstKeyframeIndexAtTime(nodeAnim.scaling, time);
    const firstKeyframe = nodeAnim.scaling[index];
    out.setFrom(firstKeyframe.value);

    if (++index < nodeAnim.scaling.length) {
      const secondKeyframe = nodeAnim.scaling[index];
      const t = (time - firstKeyframe.keytime) / (secondKeyframe.keytime - firstKeyframe.keytime);
      out.lerp(secondKeyframe.value, t);
    }
    return out;
  }

  private static getNodeAnimationTransform(nodeAnim: NodeAnimation, time: number): Transform {
    const transform = this.tmpT;
    this.getTranslationAtTime(nodeAnim, time, transform.translation);
    this.getRotationAtTime(nodeAnim, time, transform.rotation);
    this.getScalingAtTime(nodeAnim, time, transform.scale);
    return transform;
  }

  private static applyNodeAnimationDirectly(nodeAnim: NodeAnimation, time: number) {
    const node = nodeAnim.node;
    node.isAnimated = true;
    const transform = this.getNodeAnimationTransform(nodeAnim, time);
    transform.toMatrix4(node.localTransform);
  }

  private static applyNodeAnimationBlending(
    nodeAnim: NodeAnimation,
    out: Map<Node, Transform>,
    pool: Pool<Transform>,
    alpha: number,
    time: number
  ) {
    const node = nodeAnim.node;
    node.isAnimated = true;
    const transform = this.getNodeAnimationTransform(nodeAnim, time);

    const t = out.get(node);
    if (t != null) {
      if (alpha > 0.999999) t.setFrom(transform);
      else t.lerpWithTranform(transform, alpha);
    } else {
      if (alpha > 0.999999) out.set(node, pool.obtain().setFrom(transform));
      else
        out.set(
          node,
          pool.obtain().set(node.translation, node.rotation, node.scale).lerpWithTranform(transform, alpha)
        );
    }
  }

  protected static applyAnimation(
    out: Map<Node, Transform>,
    pool: Pool<Transform>,
    alpha: number,
    animation: Animation,
    time: number
  ) {
    if (out === null) {
      for (const nodeAnim of animation.nodeAnimations) this.applyNodeAnimationDirectly(nodeAnim, time);
    } else {
      for (const node of out.keys()) node.isAnimated = false;
      for (const nodeAnim of animation.nodeAnimations)
        this.applyNodeAnimationBlending(nodeAnim, out, pool, alpha, time);
      for (const e of out.entries()) {
        if (!e[0].isAnimated) {
          e[0].isAnimated = true;
          e[1].lerp(e[0].translation, e[0].rotation, e[0].scale, alpha);
        }
      }
    }
  }

  public removeAnimation(animation: Animation) {
    for (const nodeAnim of animation.nodeAnimations) {
      nodeAnim.node.isAnimated = false;
    }
  }
}
