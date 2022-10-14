import { Material } from '../../../Material';
import { GLTFMaterial } from '../../data/material/GLTFMaterial';
import { TextureResolver } from '../texture/TextureResolver';
import { MaterialLoader } from './MaterialLoader';

export abstract class MaterialLoaderBase extends MaterialLoader {
  protected textureResolver: TextureResolver;
  private materials = new Array<Material>();
  private defaultMaterial: Material;

  constructor(textureResolver: TextureResolver, defaultMaterial: Material) {
    super();
    this.textureResolver = textureResolver;
    this.defaultMaterial = defaultMaterial;
  }

  public getDefaultMaterial(): Material {
    return this.defaultMaterial;
  }

  public get(index: number): Material {
    return this.materials[index];
  }

  public loadMaterials(glMaterials: GLTFMaterial[]) {
    if (!!glMaterials) {
      for (let i = 0; i < glMaterials.length; i++) {
        const glMaterial = glMaterials[i];
        const material = this.loadMaterial(glMaterial);
        this.materials.push(material);
      }
    }
  }

  protected abstract loadMaterial(glMaterial: GLTFMaterial): Material;
}
