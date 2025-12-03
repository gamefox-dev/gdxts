# MathUtils

[← Back to Index](./README.md)

`MathUtils` provides common math constants and utility functions.

## Constants

```typescript
import { MathUtils } from 'gdxts';

MathUtils.PI; // 3.1415927
MathUtils.PI2; // PI * 2
MathUtils.degreesToRadians; // PI / 180
MathUtils.degRad; // Alias for degreesToRadians
MathUtils.radiansToDegrees; // 180 / PI
MathUtils.radDeg; // Alias for radiansToDegrees
MathUtils.FLOAT_ROUNDING_ERROR; // 0.000001
```

## Methods

### Clamping

```typescript
MathUtils.clamp(value: number, min: number, max: number): number
```

### Trigonometry (Degrees)

```typescript
MathUtils.cosDeg(degrees: number): number
MathUtils.sinDeg(degrees: number): number
```

### Sign & Rounding

```typescript
MathUtils.signum(value: number): number  // Returns -1, 0, or 1
MathUtils.toInt(x: number): number       // Truncate toward zero
```

### Roots

```typescript
MathUtils.cbrt(x: number): number  // Cube root
```

### Random

```typescript
// Triangular distribution (mode at center)
MathUtils.randomTriangular(min: number, max: number): number

// Triangular distribution with custom mode
MathUtils.randomTriangularWith(min: number, max: number, mode: number): number
```

### Comparison

```typescript
MathUtils.isEqual(a: number, b: number): boolean  // Within FLOAT_ROUNDING_ERROR
MathUtils.isZero(value: number): boolean          // Within FLOAT_ROUNDING_ERROR
MathUtils.isPowerOfTwo(value: number): boolean
```

## Example

```typescript
// Angle conversion
const radians = degrees * MathUtils.degRad;
const degrees = radians * MathUtils.radDeg;

// Clamp health
health = MathUtils.clamp(health, 0, maxHealth);

// Direction from angle
const dx = MathUtils.cosDeg(angle);
const dy = MathUtils.sinDeg(angle);

// Random with bias toward center
const damage = MathUtils.randomTriangular(10, 20);

// Float comparison
if (MathUtils.isEqual(a, b)) {
  // Approximately equal
}
```

## Interpolation Classes

### Interpolation (Base)

```typescript
abstract class Interpolation {
  apply(start: number, end: number, a: number): number;
}
```

### Pow

```typescript
import { Pow } from 'gdxts';

const ease = new Pow(2); // Quadratic
const value = ease.apply(0, 100, 0.5); // Ease in-out
```

### PowOut

```typescript
import { PowOut } from 'gdxts';

const easeOut = new PowOut(2); // Quadratic ease-out
const value = easeOut.apply(0, 100, 0.5);
```

## Related

- [Vector2](./vector2.md) - Vector math
- [Affine2](./affine2.md) - Transform math
- [Color](./color.md) - Color interpolation
