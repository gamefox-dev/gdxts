# Animation

[← Back to Index](./README.md)

The `Animation` class handles frame-based sprite animation using [TextureRegions](./texture-region.md).

## Constructor

```typescript
import { Animation, PlayMode } from 'gdxts';

const animation = new Animation(
  keyFrames, // TextureRegion[]
  frameDurations // number | number[] (seconds per frame)
);
```

## PlayMode

```typescript
enum PlayMode {
  NORMAL = 0, // Play once, stop at last frame
  LOOP = 1, // Loop continuously
  LOOP_PINGPONG = 2, // Loop forward then backward
  REVERSED = 3, // Play once in reverse
  LOOP_REVERSED = 4 // Loop in reverse
}
```

## Methods

### getKeyFrame

Get the current frame for a given state time:

```typescript
const frame = animation.getKeyFrame(stateTime, playMode);
```

## Helper Function

```typescript
import { createAnimation } from 'gdxts';

// All frames have same duration
const animation = createAnimation(0.1, frames);
```

## Example

```typescript
// Load frames from atlas
const atlas = await TextureAtlas.load(gl, 'sprites.atlas');
const walkFrames = atlas.findRegions('walk');

// Create animation (0.1 seconds per frame)
const walkAnimation = new Animation(walkFrames, 0.1);

// Track animation time
let stateTime = 0;

createGameLoop(delta => {
  stateTime += delta;

  // Get current frame
  const frame = walkAnimation.getKeyFrame(stateTime, PlayMode.LOOP);

  // Draw
  batch.begin();
  frame.draw(batch, x, y, 64, 64);
  batch.end();
});
```

## Variable Frame Durations

```typescript
// Different duration per frame
const animation = new Animation(frames, [0.1, 0.2, 0.1, 0.3]);
```

## Using with Sprite

```typescript
const sprite = new Sprite(walkFrames[0]);
let stateTime = 0;

createGameLoop(delta => {
  stateTime += delta;

  // Update sprite's region
  sprite.region = walkAnimation.getKeyFrame(stateTime, PlayMode.LOOP);

  batch.begin();
  sprite.draw(batch);
  batch.end();
});
```

## Related

- [TextureRegion](./texture-region.md) - Animation frames
- [TextureAtlas](./texture-atlas.md) - Loading frame sequences
- [Sprite](./sprite.md) - Animated sprites
