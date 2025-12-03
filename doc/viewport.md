# Viewport

[← Back to Index](./README.md)

The viewport manages the WebGL context, screen sizing, and camera setup.

## createViewport

```typescript
import { createViewport } from 'gdxts';

const viewport = createViewport(canvas, worldWidth, worldHeight, options);
```

### Parameters

| Parameter     | Type                | Description            |
| ------------- | ------------------- | ---------------------- |
| `canvas`      | `HTMLCanvasElement` | Target canvas element  |
| `worldWidth`  | `number`            | Virtual world width    |
| `worldHeight` | `number`            | Virtual world height   |
| `options`     | `ViewportOptions`   | Optional configuration |

### ViewportOptions

```typescript
interface ViewportOptions {
  autoUpdate?: boolean; // Auto-resize on window resize (default: true)
  pixelRatio?: number; // Device pixel ratio override
  crop?: boolean; // Crop to maintain aspect ratio (default: true)
  disablePremultipliedAlpha?: boolean;
  contextOption?: WebGLContextAttributes;
}
```

## Viewport Interface

```typescript
interface Viewport {
  getViewportInfo(): ViewportInfo;
  getCamera(): OrthoCamera;
  getContext(): WebGLRenderingContext;
  getCanvas(): HTMLCanvasElement;
  update(): void;
  cleanUp(): void;
  addCamera(camera: OrthoCamera): void;
  addUpdateListener(listener: () => void): void;
}
```

## ViewportInfo

```typescript
interface ViewportInfo {
  pixelRatio: number;
  x: number; // Viewport X offset
  y: number; // Viewport Y offset
  width: number; // Viewport width
  height: number; // Viewport height
  worldWidth: number; // Virtual world width
  worldHeight: number; // Virtual world height
  offsetX: number;
  offsetY: number;
}
```

## Example

```typescript
const viewport = createViewport(canvas, 1920, 1080, {
  crop: true,
  pixelRatio: window.devicePixelRatio
});

const gl = viewport.getContext();
const camera = viewport.getCamera();

// Listen for resize
viewport.addUpdateListener(() => {
  console.log('Viewport resized');
});

// Cleanup when done
viewport.cleanUp();
```

## Aspect Ratio Modes

### Crop Mode (`crop: true`)

Maintains aspect ratio by letterboxing/pillarboxing. The world is always fully visible.

### Extend Mode (`crop: false`)

Extends the visible world area to fill the screen. No letterboxing, but more world is visible on wider/taller screens.

## Related

- [Camera](./camera.md) - Orthographic camera
- [ViewportInputHandler](./viewport-input-handler.md) - Input handling
- [Getting Started](./getting-started.md) - Basic setup
