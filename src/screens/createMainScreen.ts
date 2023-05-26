import { YDOWN } from '..';
import {
  Animation,
  Color,
  PlayMode,
  PolygonBatch,
  Screen,
  ShapeRenderer,
  TextureAtlas,
  Viewport,
  ViewportInputHandler
} from '../lib';

export const createMainScreen = async (viewport: Viewport): Promise<Screen> => {
  const gl = viewport.getContext();
  const camera = viewport.getCamera();

  camera.setYDown(YDOWN);

  const kitGardenAtlas = await TextureAtlas.load(gl, './kit-garden.atlas');
  const atlas = await TextureAtlas.load(gl, './gem.atlas');

  const kitFullRun = new Animation(kitGardenAtlas.findRegions('char_run_full'), [1 / 30]);

  const kitFullHalf = new Animation(kitGardenAtlas.findRegions('char_run_half'), [1 / 30]);

  const inputHandler = new ViewportInputHandler(viewport);

  const batch = new PolygonBatch(gl);

  batch.setYDown(YDOWN);

  const shapeRenderer = new ShapeRenderer(gl);

  const gems: any[] = [];

  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 5; x++) {
      gems.push({
        x: x * 52,
        y: y * 52,
        type: Math.floor(Math.random() * 4)
      });
    }
  }

  let stateTime = 0;
  return {
    update(delta, game) {
      stateTime += delta;

      if (inputHandler.isTouched()) {
        const coord = inputHandler.getTouchedWorldCoord(camera);
        gems.push({
          x: coord.x - 25,
          y: coord.y - 25,
          type: Math.floor(Math.random() * 4)
        });
      }

      shapeRenderer.setProjection(camera.combined);
      shapeRenderer.begin();
      shapeRenderer.rect(true, 0, 0, 500, 1000, Color.BLUE);
      shapeRenderer.rect(true, 300, 100, 75, 100, Color.RED);
      shapeRenderer.rect(true, 400, 100, 75, 100, Color.RED);
      shapeRenderer.end();

      batch.setProjection(camera.combined);
      batch.begin();
      for (let gem of gems) {
        atlas.findRegion(`gem_0${gem.type + 1}`, 1).draw(batch, gem.x, gem.y, 50, 50);
      }
      kitFullRun.getKeyFrame(stateTime, PlayMode.LOOP).draw(batch, 300, 100, 75, 100);

      kitFullHalf.getKeyFrame(stateTime, PlayMode.LOOP).draw(batch, 400, 100, 75, 100);
      batch.end();
    },
    dispose() {
      console.log('main screen disposed');
      batch.dispose();
      shapeRenderer.dispose();
      atlas.dispose();
      kitGardenAtlas.dispose();
    }
  };
};
