import { YDOWN } from '..';
import { Color, Game, Screen, Texture, Viewport } from '../lib';
import { TestActor } from '../lib/ui/actors/TestActor';
import { Stage } from '../lib/ui/Stage';
import { Group } from '../lib/ui/Group';
import Yoga from 'yoga-layout-prebuilt';

export const createTestUIScreen = async (viewport: Viewport): Promise<Screen> => {
  const gl = viewport.getContext();

  const camera = viewport.getCamera();
  camera.setYDown(YDOWN);

  const texture = await Texture.createWhiteTexture(gl);

  const stage = new Stage(viewport);
  stage.root.style.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN);
  stage.root.style.setJustifyContent(Yoga.JUSTIFY_FLEX_START);

  const A = new Group();
  A.style.setFlex(1);
  A.style.setJustifyContent(Yoga.JUSTIFY_FLEX_START);
  A.style.setAlignItems(Yoga.ALIGN_CENTER);
  A.style.setFlexWrap(Yoga.WRAP_WRAP);
  const ABackground = new TestActor(texture).setColor(Color.BLUE);
  ABackground.style.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE);
  ABackground.style.setPosition(Yoga.EDGE_ALL, 0);
  A.addActor(ABackground);

  for (let i = 0; i < 20; i++) {
    const a1 = new TestActor(texture).setColor(Color.MAGENTA);
    a1.style.setWidth(50);
    a1.style.setHeight(50);
    a1.style.setMargin(Yoga.EDGE_ALL, 10);
    A.addActor(a1);
  }

  const B = new Group();
  B.style.setFlex(1);
  const BBackground = new TestActor(texture).setColor(Color.GREEN);
  BBackground.style.setFlex(1);
  B.addActor(BBackground);

  stage.addActor(A);
  stage.addActor(B);

  return {
    update(delta: number, game: Game) {
      stage.draw();
    },
    dispose() {
      texture.dispose();
      stage.dispose();
    }
  };
};
