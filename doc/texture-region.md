# TextureRegion

[← Back to Index](./README.md)

A `TextureRegion` represents a rectangular sub-area of a [Texture](./texture.md).

## Constructor

```typescript
import { TextureRegion } from 'gdxts';

const region = new TextureRegion(
  texture, // Source texture
  x, // Region X in pixels
  y, // Region Y in pixels
  width, // Region width
  height, // Region height
  extraData, // Additional properties (optional)
  invTexWidth, // 1/texture.width (optional)
  invTexHeight, // 1/texture.height (optional)
  rotate // Is region rotated 90° (optional)
);
```

## Properties

| Property         | Type      | Description                   |
| ---------------- | --------- | ----------------------------- |
| `texture`        | `Texture` | Source texture                |
| `width`          | `number`  | Region width                  |
| `height`         | `number`  | Region height                 |
| `u`, `v`         | `number`  | Top-left UV coordinates       |
| `u2`, `v2`       | `number`  | Bottom-right UV coordinates   |
| `rotated`        | `boolean` | Whether region is rotated 90° |
| `name`           | `string`  | Optional name (from atlas)    |
| `index`          | `number`  | Animation frame index         |
| `originalWidth`  | `number`  | Original size before trimming |
| `originalHeight` | `number`  | Original size before trimming |
| `offsetX`        | `number`  | Trim offset X                 |
| `offsetY`        | `number`  | Trim offset Y                 |

## Static Methods

### splitTexture

Split a texture into a grid of regions:

```typescript
const regions = TextureRegion.splitTexture(
  texture,
  cols, // Number of columns
  rows, // Number of rows
  padding // Optional padding [left, right, top, bottom]
);
```

## Instance Methods

### draw

Draw the region with transforms:

```typescript
region.draw(
  batch, // PolygonBatch
  x,
  y, // Position
  width, // Draw width
  height, // Draw height
  originX, // Origin X (default 0)
  originY, // Origin Y (default 0)
  rotation, // Rotation in radians (default 0)
  scaleX, // X scale (default 1)
  scaleY // Y scale (default 1)
);
```

### drawTransformed

Draw using an affine transform:

```typescript
region.drawTransformed(
  batch,
  width,
  height,
  transform // Affine2
);
```

## Example

```typescript
// Create region from texture
const texture = await Texture.load(gl, 'spritesheet.png');
const region = new TextureRegion(texture, 0, 0, 64, 64, {});

// Split into grid
const frames = TextureRegion.splitTexture(texture, 4, 4);

// Draw
batch.begin();
region.draw(batch, 100, 100, 64, 64);
batch.end();
```

## Related

- [Texture](./texture.md) - Source textures
- [TextureAtlas](./texture-atlas.md) - Packed regions
- [Animation](./animation.md) - Animating regions
- [Sprite](./sprite.md) - Sprite wrapper
