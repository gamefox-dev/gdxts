# Getting Started

[← Back to Index](./README.md)

## Installation

```bash
npm install gdxts
```

## Basic Setup

```typescript
import { createViewport, createGameLoop, PolygonBatch, Texture } from 'gdxts';

// Create a canvas element
const canvas = document.getElementById('game') as HTMLCanvasElement;

// Create viewport with world dimensions
const viewport = createViewport(canvas, 800, 600);
const gl = viewport.getContext();
const camera = viewport.getCamera();

// Create a batch for rendering
const batch = new PolygonBatch(gl);

// Load a texture
const texture = await Texture.load(gl, 'sprite.png');

// Game loop
createGameLoop(delta => {
  // Clear screen
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Begin batch rendering
  batch.setProjection(camera.combined);
  batch.begin();

  // Draw texture at position (100, 100)
  batch.draw(texture, 100, 100, texture.width, texture.height);

  batch.end();
});
```

## Related

- [Viewport](./viewport.md) - Screen and camera management
- [PolygonBatch](./polygon-batch.md) - Batched rendering
- [Texture](./texture.md) - Loading textures
- [Game Loop](./game-loop.md) - Frame updates
