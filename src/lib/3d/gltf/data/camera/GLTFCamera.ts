import { GLTFEntity } from '../GLTFEntity';
import { GLTFOrthographic } from './GLTFOrthographic';
import { GLTFPerspective } from './GLTFPerspective';

export class GLTFCamera extends GLTFEntity {
  public type: string;
  public perspective: GLTFPerspective;
  public orthographic: GLTFOrthographic;
}
