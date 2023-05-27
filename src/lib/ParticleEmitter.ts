import { StringBufferedReader } from './StringBufferedReader';
import { PolygonBatch } from './PolygonBatcher';
import { Sprite } from './Sprite';
import { MathUtils, Utils } from './Utils';

export enum SpawnShape {
  point,
  line,
  square,
  ellipse
}

export enum SpawnEllipseSide {
  both,
  top,
  bottom
}

export enum SpriteMode {
  single,
  random,
  animated
}

export class ParticleEmitter {
  private static UPDATE_SCALE = 1 << 0;
  private static UPDATE_ANGLE = 1 << 1;
  private static UPDATE_ROTATION = 1 << 2;
  private static UPDATE_VELOCITY = 1 << 3;
  private static UPDATE_WIND = 1 << 4;
  private static UPDATE_GRAVITY = 1 << 5;
  private static UPDATE_TINT = 1 << 6;
  private static UPDATE_SPRITE = 1 << 7;

  private delayValue = new RangedNumericValue();
  private lifeOffsetValue = new IndependentScaledNumericValue();
  private durationValue = new RangedNumericValue();
  private lifeValue = new IndependentScaledNumericValue();
  private emissionValue = new ScaledNumericValue();
  private xScaleValue = new ScaledNumericValue();
  private yScaleValue = new ScaledNumericValue();
  private rotationValue = new ScaledNumericValue();
  private velocityValue = new ScaledNumericValue();
  private angleValue = new ScaledNumericValue();
  private windValue = new ScaledNumericValue();
  private gravityValue = new ScaledNumericValue();
  private transparencyValue = new ScaledNumericValue();
  private tintValue = new GradientColorValue();
  private xOffsetValue = new ScaledNumericValue();
  private yOffsetValue = new ScaledNumericValue();
  private spawnWidthValue = new ScaledNumericValue();
  private spawnHeightValue = new ScaledNumericValue();
  private spawnShapeValue = new SpawnShapeValue();

  private xSizeValues: RangedNumericValue[] = [];
  private ySizeValues: RangedNumericValue[] = [];
  private motionValues: RangedNumericValue[] = [];

  private accumulator: number = 0;
  private sprites: Sprite[] = [];
  private spriteMode = SpriteMode.single;
  private particles: Particle[] = [];
  private minParticleCount: number;
  private maxParticleCount = 4;
  private x: number = 0;
  private y: number = 0;
  private name: string;
  private imagePaths: string[] = [];
  private activeCount: number;
  private active: boolean[] = [];
  private firstUpdate: boolean;
  private flipX: boolean;
  private flipY: boolean;
  private updateFlags: number;
  private allowingCompletion: boolean;
  // private BoundingBox bounds;

  private emission: number;
  private emissionDiff: number;
  private emissionDelta: number = 0;
  private lifeOffset: number;
  private lifeOffsetDiff: number;
  private life: number;
  private lifeDiff: number;
  private spawnWidth: number;
  private spawnWidthDiff: number;
  private spawnHeight: number;
  private spawnHeightDiff: number;
  public duration = 1;
  public durationTimer: number;
  private delay: number;
  private delayTimer: number;

  private attached: boolean;
  private continuous: boolean;
  private aligned: boolean;
  private behind: boolean;
  private additive: boolean = true;
  private premultipliedAlpha: boolean = false;
  private cleaningUpBlendFunction: boolean = true;

  static load(reader: StringBufferedReader): ParticleEmitter {
    const emitter = new ParticleEmitter();
    emitter.initialize();
    emitter.load(reader);
    return emitter;
  }

  static clone(otherEmitter: ParticleEmitter): ParticleEmitter {
    const emitter = new ParticleEmitter();
    emitter.set(otherEmitter);
    return emitter;
  }

  public set(emitter: ParticleEmitter) {
    this.sprites.length = 0;
    emitter.sprites.forEach(sprite => {
      this.sprites.push(sprite);
    });
    this.imagePaths.length = 0;
    emitter.imagePaths.forEach(path => {
      this.imagePaths.push(path);
    });
    this.name = emitter.name;
    this.setMaxParticleCount(emitter.maxParticleCount);
    this.minParticleCount = emitter.minParticleCount;
    this.delayValue.set(emitter.delayValue);
    this.durationValue.set(emitter.durationValue);
    this.emissionValue.set(emitter.emissionValue);
    this.lifeValue.set(emitter.lifeValue);
    this.lifeOffsetValue.set(emitter.lifeOffsetValue);
    this.xScaleValue.set(emitter.xScaleValue);
    this.yScaleValue.set(emitter.yScaleValue);
    this.rotationValue.set(emitter.rotationValue);
    this.velocityValue.set(emitter.velocityValue);
    this.angleValue.set(emitter.angleValue);
    this.windValue.set(emitter.windValue);
    this.gravityValue.set(emitter.gravityValue);
    this.transparencyValue.set(emitter.transparencyValue);
    this.tintValue.set(emitter.tintValue);
    this.xOffsetValue.set(emitter.xOffsetValue);
    this.yOffsetValue.set(emitter.yOffsetValue);
    this.spawnWidthValue.set(emitter.spawnWidthValue);
    this.spawnHeightValue.set(emitter.spawnHeightValue);
    this.spawnShapeValue.set(emitter.spawnShapeValue);
    this.attached = emitter.attached;
    this.continuous = emitter.continuous;
    this.aligned = emitter.aligned;
    this.behind = emitter.behind;
    this.additive = emitter.additive;
    this.premultipliedAlpha = emitter.premultipliedAlpha;
    this.cleaningUpBlendFunction = emitter.cleaningUpBlendFunction;
    this.spriteMode = emitter.spriteMode;
    this.setPosition(emitter.getX(), emitter.getY());
  }

  private initialize() {
    this.sprites.length = 0;
    this.imagePaths.length = 0;
    this.durationValue.setAlwaysActive(true);
    this.emissionValue.setAlwaysActive(true);
    this.lifeValue.setAlwaysActive(true);
    this.xScaleValue.setAlwaysActive(true);
    this.tintValue.setAlwaysActive(true);
    this.transparencyValue.setAlwaysActive(true);
    this.spawnShapeValue.setAlwaysActive(true);
    this.spawnWidthValue.setAlwaysActive(true);
    this.spawnHeightValue.setAlwaysActive(true);
  }

  setMaxParticleCount(maxParticleCount: number) {
    this.maxParticleCount = maxParticleCount;
    this.active = new Array(maxParticleCount);
    this.particles = new Array(maxParticleCount);
    this.activeCount = 0;
  }

