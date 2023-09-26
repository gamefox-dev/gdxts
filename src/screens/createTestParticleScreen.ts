import { YDOWN } from '..';
import { Color, PolygonBatch, Screen, ShapeRenderer, TextureAtlas, Viewport, ViewportInputHandler } from '../lib';
import { ParticleEffect } from '../lib/ParticleEffect';
import { ParticleEffectPool, PooledEffect } from '../lib/ParticleEffectPool';

export const createTestParticleScreen = async (viewport: Viewport): Promise<Screen> => {
  const gl = viewport.getContext();
  const camera = viewport.getCamera();

  camera.setYDown(YDOWN);

  const particleAtlas = await TextureAtlas.load(gl, './particle.atlas');

  const inputHandler = new ViewportInputHandler(viewport);

  const batch = new PolygonBatch(gl);

  batch.setYDown(YDOWN);

  const shapeRenderer = new ShapeRenderer(gl);

  const particleEffect = new ParticleEffect();
  await particleEffect.load('./Particle Park Smoke Trail.p', particleAtlas);
  particleEffect.flipY();
  const pool = new ParticleEffectPool(particleEffect, 10, 100);

  const effects: ParticleEffect[] = [];
  const effectToBeDeleted: ParticleEffect[] = [];

  return {
    update(delta, game) {
      if (inputHandler.isTouched()) {
        const coord = inputHandler.getTouchedWorldCoord(camera);
        const effect = pool.obtain();
        effect.setPosition(coord.x, coord.y);
        effects.push(effect);
        effect.setPosition(coord.x, coord.y);
        effect.setDuration(2);
        effect.start();
      }

      shapeRenderer.setProjection(camera.combined);
      shapeRenderer.begin();
      shapeRenderer.rect(true, 0, 0, 500, 1000, Color.BLUE);
      shapeRenderer.end();

      batch.setProjection(camera.combined);
      batch.begin();
      for (let effect of effects) {
        effect.update(delta);
        effect.draw(batch, gl);
        if (effect.isComplete()) {
          effectToBeDeleted.push(effect);
        }
      }
      for (let effect of effectToBeDeleted) {
        effects.splice(effects.indexOf(effect), 1);
        pool.free(effect as PooledEffect);
      }
      batch.end();
    },
    dispose() {
      console.log('main screen disposed');
      batch.dispose();
      shapeRenderer.dispose();
      inputHandler.cleanup();
      particleAtlas.dispose();
    }
  };
};
