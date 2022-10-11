import { GLTFObject } from '../GLTFObject';
import { GLTFTextureInfo } from '../texture/GLTFTextureInfo';

export class GLTFpbrMetallicRoughness extends GLTFObject {
  public baseColorFactor: number[];
  public metallicFactor: number = 1;
  public roughnessFactor: number = 1;
  public baseColorTexture: GLTFTextureInfo;
  public metallicRoughnessTexture: GLTFTextureInfo;
}
