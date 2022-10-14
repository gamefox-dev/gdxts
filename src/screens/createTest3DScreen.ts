import {
  Color,
  ColorAttribute3D,
  DefaultShaderProvider,
  Environment,
  G3dModelLoader,
  Game,
  InputEvent,
  Material,
  ModelBatch,
  ModelBuilder,
  ModelInstance,
  ObjLoader,
  PerspectiveCamera,
  Quaternion,
  Screen,
  Usage,
  Vector2,
  Vector3,
  Viewport,
  ViewportInputHandler
} from '../lib';
import { DirectionalLightEx } from '../lib/3d/gltf/scene3d/lights/DirectionalLightEx';
import { SceneManager } from '../lib/3d/gltf/scene3d/scene/SceneManager';
import { PBRShaderProvider } from '../lib/3d/gltf/scene3d/shaders/PBRShaderProvider';

const modelFiles = ['castle.obj'];
const modelRotations: Quaternion[] = [
  new Quaternion().setEulerAngles(90, 0, 0),
  new Quaternion(),
  new Quaternion().setEulerAngles(180, 0, 0),
  new Quaternion().setEulerAngles(-90, 0, 0)
];

export const create3DTestScreen = async (viewport: Viewport): Promise<Screen> => {
  const gl = viewport.getContext();
  const canvas = viewport.getCanvas();

  const viewportInfo = viewport.getViewportInfo();
  const cam = new PerspectiveCamera(
    67,
    viewportInfo.width,
    viewportInfo.height,
    viewportInfo.worldWidth,
    viewportInfo.worldHeight
  );
  cam.position.set(0, 15, 10);
  cam.lookAt(0, 0, 0);
  cam.near = 1;
  cam.far = 300;
  cam.update();

  const shaderProvider = PBRShaderProvider.createDefaultWithNumBones(gl, 24);
  let modelBatch = new ModelBatch(gl, null, shaderProvider);
  modelBatch = new ModelBatch(gl, null, new DefaultShaderProvider(gl));

  const environment = new Environment();
  environment.set(new ColorAttribute3D(ColorAttribute3D.AmbientLight, new Color(1, 1, 1, 1)));
  environment.addLight(new DirectionalLightEx().setWithInstensity(Color.WHITE, new Vector3(-1, -4, -2), 10));

  const instances: ModelInstance[] = [];
  const g3dLoader = new G3dModelLoader();
  let model = await g3dLoader.load(gl, './castle.g3dj');

  const objLoader = new ObjLoader();
  model = await objLoader.load(gl, './castle.obj');

  const instance = new ModelInstance(model);
  instances.push(instance);

  const material = new Material();
  material.setAttribute(ColorAttribute3D.createDiffuse(Color.GREEN));
  const modelBuilder = new ModelBuilder(gl);
  const boxModel = modelBuilder.createBox(2, 2, 2, material, Usage.Position | Usage.Normal);
  const boxInstance = new ModelInstance(boxModel);
  boxInstance.transform.setTranslation(-5, 0, 0);

  const manager = new SceneManager(gl);
  manager.setAmbientLight(0.01);
  manager.environment.addLight(new DirectionalLightEx().setWithInstensity(Color.WHITE, new Vector3(-1, -4, -2), 10));
  manager.camera = cam;

  const touchStartPos = new Vector2();
  let touched = false;
  const inputHandler = new ViewportInputHandler(viewport);
  inputHandler.addEventListener(InputEvent.TouchStart, async (x, y) => {
    touchStartPos.set(x, y);
    touched = true;
  });

  const tmpV1 = new Vector3();
  const camTarget = new Vector3();
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
  });

  gl.clearColor(0, 0, 0, 1);
  return {
    update(delta: number, game: Game) {
      gl.clear(gl.COLOR_BUFFER_BIT);

      // modelBatch.begin(cam);
      // for (const instance of instances) {
      //   modelBatch.render(instance, environment);
      // }
      // modelBatch.end();

      manager.update(delta);
      for (const instance of instances) {
        manager.getRenderableProviders().push(instance);
        manager.getRenderableProviders().push(boxInstance);
      }
      manager.render();
      manager.getRenderableProviders().length = 0;
    },
    dispose() {}
  };
};
