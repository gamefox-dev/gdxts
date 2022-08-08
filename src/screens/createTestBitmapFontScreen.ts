import { YDOWN } from '..';
import { Viewport, PolygonBatch, ShapeRenderer, BitmapFont, Color, Game, Align, Screen } from '../lib';

export const createTestBitmapFontScreen = async (viewport: Viewport): Promise<Screen> => {
  const gl = viewport.getContext();
  const camera = viewport.getCamera();
  camera.setYDown(YDOWN);

  const batch = new PolygonBatch(gl);
  batch.setYDown(YDOWN);

  const shapeRenderer = new ShapeRenderer(gl);

  const font = await BitmapFont.load(gl, './number.fnt', YDOWN);

  const strs = [
    'Strings are useful for holding data that can be represented in text form. Some of the most-used operations on strings are to check their',
    "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever",
    'Strings are useful for holding data'
  ];

  const color = new Color(1, 1, 0, 0.6);

  return {
    update(delta: number, game: Game) {
      shapeRenderer.setProjection(camera.projectionView.values);
      shapeRenderer.begin();
      shapeRenderer.rect(true, 0, 0, 500, 1000, Color.RED);
      shapeRenderer.end();

      batch.setProjection(camera.projectionView.values);
      batch.begin();
      batch.setColor(color);
      strs.map((str, i) => font.draw(batch, str, 0, (i + 1) * 300, 500, [Align.left, Align.center, Align.right][i]));
      batch.end();
    },
    dispose() {
      batch.dispose();
    }
  };
};
