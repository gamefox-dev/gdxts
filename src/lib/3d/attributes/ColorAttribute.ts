import { Color } from '../../Utils';
import { Attribute } from './Attribute';

export class ColorAttribute3D extends Attribute {
  public static DiffuseAlias: string = 'diffuseColor';
  public static Diffuse: number = this.register(ColorAttribute3D.DiffuseAlias);
  public static SpecularAlias: string = 'specularColor';
  public static Specular: number = this.register(ColorAttribute3D.SpecularAlias);
  public static AmbientAlias: string = 'ambientColor';
  public static Ambient: number = this.register(ColorAttribute3D.AmbientAlias);
  public static EmissiveAlias: string = 'emissiveColor';
  public static Emissive: number = this.register(ColorAttribute3D.EmissiveAlias);
  public static ReflectionAlias: string = 'reflectionColor';
  public static Reflection: number = this.register(ColorAttribute3D.ReflectionAlias);
  public static AmbientLightAlias: string = 'ambientLightColor';
  public static AmbientLight: number = this.register(ColorAttribute3D.AmbientLightAlias);
  public static FogAlias: string = 'fogColor';
  public static Fog: number = this.register(ColorAttribute3D.FogAlias);

  protected static Mask: number =
    this.Ambient | this.Diffuse | this.Specular | this.Emissive | this.Reflection | this.AmbientLight | this.Fog;

  public static is(mask: number): boolean {
    return (mask & this.Mask) !== 0;
  }

  public static createAmbient(color: Color): ColorAttribute3D {
    return new ColorAttribute3D(ColorAttribute3D.Ambient, color);
  }

  public static createDiffuse(color: Color): ColorAttribute3D {
    return new ColorAttribute3D(ColorAttribute3D.Diffuse, color);
  }

  public static createSpecular(color: Color): ColorAttribute3D {
    return new ColorAttribute3D(ColorAttribute3D.Specular, color);
  }

  public static createReflection(color: Color): ColorAttribute3D {
    return new ColorAttribute3D(ColorAttribute3D.Reflection, color);
  }

  public static createEmissive(color: Color): ColorAttribute3D {
    return new ColorAttribute3D(ColorAttribute3D.Emissive, color);
  }

  public static createAmbientLight(color: Color): ColorAttribute3D {
    return new ColorAttribute3D(ColorAttribute3D.AmbientLight, color);
  }

  public static createFog(color: Color) {
    return new ColorAttribute3D(ColorAttribute3D.Fog, color);
  }

  public color: Color = new Color();

  constructor(type: number, color: Color) {
    super();
    this.setType(type);
    if (!!color) this.color.set(color.r, color.g, color.b, color.a);
  }

  public copy(): Attribute {
    return new ColorAttribute3D(this.type, this.color);
  }
}
