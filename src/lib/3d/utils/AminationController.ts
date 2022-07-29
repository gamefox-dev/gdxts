import { MathUtils, Pool } from '../../Utils';
import { Animation } from '../model/Animation';
import { BaseAnimationController } from './BaseAnimationController';

export class AnimationDesc {
  public listener: AnimationListener = null;
  public animation: Animation = null;
  public speed: number;
  public time: number;
  public offset: number;
  public duration: number;
  public loopCount: number;

  public update(delta: number): number {
    if (this.loopCount !== 0 && this.animation !== null) {
      let loops;
      const diff = this.speed * delta;
      if (!MathUtils.isZero(this.duration)) {
        this.time += diff;
        if (this.speed < 0) {
          let invTime = this.duration - this.time;
          loops = Math.abs(invTime / this.duration);
          invTime = Math.abs(invTime % this.duration);
          this.time = this.duration - invTime;
        } else {
          loops = Math.abs(this.time / this.duration);
          this.time = Math.abs(this.time % this.duration);
        }
      } else loops = 1;
      for (let i = 0; i < loops; i++) {
        if (this.loopCount > 0) this.loopCount--;
        if (this.loopCount !== 0 && this.listener !== null) this.listener.onLoop(this);
        if (this.loopCount === 0) {
          const result = (loops - 1 - i) * this.duration + (diff < 0 ? this.duration - this.time : this.time);
          this.time = diff < 0 ? 0 : this.duration;
          if (this.listener !== null) this.listener.onEnd(this);
          return result;
        }
      }
      return -1;
    } else return delta;
  }
}

export interface AnimationListener {
  onEnd(animation: AnimationDesc): void;
  onLoop(animation: AnimationDesc): void;
}

export class AnimationController extends BaseAnimationController {
  protected animationPool = new Pool<AnimationDesc>((): AnimationDesc => {
    return new AnimationDesc();
  });

  public current: AnimationDesc = null;
  public queued: AnimationDesc = null;
  public queuedTransitionTime: number;
  public previous: AnimationDesc = null;
  public transitionCurrentTime: number;
  public transitionTargetTime: number;
  public inAction: boolean;
  public paused: boolean;
  public allowSameAnimation: boolean;
  private justChangedAnimation = false;

  private obtainAnimation(
    anim: Animation,
    offset: number,
    duration: number,
    loopCount: number,
    speed: number,
    listener: AnimationListener
  ): AnimationDesc {
    if (anim === null) return null;
    const result = this.animationPool.obtain();
    result.animation = anim;
    result.listener = listener;
    result.loopCount = loopCount;
    result.speed = speed;
    result.offset = offset;
    result.duration = duration < 0 ? anim.duration - offset : duration;
    result.time = speed < 0 ? result.duration : 0;
    return result;
  }

  private obtain(
    id: string,
    offset: number,
    duration: number,
    loopCount: number,
    speed: number,
    listener: AnimationListener
  ): AnimationDesc {
    if (id === null) return null;
    const anim = this.target.getAnimation(id);
    if (anim === null) throw new Error('Unknown animation: ' + id);
    return this.obtainAnimation(anim, offset, duration, loopCount, speed, listener);
  }

  private obtainAnimationDesc(anim: AnimationDesc): AnimationDesc {
    return this.obtainAnimation(anim.animation, anim.offset, anim.duration, anim.loopCount, anim.speed, anim.listener);
  }

  public update(delta: number) {
    if (this.paused) return;
    if (this.previous !== null && (this.transitionCurrentTime += delta) >= this.transitionTargetTime) {
      this.removeAnimation(this.previous.animation);
      this.justChangedAnimation = true;
      this.animationPool.free(this.previous);
      this.previous = null;
    }
    if (this.justChangedAnimation) {
      this.target.calculateTransforms();
      this.justChangedAnimation = false;
    }
    if (this.current === null || this.current.loopCount === 0 || this.current.animation === null) return;
    const remain = this.current.update(delta);
    if (remain >= 0 && this.queued !== null) {
      this.inAction = false;
      this.actionWithAnimationDesc(this.queued, this.queuedTransitionTime);
      this.queued = null;
      if (remain > 0) this.update(remain);
      return;
    }
    if (this.previous !== null)
      this.applyAnimations(
        this.previous.animation,
        this.previous.offset + this.previous.time,
        this.current.animation,
        this.current.offset + this.current.time,
        this.transitionCurrentTime / this.transitionTargetTime
      );
    else this.applyAnimation(this.current.animation, this.current.offset + this.current.time);
  }

  public setAnimation(
    id: string,
    loopCount: number = 1,
    speed: number = 1,
    listener: AnimationListener = null
  ): AnimationDesc {
    return this.setAnimationWithOffset(id, 0, -1, loopCount, speed, listener);
  }

  public setAnimationWithOffset(
    id: string,
    offset: number,
    duration: number,
    loopCount: number,
    speed: number,
    listener: AnimationListener
  ): AnimationDesc {
    return this.setAnimationWithAnimationDesc(this.obtain(id, offset, duration, loopCount, speed, listener));
  }

  protected setAnimationWithAnimation(
    anim: Animation,
    offset: number,
    duration: number,
    loopCount: number,
    speed: number,
    listener: AnimationListener
  ): AnimationDesc {
    return this.setAnimationWithAnimationDesc(this.obtainAnimation(anim, offset, duration, loopCount, speed, listener));
  }

