import { createStage, createViewport, createGameLoop, Game, Color } from './lib';
import { Material } from './lib/3d/Material';
import { PerspectiveCamera } from './lib/3d/PerspectiveCamera';
import { ModelBuilder } from './lib/3d/utils/ModelBuilder';
import { ColorAttribute } from './lib/3d/attributes/ColorAttribute';
import { Usage } from './lib/3d/attributes/VertexAttribute';
import { ModelInstance } from './lib/3d/ModelInstance';
import { ModelBatch } from './lib/3d/ModelBatch';
import { Environment } from './lib/3d/environment/Environment';
import { DirectionalLight } from './lib/3d/environment/DirectionalLight';

const init = async () => {
  const stage = createStage();
  const canvas = stage.getCanvas();

  const viewport = createViewport(canvas, 500, 1000, {
    crop: false
  });

  const gl = viewport.getContext();
  const cam = new PerspectiveCamera(67, 640, 480);
  cam.position.set(10, 10, 10);
  cam.lookAt(0, 0, 0);
  cam.near = 1;
  cam.far = 300;
  cam.update();

  const modelBatch = new ModelBatch(gl);
  const modelBuilder = new ModelBuilder(gl);
  const material = new Material();
  material.setAttribute(ColorAttribute.createDiffuse(Color.GREEN));

  const environment = new Environment();
  environment.set(new ColorAttribute(ColorAttribute.AmbientLight, new Color(0.4, 0.4, 0.4, 1)));
  environment.addDirectionalLight(new DirectionalLight().set(0.8, 0.8, 0.8, -1, -0.8, -0.2));

  const model = modelBuilder.createBox(5, 5, 5, material, Usage.Position | Usage.Normal);
  const instance = new ModelInstance(model);

  gl.clearColor(0, 0, 0, 1);
  createGameLoop((delta: number) => {
    gl.clear(gl.COLOR_BUFFER_BIT);

    modelBatch.begin(cam);
    modelBatch.render(instance, environment);
    modelBatch.end();

    // Game.shared.update(delta);
  });
};

init();

export {};
