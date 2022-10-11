import { GLTFObject } from '../GLTFObject';

export type GLTFMorphTarget = Map<string, number>;

export class GLTFPrimitive extends GLTFObject {
  public attributes: Map<string, number>;
  public indices: number;
  public mode: number;
  public material: number;
  public targets: GLTFMorphTarget[];
}
