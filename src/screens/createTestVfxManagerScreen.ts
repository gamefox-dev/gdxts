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
  installStandardVfxLibrary,
  STANDARD_VFX_IDS
} from '../lib';
import { MultiTextureBatch } from '../lib/MultiTextureBatch';

const BG_COLORS = {
  main: Color.fromString('#0f1722'),
  lane1: Color.fromString('#162233'),
  lane2: Color.fromString('#18283c'),
  lane3: Color.fromString('#1a2c41'),
  lane4: Color.fromString('#152235')
};

type Showcase = {
  name: string;
  interval: number;
  spawn: (touchX?: number, touchY?: number) => void;
};

export const createTestVfxManagerScreen = async (viewport: Viewport): Promise<Screen> => {
  const gl = viewport.getContext();
  const camera = viewport.getCamera();
  camera.setYDown(YDOWN);

  const batch = new MultiTextureBatch(gl, 6, 10920, true);
  batch.setYDown(YDOWN);

  const font = await BitmapFont.load(gl, './number.fnt', YDOWN);
  font.getData().setScale(0.62, 0.62);

  const shapeRenderer = new ShapeRenderer(gl);
  const inputHandler = new ViewportInputHandler(viewport);

  const particleAtlas = await TextureAtlas.load(gl, './particle.atlas');

  const vfx = new VfxManager();
  let lightningRays = 4;
  let lightningJitter = 0.5;
  const vfxLibrary = await installStandardVfxLibrary(vfx, {
    gl,
    projection: () => camera.combined,
    particleAtlas,
    lightningRayCount: () => lightningRays,
    lightningJitter: () => lightningJitter
  });

  const showcases: Showcase[] = [
    {
      name: 'Projectile + Trail',
      interval: 0.72,
      spawn: (touchX, touchY) => {
        const y = touchY ?? 460;
        vfx.spawn(STANDARD_VFX_IDS.projectileTrail, {
          source: { x: 80, y },
          target: { x: touchX ?? 420, y }
        });
      }
    },
    {
      name: 'Lightning Bolt',
      interval: 0.78,
      spawn: (touchX, touchY) => {
        const y = touchY ?? 460;
        vfx.spawn(STANDARD_VFX_IDS.lightningBolt, {
          source: { x: 80, y },
          target: { x: touchX ?? 420, y }
        });
      }
    },
    {
      name: 'Hit Impact',
      interval: 0.42,
      spawn: (touchX, touchY) => {
        vfx.spawn(STANDARD_VFX_IDS.hitImpact, {
          position: { x: touchX ?? 250, y: touchY ?? 520 }
        });
      }
    },
    {
      name: 'Melee Jump + Slash',
      interval: 0.74,
      spawn: (touchX, touchY) => {
        const y = touchY ?? 520;
        vfx.spawn(STANDARD_VFX_IDS.meleeJumpSlash, {
          source: { x: 90, y },
          target: { x: touchX ?? 405, y }
        });
      }
    },
    {
      name: 'Area Burst',
      interval: 0.95,
      spawn: (touchX, touchY) => {
        vfx.spawn(STANDARD_VFX_IDS.areaBurst, {
          position: { x: touchX ?? 250, y: touchY ?? 560 }
        });
      }
    },
    {
      name: 'Ground Effect Loop',
      interval: 2.1,
      spawn: (touchX, touchY) => {
        vfx.spawn(STANDARD_VFX_IDS.groundAura, {
          position: { x: touchX ?? 250, y: touchY ?? 700 }
        });
      }
    },
    {
      name: 'Buff Aura',
      interval: 2.0,
      spawn: (touchX, touchY) => {
        vfx.spawn(STANDARD_VFX_IDS.buffAura, {
          position: { x: touchX ?? 250, y: touchY ?? 600 }
        });
      }
    },
    {
      name: 'Debuff Status',
      interval: 2.0,
      spawn: (touchX, touchY) => {
        vfx.spawn(STANDARD_VFX_IDS.statusDebuff, {
          position: { x: touchX ?? 250, y: touchY ?? 600 }
        });
      }
    },
    {
      name: 'Sky Sword Spirit',
      interval: 1.85,
      spawn: (touchX, touchY) => {
        vfx.spawn(STANDARD_VFX_IDS.skySword, {
          target: { x: touchX ?? 250, y: touchY ?? 760 }
        });
      }
    }
  ];
  const lightningShowcaseIndex = showcases.findIndex(showcase => showcase.name === 'Lightning Bolt');

  let currentShowcaseIndex = 0;
  let showcaseTime = 0;

  const setShowcase = (nextIndex: number) => {
    if (nextIndex < 0) {
      nextIndex = showcases.length - 1;
    } else if (nextIndex >= showcases.length) {
      nextIndex = 0;
    }

    currentShowcaseIndex = nextIndex;
    showcaseTime = 0;
    vfx.clear(true);
    showcases[currentShowcaseIndex].spawn();
  };

  const triggerCurrentShowcase = (touchX?: number, touchY?: number) => {
    showcases[currentShowcaseIndex].spawn(touchX, touchY);
  };

  const setLightningRays = (next: number) => {
    const clamped = Math.max(1, Math.min(12, next));
    if (clamped === lightningRays) {
      return;
    }
    lightningRays = clamped;

    if (currentShowcaseIndex === lightningShowcaseIndex) {
      showcaseTime = 0;
      vfx.clear(true);
      triggerCurrentShowcase();
    }
  };

  const setLightningJitter = (next: number) => {
    const clamped = Math.max(0, Math.min(1, next));
    if (Math.abs(clamped - lightningJitter) < 0.001) {
      return;
    }
    lightningJitter = clamped;

    if (currentShowcaseIndex === lightningShowcaseIndex) {
      showcaseTime = 0;
      vfx.clear(true);
      triggerCurrentShowcase();
    }
  };

  setShowcase(0);

  const buttonBounds = {
    left: { minX: 20, maxX: 80, minY: 35, maxY: 105 },
    right: { minX: 420, maxX: 480, minY: 35, maxY: 105 },
    raysUp: { minX: 430, maxX: 480, minY: 140, maxY: 180 },
    raysDown: { minX: 430, maxX: 480, minY: 191, maxY: 226 },
    jitterUp: { minX: 430, maxX: 480, minY: 251, maxY: 286 },
    jitterDown: { minX: 430, maxX: 480, minY: 297, maxY: 332 }
  };

  inputHandler.addEventListener(InputEvent.TouchEnd, () => {
    const p = inputHandler.getTouchedWorldCoord(camera);

    if (
      p.x >= buttonBounds.left.minX &&
      p.x <= buttonBounds.left.maxX &&
      p.y >= buttonBounds.left.minY &&
      p.y <= buttonBounds.left.maxY
    ) {
      setShowcase(currentShowcaseIndex - 1);
      return;
    }

    if (
      p.x >= buttonBounds.right.minX &&
      p.x <= buttonBounds.right.maxX &&
      p.y >= buttonBounds.right.minY &&
      p.y <= buttonBounds.right.maxY
    ) {
      setShowcase(currentShowcaseIndex + 1);
      return;
    }

    if (currentShowcaseIndex === lightningShowcaseIndex) {
      if (
        p.x >= buttonBounds.raysUp.minX &&
        p.x <= buttonBounds.raysUp.maxX &&
        p.y >= buttonBounds.raysUp.minY &&
        p.y <= buttonBounds.raysUp.maxY
      ) {
        setLightningRays(lightningRays + 1);
        return;
      }

      if (
        p.x >= buttonBounds.raysDown.minX &&
        p.x <= buttonBounds.raysDown.maxX &&
        p.y >= buttonBounds.raysDown.minY &&
        p.y <= buttonBounds.raysDown.maxY
      ) {
        setLightningRays(lightningRays - 1);
        return;
      }

      if (
        p.x >= buttonBounds.jitterUp.minX &&
        p.x <= buttonBounds.jitterUp.maxX &&
        p.y >= buttonBounds.jitterUp.minY &&
        p.y <= buttonBounds.jitterUp.maxY
      ) {
        setLightningJitter(lightningJitter + 0.1);
        return;
      }

      if (
        p.x >= buttonBounds.jitterDown.minX &&
        p.x <= buttonBounds.jitterDown.maxX &&
        p.y >= buttonBounds.jitterDown.minY &&
        p.y <= buttonBounds.jitterDown.maxY
      ) {
        setLightningJitter(lightningJitter - 0.1);
        return;
      }
    }

    triggerCurrentShowcase(p.x, p.y);
  });

  return {
    update(delta) {
      showcaseTime += delta;
      const currentShowcase = showcases[currentShowcaseIndex];
      if (showcaseTime >= currentShowcase.interval) {
        showcaseTime = 0;
        triggerCurrentShowcase();
      }

      vfx.update(delta);

      shapeRenderer.setProjection(camera.combined);
      shapeRenderer.begin();
      shapeRenderer.rect(true, 0, 0, 500, 1000, BG_COLORS.main);
      shapeRenderer.rect(true, 20, 130, 460, 200, BG_COLORS.lane1);
      shapeRenderer.rect(true, 20, 330, 460, 210, BG_COLORS.lane2);
      shapeRenderer.rect(true, 20, 540, 460, 210, BG_COLORS.lane3);
      shapeRenderer.rect(true, 20, 750, 460, 220, BG_COLORS.lane4);

      shapeRenderer.circle(true, 95, 610, 16, Color.fromString('#3b4f68'));
      shapeRenderer.circle(true, 405, 610, 16, Color.fromString('#3b4f68'));
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
      if (currentShowcaseIndex === lightningShowcaseIndex) {
        shapeRenderer.triangle(true, 455, 145, 435, 180, 475, 180);
        shapeRenderer.triangle(true, 455, 226, 435, 191, 475, 191);
        shapeRenderer.triangle(true, 455, 251, 435, 286, 475, 286);
        shapeRenderer.triangle(true, 455, 332, 435, 297, 475, 297);
      }
      shapeRenderer.end();

      const label = `${currentShowcaseIndex + 1}/${showcases.length}  ${showcases[currentShowcaseIndex].name}`;
      batch.begin();
      font.draw(batch, label, 80, 75, 340, Align.center);
      if (currentShowcaseIndex === lightningShowcaseIndex) {
        font.draw(batch, 'Rays', 345, 198, 120, Align.center);
        font.draw(batch, `${lightningRays}`, 345, 220, 120, Align.center);
        font.draw(batch, 'Jitter', 345, 304, 120, Align.center);
        font.draw(batch, lightningJitter.toFixed(1), 345, 326, 120, Align.center);
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
      particleAtlas.dispose();
    }
  };
};
