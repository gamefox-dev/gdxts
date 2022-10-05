# gdxts

Lightweight 2D game development framework, target WebGL, inspired by libgdx.

## Installation

    $ npm install gdxts

## Feature list

- [x] Texture
- [x] Mesh
- [x] Shader
- [x] SpriteBatch
- [x] PolygonBatch
- [x] OrthoCamera
- [x] Viewport
- [x] InputHandler
- [x] ViewportInputHandler
- [x] TextureRegion
- [x] TextureAtlas
- [x] Vector2
- [x] Vector3
- [x] Animation
- [x] ShapeRenderer
- [x] ScreenManager
- [ ] BitmapFont

The features listed below will go to different packages:

- [x] ECS (https://www.npmjs.com/package/flat-ecs)
- [ ] UI
- [ ] UI React
- [ ] 2D Light
- [ ] TiledMapRenderer
- [ ] Spine Runtime
- [ ] Audio Manager
- [ ] 3D Model Batch
- [ ] Gltf Loader

## Usage

### Game loop

You can create your game loop by calling `createGameLoop` function.

```Javascript
import { createGameLoop } from 'gdxts';
...
const loop = createGameLoop((delta: number) => {
  // your update and rendering logic goes here!
});
loop.stop(); // stop/pause the game loop
loop.start(); // resume the game loop
loop.getFps(); // get the current FPS of the loop
```

### Viewport

You can start using gdxts easily with the help of `Viewport` feature. It will provide responsive feature, keep track and update your orthographic camera and help convert coordinates between world/screen space.

```Javascript
import { createViewport, ViewportInputHandler, InputEvent } from 'gdxts';
...
const viewport = createViewport(canvas, WORLD_WIDTH, WORLD_HEIGHT);

// you can get your default camera by using
const camera = viewport.getCamera();

// and your WebGL context by
const gl = viewport.getContext();

// optionally, you can create a ViewportInputHandler
const inputHandler = new ViewportInputHandler(viewport);
```

### InputHandler

You can use `InputHandler` for handling touch events.

For the event-based approach:

```Javascript
inputHandler.addEventListener(InputEvent.TouchStart, (x, y) => {
  const coord = inputHandler.getTouchedWorldCoord();
});
```

And the pooling approach:

```Javascript
let touched = false;
// somewhere inside the game loop
if (inputHandler.isTouched()) {
  const coord = inputHandler.getTouchedWorldCoord();
  if (touched) {
    // do something with the coord
  }
  touched = true;
}
```

### Clearing the screen

```Javascript
gl.clearColor(0, 0, 0, 1);
createGameLoop((delta: number) => {
  gl.clear(gl.COLOR_BUFFER_BIT);
  // your rendering logic goes here!
});
```

### Rendering a simple texture

** Step 1: ** Create your SpriteBatch

```Javascript
const batch = new PolygonBatch(gl);
```

** Step 2: ** Load your texture

```Javascript
const texture = await Texture.load(gl, '<your texture url>');
```

** Step 3: ** Your typical rendering call

```Javascript
// somewhere inside your game loop
batch.setProjection(camera.combined);
batch.begin();
batch.draw(
  texture,
  x, // the x coord that you want to draw your texture, going from left to right
  y, // the x coord that you want to draw your texture, going from bottom to top
  width,
  height // the size you want to draw your texture, using world space unit
);
// other draws go here!
batch.end();
```

Using a batch can help you reduce your draw calls. Calling `batch.end()` will flush the batch and do the actual draw.
But changing a uniform (change the projection matrix or use another texture) will flush the batch automatically too.
Another case the batch is flushed automatically is when the maximum vertices count is reached.

** Step 4: ** Control your draw (optional)
You can rotate and scale your texture while drawing to the screen.

```Javascript
// somewhere inside your game loop
batch.setProjection(camera.combined);
batch.begin();
batch.draw(
  texture,
  x,
  y,
  width,
  height,
  width / 2,
  height / 2, // using the center of the sprite as the origin
  rotation, // an angle in rad
  scaleX,
  scaleY, // negative scale will flip the texture
  u1,
  v1,
  u2,
  v2 // custom UV, change it when you know what it is
);
batch.end();
```

### Using TextureRegion and TextureAtlas

`TextureRegion` is a logical region of the texture, defined by a rectangle that cover a part of the texture.  
You can split a texture into multiple even TextureRegion by calling

```Javascript
const cols = 4;
const rows = 4;
const regions = TextureRegion.splitTexture(texture, cols, rows);
...
// use your region for drawing
regions[0].draw(batch, x, y, width, height);
```

You can also use `region.draw(batch, x, y, width, height, originX, originY, rotation, scaleX, scaleY);` just like how you do it with Texture.

A `TextureAtlas` is the recommended method to work with regions.

```Javascript
const atlas = await TextureAtlas.load(gl, '<.atlas file url>'); // the load function is promise-based

// get a single region with a given name, packer tool usually use -1 index for this type of region
const region: TextureRegion = atlas.findRegion('start_button', -1);

// get multiple regions with the same name
const regions: TextureRegion[] = atlas.findRegion('character_run');
```

### Animation

You can construct a 2D animation with a set of keyframes (TextureRegion) and a frame duration (time in seconds)

```Javascript
const runAnimation = new Animation(
  atlas.findRegions("char_run_full"),
  1 / 30
);
```

If the duration for each keyframe is different, you can use an array for frame durations.

```Javascript
const runAnimation = new Animation(
  atlas.findRegions("char_run_full"),
  [1 / 10, 1 / 10, 1 / 30] // this array will be filled with the last value
);
```

Drawing the animation: You can get the current keyframe as a `TextureRegion` and draw it using the batch

```Javascript
runAnimation.getKeyFrame(stateTime, PlayMode.LOOP).draw(batch, x, y, width, height);
```

Available `PlayMode`s are LOOP, REVERSED, NORMAL, LOOP_REVERSED, LOOP_PINGPONG

### Bitmap font

You can load a bitmapfont by calling

```Javascript
const font = await BitmapFont.load(gl, "./number.fnt", YDOWN, false);
```

The 3rd argument is `flipped`, useful for the case you want to choose the coordinate system. Usually, you must set `flipped` to `true` if you want to draw with y-down.

To draw some string use the loaded font

```Javascript
font.draw(batch, string, x, y, targetWidth, Align.left);
```

TODO: More documentation on advanced usage of bitmapfont and glyph.
