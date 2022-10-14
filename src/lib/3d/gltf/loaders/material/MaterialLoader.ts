import { Material } from '../../../Material';
import { GLTFMaterial } from '../../data/material/GLTFMaterial';

export abstract class MaterialLoader {
  public abstract getDefaultMaterial(): Material;

  public abstract get(index: number): Material;

  public abstract loadMaterials(materials: GLTFMaterial[]);
}
