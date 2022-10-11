import { GLTFExtensions } from './GLTFExtensions';
import { GLTFExtras } from './GLTFExtras';

export abstract class GLTFObject {
  public extensions: GLTFExtensions;
  public extras: GLTFExtras;
}
