import { GLTFObject } from '../GLTFObject';

export class GLTFOrthographic extends GLTFObject {
  public znear: number;
  public zfar: number;
  public xmag: number;
  public ymag: number;
}
