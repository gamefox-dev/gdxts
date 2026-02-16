import { Animation, PlayMode } from '../Animation';
import { ParticleEffect } from '../ParticleEffect';
import { ParticleEffectPool, PooledEffect } from '../ParticleEffectPool';
import { PolygonBatch } from '../PolygonBatcher';
import { TextureAtlas } from '../TextureAtlas';
import { Disposable } from '../Utils';
import {
  VfxDefinition,
  VfxEasing,
  VfxLayer,
  VfxLayerPass,
  VfxMotionSpec,
  VfxParticleLayer,
  VfxParticleTemplateConfig,
  VfxPoint,
  VfxPointRef,
  VfxShaderDrawContext,
  VfxShaderLayer,
  VfxShaderRenderer,
  VfxSpawnOptions,
  VfxSpriteLayer
} from './types';

type RuntimeMotion = {
  from: VfxPoint;
  to: VfxPoint;
  duration: number;
  easing: VfxEasing;
};

type RuntimeParticleState = {
  started: boolean;
  completed: boolean;
  completionAllowed: boolean;
  effect: PooledEffect | null;
};

type RuntimeParticleTemplate = {
  effect: ParticleEffect;
  pool: ParticleEffectPool;
};

type RuntimeInstance = {
  handle: number;
  definition: VfxDefinition;
  source: VfxPoint;
  target: VfxPoint;
  position: VfxPoint;
  duration: number;
  loop: boolean;
  time: number;
  timeScale: number;
  motion: RuntimeMotion | null;
  particleStates: Map<number, RuntimeParticleState>;
  stopping: boolean;
};

const clonePoint = (point: VfxPoint): VfxPoint => ({ x: point.x, y: point.y });

const lerp = (from: number, to: number, alpha: number) => from + (to - from) * alpha;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const applyEasing = (easing: VfxEasing, value: number) => {
  const t = clamp01(value);
  switch (easing) {
    case 'easeOutCubic':
      return 1 - Math.pow(1 - t, 3);
    case 'easeInOutSine':
      return -(Math.cos(Math.PI * t) - 1) * 0.5;
    default:
      return t;
  }
};

export class VfxManager implements Disposable {
  private nextHandle = 1;
  private definitions = new Map<string, VfxDefinition>();
  private atlases = new Map<string, TextureAtlas>();
  private animations = new Map<string, Animation | null>();
  private particleTemplates = new Map<string, RuntimeParticleTemplate>();
  private shaderRenderers = new Map<string, VfxShaderRenderer>();
  private instances: RuntimeInstance[] = [];

  registerAtlas(key: string, atlas: TextureAtlas) {
    this.atlases.set(key, atlas);
  }

  registerDefinition(definition: VfxDefinition) {
    this.definitions.set(definition.id, definition);
  }

  registerDefinitions(definitions: VfxDefinition[]) {
    definitions.forEach(definition => this.registerDefinition(definition));
  }

  registerShaderRenderer(key: string, renderer: VfxShaderRenderer) {
    this.shaderRenderers.set(key, renderer);
  }

  async loadParticleTemplate(
    templateKey: string,
    config: VfxParticleTemplateConfig,
    atlas: TextureAtlas
  ): Promise<void> {
    const effect = new ParticleEffect();
    await effect.load(config.effectFile, atlas);
    if (config.flipY) {
      effect.flipY();
    }

    const pool = new ParticleEffectPool(effect, config.poolMin ?? 8, config.poolMax ?? 128);
    this.particleTemplates.set(templateKey, { effect, pool });
  }

  spawn(definitionId: string, options: VfxSpawnOptions = {}): number {
    const definition = this.definitions.get(definitionId);
    if (!definition) {
      throw new Error(`VfxManager.spawn(): definition "${definitionId}" is not registered`);
    }

    const basePosition = options.position ?? options.source ?? options.target ?? { x: 0, y: 0 };
    const source = clonePoint(options.source ?? basePosition);
    const target = clonePoint(options.target ?? source);
    const position = clonePoint(basePosition);
    const duration = Math.max(0.0001, options.duration ?? definition.duration);

    const instance: RuntimeInstance = {
      handle: this.nextHandle++,
      definition,
      source,
      target,
      position,
      duration,
      loop: options.loop ?? !!definition.loop,
      time: 0,
      timeScale: options.timeScale ?? 1,
      motion: null,
      particleStates: new Map(),
      stopping: false
    };

    instance.motion = this.createMotion(instance, options.motion ?? definition.motion);
    this.instances.push(instance);
    return instance.handle;
  }

