import { Quaternion } from '../../Quaternion';
import { Vector3 } from '../../Vector3';
import { NodeKeyframe } from './NodeKeyframe';
import { Node } from './Node';

export class NodeAnimation {
  public node: Node;
  public translation: NodeKeyframe<Vector3>[] = null;
  public rotation: NodeKeyframe<Quaternion>[] = null;
  public scaling: NodeKeyframe<Vector3>[] = null;
}
