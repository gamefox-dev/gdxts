import {
  createStage,
  createViewport,
  ViewportInputHandler,
  TextureAtlas,
  PolygonBatch,
  ShapeRenderer,
  createGameLoop,
  Color,
  PlayMode,
  Animation,
  InputEvent,
} from "./lib";

const init = async () => {
  const stage = createStage();
  const canvas = stage.getCanvas();

  const viewport = createViewport(canvas, 500, 1000, {
    crop: false,
  });

  const gl = viewport.getContext();
  const camera = viewport.getCamera();

  const inputHandler = new ViewportInputHandler(viewport);

  const kitGardenAtlas = await TextureAtlas.load(gl, "./kit-garden.atlas");
  const atlas = await TextureAtlas.load(gl, "./gem.atlas");

  const kitFullRun = new Animation(
    kitGardenAtlas.findRegions("char_run_full"),
    [1 / 5, 1 / 5, 1 / 5, 1 / 5, 1 / 5, 1 / 5, 1 / 30]
  );

  const batch = new PolygonBatch(gl);
  const shapeRenderer = new ShapeRenderer(gl);

  const gems: any[] = [];

  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 5; x++) {
      gems.push({
        x,
        y,
        type: Math.floor(Math.random() * 4),
      });
    }
  }

  inputHandler.addEventListener(InputEvent.TouchStart, (x, y) => {
    const coord = inputHandler.getTouchedWorldCoord(camera);
    console.log(coord);
  });

  let stateTime = 0;
  gl.clearColor(0, 0, 0, 1);
  createGameLoop((delta: number) => {
    stateTime += delta;
    gl.clear(gl.COLOR_BUFFER_BIT);

    shapeRenderer.setProjection(camera.projectionView.values);
    shapeRenderer.begin();
    shapeRenderer.rect(true, 0, 0, 500, 1000, Color.BLUE);
    shapeRenderer.end();

    batch.setProjection(camera.projectionView.values);
    batch.begin();
    for (let gem of gems) {
      atlas
        .findRegion(`gem_0${gem.type + 1}`, 1)
        .draw(batch, 52 * gem.x, 52 * gem.y, 50, 50);
    }
    kitFullRun
      .getKeyFrame(stateTime, PlayMode.LOOP_PINGPONG)
      .draw(batch, 300, 100, 100, 100);
    batch.end();
  });
};

init();

export {};