  stop(handle: number, immediate = false): boolean {
    const index = this.instances.findIndex(item => item.handle === handle);
    if (index < 0) {
      return false;
    }

    if (immediate) {
      this.cleanupInstance(this.instances[index]);
      this.instances.splice(index, 1);
      return true;
    }

    this.instances[index].stopping = true;
    this.allowCompletionForParticles(this.instances[index]);
    return true;
  }

  clear(immediate = false) {
    if (immediate) {
      this.instances.forEach(instance => this.cleanupInstance(instance));
      this.instances.length = 0;
      return;
    }

    this.instances.forEach(instance => {
      instance.stopping = true;
      this.allowCompletionForParticles(instance);
    });
  }

  update(delta: number) {
    for (let i = this.instances.length - 1; i >= 0; i--) {
      const instance = this.instances[i];
      instance.time += delta * instance.timeScale;

      this.updateParticles(instance, delta);

      if (instance.stopping) {
        if (this.areParticlesDone(instance)) {
          this.cleanupInstance(instance);
          this.instances.splice(i, 1);
        }
        continue;
      }

      if (!instance.loop && instance.time >= instance.duration && this.areParticlesDone(instance)) {
        this.cleanupInstance(instance);
        this.instances.splice(i, 1);
      }
    }
  }

  draw(batch: PolygonBatch, gl: WebGLRenderingContext, pass: VfxLayerPass) {
    for (const instance of this.instances) {
      for (let layerIndex = 0; layerIndex < instance.definition.layers.length; layerIndex++) {
        const layer = instance.definition.layers[layerIndex];
        if ((layer.pass ?? 'front') !== pass) {
          continue;
        }

        if (layer.kind === 'sprite') {
          this.drawSpriteLayer(batch, instance, layer);
          continue;
        }

        if (layer.kind === 'particle') {
          const state = instance.particleStates.get(layerIndex);
          if (state?.effect) {
            state.effect.draw(batch, gl);
          }
        }
      }
    }
  }

  drawShaders(pass: VfxLayerPass) {
    for (const instance of this.instances) {
      for (let layerIndex = 0; layerIndex < instance.definition.layers.length; layerIndex++) {
        const layer = instance.definition.layers[layerIndex];
        if (layer.kind !== 'shader') {
          continue;
        }

        if ((layer.pass ?? 'front') !== pass) {
          continue;
        }

        if (!this.isLayerActive(instance, layer)) {
          continue;
        }

        const renderer = this.shaderRenderers.get(layer.shaderKey);
        if (!renderer) {
          continue;
        }

        const localTime = Math.max(0, instance.time - (layer.startTime ?? 0));
        const layerDuration = this.resolveLayerDuration(instance, layer);
        const normalizedTime = layerDuration > 0 ? clamp01(localTime / layerDuration) : 1;
        const position = this.resolveLayerPosition(instance, layer);
        const scaleX = this.resolveScaleX(layer, normalizedTime);
        const scaleY = this.resolveScaleY(layer, normalizedTime);
        const alpha = this.resolveAlpha(layer, normalizedTime);

        const context: VfxShaderDrawContext = {
          instanceHandle: instance.handle,
          layer,
          localTime,
          normalizedTime,
          position,
          source: clonePoint(instance.source),
          target: clonePoint(instance.target),
          motion: this.resolvePoint(instance, 'motion'),
          width: layer.width ?? 100,
          height: layer.height ?? 100,
          rotation: layer.rotation ?? 0,
          alpha,
          scaleX,
          scaleY
        };
        renderer.draw(context);
      }
    }
  }

