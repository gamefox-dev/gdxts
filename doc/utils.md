# Utils

[← Back to Index](./README.md)

General utility classes and functions.

## Stage

Create a fullscreen canvas with optional info overlay:

```typescript
import { createStage, Stage } from 'gdxts';

const stage = createStage({
  hidden: false, // Start visible
  info: true, // Show info div
  wrapperClassName: 'game' // CSS class for wrapper
});

const canvas = stage.getCanvas();
const info = stage.getInfo();

// Control visibility
stage.show();
stage.hide();

// Cleanup
stage.cleanup();
```

## Rectangle

```typescript
interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

## Point in Rectangle

```typescript
import { pointInRect } from 'gdxts';

if (pointInRect(mouseX, mouseY, rect.x, rect.y, rect.width, rect.height)) {
  // Point is inside rectangle
}
```

## Disposable Interface

```typescript
interface Disposable {
  dispose(): void;
}
```

## Restorable Interface

```typescript
interface Restorable {
  restore(): void;
}
```

## Pool

Object pooling to reduce garbage collection:

```typescript
import { Pool } from 'gdxts';

const bulletPool = new Pool<Bullet>(() => new Bullet());

// Get from pool
const bullet = bulletPool.obtain();

// Return to pool
bulletPool.free(bullet);

// Free multiple
bulletPool.freeAll(bullets);

// Clear pool
bulletPool.clear();
```

### FlushablePool

Pool that tracks obtained objects:

```typescript
import { FlushablePool } from 'gdxts';

const pool = new FlushablePool<Particle>(() => new Particle());

// Obtain particles
const p1 = pool.obtain();
const p2 = pool.obtain();

// Return all obtained at once
pool.flush();
```

### Pools (Global Registry)

```typescript
import { Pools } from 'gdxts';

// Register/get pool
const pool = Pools.get('bullets', () => new Bullet());

// Obtain
const bullet = Pools.obtain('bullets');

// Free
Pools.free('bullets', bullet);
Pools.freeAll('bullets', bullets);
```

## Poolable Interface

```typescript
interface Poolable {
  reset(): void; // Called when returned to pool
}
```

## ArrayMap

Map using arrays (preserves insertion order):

```typescript
import { ArrayMap } from 'gdxts';

const map = new ArrayMap<string, number>();
map.set('a', 1);
map.set('b', 2);

map.get('a'); // 1
map.get('c', 0); // 0 (default)
map.indexOfKey('b'); // 1
map.removeKey('a');
map.clear();
```

## Sets

### IntSet

```typescript
import { IntSet } from 'gdxts';

const set = new IntSet();
set.add(5);
set.contains(5); // true
set.remove(5);
set.clear();
```

### StringSet

```typescript
import { StringSet } from 'gdxts';

const set = new StringSet();
set.add('hello');
set.addAll(['a', 'b', 'c']);
set.contains('hello'); // true
set.size; // 4
set.clear();
```

## Array Utilities

```typescript
import { Utils } from 'gdxts';

// Copy array elements
Utils.arrayCopy(source, srcStart, dest, destStart, count);

// Fill array range
Utils.arrayFill(array, fromIndex, toIndex, value);

// Resize array
Utils.setArraySize(array, size, defaultValue);

// Ensure capacity
Utils.ensureArrayCapacity(array, size, defaultValue);

// Create filled array
Utils.newArray(size, defaultValue);

// Typed arrays
Utils.newFloatArray(size);
Utils.newShortArray(size);
Utils.toFloatArray(array);
```

## WindowedMean

Calculate rolling average:

```typescript
import { WindowedMean } from 'gdxts';

const mean = new WindowedMean(60); // 60 samples

createGameLoop(delta => {
  mean.addValue(delta);

  if (mean.hasEnoughData()) {
    console.log(`Average delta: ${mean.getMean()}`);
  }
});
```

## Align

Text/element alignment flags:

```typescript
import { Align } from 'gdxts';

Align.center;
Align.top;
Align.bottom;
Align.left;
Align.right;
Align.topLeft;
Align.topRight;
Align.bottomLeft;
Align.bottomRight;

// Check alignment
Align.isLeft(align);
Align.isRight(align);
Align.isTop(align);
Align.isBottom(align);
Align.isCenterVertical(align);
Align.isCenterHorizontal(align);
```

## URL Utilities

```typescript
import { concatAndResolveUrl } from 'gdxts';

const url = concatAndResolveUrl('/assets/sprites/', '../images/player.png');
// Result: '/assets/images/player.png'
```

## File Utilities

```typescript
import { getFilenameAndExtension } from 'gdxts';

const [name, ext] = getFilenameAndExtension('/path/to/file.png');
// name: 'file', ext: 'png'
```

## Related

- [Game Loop](./game-loop.md) - createGameLoop
- [Color](./color.md) - Color class
- [MathUtils](./math-utils.md) - Math utilities