  addParticle() {
    const activeCount = this.activeCount;
    if (activeCount === this.maxParticleCount) return;
    const active = this.active;
    for (let i = 0; i < active.length; i++) {
      if (!active[i]) {
        this.activateParticle(i);
        active[i] = true;
        this.activeCount = activeCount + 1;
        break;
      }
    }
  }

  addParticles(count: number) {
    count = Math.min(count, this.maxParticleCount - this.activeCount);
    if (count === 0) return;
    const active = this.active;
    let index = 0;
    let n = active.length;

    outer: for (let i = 0; i < count; i++) {
      for (; index < n; index++) {
        if (!active[index]) {
          this.activateParticle(index);
          active[index++] = true;
          continue outer;
        }
      }
      break;
    }
    this.activeCount += count;
  }

  update(delta: number) {
    this.accumulator += delta * 1000;
    if (this.accumulator < 1) return;
    const deltaMillis = this.accumulator;
    this.accumulator -= deltaMillis;

    if (this.delayTimer < this.delay) {
      this.delayTimer += deltaMillis;
    } else {
      let done = false;
      if (this.firstUpdate) {
        this.firstUpdate = false;
        this.addParticle();
      }

      if (this.durationTimer < this.duration) this.durationTimer += deltaMillis;
      else {
        if (!this.continuous || this.allowingCompletion) done = true;
        else this.restart();
      }

      if (!done) {
        this.emissionDelta += deltaMillis;
        let emissionTime =
          this.emission + this.emissionDiff * this.emissionValue.getScale(this.durationTimer / this.duration);

        if (emissionTime > 0) {
          emissionTime = 1000 / emissionTime;
          if (this.emissionDelta >= emissionTime) {
            let emitCount = this.emissionDelta / emissionTime;
            emitCount = Math.min(emitCount, this.maxParticleCount - this.activeCount);
            this.emissionDelta -= emitCount * emissionTime;
            this.emissionDelta %= emissionTime;
            this.addParticles(emitCount);
          }
        }
        if (this.activeCount < this.minParticleCount) this.addParticles(this.minParticleCount - this.activeCount);
      }
    }

    const active = this.active;
    let activeCount = this.activeCount;
    const particles = this.particles;
    for (let i = 0; i < active.length; i++) {
      if (active[i] && !this.updateParticle(particles[i], delta, deltaMillis)) {
        active[i] = false;
        activeCount--;
      }
    }
    this.activeCount = activeCount;
  }

