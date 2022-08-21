import { YDOWN } from '..';
import { Color, Game, InputEvent, Screen, Texture, Viewport, ViewportInputHandler } from '../lib';
import { TestActor } from '../lib/ui/actors/TestActor';
import { Group } from '../lib/ui/Group';
import { Stage } from '../lib/ui/Stage';

export const createTestUIScreen = async (viewport: Viewport): Promise<Screen> => {
  const gl = viewport.getContext();

  const camera = viewport.getCamera();
  camera.setYDown(YDOWN);

  const texture = await Texture.createWhiteTexture(gl);
  const inputHandler = new ViewportInputHandler(viewport);

  const stage = new Stage(viewport);
  stage.root.setStyle({
    flexDirection: 'column',
    justifyContent: 'flex-start'
  });

  const A = new Group(stage);
  A.setStyle({
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexWrap: 'wrap'
  });
  const ABackground = new TestActor(stage, texture).setColor(Color.BLUE);
  ABackground.setStyle({
    position: 'absolute',
    inset: 0
  });
  A.addActor(ABackground);

  for (let i = 0; i < 20; i++) {
    const a1 = new TestActor(stage, texture).setColor(Color.MAGENTA);
    a1.setStyle({
      width: 50,
      aspectRatio: 1.5,
      margin: 10
    });
    A.addActor(a1);
  }

  const B = new Group(stage);
  B.setStyle({
    flex: 1
  });
  const BBackground = new TestActor(stage, texture).setColor(Color.GREEN);
  BBackground.setStyle({
    flex: 1
  });
  B.addActor(BBackground);

  stage.addActor(A);
  stage.addActor(B);

  inputHandler.addEventListener(InputEvent.TouchStart, () => {
    A.setStyle({
      flex: 2
    });
  });

  inputHandler.addEventListener(InputEvent.TouchEnd, () => {
    A.setStyle({
      flex: 1
    });
  });

  return {
    update(delta: number, game: Game) {
      stage.draw();
    },
    dispose() {
      texture.dispose();
      stage.dispose();
      inputHandler.cleanup();
    }
  };
};
