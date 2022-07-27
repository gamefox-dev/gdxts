import {
  createStage,
  createViewport,
  createGameLoop,
  Color,
  Vector3,
  ViewportInputHandler,
  InputEvent,
  Vector2
} from './lib';
import { Material } from './lib/3d/Material';
import { PerspectiveCamera } from './lib/3d/PerspectiveCamera';
import { ModelBuilder } from './lib/3d/utils/ModelBuilder';
import { ColorAttribute } from './lib/3d/attributes/ColorAttribute';
import { Usage } from './lib/3d/attributes/VertexAttribute';
import { ModelInstance } from './lib/3d/ModelInstance';
import { ModelBatch } from './lib/3d/ModelBatch';
import { Environment } from './lib/3d/environment/Environment';
import { DirectionalLight } from './lib/3d/environment/DirectionalLight';
import { PointLight } from './lib/3d/environment/PointLight';
import { SpotLight } from './lib/3d/environment/SpotLight';
import { BoundingBox } from './lib/3d/BoundingBox';
import { ObjLoader } from './lib/3d/loader/ObjLoader';
import { Model } from './lib/3d/model/Model';

const init = async () => {
  const stage = createStage();
  const canvas = stage.getCanvas();

  const viewport = createViewport(canvas, canvas.width, canvas.height, {
    crop: false
  });

  const gl = viewport.getContext();
  const cam = new PerspectiveCamera(67, canvas.width, canvas.height);
  cam.position.set(10, 10, 10);
  cam.lookAt(0, 0, 0);
  cam.near = 1;
  cam.far = 300;
  cam.update();

  const modelBatch = new ModelBatch(gl);
  const modelBuilder = new ModelBuilder(gl);
  const material = new Material();
  material.setAttribute(ColorAttribute.createDiffuse(Color.WHITE));
  const model = modelBuilder.createBox(2, 2, 2, material, Usage.Position | Usage.Normal);

  const environment = new Environment();
  environment.set(new ColorAttribute(ColorAttribute.AmbientLight, new Color(0.4, 0.4, 0.8, 1)));
  const directionalLight = new DirectionalLight().set(0, 1, 0.8, -1, -0.8, -0.2);

  environment.addDirectionalLight(directionalLight);
  //environment.addPointLight(new PointLight().set(new Color(0, 1, 1), new Vector3(10, 0, 10), 100));

  const COUNT = 1800;
  const instances: ModelInstance[] = [];
  const COLORS = [Color.GREEN, Color.RED, Color.BLUE, Color.MAGENTA, Color.WHITE];
  for (let i = 0; i < COUNT; i++) {
    const instance = new ModelInstance(model);
    instance.getMaterial(material.id).setAttribute(ColorAttribute.createDiffuse(COLORS[Math.floor(Math.random() * 5)]));
    instance.transform.translate(Math.random() * 100 - 50, Math.random() * 100 - 50, Math.random() * 100 - 50);
    instances.push(instance);
  }

  const loader = new ObjLoader();
  const shipModel = await loader.load(gl, 'ship.obj');
  const shipInstance = new ModelInstance(shipModel);
  instances.push(shipInstance);

  // culling
  const bounds = new BoundingBox();
  const position = new Vector3();
  const center = new Vector3();
  const dimensions = new Vector3();
  const isVisible = (cam: PerspectiveCamera, instance: ModelInstance) => {
    instance.model.calculateBoundingBox(bounds);
    bounds.getCenter(center);
    bounds.getDimensions(dimensions);
    instance.transform.getTranslation(position);
    position.add(center);

    return cam.frustum.boundsInFrustrum(position, dimensions);
  };

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

  const lightDirection = new Vector2(1, 0);
  const ROTATION_SPEED = Math.PI;
  createGameLoop((delta: number) => {
    gl.clear(gl.COLOR_BUFFER_BIT);
    modelBatch.begin(cam);
    lightDirection.rotateRad(ROTATION_SPEED * delta);
    directionalLight.direction.set(lightDirection.x, 0, lightDirection.y);
    for (let i = 0; i < instances.length; i++) {
      if (isVisible(cam, instances[i])) {
        modelBatch.render(instances[i], environment);
      }
    }
    modelBatch.end();
  });
};

init();

export {};
