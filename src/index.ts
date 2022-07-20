import { createStage, createViewport, createGameLoop, Game, Color } from './lib';
import { Material } from './lib/3d/Material';
import { PerspectiveCamera } from './lib/3d/PerspectiveCamera';
import { ModelBuilder } from './lib/3d/utils/ModelBuilder';
import { ColorAttribute } from './lib/3d/ColorAttribute';
import { Usage } from './lib/3d/VertexAttribute';
import { ModelInstance } from './lib/3d/ModelInstance';
import { ModelBatch } from './lib/3d/ModelBatch';

const init = async () => {
  const stage = createStage();
  const canvas = stage.getCanvas();

  const viewport = createViewport(canvas, 500, 1000, {
    crop: false
  });

  const gl = viewport.getContext();
  const cam = new PerspectiveCamera(67, 500, 1000);
  cam.update();

  const modelBatch = new ModelBatch(gl);
  const modelBuilder = new ModelBuilder(gl);
  const material = new Material();
  material.setAttribute(ColorAttribute.createDiffuse(Color.GREEN));

  const model = modelBuilder.createBox(5, 5, 5, material, Usage.Position | Usage.Normal);
  const instance = new ModelInstance(model);

  gl.clearColor(0, 0, 0, 1);
  createGameLoop((delta: number) => {
    gl.clear(gl.COLOR_BUFFER_BIT);

    modelBatch.begin(cam);
    modelBatch.renderWithModelInstance(instance);
    modelBatch.end();

    // Game.shared.update(delta);
  });
};

init();

export {};
