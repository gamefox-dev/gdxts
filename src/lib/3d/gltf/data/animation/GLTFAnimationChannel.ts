import { GLTFObject } from '../GLTFObject';
import { GLTFAnimationTarget } from './GLTFAnimationTarget';

export class GLTFAnimationChannel extends GLTFObject {
  public sampler: number;
  public target: GLTFAnimationTarget;
}
