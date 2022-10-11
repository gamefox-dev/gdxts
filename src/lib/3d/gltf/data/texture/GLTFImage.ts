import { GLTFEntity } from '../GLTFEntity';

export class GLTFImage extends GLTFEntity {
  public uri: string;
  public mimeType: string;
  public bufferView: number;
}
