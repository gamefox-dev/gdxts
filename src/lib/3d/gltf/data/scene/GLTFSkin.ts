import { GLTFEntity } from '../GLTFEntity';

export class GLTFSkin extends GLTFEntity {
  public inverseBindMatrices: number;
  public joints: number[];
  public skeleton: number;
}
