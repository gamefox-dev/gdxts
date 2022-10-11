import { GLTFEntity } from '../GLTFEntity';
import { GLTFPrimitive } from './GLTFPrimitive';

export class GLTFMesh extends GLTFEntity {
  public primitives: GLTFPrimitive[];
  public weights: number;
}
