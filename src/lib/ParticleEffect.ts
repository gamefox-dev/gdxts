import { ParticleEmitter } from './ParticleEmitter';
import { PolygonBatch } from './PolygonBatcher';
import { Sprite } from './Sprite';
import { StringBufferedReader } from './StringBufferedReader';
import { TextureAtlas } from './TextureAtlas';
import { Disposable, getFilenameAndExtension } from './Utils';

export class ParticleEffect implements Disposable {
  emitters: ParticleEmitter[] = [];
  ownsTexture: boolean;
  xSizeScale = 1;
  ySizeScale = 1;
  motionScale = 1;

  constructor(effect?: ParticleEffect) {
    if (effect) {
      for (let i = 0; i < effect.emitters.length; i++) {
        this.emitters.push(this.cloneEmitter(effect.emitters[i]));
      }
    }
  }

  start() {
    for (let i = 0; i < this.emitters.length; i++) this.emitters[i].start();
  }

  /** Resets the effect so it can be started again like a new effect.
   * @param resetScaling Whether to restore the original size and motion parameters if they were scaled. Repeated scaling and
   *           resetting may introduce error. */
  reset(resetScaling: boolean = true) {
    for (let i = 0; i < this.emitters.length; i++) {
      this.emitters[i].reset();
    }
    if (resetScaling && (this.xSizeScale !== 1 || this.ySizeScale !== 1 || this.motionScale !== 1)) {
      this.scaleEffect(1 / this.xSizeScale, 1 / this.ySizeScale, 1 / this.motionScale);
      this.xSizeScale = this.ySizeScale = this.motionScale = 1;
    }
  }

  update(delta: number) {
    for (let i = 0; i < this.emitters.length; i++) this.emitters[i].update(delta);
  }

  draw(batch: PolygonBatch, gl: WebGLRenderingContext) {
    for (let i = 0; i < this.emitters.length; i++) this.emitters[i].draw(batch, gl);
  }

  allowCompletion() {
    for (let i = 0; i < this.emitters.length; i++) this.emitters[i].allowCompletion();
  }

  isComplete(): boolean {
    for (let i = 0; i < this.emitters.length; i++) {
      const emitter = this.emitters[i];
      if (!emitter.isComplete()) return false;
    }
    return true;
  }

  setDuration(duration: number) {
    for (let i = 0; i < this.emitters.length; i++) {
      const emitter = this.emitters[i];
      emitter.setContinuous(false);
      emitter.duration = duration;
      emitter.durationTimer = 0;
    }
  }

  setPosition(x: number, y: number) {
    for (let i = 0; i < this.emitters.length; i++) this.emitters[i].setPosition(x, y);
  }

  setFlip(flipX: boolean, flipY: boolean) {
    for (let i = 0; i < this.emitters.length; i++) this.emitters[i].setFlip(flipX, flipY);
  }

  flipY() {
    for (let i = 0; i < this.emitters.length; i++) this.emitters[i].flipYAxis();
  }

  public getEmitters(): ParticleEmitter[] {
    return this.emitters;
  }

  /** Returns the emitter with the specified name, or null. */
  findEmitter(name: string): ParticleEmitter | null {
    for (let i = 0; i < this.emitters.length; i++) {
      const emitter = this.emitters[i];
      if (emitter.getName() === name) return emitter;
    }
    return null;
  }

  /** Allocates all emitters particles. See {@link com.badlogic.gdx.graphics.g2d.ParticleEmitter#preAllocateParticles()} */
  preAllocateParticles() {
    for (const emitter of this.emitters) {
      emitter.preAllocateParticles();
    }
  }

  async load(url: string, atlas: TextureAtlas) {
    await this.loadEmitters(url);
    this.loadEmitterImages(atlas);
  }

  async loadEmitters(url: string) {
    const string = await fetch(url).then(res => res.text());
    const reader = new StringBufferedReader(string);
    while (true) {
      const emitter = ParticleEmitter.load(reader);
      this.emitters.push(emitter);
      if (reader.readLine() === null) break;
    }
  }

  loadEmitterImages(atlas: TextureAtlas) {
    for (let i = 0; i < this.emitters.length; i++) {
      const emitter = this.emitters[i];
      if (emitter.getImagePaths().length === 0) continue;
      const sprites: Sprite[] = [];
      for (let imagePath of emitter.getImagePaths()) {
        const imageName = getFilenameAndExtension(imagePath)[0];
        const sprite = new Sprite(atlas.findRegion(imageName));
        sprites.push(sprite);
      }
      emitter.setSprites(sprites);
    }
  }

  newEmitter(reader: StringBufferedReader): ParticleEmitter {
    return ParticleEmitter.load(reader);
  }

  cloneEmitter(emitter: ParticleEmitter): ParticleEmitter {
    return ParticleEmitter.clone(emitter);
  }

  /** Disposes the texture for each sprite for each ParticleEmitter. */
  // Assume that all textures is not owned by this
  dispose() {
    // if (!this.ownsTexture) return;
    // for (let i = 0; i < this.emitters.length; i++) {
    //   const emitter = this.emitters[i];
    //   for (const sprite of emitter.getSprites()) {
    //     sprite.region.texture.dispose();
    //   }
    // }
  }

  /** Permanently scales all the size and motion parameters of all the emitters in this effect. If this effect originated from a
   * {@link ParticleEffectPool}, the scale will be reset when it is returned to the pool. */
  scaleEffect(_xSizeScale: number, _ySizeScale: number, _motionScale: number) {
    this.xSizeScale *= _xSizeScale;
    this.ySizeScale *= _ySizeScale;
    this.motionScale *= _motionScale;
    for (const emitter of this.emitters) {
      emitter.scaleSizeXY(this.xSizeScale, this.ySizeScale);
      emitter.scaleMotion(this.motionScale);
    }
  }

  /** Sets the {@link com.badlogic.gdx.graphics.g2d.ParticleEmitter#setCleansUpBlendFunction(boolean) cleansUpBlendFunction}
   * parameter on all {@link com.badlogic.gdx.graphics.g2d.ParticleEmitter ParticleEmitters} currently in this ParticleEffect.
   * <p>
   * IMPORTANT: If set to false and if the next object to use this Batch expects alpha blending, you are responsible for setting
   * the Batch's blend function to (GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA) before that next object is drawn.
   * @param cleanUpBlendFunction */
  setEmittersCleanUpBlendFunction(cleanUpBlendFunction: boolean) {
    for (let i = 0; i < this.emitters.length; i++) {
      this.emitters[i].setCleansUpBlendFunction(cleanUpBlendFunction);
    }
  }
}
