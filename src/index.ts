import { OrthoCamera } from "./lib/Camera";
import { GLTexture } from "./lib/GLTexture";
import { PolygonBatcher } from "./lib/PolygonBatcher";
import { Shader } from "./lib/Shader";

const loadTexture = (
  gl: WebGLRenderingContext,
  url: string,
  useMipmaps = false
): Promise<GLTexture> =>
  new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      resolve(new GLTexture(gl, image, useMipmaps));
    };
    image.src = url;
  });

const createGameLoop = (update) => {
  let lastUpdate = performance.now();
  (function loop() {
    requestAnimationFrame(loop);
    const delta = (performance.now() - lastUpdate) / 1000;
    lastUpdate = performance.now();

    update(delta);
  })();
};

const init = async () => {
  const canvas = document.getElementById("main") as HTMLCanvasElement;
  const gl = canvas.getContext("webgl2");

  const texture = await loadTexture(gl, "./test.jpg");
  const camera = new OrthoCamera(600, 400);

  const shader = Shader.newTwoColoredTextured(gl);
  const batch = new PolygonBatcher(gl);

  gl.clearColor(0, 0, 0, 1);
  createGameLoop((delta: number) => {
    gl.clear(gl.COLOR_BUFFER_BIT);
    batch.setProjection(camera.projectionView.values);
    batch.begin(shader);
    // batch.
    batch.drawTexture(texture, 50, 50, 500, 300);
    batch.end();
  });
};

init();

export {};