  private drawSpriteLayer(batch: PolygonBatch, instance: RuntimeInstance, layer: VfxSpriteLayer) {
    if (!this.isLayerActive(instance, layer)) {
      return;
    }

    const animation = this.getAnimation(layer);
    if (!animation) {
      return;
    }

    const localTime = Math.max(0, instance.time - (layer.startTime ?? 0));
    const layerDuration = this.resolveLayerDuration(instance, layer);
    const normalizedTime = layerDuration > 0 ? clamp01(localTime / layerDuration) : 1;

    const mode = layer.mode ?? (this.isLayerLoop(instance, layer) ? PlayMode.LOOP : PlayMode.NORMAL);
    const frame = animation.getKeyFrame(localTime, mode);
    if (!frame) {
      return;
    }

    const position = this.resolveLayerPosition(instance, layer);
    const width = layer.width ?? frame.originalWidth ?? frame.width;
    const height = layer.height ?? frame.originalHeight ?? frame.height;
    const scaleX = this.resolveScaleX(layer, normalizedTime);
    const scaleY = this.resolveScaleY(layer, normalizedTime);
    const alpha = this.resolveAlpha(layer, normalizedTime);
    batch.setColor(1, 1, 1, alpha);
    frame.draw(
      batch,
      position.x - width * 0.5,
      position.y - height * 0.5,
      width,
      height,
      width * 0.5,
      height * 0.5,
      layer.rotation ?? 0,
      scaleX,
      scaleY
    );
    batch.setColor(1, 1, 1, 1);
  }

  private updateParticles(instance: RuntimeInstance, delta: number) {
    for (let layerIndex = 0; layerIndex < instance.definition.layers.length; layerIndex++) {
      const layer = instance.definition.layers[layerIndex];
      if (layer.kind !== 'particle') {
        continue;
      }

      let state = instance.particleStates.get(layerIndex);
      if (!state) {
        state = {
          started: false,
          completed: false,
          completionAllowed: false,
          effect: null
        };
        instance.particleStates.set(layerIndex, state);
      }

      if (!state.started && instance.time >= (layer.startTime ?? 0)) {
        const template = this.particleTemplates.get(layer.templateKey);
        if (template) {
          const pooledEffect = template.pool.obtain();
          const position = this.resolveLayerPosition(instance, layer);
          pooledEffect.setPosition(position.x, position.y);
          const scaleX = layer.scaleX ?? 1;
          const scaleY = layer.scaleY ?? 1;
          const motionScale = layer.motionScale ?? 1;
          if (scaleX !== 1 || scaleY !== 1 || motionScale !== 1) {
            pooledEffect.scaleEffect(scaleX, scaleY, motionScale);
          }
          if (!this.isLayerLoop(instance, layer)) {
            pooledEffect.setDuration(this.resolveLayerDuration(instance, layer));
          }
          pooledEffect.start();
          state.started = true;
          state.effect = pooledEffect;
        }
      }

      if (!state.effect) {
        continue;
      }

      if (layer.followMotion || layer.point === 'motion') {
        const position = this.resolveLayerPosition(instance, layer);
        state.effect.setPosition(position.x, position.y);
      }
      state.effect.update(delta);

      const endTime = (layer.startTime ?? 0) + this.resolveLayerDuration(instance, layer);
      if (!this.isLayerLoop(instance, layer) && instance.time >= endTime && !state.completionAllowed) {
        state.effect.allowCompletion();
        state.completionAllowed = true;
      }

      if ((state.completionAllowed || instance.stopping) && state.effect.isComplete()) {
        state.effect.free();
        state.effect = null;
        state.completed = true;
      }
    }
  }

  private createMotion(instance: RuntimeInstance, spec?: VfxMotionSpec): RuntimeMotion | null {
    if (!spec) {
      return null;
    }
    const from = this.resolvePointSpec(instance, spec.from ?? 'source');
    const to = this.resolvePointSpec(instance, spec.to ?? 'target');
    return {
      from,
      to,
      duration: Math.max(0.0001, spec.duration ?? instance.duration),
      easing: spec.easing ?? 'linear'
    };
  }

  private resolvePointSpec(instance: RuntimeInstance, ref: VfxPoint | VfxPointRef): VfxPoint {
    if (typeof ref === 'object') {
      return clonePoint(ref);
    }
    return this.resolvePoint(instance, ref);
  }

  private resolvePoint(instance: RuntimeInstance, pointRef: VfxPointRef): VfxPoint {
    switch (pointRef) {
      case 'source':
        return clonePoint(instance.source);
      case 'target':
        return clonePoint(instance.target);
      case 'motion':
        return this.resolveMotionPoint(instance);
      default:
        return clonePoint(instance.position);
    }
  }

