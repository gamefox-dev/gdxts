import { ParticleEffect } from './ParticleEffect';
import { Pool } from './Utils';

export class ParticleEffectPool extends Pool<PooledEffect> {
  effect: ParticleEffect;

  constructor(effect: ParticleEffect, _initialCapacity: number, _max: number) {
    super();
    this.effect = effect;
  }

  newObject(): PooledEffect {
    const pooledEffect = new PooledEffect(this, this.effect);
    pooledEffect.start();
    return pooledEffect;
  }

  free(effect: PooledEffect) {
    super.free(effect);

    effect.reset(false); // copy parameters exactly to avoid introducing error
    if (
      effect.xSizeScale !== this.effect.xSizeScale ||
      effect.ySizeScale !== this.effect.ySizeScale ||
      effect.motionScale !== this.effect.motionScale
    ) {
      const emitters = effect.getEmitters();
      const templateEmitters = this.effect.getEmitters();
      for (let i = 0; i < emitters.length; i++) {
        const emitter = emitters[i];
        const templateEmitter = templateEmitters[i];
        emitter.matchSize(templateEmitter);
        emitter.matchMotion(templateEmitter);
      }
      effect.xSizeScale = this.effect.xSizeScale;
      effect.ySizeScale = this.effect.ySizeScale;
      effect.motionScale = this.effect.motionScale;
    }
  }
}

class PooledEffect extends ParticleEffect {
  constructor(private pool: ParticleEffectPool, effect: ParticleEffect) {
    super(effect);
  }

  free() {
    this.pool.free(this);
  }
}
