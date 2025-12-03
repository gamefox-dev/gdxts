# ViewportInputHandler

[← Back to Index](./README.md)

`ViewportInputHandler` extends [InputHandler](./input-handler.md) with viewport-aware coordinate handling.

## Constructor

```typescript
import { ViewportInputHandler } from 'gdxts';

const input = new ViewportInputHandler(viewport);
```

## Why Use ViewportInputHandler?

When using a [Viewport](./viewport.md) with letterboxing/pillarboxing, raw input coordinates don't match world coordinates. `ViewportInputHandler` automatically accounts for:

- Viewport offset (letterbox/pillarbox margins)
- Pixel ratio scaling
- Camera projection

## Methods

### State Queries

```typescript
input.isTouched(): boolean
input.getX(index?: number): number   // Viewport-adjusted X
input.getY(index?: number): number   // Viewport-adjusted Y
```

### World Coordinates

```typescript
input.getTouchedWorldCoord(camera?: OrthoCamera): Vector2
```

If no camera is provided, uses the viewport's default camera.

### Event Listeners

```typescript
input.addEventListener(event: InputEvent, listener: (x: number, y: number) => void): void
```

Listener receives viewport-adjusted coordinates.

### Multi-touch

```typescript
input.getTotalTouched(): TouchData[]
```

### Cleanup

```typescript
input.cleanup(): void
```

## Example

```typescript
const viewport = createViewport(canvas, 800, 600);
const input = new ViewportInputHandler(viewport);

createGameLoop(delta => {
  if (input.isTouched()) {
    // Get world coordinates directly
    const worldPos = input.getTouchedWorldCoord();

    // Move player to touch position
    player.x = worldPos.x;
    player.y = worldPos.y;
  }
});

// Event-based (coordinates are viewport-adjusted)
input.addEventListener(InputEvent.TouchStart, (x, y) => {
  // x, y are in viewport space
  // Convert to world if needed
  const worldPos = input.getTouchedWorldCoord();
});
```

## Comparison with InputHandler

```typescript
// Without ViewportInputHandler (manual adjustment)
const rawInput = new InputHandler(canvas);
const { x: vX, y: vY, pixelRatio } = viewport.getViewportInfo();
const adjustedX = rawInput.getX() * pixelRatio - vX;
const adjustedY = rawInput.getY() * pixelRatio - vY;

// With ViewportInputHandler (automatic)
const input = new ViewportInputHandler(viewport);
const adjustedX = input.getX(); // Already adjusted
const adjustedY = input.getY();
```

## Properties

| Property      | Type                | Description                |
| ------------- | ------------------- | -------------------------- |
| `viewport`    | `Viewport`          | Associated viewport        |
| `canvas`      | `HTMLCanvasElement` | Canvas element             |
| `screenCoord` | `Vector2`           | Reusable screen coordinate |
| `worldCoord`  | `Vector2`           | Reusable world coordinate  |

## Related

- [InputHandler](./input-handler.md) - Base input handling
- [Viewport](./viewport.md) - Screen management
- [Camera](./camera.md) - Coordinate conversion
