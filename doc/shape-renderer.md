# ShapeRenderer

[← Back to Index](./README.md)

`ShapeRenderer` draws primitive shapes (lines, rectangles, circles, etc.) without textures.

## Constructor

```typescript
import { ShapeRenderer, ShapeType } from 'gdxts';

const shapes = new ShapeRenderer(
  gl, // WebGLRenderingContext
  maxVertices // Max vertices (default: 10920)
);
```

## ShapeType

```typescript
enum ShapeType {
  Point = 0x0000,
  Line = 0x0001,
  Filled = 0x0004
}
```

## Basic Usage

```typescript
shapes.setProjection(camera.combined);
shapes.begin();

// Draw shapes
shapes.setColor(Color.RED);
shapes.rect(true, 100, 100, 50, 50);

shapes.end();
```

## Methods

### Control

```typescript
shapes.begin(): void
shapes.end(): void
shapes.setProjection(matrix: Float32Array): void
shapes.setColor(color: Color): void
shapes.setColorWith(r: number, g: number, b: number, a: number): void
shapes.setBlendMode(srcColor: number, srcAlpha: number, dst: number): void
```

### Primitives

#### Point

```typescript
shapes.point(x: number, y: number, color?: Color): void
```

#### Line

```typescript
shapes.line(x1: number, y1: number, x2: number, y2: number, color?: Color): void
```

#### Rectangle

```typescript
shapes.rect(
  filled: boolean,
  x: number,
  y: number,
  width: number,
  height: number,
  color?: Color
): void
```

#### Rectangle Line (thick line)

```typescript
shapes.rectLine(
  filled: boolean,
  x1: number, y1: number,
  x2: number, y2: number,
  width: number,
  color?: Color
): void
```

#### Triangle

```typescript
shapes.triangle(
  filled: boolean,
  x1: number, y1: number,
  x2: number, y2: number,
  x3: number, y3: number,
  color?: Color,
  color2?: Color,
  color3?: Color
): void
```

#### Quad

```typescript
shapes.quad(
  filled: boolean,
  x1: number, y1: number,
  x2: number, y2: number,
  x3: number, y3: number,
  x4: number, y4: number,
  color?: Color,
  color2?: Color,
  color3?: Color,
  color4?: Color
): void
```

#### Circle

```typescript
shapes.circle(
  filled: boolean,
  x: number,
  y: number,
  radius: number,
  color?: Color,
  segments?: number  // Auto-calculated if 0
): void
```

#### Polygon

```typescript
shapes.polygon(
  vertices: ArrayLike<number>,  // [x1, y1, x2, y2, ...]
  offset: number,
  count: number,  // Number of vertices
  color?: Color
): void
```

#### Bezier Curve

```typescript
shapes.curve(
  x1: number, y1: number,    // Start point
  cx1: number, cy1: number,  // Control point 1
  cx2: number, cy2: number,  // Control point 2
  x2: number, y2: number,    // End point
  segments: number,
  color?: Color
): void
```

#### X Mark

```typescript
shapes.x(x: number, y: number, size: number): void
```

## Example

```typescript
const shapes = new ShapeRenderer(gl);

createGameLoop(delta => {
  gl.clear(gl.COLOR_BUFFER_BIT);

  shapes.setProjection(camera.combined);
  shapes.begin();

  // Filled red rectangle
  shapes.setColorWith(1, 0, 0, 1);
  shapes.rect(true, 50, 50, 100, 100);

  // Blue circle outline
  shapes.setColorWith(0, 0, 1, 1);
  shapes.circle(false, 200, 100, 50);

  // Green line
  shapes.setColorWith(0, 1, 0, 1);
  shapes.line(0, 0, 300, 200);

  // Gradient triangle
  shapes.triangle(true, 400, 50, 350, 150, 450, 150, Color.RED, Color.GREEN, Color.BLUE);

  shapes.end();
});
```

## Debug Drawing

Useful for debugging hitboxes, paths, etc.:

```typescript
function debugDraw(shapes: ShapeRenderer) {
  shapes.begin();

  // Draw hitboxes
  shapes.setColorWith(1, 1, 0, 0.5);
  entities.forEach(e => {
    shapes.rect(false, e.x, e.y, e.width, e.height);
  });

  // Draw path
  shapes.setColorWith(0, 1, 1, 1);
  for (let i = 0; i < path.length - 1; i++) {
    shapes.line(path[i].x, path[i].y, path[i + 1].x, path[i + 1].y);
  }

  shapes.end();
}
```

## Related

- [PolygonBatch](./polygon-batch.md) - Textured rendering
- [Color](./color.md) - Color utilities
- [Camera](./camera.md) - Projection
