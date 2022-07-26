import { Color } from '../../../Utils';
import { ModelTexture } from './ModelTexture';

export enum MaterialType {
  Lambert,
  Phong
}

export class ModelMaterial {
  public id: string;

  public type: MaterialType;

  public ambient: Color;
  public diffuse: Color;
  public specular: Color;
  public emissive: Color;
  public reflection: Color;

  public shininess: number;
  public opacity = 1.0;

  public textures: ModelTexture[];
}
