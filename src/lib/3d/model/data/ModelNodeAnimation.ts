import { Quaternion } from '../../../Quaternion';
import { Vector3 } from '../../../Vector3';
import { ModelNodeKeyframe } from './ModelNodeKeyframe';

export class ModelNodeAnimation {
  public nodeId: string;
  public translation: ModelNodeKeyframe<Vector3>[] = null;
  public rotation: ModelNodeKeyframe<Quaternion>[] = null;
  public scaling: ModelNodeKeyframe<Vector3>[] = null;
}
