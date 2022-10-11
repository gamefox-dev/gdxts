import { GLTFEntity } from '../GLTFEntity';

export class GLTFSampler extends GLTFEntity {
  public minFilter: number;
  public magFilter: number;
  public wrapS: number;
  public wrapT: number;
}
