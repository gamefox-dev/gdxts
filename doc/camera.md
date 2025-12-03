# Camera

[← Back to Index](./README.md)

The `OrthoCamera` provides orthographic projection for 2D rendering.

## OrthoCamera

```typescript
import { OrthoCamera } from 'gdxts';

const camera = new OrthoCamera(
  viewportWidth, // Virtual width
  viewportHeight, // Virtual height
  screenWidth, // Actual screen width
  screenHeight // Actual screen height
);
```

## Properties

| Property         | Type           | Description                     |
| ---------------- | -------------- | ------------------------------- |
| `position`       | `Vector3`      | Camera position (x, y, z)       |
| `zoom`           | `number`       | Zoom level (1 = normal)         |
| `combined`       | `Float32Array` | Combined projection-view matrix |
| `viewportWidth`  | `number`       | Virtual viewport width          |
| `viewportHeight` | `number`       | Virtual viewport height         |

## Methods

### setPosition

```typescript
camera.setPosition(x: number, y: number): void
```

### resize

```typescript
camera.resize(
  viewportWidth: number,
  viewportHeight: number,
  screenWidth: number,
  screenHeight: number
): void
```

### update

```typescript
camera.update(): void  // Recalculate matrices after changes
```

### screenToWorld

Convert screen coordinates to world coordinates:

```typescript
const worldPos = camera.screenToWorld(screenCoords: Vector3): Vector3
```

### worldToScreen

Convert world coordinates to screen coordinates:

```typescript
const screenPos = camera.worldToScreen(worldCoords: Vector3): Vector3
```

### unprojectVector2

Convenience method for 2D unprojection:

```typescript
camera.unprojectVector2(worldCoord: Vector2, screenCoord: Vector2): void
```

## Y-Down Mode

By default, Y increases upward. For Y-down coordinate system:

```typescript
camera.setYDown(true);
```

## Example

```typescript
const camera = viewport.getCamera();

// Move camera
camera.setPosition(player.x, player.y);

// Zoom in
camera.zoom = 0.5;
camera.update();

// Use for rendering
batch.setProjection(camera.combined);

// Convert mouse to world position
const worldPos = new Vector3(mouseX, mouseY, 0);
camera.screenToWorld(worldPos);
```

## Related

- [Viewport](./viewport.md) - Screen management
- [Vector2](./vector2.md) - 2D vectors
- [PolygonBatch](./polygon-batch.md) - Uses camera projection