  draw(batch: PolygonBatch, gl: WebGLRenderingContext) {
    if (this.premultipliedAlpha) {
      batch.setBlendMode(gl.ONE, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    } else if (this.additive) {
      batch.setBlendMode(gl.SRC_ALPHA, gl.SRC_ALPHA, gl.ONE);
    } else {
      batch.setBlendMode(gl.SRC_ALPHA, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }
    const particles = this.particles;
    const active = this.active;

    for (let i = 0; i < active.length; i++) {
      if (active[i]) particles[i].draw(batch);
    }

    if (this.cleaningUpBlendFunction && (this.additive || this.premultipliedAlpha))
      batch.setBlendMode(gl.SRC_ALPHA, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  /** Updates and draws the particles. This is slightly more efficient than calling {@link #update} and
   * {@link #draw(Batch)} separately. */
  updateAndDraw(batch: PolygonBatch, gl: WebGLRenderingContext, delta: number) {
    this.accumulator += delta * 1000;
    if (this.accumulator < 1) {
      this.draw(batch, gl);
      return;
    }
    const deltaMillis = this.accumulator;
    this.accumulator -= deltaMillis;

    if (this.premultipliedAlpha) {
      batch.setBlendMode(gl.ONE, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    } else if (this.additive) {
      batch.setBlendMode(gl.SRC_ALPHA, gl.SRC_ALPHA, gl.ONE);
    } else {
      batch.setBlendMode(gl.SRC_ALPHA, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    const particles = this.particles;
    const active = this.active;
    let activeCount = this.activeCount;
    for (let i = 0; i < active.length; i++) {
      if (active[i]) {
        const particle = particles[i];
        if (this.updateParticle(particle, delta, deltaMillis)) particle.draw(batch);
        else {
          active[i] = false;
          activeCount--;
        }
      }
    }
    this.activeCount = activeCount;

    if (this.cleaningUpBlendFunction && (this.additive || this.premultipliedAlpha))
      batch.setBlendMode(gl.SRC_ALPHA, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    if (this.delayTimer < this.delay) {
      this.delayTimer += deltaMillis;
      return;
    }

    if (this.firstUpdate) {
      this.firstUpdate = false;
      this.addParticle();
    }

    if (this.durationTimer < this.duration) this.durationTimer += deltaMillis;
    else {
      if (!this.continuous || this.allowingCompletion) return;
      this.restart();
    }

    this.emissionDelta += deltaMillis;
    let emissionTime =
      this.emission + this.emissionDiff * this.emissionValue.getScale(this.durationTimer / this.duration);
    if (emissionTime > 0) {
      emissionTime = 1000 / emissionTime;
      if (this.emissionDelta >= emissionTime) {
        let emitCount = this.emissionDelta / emissionTime;
        emitCount = Math.min(emitCount, this.maxParticleCount - activeCount);
        this.emissionDelta -= emitCount * emissionTime;
        this.emissionDelta %= emissionTime;
        this.addParticles(emitCount);
      }
    }
    if (activeCount < this.minParticleCount) this.addParticles(this.minParticleCount - activeCount);
  }

  start() {
    this.firstUpdate = true;
    this.allowingCompletion = false;
    this.restart();
  }

  reset() {
    this.emissionDelta = 0;
    this.durationTimer = this.duration;
    const active = this.active;
    for (let i = 0; i < active.length; i++) active[i] = false;
    this.activeCount = 0;
    this.start();
  }

  restart() {
    this.delay = this.delayValue.active ? this.delayValue.newLowValue() : 0;
    this.delayTimer = 0;

    this.durationTimer -= this.duration;
    this.duration = this.durationValue.newLowValue();

    this.emission = this.emissionValue.newLowValue();
    this.emissionDiff = this.emissionValue.newHighValue();
    if (!this.emissionValue.isRelative()) this.emissionDiff -= this.emission;

    if (!this.lifeValue.independent) this.generateLifeValues();

    if (!this.lifeOffsetValue.independent) this.generateLifeOffsetValues();

    this.spawnWidth = this.spawnWidthValue.newLowValue();
    this.spawnWidthDiff = this.spawnWidthValue.newHighValue();
    if (!this.spawnWidthValue.isRelative()) this.spawnWidthDiff -= this.spawnWidth;

    this.spawnHeight = this.spawnHeightValue.newLowValue();
    this.spawnHeightDiff = this.spawnHeightValue.newHighValue();
    if (!this.spawnHeightValue.isRelative()) this.spawnHeightDiff -= this.spawnHeight;

    this.updateFlags = 0;
    if (this.angleValue.active && this.angleValue.timeline.length > 1) this.updateFlags |= ParticleEmitter.UPDATE_ANGLE;
    if (this.velocityValue.active) this.updateFlags |= ParticleEmitter.UPDATE_VELOCITY;
    if (this.xScaleValue.timeline.length > 1) this.updateFlags |= ParticleEmitter.UPDATE_SCALE;
    if (this.yScaleValue.active && this.yScaleValue.timeline.length > 1)
      this.updateFlags |= ParticleEmitter.UPDATE_SCALE;
    if (this.rotationValue.active && this.rotationValue.timeline.length > 1)
      this.updateFlags |= ParticleEmitter.UPDATE_ROTATION;
    if (this.windValue.active) this.updateFlags |= ParticleEmitter.UPDATE_WIND;
    if (this.gravityValue.active) this.updateFlags |= ParticleEmitter.UPDATE_GRAVITY;
    if (this.tintValue.timeline.length > 1) this.updateFlags |= ParticleEmitter.UPDATE_TINT;
    if (this.spriteMode === SpriteMode.animated) this.updateFlags |= ParticleEmitter.UPDATE_SPRITE;
  }

  protected newParticle(sprite: Sprite): Particle {
    return Particle.fromSprite(sprite);
  }

  protected getParticles(): Particle[] {
    return this.particles;
  }

  private activateParticle(index: number) {
    let sprite: Sprite | null = null;
    switch (this.spriteMode) {
      case SpriteMode.single:
      case SpriteMode.animated:
        sprite = this.sprites[0];
        break;
      case SpriteMode.random:
        sprite = this.sprites[Math.floor(Math.random() * this.sprites.length)];
        break;
    }

    let particle = this.particles[index];
    if (!particle) {
      this.particles[index] = particle = this.newParticle(sprite);
      particle.flip(this.flipX, this.flipY);
    } else {
      particle.set(sprite);
    }

    const percent = this.durationTimer / this.duration;
    const updateFlags = this.updateFlags;

    if (this.lifeValue.independent) this.generateLifeValues();

    if (this.lifeOffsetValue.independent) this.generateLifeOffsetValues();

    particle.currentLife = particle.life = this.life + this.lifeDiff * this.lifeValue.getScale(percent);

    if (this.velocityValue.active) {
      particle.velocity = this.velocityValue.newLowValue();
      particle.velocityDiff = this.velocityValue.newHighValue();
      if (!this.velocityValue.isRelative()) particle.velocityDiff -= particle.velocity;
    }

    particle.angle = this.angleValue.newLowValue();
    particle.angleDiff = this.angleValue.newHighValue();
    if (!this.angleValue.isRelative()) particle.angleDiff -= particle.angle;
    let angle = 0;
    if ((updateFlags & ParticleEmitter.UPDATE_ANGLE) === 0) {
      angle = particle.angle + particle.angleDiff * this.angleValue.getScale(0);
      particle.angle = angle;
      particle.angleCos = MathUtils.cosDeg(angle);
      particle.angleSin = MathUtils.sinDeg(angle);
    }

    let spriteWidth = sprite.getWidth();
    let spriteHeight = sprite.getHeight();

    particle.xScale = this.xScaleValue.newLowValue() / spriteWidth;
    particle.xScaleDiff = this.xScaleValue.newHighValue() / spriteWidth;
    if (!this.xScaleValue.isRelative()) particle.xScaleDiff -= particle.xScale;

    if (this.yScaleValue.active) {
      particle.yScale = this.yScaleValue.newLowValue() / spriteHeight;
      particle.yScaleDiff = this.yScaleValue.newHighValue() / spriteHeight;
      if (!this.yScaleValue.isRelative()) particle.yScaleDiff -= particle.yScale;
      particle.setScale(
        particle.xScale + particle.xScaleDiff * this.xScaleValue.getScale(0),
        particle.yScale + particle.yScaleDiff * this.yScaleValue.getScale(0)
      );
    } else {
      particle.setScaleXY(particle.xScale + particle.xScaleDiff * this.xScaleValue.getScale(0));
    }

    if (this.rotationValue.active) {
      particle.rotation = this.rotationValue.newLowValue();
      particle.rotationDiff = this.rotationValue.newHighValue();
      if (!this.rotationValue.isRelative()) particle.rotationDiff -= particle.rotation;
      let rotation = particle.rotation + particle.rotationDiff * this.rotationValue.getScale(0);
      if (this.aligned) rotation += angle;
      particle.setRotation(rotation);
    }

    if (this.windValue.active) {
      particle.wind = this.windValue.newLowValue();
      particle.windDiff = this.windValue.newHighValue();
      if (!this.windValue.isRelative()) particle.windDiff -= particle.wind;
    }

    if (this.gravityValue.active) {
      particle.gravity = this.gravityValue.newLowValue();
      particle.gravityDiff = this.gravityValue.newHighValue();
      if (!this.gravityValue.isRelative()) particle.gravityDiff -= particle.gravity;
    }

    let color = particle.tint;
    if (!color) particle.tint = color = [0, 0, 0];
    const temp = this.tintValue.getColor(0);
    color[0] = temp[0];
    color[1] = temp[1];
    color[2] = temp[2];

    particle.transparency = this.transparencyValue.newLowValue();
    particle.transparencyDiff = this.transparencyValue.newHighValue() - particle.transparency;

    // Spawn.
    let x = this.x;
    if (this.xOffsetValue.active) x += this.xOffsetValue.newLowValue();
    let y = this.y;
    if (this.yOffsetValue.active) y += this.yOffsetValue.newLowValue();
    switch (this.spawnShapeValue.shape) {
      case SpawnShape.square: {
        let width = this.spawnWidth + this.spawnWidthDiff * this.spawnWidthValue.getScale(percent);
        let height = this.spawnHeight + this.spawnHeightDiff * this.spawnHeightValue.getScale(percent);
        x += Math.random() * width - width / 2;
        y += Math.random() * height - height / 2;
        break;
      }
      case SpawnShape.ellipse: {
        let width = this.spawnWidth + this.spawnWidthDiff * this.spawnWidthValue.getScale(percent);
        let height = this.spawnHeight + this.spawnHeightDiff * this.spawnHeightValue.getScale(percent);
        let radiusX = width / 2;
        let radiusY = height / 2;
        if (radiusX === 0 || radiusY === 0) break;
        let scaleY = radiusX / radiusY;
        if (this.spawnShapeValue.edges) {
          let spawnAngle;
          switch (this.spawnShapeValue.side) {
            case SpawnEllipseSide.top:
              spawnAngle = -Math.random() * 179;
              break;
            case SpawnEllipseSide.bottom:
              spawnAngle = Math.random() * 179;
              break;
            default:
              spawnAngle = Math.random() * 360;
              break;
          }
          let cosDeg = MathUtils.cosDeg(spawnAngle);
          let sinDeg = MathUtils.sinDeg(spawnAngle);
          x += cosDeg * radiusX;
          y += (sinDeg * radiusX) / scaleY;
          if ((updateFlags & ParticleEmitter.UPDATE_ANGLE) === 0) {
            particle.angle = spawnAngle;
            particle.angleCos = cosDeg;
            particle.angleSin = sinDeg;
          }
        } else {
          let radius2 = radiusX * radiusX;
          while (true) {
            let px = Math.random() * width - radiusX;
            let py = Math.random() * width - radiusX;
            if (px * px + py * py <= radius2) {
              x += px;
              y += py / scaleY;
              break;
            }
          }
        }
        break;
      }
      case SpawnShape.line: {
        let width = this.spawnWidth + this.spawnWidthDiff * this.spawnWidthValue.getScale(percent);
        let height = this.spawnHeight + this.spawnHeightDiff * this.spawnHeightValue.getScale(percent);
        if (width !== 0) {
          let lineX = width * Math.random();
          x += lineX;
          y += lineX * (height / width);
        } else y += height * Math.random();
        break;
      }
    }

    particle.setBounds(x - spriteWidth / 2, y - spriteHeight / 2, spriteWidth, spriteHeight);

    let offsetTime = this.lifeOffset + this.lifeOffsetDiff * this.lifeOffsetValue.getScale(percent);
    if (offsetTime > 0) {
      if (offsetTime >= particle.currentLife) offsetTime = particle.currentLife - 1;
      this.updateParticle(particle, offsetTime / 1000, offsetTime);
    }
  }

  private updateParticle(particle: Particle, delta: number, deltaMillis: number): boolean {
    const life = particle.currentLife - deltaMillis;
    if (life <= 0) return false;
    particle.currentLife = life;

    let percent = 1 - particle.currentLife / particle.life;
    const updateFlags = this.updateFlags;

    if ((updateFlags & ParticleEmitter.UPDATE_SCALE) !== 0) {
      if (this.yScaleValue.active) {
        particle.setScale(
          particle.xScale + particle.xScaleDiff * this.xScaleValue.getScale(percent),
          particle.yScale + particle.yScaleDiff * this.yScaleValue.getScale(percent)
        );
      } else {
        particle.setScaleXY(particle.xScale + particle.xScaleDiff * this.xScaleValue.getScale(percent));
      }
    }

    if ((updateFlags & ParticleEmitter.UPDATE_VELOCITY) !== 0) {
      let velocity = (particle.velocity + particle.velocityDiff * this.velocityValue.getScale(percent)) * delta;

      let velocityX, velocityY;
      if ((updateFlags & ParticleEmitter.UPDATE_ANGLE) !== 0) {
        let angle = particle.angle + particle.angleDiff * this.angleValue.getScale(percent);
        velocityX = velocity * MathUtils.cosDeg(angle);
        velocityY = velocity * MathUtils.sinDeg(angle);
        if ((updateFlags & ParticleEmitter.UPDATE_ROTATION) !== 0) {
          let rotation = particle.rotation + particle.rotationDiff * this.rotationValue.getScale(percent);
          if (this.aligned) rotation += angle;
          particle.setRotation(rotation);
        }
      } else {
        velocityX = velocity * particle.angleCos;
        velocityY = velocity * particle.angleSin;
        if (this.aligned || (updateFlags & ParticleEmitter.UPDATE_ROTATION) !== 0) {
          let rotation = particle.rotation + particle.rotationDiff * this.rotationValue.getScale(percent);
          if (this.aligned) rotation += particle.angle;
          particle.setRotation(rotation);
        }
      }

      if ((updateFlags & ParticleEmitter.UPDATE_WIND) !== 0)
        velocityX += (particle.wind + particle.windDiff * this.windValue.getScale(percent)) * delta;

      if ((updateFlags & ParticleEmitter.UPDATE_GRAVITY) !== 0)
        velocityY += (particle.gravity + particle.gravityDiff * this.gravityValue.getScale(percent)) * delta;

      particle.translate(velocityX, velocityY);
    } else {
      if ((updateFlags & ParticleEmitter.UPDATE_ROTATION) !== 0)
        particle.setRotation(particle.rotation + particle.rotationDiff * this.rotationValue.getScale(percent));
    }

    let color;
    if ((updateFlags & ParticleEmitter.UPDATE_TINT) !== 0) color = this.tintValue.getColor(percent);
    else color = particle.tint;

    if (this.premultipliedAlpha) {
      let alphaMultiplier = this.additive ? 0 : 1;
      let a = particle.transparency + particle.transparencyDiff * this.transparencyValue.getScale(percent);
      particle.color.set(color[0] * a, color[1] * a, color[2] * a, a * alphaMultiplier);
    } else {
      particle.color.set(
        color[0],
        color[1],
        color[2],
        particle.transparency + particle.transparencyDiff * this.transparencyValue.getScale(percent)
      );
    }

    if ((updateFlags & ParticleEmitter.UPDATE_SPRITE) !== 0) {
      const frame = Math.min(percent * this.sprites.length, this.sprites.length - 1);
      if (particle.frame !== frame) {
        const sprite = this.sprites[frame];
        let prevSpriteWidth = particle.getWidth();
        let prevSpriteHeight = particle.getHeight();
        particle.set(sprite);
        particle.setSize(sprite.getWidth(), sprite.getHeight());
        particle.setOrigin(sprite.getOriginX(), sprite.getOriginY());
        particle.translate((prevSpriteWidth - sprite.getWidth()) / 2, (prevSpriteHeight - sprite.getHeight()) / 2);
        particle.frame = frame;
      }
    }

    return true;
  }

  private generateLifeValues() {
    this.life = this.lifeValue.newLowValue();
    this.lifeDiff = this.lifeValue.newHighValue();
    if (!this.lifeValue.isRelative()) this.lifeDiff -= this.life;
  }

  private generateLifeOffsetValues() {
    this.lifeOffset = this.lifeOffsetValue.active ? this.lifeOffsetValue.newLowValue() : 0;
    this.lifeOffsetDiff = this.lifeOffsetValue.newHighValue();
    if (!this.lifeOffsetValue.isRelative()) this.lifeOffsetDiff -= this.lifeOffset;
  }

  public setPosition(x: number, y: number) {
    if (this.attached) {
      let xAmount = x - this.x;
      let yAmount = y - this.y;
      const active = this.active;
      for (let i = 0; i < active.length; i++) {
        if (active[i]) {
          this.particles[i].translate(xAmount, yAmount);
        }
      }
    }
    this.x = x;
    this.y = y;
  }

  public setSprites(sprites: Sprite[]) {
    this.sprites = sprites;
    if (sprites.length === 0) return;
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      if (!particle) break;
      let sprite: Sprite | null = null;
      switch (this.spriteMode) {
        case SpriteMode.single:
          sprite = sprites[0];
          break;
        case SpriteMode.random:
          sprite = this.sprites[Math.floor(Math.random() * this.sprites.length)];
          break;
        case SpriteMode.animated:
          let percent = 1 - particle.currentLife / particle.life;
          particle.frame = Math.min(percent * sprites.length, sprites.length - 1);
          sprite = sprites[particle.frame];
          break;
      }

      particle.set(sprite);
      particle.setOrigin(sprite.getOriginX(), sprite.getOriginY());
    }
  }

  public setSpriteMode(spriteMode: SpriteMode) {
    this.spriteMode = spriteMode;
  }

  /** Allocates max particles emitter can hold. Usually called early on to a allocation on updates.
   * {@link #setSprites(Array)} must have been set before calling this method */
  public preAllocateParticles() {
    if (this.sprites.length === 0)
      throw new Error('ParticleEmitter.setSprites() must have been called before preAllocateParticles()');
    for (let index = 0; index < this.particles.length; index++) {
      let particle = this.particles[index];
      if (!particle) {
        this.particles[index] = particle = this.newParticle(this.sprites[0]);
        particle.flip(this.flipX, this.flipY);
      }
    }
  }

  /** Ignores the {@link #setContinuous(boolean) continuous} setting until the emitter is started again. This allows the emitter
   * to stop smoothly. */
  public allowCompletion() {
    this.allowingCompletion = true;
    this.durationTimer = this.duration;
  }

  public getSprites(): Sprite[] {
    return this.sprites;
  }

  public getSpriteMode(): SpriteMode {
    return this.spriteMode;
  }

  public getName(): string {
    return this.name;
  }

  public setName(name: string) {
    this.name = name;
  }

  public getLife(): ScaledNumericValue {
    return this.lifeValue;
  }

  public getXScale(): ScaledNumericValue {
    return this.xScaleValue;
  }

  public getYScale(): ScaledNumericValue {
    return this.yScaleValue;
  }

  public getRotation(): ScaledNumericValue {
    return this.rotationValue;
  }

  public getTint(): GradientColorValue {
    return this.tintValue;
  }

  public getVelocity(): ScaledNumericValue {
    return this.velocityValue;
  }

  public getWind(): ScaledNumericValue {
    return this.windValue;
  }

  public getGravity(): ScaledNumericValue {
    return this.gravityValue;
  }

  public getAngle(): ScaledNumericValue {
    return this.angleValue;
  }

  public getEmission(): ScaledNumericValue {
    return this.emissionValue;
  }

  public getTransparency(): ScaledNumericValue {
    return this.transparencyValue;
  }

  public getDuration(): RangedNumericValue {
    return this.durationValue;
  }

  public getDelay(): RangedNumericValue {
    return this.delayValue;
  }

  public getLifeOffset(): ScaledNumericValue {
    return this.lifeOffsetValue;
  }

  public getXOffsetValue(): ScaledNumericValue {
    return this.xOffsetValue;
  }

  public getYOffsetValue(): ScaledNumericValue {
    return this.yOffsetValue;
  }

  public getSpawnWidth(): ScaledNumericValue {
    return this.spawnWidthValue;
  }

  public getSpawnHeight(): ScaledNumericValue {
    return this.spawnHeightValue;
  }

  public getSpawnShape(): SpawnShapeValue {
    return this.spawnShapeValue;
  }

  public isAttached(): boolean {
    return this.attached;
  }

  public setAttached(attached: boolean) {
    this.attached = attached;
  }

  public isContinuous(): boolean {
    return this.continuous;
  }

  public setContinuous(continuous: boolean) {
    this.continuous = continuous;
  }

  public isAligned(): boolean {
    return this.aligned;
  }

  public setAligned(aligned: boolean) {
    this.aligned = aligned;
  }

  public isAdditive(): boolean {
    return this.additive;
  }

  public setAdditive(additive: boolean) {
    this.additive = additive;
  }

  /** @return Whether this ParticleEmitter automatically returns the {@link com.badlogic.gdx.graphics.g2d.Batch Batch}'s blend
   *         function to the alpha-blending default (GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA) when done drawing. */
  public cleansUpBlendFunction(): boolean {
    return this.cleaningUpBlendFunction;
  }

  /** Set whether to automatically return the {@link com.badlogic.gdx.graphics.g2d.Batch Batch}'s blend function to the
   * alpha-blending default (GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA) when done drawing. Is true by default. If set to false, the
   * Batch's blend function is left as it was for drawing this ParticleEmitter, which prevents the Batch from being flushed
   * repeatedly if consecutive ParticleEmitters with the same additive or pre-multiplied alpha state are drawn in a row.
   * <p>
   * IMPORTANT: If set to false and if the next object to use this Batch expects alpha blending, you are responsible for setting
   * the Batch's blend function to (GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA) before that next object is drawn.
   * @param cleansUpBlendFunction */
  public setCleansUpBlendFunction(cleaningUpBlendFunction) {
    this.cleaningUpBlendFunction = cleaningUpBlendFunction;
  }

  public isBehind(): boolean {
    return this.behind;
  }

  public setBehind(behind: boolean) {
    this.behind = behind;
  }

  public isPremultipliedAlpha(): boolean {
    return this.premultipliedAlpha;
  }

  public setPremultipliedAlpha(premultipliedAlpha: boolean) {
    this.premultipliedAlpha = premultipliedAlpha;
  }

  public getMinParticleCount(): number {
    return this.minParticleCount;
  }

  public setMinParticleCount(minParticleCount: number) {
    this.minParticleCount = minParticleCount;
  }

  public getMaxParticleCount(): number {
    return this.maxParticleCount;
  }

  public isComplete(): boolean {
    if (this.continuous && !this.allowingCompletion) return false;
    if (this.delayTimer < this.delay) return false;
    return this.durationTimer >= this.duration && this.activeCount === 0;
  }

  public getPercentComplete(): number {
    if (this.delayTimer < this.delay) return 0;
    return Math.min(1, this.durationTimer / this.duration);
  }

  public getX(): number {
    return this.x;
  }

  public getY(): number {
    return this.y;
  }

  public getActiveCount(): number {
    return this.activeCount;
  }

  public getImagePaths(): string[] {
    return this.imagePaths;
  }

  public setImagePaths(imagePaths: string[]) {
    this.imagePaths = imagePaths;
  }

  public setFlip(flipX: boolean, flipY: boolean) {
    this.flipX = flipX;
    this.flipY = flipY;
    if (!this.particles.length) return;
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      if (particle !== null) particle.flip(flipX, flipY);
    }
  }

  public flipYAxis() {
    this.angleValue.setHighRange(-this.angleValue.getHighMin(), -this.angleValue.getHighMax());
    this.angleValue.setLowRange(-this.angleValue.getLowMin(), -this.angleValue.getLowMax());

    this.gravityValue.setHighRange(-this.gravityValue.getHighMin(), -this.gravityValue.getHighMax());
    this.gravityValue.setLowRange(-this.gravityValue.getLowMin(), -this.gravityValue.getLowMax());

    this.windValue.setHighRange(-this.windValue.getHighMin(), -this.windValue.getHighMax());
    this.windValue.setLowRange(-this.windValue.getLowMin(), -this.windValue.getLowMax());

    this.rotationValue.setHighRange(-this.rotationValue.getHighMin(), -this.rotationValue.getHighMax());
    this.rotationValue.setLowRange(-this.rotationValue.getLowMin(), -this.rotationValue.getLowMax());

    this.yOffsetValue.setLowRange(-this.yOffsetValue.getLowMin(), -this.yOffsetValue.getLowMax());
  }

  /** Returns the bounding box for all active particles. z axis will always be zero. */
  // public getBoundingBox (): BoundingBox {
  // 	if (this.bounds === null) this.bounds = new this.BoundingBox();

  // const particles = this.particles;
  // 	const active = this.active;
  // 	const bounds = this.bounds;

  // 	bounds.inf();
  // 	for (let i = 0; i < this.active.length; i++)
  // 		if (this.active[i]) {
  // 			const r = this.particles[i].getBoundingRectangle();
  // 			bounds.ext(r.x, r.y, 0);
  // 			bounds.ext(r.x + r.width, r.y + r.height, 0);
  // 		}

  // 	return bounds;
  // }

  protected getXSizeValues(): RangedNumericValue[] {
    if (!this.xSizeValues.length) {
      this.xSizeValues = new Array(3);
      this.xSizeValues[0] = this.xScaleValue as any;
      this.xSizeValues[1] = this.spawnWidthValue as any;
      this.xSizeValues[2] = this.xOffsetValue as any;
    }
    return this.xSizeValues;
  }

  protected getYSizeValues(): RangedNumericValue[] {
    if (!this.ySizeValues.length) {
      this.ySizeValues = new Array(3);
      this.ySizeValues[0] = this.yScaleValue as any;
      this.ySizeValues[1] = this.spawnHeightValue as any;
      this.ySizeValues[2] = this.yOffsetValue as any;
    }
    return this.ySizeValues;
  }

  protected getMotionValues(): RangedNumericValue[] {
    if (!this.motionValues.length) {
      this.motionValues = new Array(3);
      this.motionValues[0] = this.velocityValue as any;
      this.motionValues[1] = this.windValue as any;
      this.motionValues[2] = this.gravityValue as any;
    }
    return this.motionValues;
  }

  /** Permanently scales the size of the emitter by scaling all its ranged values related to size. */
  public scaleSize(scale: number) {
    if (scale === 1) return;
    this.scaleSizeXY(scale, scale);
  }

  /** Permanently scales the size of the emitter by scaling all its ranged values related to size. */
  public scaleSizeXY(scaleX: number, scaleY: number) {
    if (scaleX === 1 && scaleY === 1) return;
    for (const value of this.getXSizeValues()) {
      value.scale(scaleX);
    }
    for (const value of this.getYSizeValues()) {
      value.scale(scaleY);
    }
  }

  /** Permanently scales the speed of the emitter by scaling all its ranged values related to motion. */
  public scaleMotion(scale: number) {
    if (scale === 1) return;
    for (const value of this.getMotionValues()) {
      value.scale(scale);
    }
  }

  /** Sets all size-related ranged values to match those of the template emitter. */
  public matchSize(template: ParticleEmitter) {
    this.matchXSize(template);
    this.matchYSize(template);
  }

  /** Sets all horizontal size-related ranged values to match those of the template emitter. */
  public matchXSize(template: ParticleEmitter) {
    const values = this.getXSizeValues();
    const templateValues = template.getXSizeValues();
    for (let i = 0; i < values.length; i++) {
      values[i].set(templateValues[i]);
    }
  }

  /** Sets all vertical size-related ranged values to match those of the template emitter. */
  public matchYSize(template: ParticleEmitter) {
    const values = this.getYSizeValues();
    const templateValues = template.getYSizeValues();
    for (let i = 0; i < values.length; i++) {
      values[i].set(templateValues[i]);
    }
  }

  /** Sets all motion-related ranged values to match those of the template emitter. */
  public matchMotion(template: ParticleEmitter) {
    const values = this.getMotionValues();
    const templateValues = template.getMotionValues();
    for (let i = 0; i < values.length; i++) {
      values[i].set(templateValues[i]);
    }
  }

  public load(reader: StringBufferedReader) {
    try {
      this.name = readStringFromReader(reader, 'name');
      reader.readLine();
      this.delayValue.load(reader);
      reader.readLine();
      this.durationValue.load(reader);
      reader.readLine();
      this.setMinParticleCount(readIntFromReader(reader, 'minParticleCount'));
      this.setMaxParticleCount(readIntFromReader(reader, 'maxParticleCount'));
      reader.readLine();
      this.emissionValue.load(reader);
      reader.readLine();
      this.lifeValue.load(reader);
      reader.readLine();
      this.lifeOffsetValue.load(reader);
      reader.readLine();
      this.xOffsetValue.load(reader);
      reader.readLine();
      this.yOffsetValue.load(reader);
      reader.readLine();
      this.spawnShapeValue.load(reader);
      reader.readLine();
      this.spawnWidthValue.load(reader);
      reader.readLine();
      this.spawnHeightValue.load(reader);
      let line = reader.readLine();
      if (line.trim() === '- Scale -') {
        this.xScaleValue.load(reader);
        this.yScaleValue.setActive(false);
      } else {
        this.xScaleValue.load(reader);
        reader.readLine();
        this.yScaleValue.load(reader);
      }
      reader.readLine();
      this.velocityValue.load(reader);
      reader.readLine();
      this.angleValue.load(reader);
      reader.readLine();
      this.rotationValue.load(reader);
      reader.readLine();
      this.windValue.load(reader);
      reader.readLine();
      this.gravityValue.load(reader);
      reader.readLine();
      this.tintValue.load(reader);
      reader.readLine();
      this.transparencyValue.load(reader);
      reader.readLine();
      this.attached = readBooleanFromReader(reader, 'attached');
      this.continuous = readBooleanFromReader(reader, 'continuous');
      this.aligned = readBooleanFromReader(reader, 'aligned');
      this.additive = readBooleanFromReader(reader, 'additive');
      this.behind = readBooleanFromReader(reader, 'behind');
      // Backwards compatibility
      line = reader.readLine();
      if (line.startsWith('premultipliedAlpha')) {
        this.premultipliedAlpha = readBoolean(line);
        line = reader.readLine();
      }
      if (line.startsWith('spriteMode')) {
        this.spriteMode = SpriteMode[readString(line)];
        line = reader.readLine();
      }
      this.imagePaths.length = 0;
      while ((line = reader.readLine()) !== null && line !== '') {
        this.imagePaths.push(line);
      }
      this.setImagePaths(this.imagePaths);
    } catch (ex: any) {
      throw new Error('Error parsing emitter: ' + this.name);
    }
  }
}

const readString = (line: string): string => {
  return line.substring(line.indexOf(':') + 1).trim();
};

const readStringFromReader = (reader: StringBufferedReader, name: string): string => {
  const line = reader.readLine();
  if (line === null) throw new Error('Missing value: ' + name);
  return readString(line);
};

const readBoolean = (line: string): boolean => {
  const str = readString(line);
  if (String(str).toLowerCase() === 'true') {
    return true;
  }
  return false;
};

const readBooleanFromReader = (reader: StringBufferedReader, name: string) => {
  const line = readStringFromReader(reader, name);
  return readBoolean(line);
};

const readIntFromReader = (reader: StringBufferedReader, name: string): number => {
  const line = readStringFromReader(reader, name);
  return parseInt(line);
};

const readFloatFromReader = (reader: StringBufferedReader, name: string): number => {
  const line = readStringFromReader(reader, name);
  return parseFloat(line);
};

export class Particle extends Sprite {
  life: number;
  currentLife: number;
  xScale: number;
  xScaleDiff: number;
  yScale: number;
  yScaleDiff: number;
  rotation: number;
  rotationDiff: number;
  velocity: number;
  velocityDiff: number;
  angle: number;
  angleDiff: number;
  angleCos: number;
  angleSin: number;
  transparency: number;
  transparencyDiff: number;
  wind: number;
  windDiff: number;
  gravity: number;
  gravityDiff: number;
  tint: number[] = [];
  frame: number;

  static fromSprite(sprite: Sprite) {
    const particle = new Particle(sprite.region);
    particle.set(sprite);
    return particle;
  }
}

export class ParticleValue<T extends ParticleValue<any>> {
  active: boolean;
  alwaysActive: boolean;

  setAlwaysActive(alwaysActive: boolean) {
    this.alwaysActive = alwaysActive;
  }

  isAlwaysActive(): boolean {
    return this.alwaysActive;
  }

  isActive(): boolean {
    return this.alwaysActive || this.active;
  }

  setActive(active: boolean) {
    this.active = active;
  }

  public load(reader: StringBufferedReader) {
    if (!this.alwaysActive) {
      this.active = readBooleanFromReader(reader, 'active');
    } else {
      this.active = true;
    }
  }

  public set(value: T) {
    this.active = value.active;
    this.alwaysActive = value.alwaysActive;
  }
}

export class NumericValue extends ParticleValue<NumericValue> {
  private value: number;

  public getValue(): number {
    return this.value;
  }

  public setValue(value: number) {
    this.value = value;
  }

  public load(reader: StringBufferedReader) {
    super.load(reader);
    if (!this.active) return;
    this.value = readFloatFromReader(reader, 'value');
  }

  public set(value: NumericValue) {
    super.set(value);
    this.value = value.value;
  }
}

class RangedNumericValue extends ParticleValue<RangedNumericValue> {
  private lowMin: number;
  private lowMax: number;

  public newLowValue(): number {
    return this.lowMin + (this.lowMax - this.lowMin) * Math.random();
  }

  public setLow(value: number) {
    this.lowMin = value;
    this.lowMax = value;
  }

  public setLowRange(min: number, max: number) {
    this.lowMin = min;
    this.lowMax = max;
  }

  public getLowMin(): number {
    return this.lowMin;
  }

  public setLowMin(lowMin: number) {
    this.lowMin = lowMin;
  }

  public getLowMax(): number {
    return this.lowMax;
  }

  public setLowMax(lowMax: number) {
    this.lowMax = lowMax;
  }

  /** permanently scales the range by a scalar. */
  public scale(scale: number) {
    this.lowMin *= scale;
    this.lowMax *= scale;
  }

  public set(value: RangedNumericValue) {
    super.set(value);
    this.lowMin = value.lowMin;
    this.lowMax = value.lowMax;
  }

  public load(reader: StringBufferedReader) {
    super.load(reader);
    if (!this.active) return;
    this.lowMin = readFloatFromReader(reader, 'lowMin');
    this.lowMax = readFloatFromReader(reader, 'lowMax');
  }
}

class ScaledNumericValue extends RangedNumericValue {
  private scaling = [1];
  timeline = [0];
  private highMin: number;
  private highMax: number;
  private relative: boolean;

  public newHighValue(): number {
    return this.highMin + (this.highMax - this.highMin) * Math.random();
  }

  public setHigh(value: number) {
    this.highMin = value;
    this.highMax = value;
  }

  public setHighRange(min: number, max: number) {
    this.highMin = min;
    this.highMax = max;
  }

  public getHighMin(): number {
    return this.highMin;
  }

  public setHighMin(highMin: number) {
    this.highMin = highMin;
  }

  public getHighMax(): number {
    return this.highMax;
  }

  public setHighMax(highMax: number) {
    this.highMax = highMax;
  }

  public scale(scale: number) {
    super.scale(scale);
    this.highMin *= scale;
    this.highMax *= scale;
  }

  public set(value: ScaledNumericValue) {
    super.set(value);
    this.highMin = value.highMin;
    this.highMax = value.highMax;
    if (this.scaling.length !== value.scaling.length) this.scaling = [...value.scaling];
    else Utils.arrayCopy(value.scaling, 0, this.scaling, 0, this.scaling.length);
    if (this.timeline.length !== value.timeline.length) this.timeline = [...value.timeline];
    else Utils.arrayCopy(value.timeline, 0, this.timeline, 0, this.timeline.length);
    this.relative = value.relative;
  }

  public load(reader: StringBufferedReader) {
    super.load(reader);
    if (!this.active) return;
    this.highMin = readFloatFromReader(reader, 'highMin');
    this.highMax = readFloatFromReader(reader, 'highMax');
    this.relative = readBooleanFromReader(reader, 'relative');
    const scalingCount = readIntFromReader(reader, 'scalingCount');
    this.scaling = new Array(scalingCount);
    for (let i = 0; i < scalingCount; i++) this.scaling[i] = readFloatFromReader(reader, 'scaling' + i);
    const timelineCount = readIntFromReader(reader, 'timelineCount');
    this.timeline = new Array(timelineCount);
    for (let i = 0; i < timelineCount; i++) this.timeline[i] = readFloatFromReader(reader, 'timeline' + i);
  }

  public getScaling() {
    return this.scaling;
  }

  public setScaling(values: number[]) {
    this.scaling = values;
  }

  public getTimeline() {
    return this.timeline;
  }

  public setTimeline(timeline: number[]) {
    this.timeline = timeline;
  }

  public isRelative(): boolean {
    return this.relative;
  }

  public setRelative(relative: boolean) {
    this.relative = relative;
  }

  public getScale(percent: number): number {
    let endIndex = -1;
    const timeline = this.timeline;
    let n = timeline.length;
    for (let i = 1; i < n; i++) {
      let t = timeline[i];
      if (t > percent) {
        endIndex = i;
        break;
      }
    }
    if (endIndex === -1) return this.scaling[n - 1];
    const scaling = this.scaling;
    let startIndex = endIndex - 1;
    let startValue = scaling[startIndex];
    let startTime = timeline[startIndex];
    return startValue + (scaling[endIndex] - startValue) * ((percent - startTime) / (timeline[endIndex] - startTime));
  }
}

class IndependentScaledNumericValue extends ScaledNumericValue {
  independent: boolean;

  public isIndependent(): boolean {
    return this.independent;
  }

  public setIndependent(independent: boolean) {
    this.independent = independent;
  }

  public set(value: IndependentScaledNumericValue) {
    super.set(value);
    this.independent = value.independent;
  }

  public load(reader: StringBufferedReader) {
    super.load(reader);
    // For backwards compatibility, independent property may not be defined
    let line = reader.readLine();
    if (line === null) throw new Error('Missing value: independent');
    if (line.includes('independent')) this.independent = readString(line)?.toLowerCase() === 'true';
    else {
      // @see java.io.BufferedReader#markSupported may return false in some platforms (such as GWT),
      // in that case backwards commpatibility is not possible
      const errorMessage =
        'The loaded particle effect descriptor file uses an old invalid format. ' +
        'Please download the latest version of the Particle Editor tool and recreate the file by' +
        ' loading and saving it again.';
      throw new Error(errorMessage);
    }
  }
}

class GradientColorValue extends ParticleValue<GradientColorValue> {
  private static temp = new Array(4);

  private colors = [1, 1, 1];
  timeline = [0];

  public GradientColorValue() {
    this.alwaysActive = true;
  }

  public getTimeline() {
    return this.timeline;
  }

  public setTimeline(timeline: number[]) {
    this.timeline = timeline;
  }

  /** @return the r, g and b values for every timeline position */
  public getColors() {
    return this.colors;
  }

  /** @param colors the r, g and b values for every timeline position */
  public setColors(colors: [number, number, number]) {
    this.colors = colors;
  }

  public getColor(percent: number) {
    let startIndex = 0;
    let endIndex = -1;
    const timeline = this.timeline;
    let n = timeline.length;
    for (let i = 1; i < n; i++) {
      let t = timeline[i];
      if (t > percent) {
        endIndex = i;
        break;
      }
      startIndex = i;
    }
    let startTime = timeline[startIndex];
    startIndex *= 3;
    let r1 = this.colors[startIndex];
    let g1 = this.colors[startIndex + 1];
    let b1 = this.colors[startIndex + 2];
    if (endIndex === -1) {
      GradientColorValue.temp[0] = r1;
      GradientColorValue.temp[1] = g1;
      GradientColorValue.temp[2] = b1;
      return GradientColorValue.temp;
    }
    let factor = (percent - startTime) / (timeline[endIndex] - startTime);
    endIndex *= 3;
    GradientColorValue.temp[0] = r1 + (this.colors[endIndex] - r1) * factor;
    GradientColorValue.temp[1] = g1 + (this.colors[endIndex + 1] - g1) * factor;
    GradientColorValue.temp[2] = b1 + (this.colors[endIndex + 2] - b1) * factor;
    return GradientColorValue.temp;
  }

  public load(reader: StringBufferedReader) {
    super.load(reader);
    if (!this.active) return;
    const colorsCount = readIntFromReader(reader, 'colorsCount');
    this.colors = new Array(colorsCount);
    for (let i = 0; i < colorsCount; i++) this.colors[i] = readFloatFromReader(reader, 'colors' + i);
    const timelineCount = readIntFromReader(reader, 'timelineCount');
    this.timeline = new Array(timelineCount);
    for (let i = 0; i < timelineCount; i++) this.timeline[i] = readFloatFromReader(reader, 'timeline' + i);
  }

  public set(value: GradientColorValue) {
    super.set(value);
    this.colors = new Array(value.colors.length);
    Utils.arrayCopy(value.colors, 0, this.colors, 0, this.colors.length);
    this.timeline = new Array(value.timeline.length);
    Utils.arrayCopy(value.timeline, 0, this.timeline, 0, this.timeline.length);
  }
}

class SpawnShapeValue extends ParticleValue<SpawnShapeValue> {
  shape = SpawnShape.point;
  edges: boolean;
  side = SpawnEllipseSide.both;

  public getShape(): SpawnShape {
    return this.shape;
  }

  public setShape(shape: SpawnShape) {
    this.shape = shape;
  }

  public isEdges(): boolean {
    return this.edges;
  }

  public setEdges(edges: boolean) {
    this.edges = edges;
  }

  public getSide(): SpawnEllipseSide {
    return this.side;
  }

  public setSide(side: SpawnEllipseSide) {
    this.side = side;
  }

  public load(reader: StringBufferedReader) {
    super.load(reader);
    if (!this.active) return;
    this.shape = SpawnShape[readStringFromReader(reader, 'shape')];
    if (this.shape === SpawnShape.ellipse) {
      this.edges = readBooleanFromReader(reader, 'edges');
      this.side = SpawnEllipseSide[readStringFromReader(reader, 'side')];
    }
  }

  public set(value: SpawnShapeValue) {
    super.set(value);
    this.shape = value.shape;
    this.edges = value.edges;
    this.side = value.side;
  }
}