  protected setAnimationWithAnimationDesc(anim: AnimationDesc): AnimationDesc {
    if (this.current === null) this.current = anim;
    else {
      if (!this.allowSameAnimation && anim !== null && this.current.animation === anim.animation)
        anim.time = this.current.time;
      else this.removeAnimation(this.current.animation);
      this.animationPool.free(this.current);
      this.current = anim;
    }
    this.justChangedAnimation = true;
    return anim;
  }

  public animate(
    id: string,
    loopCount: number = 0,
    speed: number = 1,
    listener: AnimationListener = null,
    transitionTime: number
  ) {
    return this.animateWithOffset(id, 0, -1, loopCount, speed, listener, transitionTime);
  }

  public animateWithOffset(
    id: string,
    offset: number,
    duration: number,
    loopCount: number,
    speed: number,
    listener: AnimationListener,
    transitionTime: number
  ): AnimationDesc {
    return this.animateWithAnimationDesc(this.obtain(id, offset, duration, loopCount, speed, listener), transitionTime);
  }

  protected animateWithAnimation(
    anim: Animation,
    offset: number,
    duration: number,
    loopCount: number,
    speed: number,
    listener: AnimationListener,
    transitionTime: number
  ): AnimationDesc {
    return this.animateWithAnimationDesc(
      this.obtainAnimation(anim, offset, duration, loopCount, speed, listener),
      transitionTime
    );
  }

  protected animateWithAnimationDesc(anim: AnimationDesc, transitionTime: number): AnimationDesc {
    if (this.current === null || this.current.loopCount === 0) this.current = anim;
    else if (this.inAction) this.queueWithAnimationDesc(anim, transitionTime);
    else if (!this.allowSameAnimation && anim !== null && this.current.animation === anim.animation) {
      anim.time = this.current.time;
      this.animationPool.free(this.current);
      this.current = anim;
    } else {
      if (this.previous !== null) {
        this.removeAnimation(this.previous.animation);
        this.animationPool.free(this.previous);
      }
      this.previous = this.current;
      this.current = anim;
      this.transitionCurrentTime = 0;
      this.transitionTargetTime = transitionTime;
    }
    return anim;
  }

  public queue(
    id: string,
    loopCount: number,
    speed: number,
    listener: AnimationListener,
    transitionTime: number
  ): AnimationDesc {
    return this.queueWithOffset(id, 0, -1, loopCount, speed, listener, transitionTime);
  }

  public queueWithOffset(
    id: string,
    offset: number,
    duration: number,
    loopCount: number,
    speed: number,
    listener: AnimationListener,
    transitionTime: number
  ): AnimationDesc {
    return this.queueWithAnimationDesc(this.obtain(id, offset, duration, loopCount, speed, listener), transitionTime);
  }

  protected queueWithAnimation(
    anim: Animation,
    offset: number,
    duration: number,
    loopCount: number,
    speed: number,
    listener: AnimationListener,
    transitionTime: number
  ): AnimationDesc {
    return this.queueWithAnimationDesc(
      this.obtainAnimation(anim, offset, duration, loopCount, speed, listener),
      transitionTime
    );
  }

  protected queueWithAnimationDesc(anim: AnimationDesc, transitionTime: number): AnimationDesc {
    if (this.current === null || this.current.loopCount === 0) this.animateWithAnimationDesc(anim, transitionTime);
    else {
      if (this.queued !== null) this.animationPool.free(this.queued);
      this.queued = anim;
      this.queuedTransitionTime = transitionTime;
      if (this.current.loopCount < 0) this.current.loopCount = 1;
    }
    return anim;
  }

  public action(
    id: string,
    loopCount: number,
    speed: number,
    listener: AnimationListener,
    transitionTime: number
  ): AnimationDesc {
    return this.actionWithOffset(id, 0, -1, loopCount, speed, listener, transitionTime);
  }

  public actionWithOffset(
    id: string,
    offset: number,
    duration: number,
    loopCount: number,
    speed: number,
    listener: AnimationListener,
    transitionTime: number
  ): AnimationDesc {
    return this.actionWithAnimationDesc(this.obtain(id, offset, duration, loopCount, speed, listener), transitionTime);
  }

  protected actionWithAnimation(
    anim: Animation,
    offset: number,
    duration: number,
    loopCount: number,
    speed: number,
    listener: AnimationListener,
    transitionTime: number
  ): AnimationDesc {
    return this.actionWithAnimationDesc(
      this.obtainAnimation(anim, offset, duration, loopCount, speed, listener),
      transitionTime
    );
  }

  protected actionWithAnimationDesc(anim: AnimationDesc, transitionTime: number): AnimationDesc {
    if (anim.loopCount < 0) throw new Error('An action cannot be continuous');
    if (this.current === null || this.current.loopCount === 0) this.animateWithAnimationDesc(anim, transitionTime);
    else {
      const toQueue = this.inAction ? null : this.obtainAnimationDesc(this.current);
      this.inAction = false;
      this.animateWithAnimationDesc(anim, transitionTime);
      this.inAction = true;
      if (toQueue !== null) this.queueWithAnimationDesc(toQueue, transitionTime);
    }
    return anim;
  }
}
