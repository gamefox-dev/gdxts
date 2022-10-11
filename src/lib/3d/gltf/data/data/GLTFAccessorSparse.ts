import { GLTFObject } from '../GLTFObject';
import { GLTFAccessorSparseIndices } from './GLTFAccessorSparseIndices';
import { GLTFAccessorSparseValues } from './GLTFAccessorSparseValues';

export class GLTFAccessorSparse extends GLTFObject {
  public count: number;
  public indices: GLTFAccessorSparseIndices;
  public values: GLTFAccessorSparseValues;
}
