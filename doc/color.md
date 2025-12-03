# Color

[← Back to Index](./README.md)

`Color` represents an RGBA color with components in the range [0, 1].

## Constructor

```typescript
import { Color } from 'gdxts';

const color = new Color(r, g, b, a); // Default: (0, 0, 0, 0)
```

## Static Colors

```typescript
Color.WHITE; // (1, 1, 1, 1)
Color.RED; // (1, 0, 0, 1)
Color.GREEN; // (0, 1, 0, 1)
Color.BLUE; // (0, 0, 1, 1)
Color.MAGENTA; // (1, 0, 1, 1)
```

## Properties

| Property | Type     | Description |
| -------- | -------- | ----------- |
| `r`      | `number` | Red (0-1)   |
| `g`      | `number` | Green (0-1) |
| `b`      | `number` | Blue (0-1)  |
| `a`      | `number` | Alpha (0-1) |

## Methods

### Setters

```typescript
color.set(r: number, g: number, b: number, a: number): Color  // Clamped
color.unsafeSet(r: number, g: number, b: number, a: number): void  // No clamp
color.setFromColor(other: Color): Color
color.setFromString(hex: string): Color  // "#RRGGBB" or "#RRGGBBAA"
```

### Arithmetic

```typescript
color.add(r: number, g: number, b: number, a: number): Color
color.mul(r: number, g: number, b: number, a: number): Color
color.clamp(): Color  // Clamp all components to [0, 1]
```

### Interpolation

```typescript
color.lerp(target: Color, t: number): Color
```

### Conversion

```typescript
color.toIntBits(): number  // Pack to 32-bit integer (ABGR)
color.equals(other: Color): boolean
```

### Static Methods

```typescript
Color.fromString(hex: string): Color
Color.rgba8888ToColor(color: Color, value: number): void
Color.rgb888ToColor(color: Color, value: number): void
```

## Example

```typescript
// Create colors
const red = new Color(1, 0, 0, 1);
const blue = Color.fromString('#0000FF');
const semiTransparent = new Color(1, 1, 1, 0.5);

// Modify
const purple = new Color();
purple.setFromColor(red);
purple.add(0, 0, 1, 0); // Add blue

// Interpolate
const transition = new Color();
transition.setFromColor(red);
transition.lerp(blue, 0.5); // 50% between red and blue

// Use with batch
batch.setColor(red);
batch.draw(texture, x, y, w, h);

// Reset to white
batch.setColor(1, 1, 1, 1);
```

## Hex String Format

```typescript
Color.fromString('#FF0000'); // Red, full alpha
Color.fromString('#FF000080'); // Red, 50% alpha
Color.fromString('00FF00'); // Green (# optional)
```

## Common Patterns

### Fade Effect

```typescript
const fadeColor = new Color(1, 1, 1, 1);
let fadeAlpha = 1;

function update(delta) {
  fadeAlpha -= delta * 0.5; // Fade out over 2 seconds
  fadeColor.a = Math.max(0, fadeAlpha);

  batch.setColor(fadeColor);
  batch.draw(texture, x, y, w, h);
}
```

### Flash Effect

```typescript
const normalColor = Color.WHITE;
const flashColor = Color.RED;
const currentColor = new Color();
let flashTime = 0;

function flash() {
  flashTime = 0.2; // Flash for 0.2 seconds
}

function update(delta) {
  if (flashTime > 0) {
    flashTime -= delta;
    currentColor.setFromColor(flashColor);
  } else {
    currentColor.setFromColor(normalColor);
  }

  batch.setColor(currentColor);
}
```

## Related

- [PolygonBatch](./polygon-batch.md) - Color tinting
- [ShapeRenderer](./shape-renderer.md) - Shape colors
- [Sprite](./sprite.md) - Sprite color
