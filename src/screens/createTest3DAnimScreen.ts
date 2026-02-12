import { YDOWN } from '..';
import {
  Align,
  AnimationController,
  BitmapFont,
  Color,
  ColorAttribute3D,
  DirectionalLight,
  Environment,
  G3dModelLoader,
  Game,
  InputEvent,
  ModelBatch,
  ModelInstance,
  PerspectiveCamera,
  PolygonBatch,
  Screen,
  ShapeRenderer,
  ToonShaderProvider,
  Vector2,
  Vector3,
  Viewport,
  ViewportInputHandler
} from '../lib';

const MODEL_SCALE = 3;
const MODEL_Y_OFFSET = 0;
export const createTest3DAnimScreen = async (viewport: Viewport): Promise<Screen> => {
  const gl = viewport.getContext();
  const canvas = viewport.getCanvas();

  // --- 3D setup ---
  const cam = new PerspectiveCamera(67, canvas.width, canvas.height);
  cam.position.set(0, 7, 15);
  cam.lookAt(0, 2, 0);
  cam.near = 0.1;
  cam.far = 300;
  cam.update();

  const toonProvider = new ToonShaderProvider(gl);
  const modelBatch = new ModelBatch(gl, null, null, toonProvider);
  const environment = new Environment();
  environment.set(new ColorAttribute3D(ColorAttribute3D.AmbientLight, new Color(0.3, 0.3, 0.3, 1)));
  const directionalLight = new DirectionalLight().set(0.8, 0.8, 0.8, -0.3, 0.3, -0.7);
  environment.addLight(directionalLight);

  // Load barbarian model
  const g3dLoader = new G3dModelLoader();
  const model = await g3dLoader.load(gl, '3d-assets/Barbarian-flipv.g3dj');
  const instance = new ModelInstance(model);
  instance.transform.setTranslation(0, MODEL_Y_OFFSET, 0).scale(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);

  // Animation setup
  const animController = new AnimationController(instance);
  const animationNames = instance.animations.map(a => a.id);
  let currentAnimIndex = 0;
  animController.setAnimation(animationNames[currentAnimIndex], -1);

  // --- 2D overlay setup ---
  const camera2d = viewport.getCamera();
  camera2d.setYDown(YDOWN);

  const batch = new PolygonBatch(gl);
  batch.setYDown(YDOWN);

  const shapeRenderer = new ShapeRenderer(gl);
  const font = await BitmapFont.load(gl, './number.fnt', YDOWN);

  const setAnimation = (index: number) => {
    currentAnimIndex = index;
    if (currentAnimIndex < 0) currentAnimIndex = animationNames.length - 1;
    if (currentAnimIndex >= animationNames.length) currentAnimIndex = 0;
    animController.setAnimation(animationNames[currentAnimIndex], -1);
  };

  // --- Camera orbit input ---
  const touchStartPos = new Vector2();
  let touched = false;
  const inputHandler = new ViewportInputHandler(viewport);
  const tmpV1 = new Vector3();
  const camTarget = new Vector3(0, 2, 0);

  inputHandler.addEventListener(InputEvent.TouchStart, async (x, y) => {
    touchStartPos.set(x, y);
    touched = true;
  });

  inputHandler.addEventListener(InputEvent.TouchMove, async (x, y) => {
    if (touched) {
      const deltaX = (x - touchStartPos.x) / canvas.width;
      const deltaY = (touchStartPos.y - y) / canvas.height;
      touchStartPos.set(x, y);

      tmpV1.set(cam.direction.x, cam.direction.y, cam.direction.z).cross(cam.up).y = 0;
      cam.rotateAround(camTarget, tmpV1.normalize(), deltaY * 360);
      cam.rotateAround(camTarget, Vector3.Y, deltaX * -360);
    }
  });

  inputHandler.addEventListener(InputEvent.TouchEnd, async (x, y) => {
    touched = false;

    // Check button clicks
    const coord = inputHandler.getTouchedWorldCoord(camera2d);
    // Left arrow: roughly x=30, y=880-920, w=50, h=50
    if (coord.x >= 20 && coord.x <= 80 && coord.y >= 860 && coord.y <= 940) {
      setAnimation(currentAnimIndex - 1);
    }
    // Right arrow: roughly x=420, y=880-920, w=50, h=50
    if (coord.x >= 420 && coord.x <= 480 && coord.y >= 860 && coord.y <= 940) {
      setAnimation(currentAnimIndex + 1);
    }
  });

  gl.clearColor(0.15, 0.15, 0.2, 1);

  return {
    update(delta: number, game: Game) {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // Update & render 3D
      animController.update(delta);
      modelBatch.begin(cam);
      modelBatch.render(instance, environment);
      modelBatch.end();

      // Render 2D overlay
      const animLabel = `${currentAnimIndex + 1}/${animationNames.length}  ${animationNames[currentAnimIndex]}`;

      // Draw buttons and text
      shapeRenderer.setProjection(camera2d.combined);
      shapeRenderer.begin();
      // Left arrow button
      shapeRenderer.triangle(true, 30, 900, 70, 870, 70, 930);
      // Right arrow button
      shapeRenderer.triangle(true, 470, 900, 430, 870, 430, 930);
      shapeRenderer.end();

      batch.setProjection(camera2d.combined);
      batch.begin();
      font.draw(batch, animLabel, 80, 890, 340, Align.center);
      batch.end();
    },
    dispose() {
      modelBatch.dispose();
      batch.dispose();
    }
  };
};
