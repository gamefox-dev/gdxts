import { GLTFObject } from '../GLTFObject';

export class GLTFPerspective extends GLTFObject {
  public yfov: number;
  public znear: number;
  public aspectRatio: number;
  public zfar: number;
}
