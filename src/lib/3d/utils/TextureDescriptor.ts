import { Texture, TextureFilter, TextureWrap } from '../../Texture';

export class TextureDescriptor<T extends Texture> {
  public texture: T = null;
  public minFilter: TextureFilter;
  public magFilter: TextureFilter;
  public uWrap: TextureWrap;
  public vWrap: TextureWrap;

  // TODO add other values, see http://www.opengl.org/sdk/docs/man/xhtml/glTexParameter.xml
  constructor(
    texture: T = null,
    minFilter: TextureFilter = null,
    magFilter: TextureFilter = null,
    uWrap: TextureWrap = null,
    vWrap: TextureWrap = null
  ) {
    this.set(texture, minFilter, magFilter, uWrap, vWrap);
  }

  public set(texture: T, minFilter: TextureFilter, magFilter: TextureFilter, uWrap: TextureWrap, vWrap: TextureWrap) {
    this.texture = texture;
    this.minFilter = minFilter;
    this.magFilter = magFilter;
    this.uWrap = uWrap;
    this.vWrap = vWrap;
  }

  public setFromOther(other: TextureDescriptor<T>) {
    this.texture = other.texture;
    this.minFilter = other.minFilter;
    this.magFilter = other.magFilter;
    this.uWrap = other.uWrap;
    this.vWrap = other.vWrap;
  }
}
