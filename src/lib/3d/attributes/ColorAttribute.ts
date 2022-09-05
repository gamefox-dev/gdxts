import { Color } from '../../Utils';
import { Attribute } from './Attribute';

export class ColorAttribute extends Attribute {
  public static DiffuseAlias: string = 'diffuseColor';
  public static Diffuse: number = this.register(ColorAttribute.DiffuseAlias);
  public static SpecularAlias: string = 'specularColor';
  public static Specular: number = this.register(ColorAttribute.SpecularAlias);
  public static AmbientAlias: string = 'ambientColor';
  public static Ambient: number = this.register(ColorAttribute.AmbientAlias);
  public static EmissiveAlias: string = 'emissiveColor';
  public static Emissive: number = this.register(ColorAttribute.EmissiveAlias);
  public static ReflectionAlias: string = 'reflectionColor';
  public static Reflection: number = this.register(ColorAttribute.ReflectionAlias);
  public static AmbientLightAlias: string = 'ambientLightColor';
  public static AmbientLight: number = this.register(ColorAttribute.AmbientLightAlias);
  public static FogAlias: string = 'fogColor';
  public static Fog: number = this.register(ColorAttribute.FogAlias);

  protected static Mask: number =
    this.Ambient | this.Diffuse | this.Specular | this.Emissive | this.Reflection | this.AmbientLight | this.Fog;

  public static is(mask: number): boolean {
    return (mask & this.Mask) !== 0;
  }

  public static createAmbient(color: Color): ColorAttribute {
    return new ColorAttribute(ColorAttribute.Ambient, color);
  }

  public static createDiffuse(color: Color): ColorAttribute {
    return new ColorAttribute(ColorAttribute.Diffuse, color);
  }

  public static createSpecular(color: Color): ColorAttribute {
    return new ColorAttribute(ColorAttribute.Specular, color);
  }

  public static createReflection(color: Color): ColorAttribute {
    return new ColorAttribute(ColorAttribute.Reflection, color);
  }

  public static createEmissive(color: Color): ColorAttribute {
    return new ColorAttribute(ColorAttribute.Emissive, color);
  }

  public static createAmbientLight(color: Color): ColorAttribute {
    return new ColorAttribute(ColorAttribute.AmbientLight, color);
  }

  public static createFog(color: Color) {
    return new ColorAttribute(ColorAttribute.Fog, color);
  }

  public color: Color = new Color();

  constructor(type: number, color: Color) {
    super();
    this.setType(type);
    if (!!color) this.color.set(color.r, color.g, color.b, color.a);
  }

  public copy(): Attribute {
    return new ColorAttribute(this.type, this.color);
  }
}
