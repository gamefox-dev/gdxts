# PolygonBatch

[← Back to Index](./README.md)

`PolygonBatch` is the primary class for batched 2D rendering. It groups draw calls to minimize GPU state changes.

## Constructor

```typescript
import { PolygonBatch } from 'gdxts';

const batch = new PolygonBatch(
  gl, // WebGLRenderingContext
  twoColorTint, // Enable two-color tinting (default: true)
  maxVertices, // Max vertices per batch (default: 10920)
  pma // Premultiplied alpha (default: true)
);
```

## Basic Usage

```typescript
batch.setProjection(camera.combined);
batch.begin();

// Draw calls here
batch.draw(texture, x, y, width, height);

batch.end();
```

## Methods

### Batch Control

```typescript
batch.begin(): void                              // Start batching
batch.end(): void                                // Flush and end batching
batch.flush(): void                              // Force flush current batch
batch.setProjection(matrix: Float32Array): void  // Set projection matrix
```

### Drawing

```typescript
batch.draw(
  texture: Texture,
  x: number,
  y: number,
  width: number,
  height: number,
  originX?: number,    // Default: 0
  originY?: number,    // Default: 0
  rotation?: number,   // Radians, default: 0
  scaleX?: number,     // Default: 1
  scaleY?: number,     // Default: 1
  u1?: number,         // UV coordinates
  v1?: number,
  u2?: number,
  v2?: number,
  rotate?: boolean     // Rotated region
): void
```

### Raw Vertex Drawing

```typescript
batch.drawVertices(
  texture: Texture,
  vertices: number[] | Float32Array,
  indices?: number[]
): void

batch.drawTransformed(
  texture: Texture,
  width: number,
  height: number,
  transform: Affine2,
  u1?: number, v1?: number,
  u2?: number, v2?: number,
  rotate?: boolean
): void
```

### Color

```typescript
batch.setColor(r: number, g: number, b: number, a: number): void
batch.setColor(color: Color): void
```

### Blend Mode

```typescript
batch.setBlendMode(src: number, dst: number): void
batch.setBlendMode(srcColor: number, dstColor: number, srcAlpha: number, dstAlpha: number): void
```

### Y-Down Mode

```typescript
batch.setYDown(yDown: boolean): void  // Enable Y-down coordinate system
```

## Properties

| Property | Type    | Description        |
| -------- | ------- | ------------------ |
| `color`  | `Color` | Current tint color |

## Static Properties

```typescript
PolygonBatch.totalDrawCalls; // Total draw calls across all batches
PolygonBatch.resetTotalDrawCalls(); // Reset counter
```

## Example

```typescript
const batch = new PolygonBatch(gl);

createGameLoop(delta => {
  gl.clear(gl.COLOR_BUFFER_BIT);

  batch.setProjection(camera.combined);
  batch.begin();

  // Tinted sprite
  batch.setColor(1, 0.5, 0.5, 1);
  batch.draw(texture, 100, 100, 64, 64);

  // Reset color
  batch.setColor(1, 1, 1, 1);

  // Rotated and scaled
  batch.draw(texture, 200, 200, 64, 64, 32, 32, Math.PI / 4, 2, 2);

  batch.end();

  console.log(`Draw calls: ${batch.getDrawCalls()}`);
});
```

## Performance Tips

- Minimize texture switches (group draws by texture)
- Use [TextureAtlas](./texture-atlas.md) to pack sprites
- Consider [MultiTextureBatch](./multi-texture-batch.md) for multiple textures

## Related

- [MultiTextureBatch](./multi-texture-batch.md) - Multi-texture variant
- [Texture](./texture.md) - Textures
- [Camera](./camera.md) - Projection matrix
- [Affine2](./affine2.md) - Transforms
- [Color](./color.md) - Tinting
