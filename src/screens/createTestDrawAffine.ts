import { YDOWN } from '..';
import {
  Align,
  Animation,
  BitmapFont,
  Color,
  Game,
  PlayMode,
  PolygonBatch,
  Screen,
  Texture,
  TextureAtlas,
  Viewport
} from '../lib';
import { Affine2 } from '../lib/Affine2';

export const createTestDrawAffine = async (viewport: Viewport): Promise<Screen> => {
  const gl = viewport.getContext();
  const camera = viewport.getCamera();
  camera.setYDown(YDOWN);

  const batch = new PolygonBatch(gl);
  batch.setYDown(YDOWN);

  const whiteTexture = Texture.createWhiteTexture(gl);
  const texture = await Texture.load(gl, 'test.jpg');
  const atlas = await TextureAtlas.load(gl, './kit-garden.atlas');
  const animation = new Animation(atlas.findRegions('Char_pick_item'), 1 / 30);

  const font = await BitmapFont.load(gl, './number.fnt', YDOWN);

  const parentAffine = new Affine2();
  parentAffine.setToTrnRotScl(20, 400, 0, 1, 1);
  const childAffine = new Affine2();
  childAffine.setToTrnRotScl(50, 400, 0, 1, 1);

  const PARENT_WIDTH = 400;
  const PARENT_HEIGHT = 100;

  const CHILD_WIDTH = 100;
  const CHILD_HEIGHT = 120;

  let parentRotation = 0;
  let childRotation = 0;
  let scale = 1;
  let stateTime = 0;

  const TEXT_CONTAINER_WIDTH = 200;
  const TEXT_CONTAINER_HEIGHT = 100;

  const container = new Affine2();
  container.setToTrnRotRadScl(150 + TEXT_CONTAINER_WIDTH / 2, 650 + TEXT_CONTAINER_HEIGHT, 0, 1, 1.5);
  container.translate(-TEXT_CONTAINER_WIDTH / 2, -TEXT_CONTAINER_HEIGHT);

  const textContainerAffine = new Affine2();
  textContainerAffine.setToTrnRotRadScl(TEXT_CONTAINER_WIDTH / 2, TEXT_CONTAINER_HEIGHT, 0, 1.5, 1);
  textContainerAffine.translate(-TEXT_CONTAINER_WIDTH / 2, -TEXT_CONTAINER_HEIGHT);
  textContainerAffine.preMul(container);

  return {
    update(delta: number, game: Game) {
      parentRotation += Math.PI * delta;
      childRotation -= 3 * Math.PI * delta;
      stateTime += delta;

      let parentScale = scale + (Math.sin(parentRotation) + 1);

      parentAffine.setToTrnRotRadScl(20 + PARENT_WIDTH / 2, 400 + PARENT_HEIGHT / 2, 0, parentScale, parentScale);
      parentAffine.translate(-PARENT_WIDTH / 2, -PARENT_HEIGHT / 2);

      childAffine.setToTrnRotRadScl(
        PARENT_WIDTH - CHILD_WIDTH + CHILD_WIDTH / 2,
        0 + CHILD_HEIGHT / 2,
        childRotation,
        1,
        1
      );
      childAffine.translate(-CHILD_WIDTH / 2, -CHILD_HEIGHT / 2);
      childAffine.preMul(parentAffine);

      batch.setProjection(camera.combined);
      batch.begin();
      batch.drawTransformed(texture, PARENT_WIDTH, PARENT_HEIGHT, parentAffine);

      batch.setColor(Color.WHITE);
      animation.getKeyFrame(stateTime, PlayMode.LOOP).drawTransformed(batch, CHILD_WIDTH, CHILD_HEIGHT, childAffine);
      animation.getKeyFrame(stateTime, PlayMode.LOOP).draw(batch, 0, 0, CHILD_WIDTH, CHILD_HEIGHT);

      batch.setColor(Color.WHITE);

      font.drawTransformed(batch, 'One Two Three Four Five Six Seven', childAffine, 400, Align.center);

      batch.drawTransformed(whiteTexture, TEXT_CONTAINER_WIDTH, TEXT_CONTAINER_HEIGHT, textContainerAffine);
      batch.setColor(Color.RED);
      font.data.setXYScale(0.5);
      font.drawTransformed(batch, 'Hello, world', textContainerAffine, TEXT_CONTAINER_WIDTH, Align.center);
      font.data.setXYScale(1);
      batch.setColor(Color.WHITE);

      batch.end();
    },
    dispose() {
      batch.dispose();
      whiteTexture.dispose();
      atlas.dispose();
    }
  };
};
