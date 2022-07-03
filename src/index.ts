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
  Texture,
} from "./lib";

// eslint-disable-next-line
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
        x: x * 52,
        y: y * 52,
        type: Math.floor(Math.random() * 4),
      });
    }
  }

  inputHandler.addEventListener(InputEvent.TouchStart, (x, y) => {
    const coord = inputHandler.getTouchedWorldCoord(camera);
    gems.push({
      x: coord.x,
      y: coord.y,
      type: Math.floor(Math.random() * 4),
    });
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
        .draw(batch, gem.x, gem.y, 50, 50);
    }
    kitFullRun
      .getKeyFrame(stateTime, PlayMode.LOOP_PINGPONG)
      .draw(batch, 300, 100, 100, 100);
    batch.end();
  });
};

// eslint-disable-next-line
const initRabbitTest = async () => {
  const stage = createStage({
    info: true,
  });
  const canvas = stage.getCanvas();
  const info = stage.getInfo();

  const viewport = createViewport(canvas, 500, 1000, {
    pixelRatio: 1,
    contextOption: {
      antialias: false,
    },
  });

  const gl = viewport.getContext();
  const camera = viewport.getCamera();

  const rabbitTexture = await Texture.load(gl, "./rabbitv3.png");

  const inputHandler = new ViewportInputHandler(viewport);
  const batch = new PolygonBatch(gl);

  const rabbits = [];

  const addMore = (count = 1000) => {
    for (let i = 0; i < count; i++) {
      rabbits.push({
        x: 0,
        y: 1000,
        speedX: Math.random() * 500,
        speedY: Math.random() * 1000,
      });
    }
  };

  const less = (count = 1000) => {
    rabbits.length = Math.max(0, rabbits.length - count);
  };

  addMore(1000);

  const rabbitWidth = rabbitTexture.width;
  const rabbitHeight = rabbitTexture.height;

  gl.clearColor(0, 0, 0, 1);
  const loop = createGameLoop((delta: number) => {
    if (inputHandler.isTouched()) {
      if (inputHandler.getTouchedWorldCoord().x <= 250) {
        less();
      } else {
        addMore();
      }
    }
    gl.clear(gl.COLOR_BUFFER_BIT);

    for (let rabbit of rabbits) {
      rabbit.x += rabbit.speedX * delta;
      if (rabbit.x < 0) {
        rabbit.x = 0;
        rabbit.speedX *= -1;
      }
      if (rabbit.x > 500) {
        rabbit.x = 500;
        rabbit.speedX *= -1;
      }
      rabbit.y += rabbit.speedY * delta;
      if (rabbit.y < 0) {
        rabbit.y = 0;
        rabbit.speedY *= -1;
      }
      if (rabbit.y > 1000) {
        rabbit.y = 1000;
        rabbit.speedY *= -1;
      }
    }

    batch.setProjection(camera.projectionView.values);
    batch.begin();
    for (let rabbit of rabbits) {
      batch.draw(
        rabbitTexture,
        rabbit.x + rabbitWidth / 2,
        rabbit.y,
        rabbitWidth,
        rabbitHeight
      );
    }
    batch.end();
  });

  setInterval(() => {
    info.innerHTML = `FPS: ${loop.getFps()} - Count: ${rabbits.length}`;
  }, 500);
};

init();
// initRabbitTest();

export {};
