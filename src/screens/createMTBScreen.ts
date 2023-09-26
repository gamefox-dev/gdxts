import { YDOWN } from '..';
import { Align, BitmapFont, Game, PolygonBatch, Screen, TextureAtlas, Viewport } from '../lib';
import { MultiTextureBatch } from '../lib/MultiTextureBatch';

export const createTestMTBScreen = async (viewport: Viewport): Promise<Screen> => {
  const gl = viewport.getContext();
  const camera = viewport.getCamera();
  camera.setYDown(YDOWN);

  const normalBatch = new PolygonBatch(gl);
  normalBatch.setYDown(YDOWN);

  const batch = new MultiTextureBatch(gl);
  batch.setYDown(YDOWN);

  const font = await BitmapFont.load(gl, './number.fnt', YDOWN);
  font.data.setXYScale(0.7);

  const atlas = await TextureAtlas.load(gl, './test-mtb/effects.atlas', true);

  let offset = 0;
  let accumulate = 0;

  return {
    update(delta: number, game: Game) {
      accumulate += delta;
      if (accumulate > 0.1) {
        offset++;
        accumulate = 0;
      }
      PolygonBatch.resetTotalDrawCalls();
      batch.setProjection(camera.combined);
      batch.begin();
      let i = 0;
      for (let region of atlas.regions) {
        i++;
        const pos = (i + offset) % atlas.regions.length;
        const x = pos % 25;
        const y = Math.floor(pos / 25);
        region.draw(batch, x * 20, 150 + y * 20, 20, 20);
      }
      batch.end();

      normalBatch.setProjection(camera.combined);
      normalBatch.begin();
      font.draw(
        normalBatch,
        'Draw calls: ' + PolygonBatch.totalDrawCalls + `\n${i} sprites\n${atlas.pages.length} textures`,
        20,
        20,
        460,
        Align.left
      );
      normalBatch.end();
    },
    dispose() {
      console.log('test screen disposed');
      batch.dispose();
      atlas.dispose();
    }
  };
};