  private resolveMotionPoint(instance: RuntimeInstance): VfxPoint {
    if (!instance.motion) {
      return clonePoint(instance.position);
    }
    const alpha = applyEasing(instance.motion.easing, instance.time / instance.motion.duration);
    return {
      x: lerp(instance.motion.from.x, instance.motion.to.x, alpha),
      y: lerp(instance.motion.from.y, instance.motion.to.y, alpha)
    };
  }

  private resolveLayerPosition(instance: RuntimeInstance, layer: VfxLayer): VfxPoint {
    const ref = layer.point ?? 'position';
    const base = typeof ref === 'object' ? clonePoint(ref) : this.resolvePoint(instance, ref);
    base.x += layer.offsetX ?? 0;
    base.y += layer.offsetY ?? 0;
    return base;
  }

  private resolveLayerDuration(instance: RuntimeInstance, layer: VfxLayer): number {
    if (layer.duration !== undefined) {
      return Math.max(0.0001, layer.duration);
    }
    const startTime = layer.startTime ?? 0;
    return Math.max(0.0001, instance.duration - startTime);
  }

  private isLayerLoop(instance: RuntimeInstance, layer: VfxLayer): boolean {
    return layer.loop ?? instance.loop;
  }

  private isLayerActive(instance: RuntimeInstance, layer: VfxLayer): boolean {
    const startTime = layer.startTime ?? 0;
    if (instance.time < startTime) {
      return false;
    }
    if (this.isLayerLoop(instance, layer)) {
      return true;
    }
    const endTime = startTime + this.resolveLayerDuration(instance, layer);
    return instance.time <= endTime;
  }

  private resolveScaleX(layer: VfxLayer, normalizedTime: number): number {
    const base = layer.scaleX ?? 1;
    if (layer.scaleFrom === undefined || layer.scaleTo === undefined) {
      return base;
    }
    return base * lerp(layer.scaleFrom, layer.scaleTo, normalizedTime);
  }

  private resolveScaleY(layer: VfxLayer, normalizedTime: number): number {
    const base = layer.scaleY ?? 1;
    if (layer.scaleFrom === undefined || layer.scaleTo === undefined) {
      return base;
    }
    return base * lerp(layer.scaleFrom, layer.scaleTo, normalizedTime);
  }

  private resolveAlpha(layer: VfxLayer, normalizedTime: number): number {
    if (layer.alphaFrom !== undefined && layer.alphaTo !== undefined) {
      return lerp(layer.alphaFrom, layer.alphaTo, normalizedTime);
    }
    return layer.alpha ?? 1;
  }

  private getAnimation(layer: VfxSpriteLayer): Animation | null {
    const key = `${layer.atlasKey}:${layer.regionName}:${layer.frameDuration ?? 0}`;
    if (this.animations.has(key)) {
      return this.animations.get(key) ?? null;
    }

    const atlas = this.atlases.get(layer.atlasKey);
    if (!atlas) {
      this.animations.set(key, null);
      return null;
    }

    const regions = atlas.findRegions(layer.regionName);
    if (!regions.length) {
      this.animations.set(key, null);
      return null;
    }

    const animation = new Animation(regions, layer.frameDuration ?? 1 / 24);
    this.animations.set(key, animation);
    return animation;
  }

  private allowCompletionForParticles(instance: RuntimeInstance) {
    for (const state of instance.particleStates.values()) {
      if (state.effect && !state.completionAllowed) {
        state.effect.allowCompletion();
        state.completionAllowed = true;
      }
    }
  }

  private areParticlesDone(instance: RuntimeInstance): boolean {
    for (const [layerIndex, state] of instance.particleStates.entries()) {
      const layer = instance.definition.layers[layerIndex] as VfxParticleLayer;
      const startTime = layer.startTime ?? 0;
      if (!state.started && startTime < instance.duration) {
        return false;
      }
      if (state.effect) {
        return false;
      }
    }
    return true;
  }

  private cleanupInstance(instance: RuntimeInstance) {
    for (const state of instance.particleStates.values()) {
      if (state.effect) {
        state.effect.free();
        state.effect = null;
      }
    }
  }

  dispose() {
    this.clear(true);
    this.shaderRenderers.forEach(renderer => renderer.dispose?.());
    this.shaderRenderers.clear();
    this.definitions.clear();
    this.atlases.clear();
    this.animations.clear();
    this.particleTemplates.clear();
  }
}
