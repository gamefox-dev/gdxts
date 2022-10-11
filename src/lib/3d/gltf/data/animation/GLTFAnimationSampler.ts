import { GLTFObject } from '../GLTFObject';

export class GLTFAnimationSampler extends GLTFObject {
  public input: number;
  public output: number;
  public interpolation: string;
}
