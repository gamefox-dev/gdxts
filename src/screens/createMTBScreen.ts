import { YDOWN } from '..';
import { Align, Animation, BitmapFont, Game, PlayMode, Screen, TextureAtlas, Viewport } from '../lib';
import { MultiTextureBatch } from '../lib/MultiTextureBatch';

export const createTestMTBScreen = async (viewport: Viewport): Promise<Screen> => {
  const gl = viewport.getContext();
  const camera = viewport.getCamera();
  camera.setYDown(YDOWN);

  const batch = new MultiTextureBatch(gl);
  batch.setYDown(YDOWN);

  const font = await BitmapFont.load(gl, './number.fnt', YDOWN);
  font.data.setXYScale(0.7);

  const atlas = await TextureAtlas.load(gl, './test-mtb/effects.atlas', true);

  let accumulate = 0;

  const names = new Set<string>();
  for (let region of atlas.regions) {
    names.add(region.name);
  }

  const anims: Animation[] = [];
  names.forEach(name => anims.push(new Animation(atlas.findRegions(name), 1 / 16)));

  let time = 0;
  let offset = 0;

  let drawCalls = 0;

  return {
    update(delta: number, game: Game) {
      accumulate += delta;
      if (accumulate > 0.1) {
        accumulate = 0;
        offset++;
      }
      time += delta;
      batch.setProjection(camera.combined);
      batch.begin();
      let i = 0;
      for (let anim of anims) {
        i++;
        const pos = i % anims.length;
        const x = pos % 10;
        const y = Math.floor(pos / 10);
        anim.getKeyFrame(time, PlayMode.LOOP).draw(batch, x * 50, 700 + y * 50, 50, 50);
      }
      for (let region of atlas.regions) {
        i++;
        const pos = (i + offset) % atlas.regions.length;
        const x = pos % 25;
        const y = Math.floor(pos / 25);
        region.draw(batch, x * 20, 150 + y * 20, 20, 20);
      }
      font.draw(batch, `why? Drawing`, 0, 200, 500, Align.center);
      font.draw(
        batch,
        'Draw calls: ' + drawCalls + `\n${i} sprites\n${atlas.pages.length} textures`,
        20,
        20,
        460,
        Align.left
      );
      batch.end();
      drawCalls = batch.getDrawCalls();
    },
    dispose() {
      console.log('test screen disposed');
      batch.dispose();
      atlas.dispose();
    }
  };
};
