# Vector2

[← Back to Index](./README.md)

`Vector2` represents a 2D vector with x and y components.

## Constructor

```typescript
import { Vector2 } from 'gdxts';

const v = new Vector2(x, y); // Default: (0, 0)
```

## Properties

| Property | Type     | Description |
| -------- | -------- | ----------- |
| `x`      | `number` | X component |
| `y`      | `number` | Y component |

## Methods

### Setters

```typescript
v.set(x: number, y: number): Vector2
v.setVector(other: Vector2): Vector2
```

### Arithmetic

```typescript
v.add(x: number, y: number): Vector2
v.addVector(other: Vector2): Vector2
v.sub(x: number, y: number): Vector2
v.subVector(other: Vector2): Vector2
v.scale(scalar: number): Vector2
```

### Vector Operations

```typescript
v.dot(other: Vector2): number           // Dot product
v.len(): number                          // Length (magnitude)
v.len2(): number                         // Squared length
v.nor(): Vector2                         // Normalize (in-place)
v.distance(other: Vector2): number       // Distance to another vector
v.distanceSqr(other: Vector2): number    // Squared distance
v.angle(): number                        // Angle in radians
```

### Rotation

```typescript
v.rotate(degrees: number): Vector2
v.rotateRad(radians: number): Vector2
```

### Interpolation

```typescript
v.lerp(target: Vector2, alpha: number): Vector2
```

### Matrix Transform

```typescript
v.mul(matrix: Matrix3): Vector2
```

### Utility

```typescript
v.cpy(): Vector2           // Create a copy
v.getX(): number
v.getY(): number
```

## Example

```typescript
const position = new Vector2(100, 100);
const velocity = new Vector2(1, 0);

// Normalize and scale
velocity.nor().scale(speed);

// Update position
position.addVector(velocity);

// Distance check
const distance = position.distance(target);

// Angle to target
const direction = target.cpy().subVector(position);
const angle = direction.angle();

// Rotate
velocity.rotateRad(Math.PI / 4);

// Smooth movement
position.lerp(target, 0.1);
```

## Common Patterns

### Direction Vector

```typescript
function getDirection(from: Vector2, to: Vector2): Vector2 {
  return to.cpy().subVector(from).nor();
}
```

### Move Towards

```typescript
function moveTowards(current: Vector2, target: Vector2, maxDelta: number): void {
  const direction = target.cpy().subVector(current);
  const distance = direction.len();

  if (distance <= maxDelta) {
    current.setVector(target);
  } else {
    direction.nor().scale(maxDelta);
    current.addVector(direction);
  }
}
```

## Related

- [Affine2](./affine2.md) - 2D transforms
- [Camera](./camera.md) - Coordinate conversion
- [MathUtils](./math-utils.md) - Math helpers
