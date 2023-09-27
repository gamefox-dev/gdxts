import { YDOWN } from '..';
import {
  Color,
  Game,
  MathUtils,
  PolygonBatch,
  Screen,
  ShapeRenderer,
  Sprite,
  TextureAtlas,
  Vector2,
  Viewport
} from '../lib';

export const createTestSpriteScreen = async (viewport: Viewport): Promise<Screen> => {
  const gl = viewport.getContext();
  const camera = viewport.getCamera();
  camera.setYDown(YDOWN);

  const batch = new PolygonBatch(gl, true);
  batch.setYDown(YDOWN);

  const shapeRenderer = new ShapeRenderer(gl);

  const atlas = await TextureAtlas.load(gl, './gem.atlas');
  const region = atlas.findRegion('gem_01');
  const sprite = new Sprite(region, false, true);
  sprite.setOriginCenter();

  const position = new Vector2(0, 500);
  let translateX = 250;

  let scale = 0.5;
  let scaleSpeed = -0.5;

  return {
    update(delta: number, game: Game) {
      shapeRenderer.setProjection(camera.combined);
      shapeRenderer.begin();
      shapeRenderer.rect(true, 0, 0, 500, 1000, Color.RED);
      shapeRenderer.end();

      position.x += translateX * delta;
      if (position.x > 500 || position.x < 0) {
        position.x = MathUtils.clamp(position.x, 0, 500);
        translateX *= -1;
      }

      scale += scaleSpeed * delta;
      if (scale < 0 || scale > 0.5) {
        scale = MathUtils.clamp(scale, 0, 0.5);
        scaleSpeed *= -1;
      }
      sprite.setScale(scale, scale);

      sprite.rotate(Math.PI * delta);

      sprite.setCenter(position.x, position.y);
      batch.setProjection(camera.combined);
      batch.begin();
      sprite.draw(batch);
      batch.end();

      const rect = sprite.getBoundingRectangle();
      shapeRenderer.begin();
      shapeRenderer.rect(false, rect.x, rect.y, rect.width, rect.height, Color.WHITE);
      shapeRenderer.end();
    },
    dispose() {
      batch.dispose();
      atlas.dispose();
    }
  };
};
