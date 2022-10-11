import { Animation3D } from '../../../model';
import { AnimationController, AnimationDesc } from '../../../utils/AnimationController';
import { Scene } from '../scene/Scene';
import { AnimationControllerHack } from './AnimationControllerHack';

export class AnimationsPlayer {
  private scene: Scene;

  private controllers = new Array<AnimationController>();

  constructor(scene: Scene) {
    this.scene = scene;
  }

  public addAnimations(animations: AnimationDesc[]) {
    for (const animation of animations) {
      this.addAnimation(animation);
    }
  }
  public addAnimation(animation: AnimationDesc) {
    const c = new AnimationControllerHack(this.scene.modelInstance);
    c.calculateTransforms = false;
    c.setAnimationDesc(animation);
    this.controllers.push(c);
  }
  public removeAnimation(animation: Animation3D) {
    for (let i = this.controllers.length - 1; i >= 0; i--) {
      if (this.controllers[i].current != null && this.controllers[i].current.animation == animation) {
        this.controllers.splice(i, 1);
      }
    }
  }

  public clearAnimations() {
    this.controllers.length = 0;
    if (this.scene.animationController != null) {
      this.scene.animationController.setAnimation(null);
    }
  }

  public loopAll() {
    this.playAll(true);
  }
  public playAll(loop = false) {
    this.clearAnimations();
    for (let i = 0, n = this.scene.modelInstance.animations.length; i < n; i++) {
      const c = new AnimationControllerHack(this.scene.modelInstance);
      c.calculateTransforms = false;
      c.setAnimationWithLoop(this.scene.modelInstance.animations[i], loop ? -1 : 1);
      this.controllers.push(c);
    }
  }

  public stopAll() {
    this.clearAnimations();
  }

  public update(delta: number) {
    if (this.controllers.length > 0) {
      for (const controller of this.controllers) {
        controller.update(delta);
      }
      this.scene.modelInstance.calculateTransforms();
    } else {
      if (this.scene.animationController != null) {
        this.scene.animationController.update(delta);
      }
    }
  }
}
