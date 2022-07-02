export abstract class Texture {
  protected _image: HTMLImageElement | ImageBitmap;

  constructor(image: HTMLImageElement | ImageBitmap) {
    this._image = image;
  }

  getImage(): HTMLImageElement | ImageBitmap {
    return this._image;
  }

  abstract setFilters(minFilter: TextureFilter, magFilter: TextureFilter): void;
  abstract setWraps(uWrap: TextureWrap, vWrap: TextureWrap): void;
  abstract dispose(): void;
}

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

export class TextureRegion {
  renderObject: any;
  u = 0;
  v = 0;
  u2 = 0;
  v2 = 0;
  width = 0;
  height = 0;
  degrees = 0;
  offsetX = 0;
  offsetY = 0;
  originalWidth = 0;
  originalHeight = 0;
}

export class FakeTexture extends Texture {
  setFilters(minFilter: TextureFilter, magFilter: TextureFilter) {}
  setWraps(uWrap: TextureWrap, vWrap: TextureWrap) {}
  dispose() {}
}
