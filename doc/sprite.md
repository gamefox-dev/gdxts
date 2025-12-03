# Sprite

[← Back to Index](./README.md)

A `Sprite` wraps a [TextureRegion](./texture-region.md) with position, size, rotation, scale, and color.

## Constructor

```typescript
import { Sprite } from 'gdxts';

const sprite = new Sprite(
  region, // TextureRegion
  useMultiBatch, // Use MultiTextureBatch (default: true)
  twoColorTint // Enable two-color tinting (default: false)
);
```

## Properties

| Property   | Type            | Description          |
| ---------- | --------------- | -------------------- |
| `position` | `Vector2`       | Position (x, y)      |
| `size`     | `Vector2`       | Size (width, height) |
| `origin`   | `Vector2`       | Transform origin     |
| `scale`    | `Vector2`       | Scale (x, y)         |
| `rotation` | `number`        | Rotation in radians  |
| `color`    | `Color`         | Tint color           |
| `region`   | `TextureRegion` | Source region        |

## Methods

### Position

```typescript
sprite.setPosition(x: number, y: number): void
sprite.setX(x: number): void
sprite.setY(y: number): void
sprite.setCenter(x: number, y: number): void
sprite.setCenterX(x: number): void
sprite.setCenterY(y: number): void
sprite.setOriginBasedPosition(x: number, y: number): void
sprite.translate(x: number, y: number): void
sprite.translateX(x: number): void
sprite.translateY(y: number): void
```

### Size

```typescript
sprite.setSize(width: number, height: number): void
sprite.setBounds(x: number, y: number, width: number, height: number): void
```

### Origin

```typescript
sprite.setOrigin(x: number, y: number): void
sprite.setOriginCenter(): void
```

### Transform

```typescript
sprite.setRotation(radians: number): void
sprite.rotate(radians: number): void
sprite.setScale(x: number, y?: number): void
sprite.scale(amount: number): void
```

### Color

```typescript
sprite.setColor(r: number, g: number, b: number, a: number): void
sprite.setAlpha(a: number): void
```

### Drawing

```typescript
sprite.draw(batch: PolygonBatch | MultiTextureBatch): void
```

### Copying

```typescript
sprite.set(other: Sprite): void  // Copy all properties from another sprite
```

## Example

```typescript
const region = atlas.findRegion('player');
const sprite = new Sprite(region);

// Setup
sprite.setSize(64, 64);
sprite.setOriginCenter();
sprite.setPosition(100, 100);

// Update
sprite.rotate(delta * Math.PI);
sprite.setColor(1, 1, 1, 0.8);

// Draw
batch.begin();
sprite.draw(batch);
batch.end();
```

## Batch Compatibility

By default, sprites use `MultiTextureBatch` format. For `PolygonBatch`:

```typescript
const sprite = new Sprite(region, false); // useMultiBatch = false
```

## Related

- [TextureRegion](./texture-region.md) - Source regions
- [PolygonBatch](./polygon-batch.md) - Rendering
- [MultiTextureBatch](./multi-texture-batch.md) - Multi-texture rendering
- [Animation](./animation.md) - Animated sprites
