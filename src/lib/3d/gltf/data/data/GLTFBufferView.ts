import { GLTFEntity } from '../GLTFEntity';

export class GLTFBufferView extends GLTFEntity {
  public byteOffset = 0;
  public byteLength: number;
  public buffer: number;
  public byteStride: number;
  public target: number;
}
