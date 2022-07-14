import {
   createStage,
   createViewport,
   ViewportInputHandler,
   TextureAtlas,
   PolygonBatch,
   ShapeRenderer,
   createGameLoop,
   Color,
   PlayMode,
   Animation,
   InputEvent,
   Texture,
   Viewport,
   Game,
   Screen,
   Align,
} from "./lib";
import { BitmapFont } from "./lib/BitmapFont";
import { BitmapFontData } from "./lib/BitmapFontData";

const YDOWN = false;
const createMainScreen = async (viewport: Viewport): Promise<Screen> => {
   const gl = viewport.getContext();
   const camera = viewport.getCamera();

   camera.setYDown(true);

   const inputHandler = new ViewportInputHandler(viewport);

   const kitGardenAtlas = await TextureAtlas.load(gl, "./kit-garden.atlas");
   const atlas = await TextureAtlas.load(gl, "./gem.atlas");

   const kitFullRun = new Animation(kitGardenAtlas.findRegions("char_run_full"), [1 / 30]);

   const kitFullHalf = new Animation(kitGardenAtlas.findRegions("char_run_half"), [1 / 30]);

   const batch = new PolygonBatch(gl);

   batch.setYDown(YDOWN);

   const shapeRenderer = new ShapeRenderer(gl);

   const gems: any[] = [];

   for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
         gems.push({
            x: x * 52,
            y: y * 52,
            type: Math.floor(Math.random() * 4),
         });
      }
   }

   let transitioning = false;
   inputHandler.addEventListener(InputEvent.TouchStart, async (x, y) => {
      const coord = inputHandler.getTouchedWorldCoord(camera);
      gems.push({
         x: coord.x - 25,
         y: coord.y - 25,
         type: Math.floor(Math.random() * 4),
      });

      if (gems.length > 30 && !transitioning) {
         transitioning = true;
         Game.shared.setScreen(await createTestScreen(viewport));
      }
   });

   let stateTime = 0;
   return {
      update(delta, game) {
         stateTime += delta;

         shapeRenderer.setProjection(camera.projectionView.values);
         shapeRenderer.begin();
         shapeRenderer.rect(true, 0, 0, 500, 1000, Color.BLUE);
         shapeRenderer.rect(true, 300, 100, 75, 100, Color.RED);
         shapeRenderer.rect(true, 400, 100, 75, 100, Color.RED);
         shapeRenderer.end();

         batch.setProjection(camera.projectionView.values);
         batch.begin();
         for (let gem of gems) {
            atlas.findRegion(`gem_0${gem.type + 1}`, 1).draw(batch, gem.x, gem.y, 50, 50);
         }
         kitFullRun.getKeyFrame(stateTime, PlayMode.LOOP).draw(batch, 300, 100, 75, 100);

         kitFullHalf.getKeyFrame(stateTime, PlayMode.LOOP).draw(batch, 400, 100, 75, 100);
         batch.end();
      },
      dispose() {
         console.log("main screen disposed");
         batch.dispose();
         shapeRenderer.dispose();
         atlas.dispose();
         kitGardenAtlas.dispose();
      },
   };
};

const createTestScreen = async (viewport: Viewport): Promise<Screen> => {
   const gl = viewport.getContext();
   const camera = viewport.getCamera();

   const batch = new PolygonBatch(gl);
   batch.setYDown(YDOWN);

   const texture = await Texture.load(gl, "test.jpg");
   let accumulate = 0;
   let transitioning = false;

   return {
      update(delta: number, game: Game) {
         accumulate += delta;
         if (accumulate >= 2 && !transitioning) {
            transitioning = true;
            createMainScreen(viewport).then((screen) => game.setScreen(screen));
         }
         batch.setProjection(camera.projectionView.values);
         batch.begin();
         batch.draw(texture, 0, 0, 500, 1000);
         batch.end();
      },
      dispose() {
         console.log("test screen disposed");
         batch.dispose();
         texture.dispose();
      },
   };
};

const createTestBitmapFontScreen = async (viewport: Viewport): Promise<Screen> => {
   const gl = viewport.getContext();
   const camera = viewport.getCamera();

   const batch = new PolygonBatch(gl);
   batch.setYDown(YDOWN);

   const shapeRenderer = new ShapeRenderer(gl);

   const fontData = await BitmapFontData.load("./number.fnt", gl, false);
   const font = new BitmapFont(fontData, fontData.regions, false);

   const strs = [
      "Strings are useful for holding data that can be represented in text form. Some of the most-used operations on strings are to check their",
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever",
      "Strings are useful for holding data",
   ];

   const color = new Color(1, 1, 0, 0.6);

   return {
      update(delta: number, game: Game) {
         shapeRenderer.setProjection(camera.projectionView.values);
         shapeRenderer.begin();
         shapeRenderer.rect(true, 0, 0, 500, 1000, Color.RED);
         shapeRenderer.end();

         batch.setProjection(camera.projectionView.values);
         batch.begin();
         batch.setColor(color);
         strs.map((str, i) =>
            font.draw(
               batch,
               str,
               0,
               (i + 1) * 300,
               0,
               str.length,
               500,
               [Align.left, Align.center, Align.right][i],
               true
            )
         );
         batch.end();
      },
      dispose() {
         batch.dispose();
      },
   };
};

const init = async () => {
   const stage = createStage();
   const canvas = stage.getCanvas();

   const viewport = createViewport(canvas, 500, 1000, {
      crop: false,
   });
   const gl = viewport.getContext();

   Game.shared.setScreen(await createTestBitmapFontScreen(viewport));

   gl.clearColor(0, 0, 0, 1);
   createGameLoop((delta: number) => {
      gl.clear(gl.COLOR_BUFFER_BIT);
      Game.shared.update(delta);
   });
};

init();

export {};
