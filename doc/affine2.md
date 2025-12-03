# Affine2

[← Back to Index](./README.md)

`Affine2` represents a 2D affine transformation matrix for translation, rotation, scaling, and shearing.

## Constructor

```typescript
import { Affine2 } from 'gdxts';

const transform = new Affine2(); // Identity matrix
```

## Matrix Components

```
| m00  m01  m02 |
| m10  m11  m12 |
| 0    0    1   |
```

- `m00`, `m11`: Scale/rotation
- `m01`, `m10`: Rotation/shear
- `m02`, `m12`: Translation

## Methods

### Identity & Copy

```typescript
transform.idt(): Affine2                    // Reset to identity
transform.set(other: Affine2): Affine2      // Copy from another
transform.setMatrix3(m: Matrix3): Affine2   // Set from Matrix3
transform.setMatrix4(m: Matrix4): Affine2   // Set from Matrix4
```

### Set Transform

```typescript
transform.setToTranslation(x: number, y: number): Affine2
transform.setToScaling(scaleX: number, scaleY: number): Affine2
transform.setToRotation(degrees: number): Affine2
transform.setToRotationRad(radians: number): Affine2
transform.setToShearing(shearX: number, shearY: number): Affine2
```

### Combined Set

```typescript
// Translation + Rotation + Scale
transform.setToTrnRotScl(x, y, degrees, scaleX, scaleY): Affine2
transform.setToTrnRotRadScl(x, y, radians, scaleX, scaleY): Affine2

// Translation + Scale
transform.setToTrnScl(x, y, scaleX, scaleY): Affine2
```

### Apply Transform (Post-multiply)

```typescript
transform.translate(x: number, y: number): Affine2
transform.scale(scaleX: number, scaleY: number): Affine2
transform.rotate(degrees: number): Affine2
transform.rotateRad(radians: number): Affine2
transform.shear(shearX: number, shearY: number): Affine2
```

### Pre-multiply

```typescript
transform.preTranslate(x: number, y: number): Affine2
transform.preScale(scaleX: number, scaleY: number): Affine2
transform.preRotate(degrees: number): Affine2
transform.preRotateRad(radians: number): Affine2
transform.preShear(shearX: number, shearY: number): Affine2
```

### Matrix Operations

```typescript
transform.mul(other: Affine2): Affine2           // Post-multiply
transform.preMul(other: Affine2): Affine2        // Pre-multiply
transform.setToProduct(l: Affine2, r: Affine2): Affine2
transform.inv(): Affine2                          // Invert
transform.det(): number                           // Determinant
```

### Apply to Point

```typescript
transform.applyTo(point: Vector2): void
```

### Query

```typescript
transform.getTranslation(out: Vector2): Vector2
transform.isTranslation(): boolean   // Only translation, no rotation/scale
transform.isIdt(): boolean           // Is identity matrix
```

## Example

```typescript
const transform = new Affine2();

// Build transform: translate, then rotate, then scale
transform.setToTranslation(100, 100);
transform.rotate(45);
transform.scale(2, 2);

// Apply to a point
const point = new Vector2(10, 0);
transform.applyTo(point);
// point is now transformed

// Draw with transform
batch.drawTransformed(texture, width, height, transform);
```

## Transform Order

Transforms are applied right-to-left (post-multiply):

```typescript
transform.setToTranslation(100, 100);
transform.rotate(45);
// Equivalent to: first rotate, then translate
```

For left-to-right order, use pre-multiply:

```typescript
transform.setToTranslation(100, 100);
transform.preRotate(45);
// Equivalent to: first translate, then rotate
```

## Common Patterns

### Sprite Transform

```typescript
const transform = new Affine2();

function updateSprite(x, y, rotation, scaleX, scaleY, originX, originY) {
  transform.setToTranslation(x, y);
  transform.translate(originX, originY);
  transform.rotateRad(rotation);
  transform.scale(scaleX, scaleY);
  transform.translate(-originX, -originY);
}
```

### Hierarchy

```typescript
const parentTransform = new Affine2();
const childTransform = new Affine2();
const worldTransform = new Affine2();

// Child in parent space
worldTransform.set(parentTransform);
worldTransform.mul(childTransform);
```

## Related

- [Vector2](./vector2.md) - 2D vectors
- [PolygonBatch](./polygon-batch.md) - drawTransformed
- [TextureRegion](./texture-region.md) - drawTransformed
