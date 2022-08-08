import { YDOWN } from '..';
import { Viewport, Texture, TextureFilter, TextureRegion, PolygonBatch, MathUtils, Screen } from '../lib';

export const createBunnyScreen = async (viewport: Viewport): Promise<Screen> => {
  const gl = viewport.getContext();
  const camera = viewport.getCamera();

  camera.setYDown(YDOWN);

  const texture = await Texture.load(gl, './bunnys.png');
  texture.setFilters(TextureFilter.Linear, TextureFilter.Linear);
  const regions = TextureRegion.splitTexture(texture, 1, 5);

  const batch = new PolygonBatch(gl);

  batch.setYDown(YDOWN);

  const SPEED = 1000;

  const gems: any[] = [];
  const moreBunnies = n => {
    for (let i = 0; i < n; i++) {
      gems.push({
        x: Math.random() * 500,
        y: Math.random() * 1000,
        speedX: Math.random() * SPEED - SPEED / 2,
        speedY: Math.random() * SPEED - SPEED / 2,
        type: Math.floor(Math.random() * 5)
      });
    }
  };

  moreBunnies(6000);

  const DRAW_WIDTH = 30;
  const DRAW_HEIGHT = (DRAW_WIDTH * regions[0].height) / regions[0].width;

  return {
    update(delta) {
      for (let gem of gems) {
        gem.x += gem.speedX * delta;
        gem.y += gem.speedY * delta;

        if (gem.x < 0 || gem.x > 500) {
          gem.x = MathUtils.clamp(gem.x, 0, 500);
          gem.speedX *= -1;
        }

        if (gem.y < 0 || gem.y > 1000) {
          gem.y = MathUtils.clamp(gem.y, 0, 1000);
          gem.speedY *= -1;
        }
      }
      batch.setProjection(camera.projectionView.values);
      batch.begin();
      for (let gem of gems) {
        regions[gem.type].draw(batch, gem.x - DRAW_WIDTH / 2, gem.y - DRAW_HEIGHT / 2, DRAW_WIDTH, DRAW_HEIGHT);
      }
      batch.end();
    },
    dispose() {
      batch.dispose();
      texture.dispose();
    }
  };
};
