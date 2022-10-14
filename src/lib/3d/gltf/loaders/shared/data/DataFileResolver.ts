import { Pixmap } from '../../../../../Pixmap';
import { GLTF } from '../../../data/GLTF';
import { GLTFImage } from '../../../data/texture/GLTFImage';

export abstract class DataFileResolver {
  public abstract load(fileDir: string);
  public abstract getRoot(): GLTF;
  public abstract getBuffer(buffer: number): Uint16Array;
  public abstract loadGLTFImage(glImage: GLTFImage): Pixmap;
}
