import { YDOWN } from '..';
import { Viewport, PolygonBatch, Texture, Game, Screen } from '../lib';

export const createTestScreen = async (viewport: Viewport): Promise<Screen> => {
  const gl = viewport.getContext();
  const camera = viewport.getCamera();
  camera.setYDown(YDOWN);

  const batch = new PolygonBatch(gl);
  batch.setYDown(YDOWN);

  const texture = await Texture.load(gl, 'test.jpg');

  return {
    update(delta: number, game: Game) {
      batch.setProjection(camera.projectionView.values);
      batch.begin();
      batch.draw(texture, 0, 0, 500, 600);
      batch.end();
    },
    dispose() {
      console.log('test screen disposed');
      batch.dispose();
      texture.dispose();
    }
  };
};
