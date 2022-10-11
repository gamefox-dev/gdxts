import { GLTFEntity } from '../GLTFEntity';
import { GLTFAccessorSparse } from './GLTFAccessorSparse';

export class GLTFAccessor extends GLTFEntity {
  public bufferView: number;
  public normalized = false;
  public byteOffset = 0;
  public componentType: number;
  public count: number;
  public type: string;
  public min: number[];
  public max: number[];

  public sparse: GLTFAccessorSparse;
}
