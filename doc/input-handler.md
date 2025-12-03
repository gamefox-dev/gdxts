# InputHandler

[← Back to Index](./README.md)

`InputHandler` provides unified mouse and touch input handling.

## Constructor

```typescript
import { InputHandler, InputEvent } from 'gdxts';

const input = new InputHandler(canvas);
```

## InputEvent

```typescript
enum InputEvent {
  TouchStart = 'touchStart',
  TouchEnd = 'touchEnd',
  TouchMove = 'touchMove'
}
```

## Methods

### State Queries

```typescript
input.isTouched(): boolean           // Is any touch/mouse active
input.getX(index?: number): number   // X position (default index 0)
input.getY(index?: number): number   // Y position (default index 0)
```

### World Coordinates

```typescript
input.getTouchedWorldCoord(camera: OrthoCamera): Vector2
```

### Event Listeners

```typescript
input.addEventListener(event: InputEvent, listener: (x: number, y: number) => void): void
```

### Cleanup

```typescript
input.cleanup(): void  // Remove all event listeners
```

## Properties

| Property  | Type          | Description         |
| --------- | ------------- | ------------------- |
| `touches` | `TouchData[]` | Active touch points |

### TouchData

```typescript
interface TouchData {
  x: number;
  y: number;
  id: number;
}
```

## Example

```typescript
const input = new InputHandler(canvas);

// Event-based
input.addEventListener(InputEvent.TouchStart, (x, y) => {
  console.log(`Touch started at ${x}, ${y}`);
});

input.addEventListener(InputEvent.TouchMove, (x, y) => {
  console.log(`Touch moved to ${x}, ${y}`);
});

input.addEventListener(InputEvent.TouchEnd, (x, y) => {
  console.log(`Touch ended at ${x}, ${y}`);
});

// Polling-based
createGameLoop(delta => {
  if (input.isTouched()) {
    const worldPos = input.getTouchedWorldCoord(camera);
    player.moveTo(worldPos.x, worldPos.y);
  }
});

// Cleanup when done
input.cleanup();
```

## Multi-touch

```typescript
createGameLoop(delta => {
  const touches = input.touches;

  touches.forEach((touch, index) => {
    console.log(`Touch ${touch.id}: (${input.getX(index)}, ${input.getY(index)})`);
  });
});
```

## Notes

- Touch events are normalized to mouse events internally
- Coordinates are relative to the canvas
- For viewport-aware input, use [ViewportInputHandler](./viewport-input-handler.md)

## Related

- [ViewportInputHandler](./viewport-input-handler.md) - Viewport-aware input
- [Camera](./camera.md) - World coordinate conversion
- [Viewport](./viewport.md) - Screen management
