import { YDOWN } from '..';
import { Color, Game, PolygonBatch, Screen, Texture, TextureFilter, Viewport } from '../lib';

export const createTestPmaScreen = async (viewport: Viewport): Promise<Screen> => {
  const gl = viewport.getContext();
  const camera = viewport.getCamera();
  camera.setYDown(YDOWN);

  PolygonBatch.PMA = true;
  const batch = new PolygonBatch(gl);
  PolygonBatch.PMA = false;
  batch.setYDown(YDOWN);

  const white = Texture.createWhiteTexture(gl);
  const texture = await Texture.load(gl, 'cloud.png', true);
  texture.setFilters(TextureFilter.Linear, TextureFilter.Linear);
  texture.update(true);

  const clearColor = Color.fromString('#A7ECEE');
  // batch.setBlendMode(gl.ONE, gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
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
      batch.draw(texture, -50, 100, texture.width / 2, texture.height / 2);

      batch.end();
    },
    dispose() {
      console.log('test screen disposed');
      batch.dispose();
      texture.dispose();
    }
  };
};
