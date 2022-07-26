import { Texture } from '../../Texture';
import { TextureRegion } from '../../TextureRegion';
import { Attribute } from './Attribute';

export class TextureAttribute extends Attribute {
  public static DiffuseAlias: string = 'diffuseTexture';
  public static Diffuse: number = this.register(TextureAttribute.DiffuseAlias);
  public static SpecularAlias: string = 'specularTexture';
  public static Specular: number = this.register(TextureAttribute.SpecularAlias);
  public static BumpAlias: string = 'bumpTexture';
  public static Bump: number = this.register(TextureAttribute.BumpAlias);
  public static NormalAlias: string = 'normalTexture';
  public static Normal: number = this.register(TextureAttribute.NormalAlias);
  public static AmbientAlias: string = 'ambientTexture';
  public static Ambient: number = this.register(TextureAttribute.AmbientAlias);
  public static EmissiveAlias: string = 'emissiveTexture';
  public static Emissive: number = this.register(TextureAttribute.EmissiveAlias);
  public static ReflectionAlias: string = 'reflectionTexture';
  public static Reflection: number = this.register(TextureAttribute.ReflectionAlias);

  protected static Mask: number =
    this.Diffuse | this.Specular | this.Bump | this.Normal | this.Ambient | this.Emissive | this.Reflection;

  public static is(mask: number): boolean {
    return (mask & TextureAttribute.Mask) !== 0;
  }

  public static createDiffuse(region: TextureRegion): TextureAttribute {
    const ta = new TextureAttribute(TextureAttribute.Diffuse);
    ta.setTextureRegion(region);
    return ta;
  }

  public static createSpecular(region: TextureRegion): TextureAttribute {
    const ta = new TextureAttribute(TextureAttribute.Specular);
    ta.setTextureRegion(region);
    return ta;
  }

  public static createNormal(region: TextureRegion): TextureAttribute {
    const ta = new TextureAttribute(TextureAttribute.Normal);
    ta.setTextureRegion(region);
    return ta;
  }

  public static createBump(region: TextureRegion): TextureAttribute {
    const ta = new TextureAttribute(TextureAttribute.Bump);
    ta.setTextureRegion(region);
    return ta;
  }

  public static createAmbient(region: TextureRegion): TextureAttribute {
    const ta = new TextureAttribute(TextureAttribute.Ambient);
    ta.setTextureRegion(region);
    return ta;
  }

  public static createEmissive(region: TextureRegion): TextureAttribute {
    const ta = new TextureAttribute(TextureAttribute.Emissive);
    ta.setTextureRegion(region);
    return ta;
  }

  public static createReflection(region: TextureRegion): TextureAttribute {
    const ta = new TextureAttribute(TextureAttribute.Reflection);
    ta.setTextureRegion(region);
    return ta;
  }

  public texture: Texture;
  public offsetU = 0;
  public offsetV = 0;
  public scaleU = 1;
  public scaleV = 1;
  public uvIndex = 0;

  constructor(type: number, offsetU: number = 0, offsetV: number = 0, scaleU: number = 1, scaleV: number = 1) {
    super();
    this.offsetU = offsetU;
    this.offsetV = offsetV;
    this.scaleU = scaleU;
    this.scaleV = scaleV;
    this.Attribute(type);
  }

  public setTextureRegion(region: TextureRegion) {
    this.texture = region.texture;
    this.offsetU = region.u;
    this.offsetV = region.v;
    this.scaleU = region.u2 - this.offsetU;
    this.scaleV = region.v2 - this.offsetV;
  }

  public setTexture(texture: Texture) {
    this.texture = texture;
  }

  public setOffset(offsetU: number, offsetV: number) {
    this.offsetU = offsetU;
    this.offsetV = offsetV;
  }

  public setScale(scaleU: number, scaleV: number) {
    this.scaleU = scaleU;
    this.scaleV = scaleV;
  }

  public copy(): Attribute {
    const att = new TextureAttribute(this.type);
    att.offsetU = this.offsetU;
    att.offsetV = this.offsetV;
    att.scaleU = this.scaleU;
    att.scaleV = this.scaleV;
    att.uvIndex = this.uvIndex;
    att.texture = this.texture;
    return att;
  }
}
