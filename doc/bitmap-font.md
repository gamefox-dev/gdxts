# BitmapFont

[← Back to Index](./README.md)

`BitmapFont` renders text using pre-rendered glyph textures (AngelCode BMFont format).

## Loading

```typescript
import { BitmapFont } from 'gdxts';

const font = await BitmapFont.load(
  gl,
  'font.fnt', // Font file path
  flip, // Flip for Y-down (default: false)
  integer // Use integer positions (default: false)
);
```

## Drawing Text

```typescript
font.draw(
  batch, // PolygonBatch
  text, // String to draw
  x,
  y, // Position
  targetWidth, // Wrap width
  halign, // Horizontal alignment (Align.left, center, right)
  wrap, // Enable word wrap (default: true)
  start, // Start index (default: 0)
  end, // End index (default: text.length)
  truncate // Truncation string (e.g., "...")
);
```

## Methods

### Drawing

```typescript
// Basic draw
font.draw(batch, 'Hello World', 100, 100, 200);

// With alignment
font.draw(batch, 'Centered', 100, 100, 200, Align.center);

// With transform
font.drawTransformed(batch, text, transform, targetWidth, halign, wrap);
```

### Properties

```typescript
font.getColor(): Color              // Text color
font.getLineHeight(): number        // Line height
font.getSpaceXadvance(): number     // Space width
font.getXHeight(): number           // x-height
font.getCapHeight(): number         // Capital height
font.getAscent(): number            // Ascent
font.getDescent(): number           // Descent (negative)
font.getScaleX(): number
font.getScaleY(): number
```

### Configuration

```typescript
font.setUseIntegerPositions(integer: boolean): void
font.setFixedWidthGlyphs(glyphs: string): void  // Make specific glyphs fixed-width
```

### Cleanup

```typescript
font.dispose(): void
```

## Alignment

```typescript
import { Align } from 'gdxts';

Align.left;
Align.center;
Align.right;
Align.top;
Align.bottom;
Align.topLeft;
Align.topRight;
Align.bottomLeft;
Align.bottomRight;
```

## Example

```typescript
const font = await BitmapFont.load(gl, 'arial.fnt');

createGameLoop(delta => {
  batch.setProjection(camera.combined);
  batch.begin();

  // Simple text
  font.draw(batch, 'Score: 1000', 10, 10, 200);

  // Centered title
  font.draw(batch, 'GAME OVER', 0, 300, 800, Align.center);

  // Wrapped paragraph
  font.draw(batch, longText, 50, 200, 300, Align.left, true);

  batch.end();
});
```

## Creating Font Files

Use tools like:

- [BMFont](https://www.angelcode.com/products/bmfont/) (Windows)
- [Hiero](https://libgdx.com/wiki/tools/hiero) (Cross-platform, libGDX)
- [Littera](http://kvazars.com/littera/) (Online)

Export in AngelCode BMFont text format (`.fnt`).

## Related

- [PolygonBatch](./polygon-batch.md) - Rendering
- [TextureAtlas](./texture-atlas.md) - Font textures
- [Affine2](./affine2.md) - Text transforms
