import { YDOWN } from '..';
import { Viewport, PolygonBatch, Game, Color, Screen, Texture } from '../lib';
import { Affine2 } from '../lib/Affine2';

export const createTestDrawAffine = async (viewport: Viewport): Promise<Screen> => {
  const gl = viewport.getContext();
  const camera = viewport.getCamera();
  camera.setYDown(YDOWN);

  const batch = new PolygonBatch(gl);
  batch.setYDown(YDOWN);

  const whiteTexture = Texture.createWhiteTexture(gl);

  const parentAffine = new Affine2();
  parentAffine.setToTrnRotScl(20, 400, 0, 1, 1);
  const childAffine = new Affine2();
  childAffine.setToTrnRotScl(50, 400, 0, 1, 1);

  let parentRotation = 0;
  let childRotation = 0;
  let scale = 1;

  return {
    update(delta: number, game: Game) {
      parentRotation += Math.PI * delta;
      childRotation -= 3 * Math.PI * delta;

      const parentScale = scale + (Math.sin(parentRotation) + 1);

      parentAffine.setToTrnRotRadScl(20 + 200, 400 + 50, parentRotation, parentScale, parentScale);
      parentAffine.translate(-200, -50);

      childAffine.setToTrnRotRadScl(350 + 25, 0 + 25, childRotation, 1, 1);
      childAffine.translate(-25, -25);
      childAffine.preMul(parentAffine);

      batch.setProjection(camera.combined);
      batch.begin();
      batch.setColor(Color.RED);
      batch.drawTransformed(whiteTexture, 400, 100, parentAffine);

      batch.setColor(Color.BLUE);
      batch.drawTransformed(whiteTexture, 50, 50, childAffine);

      batch.setColor(Color.WHITE);
      batch.end();
    },
    dispose() {
      batch.dispose();
    }
  };
};
