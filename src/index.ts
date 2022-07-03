import { OrthoCamera } from "./lib/Camera";
import { PolygonBatch } from "./lib/PolygonBatcher";
import { createGameLoop } from "./lib/Utils";
import { TextureAtlas } from "./lib/TextureAtlas";
import { Animation, PlayMode } from "./lib/Animation";
import { Texture } from "./lib/Texture";

const init = async () => {
  const canvas = document.getElementById("main") as HTMLCanvasElement;
  const gl = canvas.getContext("webgl2");

  const camera = new OrthoCamera(600, 400);

  const tex = await Texture.load(gl, "./test.jpg");

  const kitGardenAtlas = await TextureAtlas.load(gl, "./kit-garden.atlas");
  const atlas = await TextureAtlas.load(gl, "./gem.atlas");

  const kitFullRun = new Animation(
    kitGardenAtlas.findRegions("char_run_full"),
    [1 / 5, 1 / 5, 1 / 5, 1 / 5, 1 / 5, 1 / 5, 1 / 30]
  );

  const batch = new PolygonBatch(gl);

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

  let stateTime = 0;
  gl.clearColor(0, 0, 0, 1);
  createGameLoop((delta: number) => {
    stateTime += delta;
    gl.clear(gl.COLOR_BUFFER_BIT);
    batch.setProjection(camera.projectionView.values);
    batch.begin();
    batch.draw(tex, 0, 0, 600, 400);
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
