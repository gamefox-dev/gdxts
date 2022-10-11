import { Disposable } from '../../../../Utils';
import { Camera } from '../../../Camera';
import { BaseLight } from '../../../environment';
import { Model, Node } from '../../../model';

export class SceneModel implements Disposable {
  public name: string;
  public model: Model;
  public cameras = new Map<Node, Camera>();
  public lights = new Map<Node, BaseLight>();

  public dispose() {
    this.model.dispose();
  }
}
