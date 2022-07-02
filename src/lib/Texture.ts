import { ManagedWebGLRenderingContext } from "./WebGL";

export enum TextureFilter {
  Nearest = 9728, // WebGLRenderingContext.NEAREST
  Linear = 9729, // WebGLRenderingContext.LINEAR
  MipMap = 9987, // WebGLRenderingContext.LINEAR_MIPMAP_LINEAR
  MipMapNearestNearest = 9984, // WebGLRenderingContext.NEAREST_MIPMAP_NEAREST
  MipMapLinearNearest = 9985, // WebGLRenderingContext.LINEAR_MIPMAP_NEAREST
  MipMapNearestLinear = 9986, // WebGLRenderingContext.NEAREST_MIPMAP_LINEAR
  MipMapLinearLinear = 9987, // WebGLRenderingContext.LINEAR_MIPMAP_LINEAR
}

export enum TextureWrap {
  MirroredRepeat = 33648, // WebGLRenderingContext.MIRRORED_REPEAT
  ClampToEdge = 33071, // WebGLRenderingContext.CLAMP_TO_EDGE
  Repeat = 10497, // WebGLRenderingContext.REPEAT
}

export class Texture {
  protected _image: HTMLImageElement | ImageBitmap;

  getImage(): HTMLImageElement | ImageBitmap {
    return this._image;
  }

  static load(
    gl: WebGLRenderingContext,
    url: string,
    useMipmaps = false
  ): Promise<Texture> {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        resolve(new Texture(gl, image, useMipmaps));
      };
      image.src = url;
    });
  }

  context: ManagedWebGLRenderingContext;
  private texture: WebGLTexture = null;
  private boundUnit = 0;
  private useMipMaps = false;

  public width = 0;
  public height = 0;

  public static DISABLE_UNPACK_PREMULTIPLIED_ALPHA_WEBGL = false;

  constructor(
    context: ManagedWebGLRenderingContext | WebGLRenderingContext,
    image: HTMLImageElement | ImageBitmap,
    useMipMaps: boolean = false
  ) {
    this._image = image;
    this.context =
      context instanceof ManagedWebGLRenderingContext
        ? context
        : new ManagedWebGLRenderingContext(context);
    this.useMipMaps = useMipMaps;
    this.restore();
    this.context.addRestorable(this);

    this.width = image.width;
    this.height = image.height;
  }

  setFilters(minFilter: TextureFilter, magFilter: TextureFilter) {
    let gl = this.context.gl;
    this.bind();
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MAG_FILTER,
      Texture.validateMagFilter(magFilter)
    );
  }

  static validateMagFilter(magFilter: TextureFilter) {
    switch (magFilter) {
      case TextureFilter.MipMap:
      case TextureFilter.MipMapLinearLinear:
      case TextureFilter.MipMapLinearNearest:
      case TextureFilter.MipMapNearestLinear:
      case TextureFilter.MipMapNearestNearest:
        return TextureFilter.Linear;
      default:
        return magFilter;
    }
  }

  setWraps(uWrap: TextureWrap, vWrap: TextureWrap) {
    let gl = this.context.gl;
    this.bind();
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, uWrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, vWrap);
  }

  update(useMipMaps: boolean) {
    let gl = this.context.gl;
    if (!this.texture) this.texture = this.context.gl.createTexture();
    this.bind();
    if (Texture.DISABLE_UNPACK_PREMULTIPLIED_ALPHA_WEBGL)
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      this._image
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      useMipMaps ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (useMipMaps) gl.generateMipmap(gl.TEXTURE_2D);
  }

  restore() {
    this.texture = null;
    this.update(this.useMipMaps);
  }

  bind(unit: number = 0) {
    let gl = this.context.gl;
    this.boundUnit = unit;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
  }

  unbind() {
    let gl = this.context.gl;
    gl.activeTexture(gl.TEXTURE0 + this.boundUnit);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  dispose() {
    this.context.removeRestorable(this);
    let gl = this.context.gl;
    gl.deleteTexture(this.texture);
  }
}
