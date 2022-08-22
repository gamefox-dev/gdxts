import { YDOWN } from '..';
import { Color, Game, InputEvent, Screen, Texture, Viewport, ViewportInputHandler } from '../lib';
import { TestActor } from '../lib/ui/actors/TestActor';
import { Group } from '../lib/ui/Group';
import { Stage } from '../lib/ui/Stage';

export const createTestUIScreen = async (viewport: Viewport): Promise<Screen> => {
  const gl = viewport.getContext();

  const camera = viewport.getCamera();
  camera.setYDown(YDOWN);

  const texture = Texture.createWhiteTexture(gl);
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
    flexWrap: 'wrap',
    backgroundColor: Color.BLUE
  });

  const children = [];
  const newChild = () => {
    const a1 = new TestActor(stage, texture).setColor(Color.MAGENTA);
    a1.setStyle({
      width: 50,
      aspectRatio: 1.5,
      margin: 10
    });
    A.addActor(a1);
    children.push(a1);
  };

  for (let i = 0; i < 20; i++) {
    newChild();
  }

  const B = new Group(stage);
  B.setStyle({
    flex: 1,
    backgroundColor: Color.GREEN
  });

  stage.addActor(A);
  stage.addActor(B);

  inputHandler.addEventListener(InputEvent.TouchStart, () => {
    if (inputHandler.getTouchedWorldCoord().y > 500) {
      newChild();
    } else if (children.length > 0) {
      const a1 = children.pop();
      A.removeActor(a1);
    }
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
