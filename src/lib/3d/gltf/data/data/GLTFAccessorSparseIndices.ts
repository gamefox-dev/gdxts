import { GLTFObject } from '../GLTFObject';

export class GLTFAccessorSparseIndices extends GLTFObject {
  public bufferView: number;
  public byteOffset: number;
  public componentType: number;
}
