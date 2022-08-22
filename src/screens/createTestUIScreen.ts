import { YDOWN } from '..';
import { Color, Game, InputEvent, Screen, Viewport, ViewportInputHandler } from '../lib';
import { Label } from '../lib/ui/actors/Label';
import { Group } from '../lib/ui/Group';
import { Skin } from '../lib/ui/Skin';
import { Stage } from '../lib/ui/Stage';

export const createTestUIScreen = async (viewport: Viewport): Promise<Screen> => {
  const camera = viewport.getCamera();
  camera.setYDown(YDOWN);

  const inputHandler = new ViewportInputHandler(viewport);

  const skin = await Skin.loadSkin(viewport.getContext(), './default.skin.json');
  const stage = new Stage(viewport, skin);
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
    const group = new Group(stage);
    group.setStyle({
      backgroundColor: Color.MAGENTA,
      width: 50,
      height: 50,
      margin: 10
    });

    const label = new Label(stage, 'dcm', 'default');
    label.setStyle({
      fontScale: 0.5,
      backgroundColor: Color.RED,
      verticalAlign: 'bottom',
      color: Color.WHITE,
      flex: 1
    });

    group.addActor(label);

    A.addActor(group);
    children.push(group);
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
      stage.dispose();
      inputHandler.cleanup();
    }
  };
};
