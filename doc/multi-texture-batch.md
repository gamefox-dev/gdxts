# MultiTextureBatch

[← Back to Index](./README.md)

`MultiTextureBatch` extends [PolygonBatch](./polygon-batch.md) to support multiple textures per draw call, reducing batch breaks.

## Constructor

```typescript
import { MultiTextureBatch } from 'gdxts';

const batch = new MultiTextureBatch(
  gl, // WebGLRenderingContext
  maxTextures, // Max textures per batch (default: 4)
  maxVertices, // Max vertices (default: 10920)
  pma // Premultiplied alpha (default: true)
);
```

## Usage

Same API as [PolygonBatch](./polygon-batch.md):

```typescript
batch.setProjection(camera.combined);
batch.begin();

// Can draw with different textures without breaking batch
batch.draw(texture1, 0, 0, 64, 64);
batch.draw(texture2, 100, 0, 64, 64);
batch.draw(texture1, 200, 0, 64, 64);
batch.draw(texture3, 300, 0, 64, 64);

batch.end();
```

## How It Works

- Uses array textures in the shader
- Tracks up to `maxTextures` different textures per batch
- Only flushes when texture limit is exceeded
- Automatically manages texture unit binding

## When to Use

Use `MultiTextureBatch` when:

- Drawing sprites from multiple texture atlases
- UI elements with different textures
- Particle systems with varied textures

Use regular [PolygonBatch](./polygon-batch.md) when:

- All sprites use the same atlas
- You need two-color tinting
- Memory is constrained

## Limitations

- Does not support two-color tinting
- Slightly more complex shader
- `maxTextures` limited by GPU texture units

## Example

```typescript
const batch = new MultiTextureBatch(gl, 8);

// Load multiple textures
const player = await Texture.load(gl, 'player.png');
const enemy = await Texture.load(gl, 'enemy.png');
const items = await Texture.load(gl, 'items.png');

createGameLoop(delta => {
  batch.setProjection(camera.combined);
  batch.begin();

  // All these can be in the same batch
  batch.draw(player, playerX, playerY, 64, 64);

  enemies.forEach(e => {
    batch.draw(enemy, e.x, e.y, 64, 64);
  });

  items.forEach(i => {
    batch.draw(items, i.x, i.y, 32, 32);
  });

  batch.end();
});
```

## Related

- [PolygonBatch](./polygon-batch.md) - Single-texture batching
- [Sprite](./sprite.md) - Uses MultiTextureBatch by default
- [Texture](./texture.md) - Texture loading
