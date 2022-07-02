import { OrthoCamera } from "./lib/Camera";
import { Texture } from "./lib/Texture";
import { PolygonBatch } from "./lib/PolygonBatcher";
import { Color, createGameLoop } from "./lib/Utils";
import { TextureRegion } from "./lib/TextureRegion";
import { TextureAtlas } from "./lib/TextureAtlas";

const init = async () => {
  const canvas = document.getElementById("main") as HTMLCanvasElement;
  const gl = canvas.getContext("webgl2");

  const texture = await Texture.load(gl, "./test.jpg");
  const regions = TextureRegion.splitTexture(texture, 4, 4);
  const camera = new OrthoCamera(600, 400);

  const atlas = await TextureAtlas.load(gl, "./gem.atlas");

  const batch = new PolygonBatch(gl);

  let rotation = 0;
  const ROTATION_SPEED = Math.PI / 2;

  gl.clearColor(0, 0, 0, 1);
  createGameLoop((delta: number) => {
    rotation += ROTATION_SPEED * delta;

    gl.clear(gl.COLOR_BUFFER_BIT);
    batch.setProjection(camera.projectionView.values);
    batch.begin();
    batch.setColor(Color.RED);
    batch.drawTexture(
      texture,
      50,
      50,
      500,
      300,
      250,
      150,
      rotation,
      Math.abs(Math.sin(rotation)),
      Math.abs(Math.sin(rotation))
    );
    batch.setColor(Color.WHITE);
    regions[3].draw(
      batch,
      50,
      50,
      250,
      150,
      250,
      150
      // -rotation,
      // Math.abs(Math.sin(-rotation)),
      // Math.abs(Math.sin(-rotation))
    );
    atlas.findRegion("gem_01", 1).draw(batch, 50, 50, 50, 50);
    batch.end();
  });
};

init();

export {};
