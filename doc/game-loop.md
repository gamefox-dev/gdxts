# Game Loop

[← Back to Index](./README.md)

The game loop handles frame updates using `requestAnimationFrame`.

## createGameLoop

Creates a managed game loop with delta time and FPS tracking.

```typescript
import { createGameLoop } from 'gdxts';

const loop = createGameLoop(delta => {
  // delta is in seconds
  player.x += speed * delta;
});
```

## GameLoop Interface

```typescript
interface GameLoop {
  isRunning(): boolean; // Check if loop is active
  start(): void; // Resume the loop
  stop(): void; // Pause the loop
  getFps(): number; // Get current FPS
}
```

## Example with FPS Display

```typescript
const loop = createGameLoop(delta => {
  update(delta);
  render();
});

// Display FPS
setInterval(() => {
  console.log(`FPS: ${loop.getFps()}`);
}, 1000);

// Pause/resume
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    loop.stop();
  } else {
    loop.start();
  }
});
```

## TimeKeeper

Alternative for manual time management:

```typescript
import { TimeKeeper } from 'gdxts';

const time = new TimeKeeper();
time.maxDelta = 0.064; // Cap delta to prevent spiral of death

function gameLoop() {
  time.update();

  console.log(time.delta); // Delta in seconds
  console.log(time.totalTime); // Total elapsed time
  console.log(time.framesPerSecond); // Current FPS

  requestAnimationFrame(gameLoop);
}
```

## Related

- [Getting Started](./getting-started.md) - Basic setup
- [Viewport](./viewport.md) - Screen management
