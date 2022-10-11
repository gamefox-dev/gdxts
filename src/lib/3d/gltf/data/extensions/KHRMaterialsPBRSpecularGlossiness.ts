import { GLTFTextureInfo } from '../texture/GLTFTextureInfo';

export class KHRMaterialsPBRSpecularGlossiness {
  public static EXT = 'KHR_materials_pbrSpecularGlossiness';

  public diffuseFactor: number[];
  public specularFactor: number[];
  public glossinessFactor = 1;

  public diffuseTexture: GLTFTextureInfo;
  public specularGlossinessTexture: GLTFTextureInfo;
}
