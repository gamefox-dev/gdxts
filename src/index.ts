import {
  Align,
  BitmapFont,
  createGameLoop,
  createStage,
  createViewport,
  Game,
  InputEvent,
  pointInRect,
  PolygonBatch,
  Screen,
  ShapeRenderer,
  Viewport,
  ViewportInputHandler
} from './lib';
import { createBunnyScreen } from './screens/createBunnyScreen';
import { createMainScreen } from './screens/createMainScreen';
import { create3DTestScreen } from './screens/createTest3DScreen';
import { createTestBitmapFontScreen } from './screens/createTestBitmapFontScreen';
import { createTestDrawAffine } from './screens/createTestDrawAffine';
import { createTestOutlineScreen } from './screens/createTestOutlineScreen';
import { createTestParticleScreen } from './screens/createTestParticleScreen';
import { createTestScreen } from './screens/createTestScreen';
import { createTestSpriteScreen } from './screens/createTestSpriteScreen';

export const YDOWN = true;
const FIRST_TEST_INDEX = 7;

const SCREENS: { [key: string]: (v: Viewport) => Promise<Screen> } = {
  'Basic rendering 01': createMainScreen,
  'Basic rendering 02': createTestScreen,
  'Sprite rendering': createTestSpriteScreen,
  'Bitmap Font': createTestBitmapFontScreen,
  'Fun with Bunnymark': createBunnyScreen,
  'Outline shader test': createTestOutlineScreen,
  'Basic 3D': create3DTestScreen,
  'Draw Affine': createTestDrawAffine,
  'Test Particle': createTestParticleScreen
};

const init = async () => {
  const stage = createStage();
  const canvas = stage.getCanvas();

  let currentScreen = 0;
  let screenNames = Object.keys(SCREENS);

  const viewport = createViewport(canvas, 500, 1000, {
    crop: false,
    contextOption: {
      antialias: false
    }
  });

  const gl = viewport.getContext();
  const font = await BitmapFont.load(gl, './number.fnt', YDOWN);
  font.getData().setScale(0.7, 0.7);

  const camera = viewport.getCamera();
  camera.setYDown(YDOWN);

  const batch = new PolygonBatch(gl, true);
  batch.setYDown(YDOWN);

  const shapeRenderer = new ShapeRenderer(gl);

  let transitioning = false;

  const setTestScreen = async (index: number) => {
    currentScreen = index;
    const name = screenNames[index];
    const screenFunc = SCREENS[name];
    const screen = await screenFunc(viewport);
    Game.shared.setScreen(screen);
    transitioning = false;
  };

  const inputHandler = new ViewportInputHandler(viewport);
  inputHandler.addEventListener(InputEvent.TouchEnd, async (x, y) => {
    if (transitioning) {
      return;
    }
    const coord = inputHandler.getTouchedWorldCoord(camera);
    if (pointInRect(coord.x, coord.y, 30, 935, 30, 50)) {
      currentScreen--;
    } else if (pointInRect(coord.x, coord.y, 440, 935, 30, 50)) {
      currentScreen++;
    } else {
      return;
    }

    if (currentScreen >= screenNames.length) {
      currentScreen = currentScreen % screenNames.length;
    } else if (currentScreen < 0) {
      currentScreen = screenNames.length - 1;
    }

    setTestScreen(currentScreen);
    transitioning = true;
  });

  let fps = 'FPS: 0';
  await setTestScreen(FIRST_TEST_INDEX);

  gl.clearColor(0, 0, 0, 1);
  const loop = createGameLoop((delta: number) => {
    gl.clear(gl.COLOR_BUFFER_BIT);
    Game.shared.update(delta);
    batch.setProjection(camera.combined);
    batch.begin();
    font.draw(batch, fps, 330, 20, 150);
    font.draw(batch, screenNames[currentScreen], 0, 950, 500, Align.center, false, 0, 22);
    batch.end();
    shapeRenderer.setProjection(camera.combined);
    shapeRenderer.begin();
    shapeRenderer.triangle(true, 30, 960, 60, 935, 60, 985);
    shapeRenderer.triangle(true, 470, 960, 440, 935, 440, 985);
    shapeRenderer.end();
  });

  setInterval(() => {
    fps = 'FPS: ' + loop.getFps();
  }, 1000);
};

init();

export {};
