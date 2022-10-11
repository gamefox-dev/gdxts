import { GLTFEntity } from '../GLTFEntity';
import { GLTFAnimationChannel } from './GLTFAnimationChannel';
import { GLTFAnimationSampler } from './GLTFAnimationSampler';

export class GLTFAnimation extends GLTFEntity {
  public channels: GLTFAnimationChannel[];
  public samplers: GLTFAnimationSampler[];
}
