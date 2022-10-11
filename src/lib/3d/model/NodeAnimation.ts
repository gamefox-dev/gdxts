import { Quaternion } from '../../Quaternion';
import { Vector3 } from '../../Vector3';
import { Node } from './Node';
import { NodeKeyframe } from './NodeKeyframe';

export class NodeAnimation {
  public node: Node;
  public translation: NodeKeyframe<Vector3>[];
  public rotation: NodeKeyframe<Quaternion>[];
  public scaling: NodeKeyframe<Vector3>[];
}
