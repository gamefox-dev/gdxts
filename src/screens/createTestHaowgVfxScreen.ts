import { YDOWN } from '..';
import {
  Align,
  BitmapFont,
  Color,
  InputEvent,
  Screen,
  ShapeRenderer,
  TextureAtlas,
  Viewport,
  ViewportInputHandler,
  VfxManager,
  installHaowgVfxLibrary
} from '../lib';
import { MultiTextureBatch } from '../lib/MultiTextureBatch';

const BG_COLORS = {
  main: Color.fromString('#101625'),
  lane1: Color.fromString('#16263c'),
  lane2: Color.fromString('#1a2f47'),
  lane3: Color.fromString('#1f3751'),
  lane4: Color.fromString('#193047')
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const createTestHaowgVfxScreen = async (viewport: Viewport): Promise<Screen> => {
  const gl = viewport.getContext();
  const camera = viewport.getCamera();
  camera.setYDown(YDOWN);

  const batch = new MultiTextureBatch(gl, 6, 10920, true);
  batch.setYDown(YDOWN);

  const font = await BitmapFont.load(gl, './number.fnt', YDOWN);
  font.getData().setScale(0.54, 0.54);

  const shapeRenderer = new ShapeRenderer(gl);
  const inputHandler = new ViewportInputHandler(viewport);
  const spriteAtlas = await TextureAtlas.load(gl, './vfx/haowg/haowg.atlas');

  const vfx = new VfxManager();
  let lightningRays = 6;
  let lightningJitter = 0.55;
  let distortionAmount = 0.5;
  let intensity = 1.0;

  const vfxLibrary = await installHaowgVfxLibrary(vfx, {
    gl,
    projection: () => camera.combined,
    spriteAtlas,
    lightningRayCount: () => lightningRays,
    lightningJitter: () => lightningJitter,
    distortionAmount: () => distortionAmount,
    intensity: () => intensity
  });

  const items = vfxLibrary.showcaseItems;
  let currentItemIndex = 0;
  let showcaseTime = 0;

  const currentItem = () => items[currentItemIndex];

  const spawnCurrentItem = (touchX?: number, touchY?: number) => {
    const item = currentItem();
    if (item.spawnKind === 'motion') {
      const y = touchY ?? 560;
      vfx.spawn(item.id, {
        source: { x: 85, y },
        target: { x: touchX ?? 415, y }
      });
      return;
    }

    vfx.spawn(item.id, {
      position: {
        x: touchX ?? 250,
        y: touchY ?? 560
      }
    });
  };

  const resetCurrentItem = () => {
    showcaseTime = 0;
    vfx.clear(true);
    spawnCurrentItem();
  };

  const setItem = (nextIndex: number) => {
    if (nextIndex < 0) {
      nextIndex = items.length - 1;
    } else if (nextIndex >= items.length) {
      nextIndex = 0;
    }

    currentItemIndex = nextIndex;
    resetCurrentItem();
  };

  const buttonBounds = {
    left: { minX: 20, maxX: 80, minY: 35, maxY: 105 },
    right: { minX: 420, maxX: 480, minY: 35, maxY: 105 },
    firstUp: { minX: 430, maxX: 480, minY: 140, maxY: 180 },
    firstDown: { minX: 430, maxX: 480, minY: 191, maxY: 226 },
    secondUp: { minX: 430, maxX: 480, minY: 251, maxY: 286 },
    secondDown: { minX: 430, maxX: 480, minY: 297, maxY: 332 }
  };

  const currentProfile = () => currentItem().paramProfile;

  const setLightningRays = (value: number) => {
    const next = clamp(Math.round(value), 1, 12);
    if (next === lightningRays) {
      return;
    }
    lightningRays = next;
    resetCurrentItem();
  };

  const setLightningJitter = (value: number) => {
    const next = clamp(value, 0, 1);
    if (Math.abs(next - lightningJitter) < 0.001) {
      return;
    }
    lightningJitter = next;
    resetCurrentItem();
  };

  const setDistortionAmount = (value: number) => {
    const next = clamp(value, 0, 1);
    if (Math.abs(next - distortionAmount) < 0.001) {
      return;
    }
    distortionAmount = next;
    resetCurrentItem();
  };

  const setIntensity = (value: number) => {
    const next = clamp(value, 0.3, 2);
    if (Math.abs(next - intensity) < 0.001) {
      return;
    }
    intensity = next;
    resetCurrentItem();
  };

  setItem(0);

  inputHandler.addEventListener(InputEvent.TouchEnd, () => {
    const p = inputHandler.getTouchedWorldCoord(camera);

    if (p.x >= buttonBounds.left.minX && p.x <= buttonBounds.left.maxX && p.y >= buttonBounds.left.minY && p.y <= buttonBounds.left.maxY) {
      setItem(currentItemIndex - 1);
      return;
    }

    if (p.x >= buttonBounds.right.minX && p.x <= buttonBounds.right.maxX && p.y >= buttonBounds.right.minY && p.y <= buttonBounds.right.maxY) {
      setItem(currentItemIndex + 1);
      return;
    }

    const profile = currentProfile();

    if (profile === 'lightning') {
      if (p.x >= buttonBounds.firstUp.minX && p.x <= buttonBounds.firstUp.maxX && p.y >= buttonBounds.firstUp.minY && p.y <= buttonBounds.firstUp.maxY) {
        setLightningRays(lightningRays + 1);
        return;
      }

      if (p.x >= buttonBounds.firstDown.minX && p.x <= buttonBounds.firstDown.maxX && p.y >= buttonBounds.firstDown.minY && p.y <= buttonBounds.firstDown.maxY) {
        setLightningRays(lightningRays - 1);
        return;
      }

      if (p.x >= buttonBounds.secondUp.minX && p.x <= buttonBounds.secondUp.maxX && p.y >= buttonBounds.secondUp.minY && p.y <= buttonBounds.secondUp.maxY) {
        setLightningJitter(lightningJitter + 0.1);
        return;
      }

      if (p.x >= buttonBounds.secondDown.minX && p.x <= buttonBounds.secondDown.maxX && p.y >= buttonBounds.secondDown.minY && p.y <= buttonBounds.secondDown.maxY) {
        setLightningJitter(lightningJitter - 0.1);
        return;
      }
    }

    if (profile === 'distortion') {
      if (p.x >= buttonBounds.firstUp.minX && p.x <= buttonBounds.firstUp.maxX && p.y >= buttonBounds.firstUp.minY && p.y <= buttonBounds.firstUp.maxY) {
        setDistortionAmount(distortionAmount + 0.1);
        return;
      }

      if (p.x >= buttonBounds.firstDown.minX && p.x <= buttonBounds.firstDown.maxX && p.y >= buttonBounds.firstDown.minY && p.y <= buttonBounds.firstDown.maxY) {
        setDistortionAmount(distortionAmount - 0.1);
        return;
      }

      if (p.x >= buttonBounds.secondUp.minX && p.x <= buttonBounds.secondUp.maxX && p.y >= buttonBounds.secondUp.minY && p.y <= buttonBounds.secondUp.maxY) {
        setIntensity(intensity + 0.1);
        return;
      }

      if (p.x >= buttonBounds.secondDown.minX && p.x <= buttonBounds.secondDown.maxX && p.y >= buttonBounds.secondDown.minY && p.y <= buttonBounds.secondDown.maxY) {
        setIntensity(intensity - 0.1);
        return;
      }
    }

    vfx.clear(true);
    spawnCurrentItem(p.x, p.y);
  });

  return {
    update(delta) {
      showcaseTime += delta;
      const item = currentItem();
      if (showcaseTime >= item.interval) {
        showcaseTime = 0;
        if (item.interval > 1.5) {
          vfx.clear(true);
        }
        spawnCurrentItem();
      }

      vfx.update(delta);

      shapeRenderer.setProjection(camera.combined);
      shapeRenderer.begin();
      shapeRenderer.rect(true, 0, 0, 500, 1000, BG_COLORS.main);
      shapeRenderer.rect(true, 20, 130, 460, 200, BG_COLORS.lane1);
      shapeRenderer.rect(true, 20, 330, 460, 210, BG_COLORS.lane2);
      shapeRenderer.rect(true, 20, 540, 460, 210, BG_COLORS.lane3);
      shapeRenderer.rect(true, 20, 750, 460, 220, BG_COLORS.lane4);

      shapeRenderer.circle(true, 95, 610, 16, Color.fromString('#3a4f68'));
      shapeRenderer.circle(true, 405, 610, 16, Color.fromString('#3a4f68'));
      shapeRenderer.end();

      batch.setProjection(camera.combined);
      batch.begin();
      vfx.draw(batch, gl, 'behind');
      batch.end();

      vfx.drawShaders('behind');

      batch.begin();
      vfx.draw(batch, gl, 'front');
      batch.end();

      vfx.drawShaders('front');

      shapeRenderer.setProjection(camera.combined);
      shapeRenderer.begin();
      shapeRenderer.triangle(true, 30, 70, 70, 35, 70, 105);
      shapeRenderer.triangle(true, 470, 70, 430, 35, 430, 105);

      if (currentProfile() !== 'none') {
        shapeRenderer.triangle(true, 455, 145, 435, 180, 475, 180);
        shapeRenderer.triangle(true, 455, 226, 435, 191, 475, 191);
        shapeRenderer.triangle(true, 455, 251, 435, 286, 475, 286);
        shapeRenderer.triangle(true, 455, 332, 435, 297, 475, 297);
      }
      shapeRenderer.end();

      const itemLabel = `${currentItemIndex + 1}/${items.length}  ${item.label}`;
      batch.begin();
      font.draw(batch, itemLabel, 86, 62, 328, Align.center);
      font.draw(batch, item.id, 30, 90, 390, Align.center);
      font.draw(batch, item.sourcePath, 20, 116, 400, Align.center);
      font.draw(batch, 'Tap lane to trigger at position', 24, 154, 380, Align.center);

      if (currentProfile() === 'lightning') {
        font.draw(batch, 'Rays', 345, 198, 120, Align.center);
        font.draw(batch, `${lightningRays}`, 345, 220, 120, Align.center);
        font.draw(batch, 'Jitter', 345, 304, 120, Align.center);
        font.draw(batch, lightningJitter.toFixed(2), 345, 326, 120, Align.center);
      } else if (currentProfile() === 'distortion') {
        font.draw(batch, 'Distortion', 330, 198, 140, Align.center);
        font.draw(batch, distortionAmount.toFixed(2), 330, 220, 140, Align.center);
        font.draw(batch, 'Intensity', 330, 304, 140, Align.center);
        font.draw(batch, intensity.toFixed(2), 330, 326, 140, Align.center);
      }
      batch.end();
    },
    dispose() {
      inputHandler.cleanup();
      vfxLibrary.dispose();
      vfx.dispose();
      font.dispose();
      batch.dispose();
      shapeRenderer.dispose();
      spriteAtlas.dispose();
    }
  };
};
