export enum TextureFilter {
  Nearest = 9728, // WebGLRenderingContext.NEAREST
  Linear = 9729, // WebGLRenderingContext.LINEAR
  MipMap = 9987, // WebGLRenderingContext.LINEAR_MIPMAP_LINEAR
  MipMapNearestNearest = 9984, // WebGLRenderingContext.NEAREST_MIPMAP_NEAREST
  MipMapLinearNearest = 9985, // WebGLRenderingContext.LINEAR_MIPMAP_NEAREST
  MipMapNearestLinear = 9986, // WebGLRenderingContext.NEAREST_MIPMAP_LINEAR
  MipMapLinearLinear = 9987 // WebGLRenderingContext.LINEAR_MIPMAP_LINEAR
}

export enum TextureWrap {
  MirroredRepeat = 33648, // WebGLRenderingContext.MIRRORED_REPEAT
  ClampToEdge = 33071, // WebGLRenderingContext.CLAMP_TO_EDGE
  Repeat = 10497 // WebGLRenderingContext.REPEAT
}

export class ImageSource {
  constructor(public width: number, public height: number, public data: ArrayBufferLike) {}
}

export class Texture {
  public _image: HTMLImageElement | ImageBitmap | ImageData | ImageSource;

  getImage(): HTMLImageElement | ImageBitmap | ImageData | ImageSource {
    return this._image;
  }

  static createWhiteTexture(gl: WebGLRenderingContext): Texture {
    const imageData = new ImageData(new Uint8ClampedArray([255, 255, 255, 255]), 1, 1);
    const texture = new Texture(gl, imageData);
    return texture;
  }

  static load(gl: WebGLRenderingContext, url: string, useMipmaps = false): Promise<Texture> {
    return new Promise(resolve => {
      const image = new Image();
      image.onload = () => {
        resolve(new Texture(gl, image, useMipmaps));
      };
      image.src = url;
    });
  }

  context: WebGLRenderingContext;
  private texture: WebGLTexture = null;
  private boundUnit = 0;
  private useMipMaps = false;

  public width = 0;
  public height = 0;

  public static DISABLE_UNPACK_PREMULTIPLIED_ALPHA_WEBGL = false;

  constructor(
    context: WebGLRenderingContext,
    image: HTMLImageElement | ImageBitmap | ImageData | ImageSource,
    useMipMaps: boolean = false
  ) {
    this._image = image;
    this.context = context;
    this.useMipMaps = useMipMaps;
    this.restore();

    this.width = image.width;
    this.height = image.height;
  }

  getWebGLTexture() {
    return this.texture;
  }

  setFilters(minFilter: TextureFilter, magFilter: TextureFilter) {
    let gl = this.context;
    this.bind();
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, Texture.validateMagFilter(magFilter));
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
    let gl = this.context;
    this.bind();
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, uWrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, vWrap);
  }

  update(useMipMaps: boolean) {
    let gl = this.context;
    if (!this.texture) this.texture = this.context.createTexture();
    this.bind();
    if (Texture.DISABLE_UNPACK_PREMULTIPLIED_ALPHA_WEBGL) {
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    } else {
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    }
    if (this._image instanceof ImageSource) {
      const view = new DataView(this._image.data);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        this._image.width,
        this._image.height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        view
      );
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this._image);
    }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, useMipMaps ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (useMipMaps) gl.generateMipmap(gl.TEXTURE_2D);
  }

  restore() {
    this.texture = null;
    this.update(this.useMipMaps);
  }

  bind(unit: number = 0) {
    let gl = this.context;
    this.boundUnit = unit;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
  }

  unbind() {
    let gl = this.context;
    gl.activeTexture(gl.TEXTURE0 + this.boundUnit);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  dispose() {
    let gl = this.context;
    gl.deleteTexture(this.texture);
  }
}
