# Texture

[← Back to Index](./README.md)

Textures represent images loaded into GPU memory for rendering.

## Loading Textures

```typescript
import { Texture } from 'gdxts';

// Simple load
const texture = await Texture.load(gl, 'image.png');

// With mipmaps
const texture = await Texture.load(gl, 'image.png', true);

// With options
const texture = await Texture.load(gl, 'image.png', {
  minFilter: TextureFilter.Linear,
  magFilter: TextureFilter.Nearest,
  wrapS: TextureWrap.Repeat,
  wrapT: TextureWrap.ClampToEdge,
  generateMipmaps: false
});
```

## TextureOptions

```typescript
interface TextureOptions {
  minFilter: TextureFilter;
  magFilter: TextureFilter;
  wrapS: TextureWrap;
  wrapT: TextureWrap;
  generateMipmaps: boolean;
  crossOrigin?: boolean;
  customLoader?: (url: string) => Promise<HTMLImageElement | ImageBitmap>;
}
```

## TextureFilter

```typescript
enum TextureFilter {
  Nearest = 9728, // Pixelated look
  Linear = 9729, // Smooth interpolation
  MipMap = 9987, // Trilinear with mipmaps
  MipMapNearestNearest = 9984,
  MipMapLinearNearest = 9985,
  MipMapNearestLinear = 9986,
  MipMapLinearLinear = 9987
}
```

## TextureWrap

```typescript
enum TextureWrap {
  MirroredRepeat = 33648,
  ClampToEdge = 33071,
  Repeat = 10497
}
```

## Properties

| Property | Type     | Description              |
| -------- | -------- | ------------------------ |
| `width`  | `number` | Texture width in pixels  |
| `height` | `number` | Texture height in pixels |

## Methods

### setFilters

```typescript
texture.setFilters(minFilter: TextureFilter, magFilter: TextureFilter): void
```

### setWraps

```typescript
texture.setWraps(uWrap: TextureWrap, vWrap: TextureWrap): void
```

### bind

```typescript
texture.bind(unit?: number): void  // Bind to texture unit (default 0)
```

### dispose

```typescript
texture.dispose(): void  // Free GPU resources
```

## Creating Textures Programmatically

```typescript
// White 1x1 texture
const white = Texture.createWhiteTexture(gl);

// From ImageData
const imageData = new ImageData(new Uint8ClampedArray([255, 0, 0, 255]), 1, 1);
const red = new Texture(gl, imageData);
```

## Example

```typescript
const texture = await Texture.load(gl, 'player.png', {
  minFilter: TextureFilter.Nearest,
  magFilter: TextureFilter.Nearest
});

batch.begin();
batch.draw(texture, x, y, texture.width, texture.height);
batch.end();

// Cleanup
texture.dispose();
```

## Related

- [TextureRegion](./texture-region.md) - Sub-regions of textures
- [TextureAtlas](./texture-atlas.md) - Packed sprite sheets
- [PolygonBatch](./polygon-batch.md) - Rendering textures
- [Sprite](./sprite.md) - Drawable texture wrapper
