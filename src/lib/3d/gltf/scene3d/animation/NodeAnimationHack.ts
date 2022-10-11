import { NodeAnimation } from '../../../model/NodeAnimation';
import { NodeKeyframe } from '../../../model/NodeKeyframe';
import { Interpolation } from '../../loaders/shared/animation/Interpolation';
import { WeightVector } from '../model/WeightVector';

export class NodeAnimationHack extends NodeAnimation {
  public translationMode: Interpolation;
  public rotationMode: Interpolation;
  public scalingMode: Interpolation;
  public weightsMode: Interpolation;

  public weights: Array<NodeKeyframe<WeightVector>>;
}
