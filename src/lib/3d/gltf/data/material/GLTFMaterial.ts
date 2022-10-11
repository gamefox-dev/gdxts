import { GLTFEntity } from '../GLTFEntity';
import { GLTFNormalTextureInfo } from '../texture/GLTFNormalTextureInfo';
import { GLTFOcclusionTextureInfo } from '../texture/GLTFOcclusionTextureInfo';
import { GLTFTextureInfo } from '../texture/GLTFTextureInfo';
import { GLTFpbrMetallicRoughness } from './GLTFpbrMetallicRoughness';

export class GLTFMaterial extends GLTFEntity {
  public emissiveFactor: number[];

  public normalTexture: GLTFNormalTextureInfo;
  public occlusionTexture: GLTFOcclusionTextureInfo;
  public emissiveTexture: GLTFTextureInfo;

  public alphaMode: string;
  public alphaCutoff: number;

  public doubleSided: boolean;

  public pbrMetallicRoughness: GLTFpbrMetallicRoughness;
}
