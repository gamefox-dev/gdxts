import { YDOWN } from '..';
import { Color, PolygonBatch, Screen, ShapeRenderer, TextureAtlas, Viewport, ViewportInputHandler } from '../lib';
import { ParticleEffect } from '../lib/ParticleEffect';

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
  particleEffect.setEmittersCleanUpBlendFunction(false);
  particleEffect.flipY();

  particleEffect.setPosition(250, 500);
  particleEffect.start();

  return {
    update(delta, game) {
      particleEffect.update(delta);

      if (inputHandler.isTouched()) {
        const coord = inputHandler.getTouchedWorldCoord(camera);
        particleEffect.setPosition(coord.x, coord.y);
      }

      shapeRenderer.setProjection(camera.combined);
      shapeRenderer.begin();
      shapeRenderer.rect(true, 0, 0, 500, 1000, Color.BLUE);
      shapeRenderer.end();

      batch.setProjection(camera.combined);
      batch.begin();
      particleEffect.draw(batch, gl);
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
