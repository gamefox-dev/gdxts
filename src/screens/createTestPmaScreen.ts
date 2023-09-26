import { YDOWN } from '..';
import { Color, Game, PolygonBatch, Screen, Texture, TextureFilter, Viewport } from '../lib';

export const createTestPmaScreen = async (viewport: Viewport): Promise<Screen> => {
  const gl = viewport.getContext();
  const camera = viewport.getCamera();
  camera.setYDown(YDOWN);

  const batch = new PolygonBatch(gl);
  batch.setYDown(YDOWN);

  PolygonBatch.PMA = true;
  const batch2 = new PolygonBatch(gl);
  batch2.setYDown(YDOWN);

  PolygonBatch.PMA = false;

  const white = Texture.createWhiteTexture(gl);
  const texture = await Texture.load(gl, 'cloud.png', true);
  texture.setFilters(TextureFilter.Linear, TextureFilter.Linear);
  texture.update(true);

  const clearColor = Color.fromString('#A7ECEE');

  return {
    update(delta: number, game: Game) {
      batch.setProjection(camera.combined);
      batch.begin();

      batch.setColor(Color.BLUE);
      batch.draw(white, 0, 0, 500, 1000);
      batch.setColor(clearColor);
      batch.draw(white, 0, 0, 500, 900, 250, 500, 0, 3, 1);
      batch.setColor(Color.WHITE);

      batch.draw(texture, 0, 50, texture.width / 2, texture.height / 2);
      batch.end();

      batch2.setProjection(camera.combined);
      batch2.begin();
      batch2.draw(texture, -50, 100, texture.width / 2, texture.height / 2);
      batch2.end();
    },
    dispose() {
      console.log('test screen disposed');
      batch.dispose();
      texture.dispose();
    }
  };
};
