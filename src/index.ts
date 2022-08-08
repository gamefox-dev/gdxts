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
  Viewport,
  Game,
  Screen,
  Align,
  BitmapFont,
  Sprite,
  MathUtils,
  Vector2,
  GameLoop,
  TextureRegion,
  TextureFilter
} from './lib';

const YDOWN = true;

const createBunnyScreen = async (viewport: Viewport, loop: GameLoop): Promise<Screen> => {
  const gl = viewport.getContext();
  const camera = viewport.getCamera();

  camera.setYDown(YDOWN);

  const texture = await Texture.load(gl, './bunnys.png');
  texture.setFilters(TextureFilter.Linear, TextureFilter.Linear);
  const regions = TextureRegion.splitTexture(texture, 1, 5);
  const font = await BitmapFont.load(gl, './number.fnt', YDOWN);

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

  let fps = 'FPS: 0';

  const iid = setInterval(() => {
    fps = 'FPS: ' + loop.getFps();
  }, 1000);

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
      font.draw(batch, fps, 20, 20, 500);
      batch.end();
    },
    dispose() {
      batch.dispose();
      texture.dispose();
      font.dispose();
      clearInterval(iid);
    }
  };
};

const createMainScreen = async (viewport: Viewport): Promise<Screen> => {
  const gl = viewport.getContext();
  const camera = viewport.getCamera();

  camera.setYDown(YDOWN);

  const inputHandler = new ViewportInputHandler(viewport);

  const kitGardenAtlas = await TextureAtlas.load(gl, './kit-garden.atlas');
  const atlas = await TextureAtlas.load(gl, './gem.atlas');

  const kitFullRun = new Animation(kitGardenAtlas.findRegions('char_run_full'), [1 / 30]);

  const kitFullHalf = new Animation(kitGardenAtlas.findRegions('char_run_half'), [1 / 30]);

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

  let transitioning = false;
  inputHandler.addEventListener(InputEvent.TouchStart, async (x, y) => {
    const coord = inputHandler.getTouchedWorldCoord(camera);
    gems.push({
      x: coord.x - 25,
      y: coord.y - 25,
      type: Math.floor(Math.random() * 4)
    });

    if (gems.length > 30 && !transitioning) {
      transitioning = true;
      Game.shared.setScreen(await createTestScreen(viewport));
    }
  });

  let stateTime = 0;
  return {
    update(delta, game) {
      stateTime += delta;

      // shapeRenderer.setProjection(camera.projectionView.values);
      // shapeRenderer.begin();
      // shapeRenderer.rect(true, 0, 0, 500, 1000, Color.BLUE);
      // shapeRenderer.rect(true, 300, 100, 75, 100, Color.RED);
      // shapeRenderer.rect(true, 400, 100, 75, 100, Color.RED);
      // shapeRenderer.end();

      batch.setProjection(camera.projectionView.values);
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

const createTestScreen = async (viewport: Viewport): Promise<Screen> => {
  const gl = viewport.getContext();
  const camera = viewport.getCamera();
  camera.setYDown(YDOWN);

  const batch = new PolygonBatch(gl);
  batch.setYDown(YDOWN);

  const texture = await Texture.load(gl, 'test.jpg');
  let accumulate = 0;
  let transitioning = false;

  return {
    update(delta: number, game: Game) {
      accumulate += delta;
      if (accumulate >= 2 && !transitioning) {
        transitioning = true;
        createMainScreen(viewport).then(screen => game.setScreen(screen));
      }
      batch.setProjection(camera.projectionView.values);
      batch.begin();
      batch.draw(texture, 0, 0, 500, 1000);
      batch.end();
    },
    dispose() {
      console.log('test screen disposed');
      batch.dispose();
      texture.dispose();
    }
  };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const createTestBitmapFontScreen = async (viewport: Viewport): Promise<Screen> => {
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const createTestSpriteScreen = async (viewport: Viewport): Promise<Screen> => {
  const gl = viewport.getContext();
  const camera = viewport.getCamera();
  camera.setYDown(YDOWN);

  const batch = new PolygonBatch(gl);
  batch.setYDown(YDOWN);

  const shapeRenderer = new ShapeRenderer(gl);

  const atlas = await TextureAtlas.load(gl, './gem.atlas');
  const region = atlas.findRegion('gem_01');
  const sprite = new Sprite(region);
  sprite.setOriginCenter();

  const position = new Vector2(0, 500);
  let translateX = 250;

  let scale = 0.5;
  let scaleSpeed = -0.5;

  return {
    update(delta: number, game: Game) {
      shapeRenderer.setProjection(camera.projectionView.values);
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
      batch.setProjection(camera.projectionView.values);
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

const init = async () => {
  const stage = createStage();
  const canvas = stage.getCanvas();

  const viewport = createViewport(canvas, 500, 1000, {
    crop: false,
    contextOption: {
      antialias: false
    }
  });
  const gl = viewport.getContext();

  gl.clearColor(0, 0, 0, 1);
  const loop = createGameLoop((delta: number) => {
    gl.clear(gl.COLOR_BUFFER_BIT);
    Game.shared.update(delta);
  });

  Game.shared.setScreen(await createBunnyScreen(viewport, loop));
};

init();

export {};
