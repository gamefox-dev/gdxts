import {
  Color,
  createGameLoop,
  createStage,
  createViewport,
  InputEvent,
  Vector2,
  Vector3,
  ViewportInputHandler
} from './lib';
import { ColorAttribute } from './lib/3d/attributes/ColorAttribute';
import { DirectionalLight } from './lib/3d/environment/DirectionalLight';
import { Environment } from './lib/3d/environment/Environment';
import { G3dModelLoader } from './lib/3d/loader/G3dModelLoader';
import { ObjLoader } from './lib/3d/loader/ObjLoader';
import { ModelBatch } from './lib/3d/ModelBatch';
import { ModelInstance } from './lib/3d/ModelInstance';
import { PerspectiveCamera } from './lib/3d/PerspectiveCamera';
import { AnimationController } from './lib/3d/utils/AminationController';
import { Quaternion } from './lib/Quaternion';

const modelFiles = ['Treasure.obj', 'Kings_Throne.obj', 'Thirsty_Corridor.obj', 'TrappedRoom.obj'];
const modelRotations: Quaternion[] = [
  new Quaternion().setEulerAngles(90, 0, 0),
  new Quaternion(),
  new Quaternion().setEulerAngles(180, 0, 0),
  new Quaternion().setEulerAngles(-90, 0, 0)
];
const MODEL_SIZE = 5;
const KNIGHT_SCALE = 0.15;
const KNIGHT_Y_OFFSET = 2.4;

const init = async () => {
  const stage = createStage();
  const canvas = stage.getCanvas();

  const viewport = createViewport(canvas, canvas.width, canvas.height, {
    crop: false
  });

  const gl = viewport.getContext();
  const cam = new PerspectiveCamera(67, canvas.width, canvas.height);
  cam.position.set(0, 15, 10);
  cam.lookAt(0, 0, 0);
  cam.near = 1;
  cam.far = 300;
  cam.update();

  const modelBatch = new ModelBatch(gl);

  const environment = new Environment();
  environment.set(new ColorAttribute(ColorAttribute.AmbientLight, new Color(0.8, 0.8, 0.8, 1)));
  const directionalLight = new DirectionalLight().set(1, 1, 1, -0.3, 0.3, -0.7);
  environment.addLight(directionalLight);

  const instances: ModelInstance[] = [];
  const animationControllers: AnimationController[] = [];
  const objLoader = new ObjLoader();
  let col = 0;
  let row = 0;
  for (let i = 0; i < modelFiles.length; i++) {
    const model = await objLoader.load(gl, modelFiles[i]);
    const instance = new ModelInstance(model);
    instance.transform
      .setTranslation(col * MODEL_SIZE - MODEL_SIZE / 2, 0, row * MODEL_SIZE - MODEL_SIZE / 2)
      .rotate(modelRotations[i]);
    instances.push(instance);

    col++;
    if (col === 2) {
      col = 0;
      row++;
    }
  }

  const g3dLoader = new G3dModelLoader();
  const knightModel = await g3dLoader.load(gl, 'knight.g3dj');

  for (let i = 0; i < 2; i++) {
    const instance = new ModelInstance(knightModel);
    instance.transform.setTranslation(1 + i * 2.7, KNIGHT_Y_OFFSET, -2).scale(KNIGHT_SCALE, KNIGHT_SCALE, KNIGHT_SCALE);
    instances.push(instance);

    const animController = new AnimationController(instance);
    animController.setAnimation('Idle', -1);
    animationControllers.push(animController);
  }

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
  createGameLoop((delta: number) => {
    gl.clear(gl.COLOR_BUFFER_BIT);
    modelBatch.begin(cam);

    for (const animController of animationControllers) {
      animController.update(delta);
    }

    for (const instance of instances) {
      modelBatch.render(instance, environment);
    }
    modelBatch.end();
  });
};

init();

export {};
