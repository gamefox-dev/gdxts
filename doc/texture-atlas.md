# TextureAtlas

[← Back to Index](./README.md)

A `TextureAtlas` loads packed sprite sheets created by tools like [libGDX TexturePacker](https://libgdx.com/wiki/tools/texture-packer).

## Loading

```typescript
import { TextureAtlas } from 'gdxts';

const atlas = await TextureAtlas.load(gl, 'pack.atlas');

// With mipmaps
const atlas = await TextureAtlas.load(gl, 'pack.atlas', true);

// With options
const atlas = await TextureAtlas.load(gl, 'pack.atlas', {
  minFilter: TextureFilter.Linear,
  magFilter: TextureFilter.Linear
});
```

## Methods

### findRegion

Find a single region by name:

```typescript
const region = atlas.findRegion('player');

// With index (for animations)
const frame = atlas.findRegion('walk', 0);
```

### findRegions

Find all regions with a name (sorted by index):

```typescript
const walkFrames = atlas.findRegions('walk');
// Returns: [walk_0, walk_1, walk_2, ...]
```

### getRegions

Get all regions:

```typescript
const allRegions = atlas.getRegions();
```

### getPages

Get all texture pages:

```typescript
const textures = atlas.getPages();
```

### dispose

Free all textures:

```typescript
atlas.dispose();
```

## Atlas File Format

The `.atlas` file format (libGDX compatible):

```
sprites.png
size: 512,512
format: RGBA8888
filter: Nearest,Nearest
repeat: none
player
  rotate: false
  xy: 0, 0
  size: 64, 64
  orig: 64, 64
  offset: 0, 0
  index: -1
walk
  rotate: false
  xy: 64, 0
  size: 64, 64
  orig: 64, 64
  offset: 0, 0
  index: 0
walk
  rotate: false
  xy: 128, 0
  size: 64, 64
  orig: 64, 64
  offset: 0, 0
  index: 1
```

## Example

```typescript
const atlas = await TextureAtlas.load(gl, 'game.atlas');

// Get single sprite
const playerRegion = atlas.findRegion('player');

// Get animation frames
const walkFrames = atlas.findRegions('walk');
const walkAnimation = new Animation(walkFrames, 0.1);

// Render
batch.begin();
playerRegion.draw(batch, x, y, 64, 64);
batch.end();

// Cleanup
atlas.dispose();
```

## Related

- [TextureRegion](./texture-region.md) - Individual regions
- [Texture](./texture.md) - Texture loading
- [Animation](./animation.md) - Animating atlas regions
