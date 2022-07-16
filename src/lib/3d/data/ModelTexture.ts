import { Vector2 } from "../../Vector2";

export class ModelTexture {
  public static USAGE_UNKNOWN = 0;
  public static USAGE_NONE = 1;
  public static USAGE_DIFFUSE = 2;
  public static USAGE_EMISSIVE = 3;
  public static USAGE_AMBIENT = 4;
  public static USAGE_SPECULAR = 5;
  public static USAGE_SHININESS = 6;
  public static USAGE_NORMAL = 7;
  public static USAGE_BUMP = 8;
  public static USAGE_TRANSPARENCY = 9;
  public static USAGE_REFLECTION = 10;

  public id: string;
  public fileName: string;
  public uvTranslation: Vector2;
  public uvScaling: Vector2;
  public usage: number;
}
