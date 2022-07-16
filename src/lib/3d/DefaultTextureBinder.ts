import { Texture } from "../Texture";

export class DefaultTextureBinder {
  static ROUNDROBIN: number = 0;
  static LRU: number = 1;
  static MAX_GLES_UNITS: number = 32;
  private offset: number;
  private count: number;
  private textures: Texture[];
  private unitsLRU: number[];
  private method: number;
  private reused: boolean;
  private reuseCount: number = 0;
  private bindCount: number = 0;
  static gl: WebGLRenderingContext;

  constructor(
    gl: WebGLRenderingContext,
    method: number,
    offset: number = 0,
    count: number = -1
  ) {
    DefaultTextureBinder.gl = gl;
    const max = Math.min(
      DefaultTextureBinder.getMaxTextureUnits(),
      DefaultTextureBinder.MAX_GLES_UNITS
    );
    if (count < 0) count = max - offset;
    if (offset < 0 || count < 0 || offset + count > max)
      throw new Error("Illegal arguments");
    this.method = method;
    this.offset = offset;
    this.count = count;
    this.textures = new Array<Texture>(count);
    this.unitsLRU =
      method === DefaultTextureBinder.LRU ? new Array<number>(count) : null;
  }

  private static getMaxTextureUnits(): number {
    return this.gl.getParameter(this.gl.MAX_TEXTURE_IMAGE_UNITS) as number;
  }

  begin() {
    for (let i = 0; i < this.count; i++) {
      this.textures[i] = null;
      if (this.unitsLRU != null) this.unitsLRU[i] = i;
    }
  }

  end() {
    DefaultTextureBinder.gl.activeTexture(DefaultTextureBinder.gl.TEXTURE0);
  }

  bindTexture(texture: Texture, rebind: boolean = false): number {
    let idx: number, result: number;
    let reused = false;

    switch (this.method) {
      case DefaultTextureBinder.ROUNDROBIN:
        result = this.offset + (idx = this.bindTextureRoundRobin(texture));
        break;
      case DefaultTextureBinder.LRU:
        result = this.offset + (idx = this.bindTextureLRU(texture));
        break;
      default:
        return -1;
    }

    if (reused) {
      this.reuseCount++;
      if (rebind) texture.bind(result);
      else
        DefaultTextureBinder.gl.activeTexture(
          DefaultTextureBinder.gl.TEXTURE0 + result
        );
    } else this.bindCount++;
    return result;
  }

  private currentTexture = 0;

  private bindTextureRoundRobin(texture: Texture): number {
    for (let i = 0; i < this.count; i++) {
      const idx = (this.currentTexture + i) % this.count;
      if (this.textures[idx] === texture) {
        this.reused = true;
        return idx;
      }
    }
    this.currentTexture = (this.currentTexture + 1) % this.count;
    this.textures[this.currentTexture] = texture;
    texture.bind(this.offset + this.currentTexture);
    return this.currentTexture;
  }

  private bindTextureLRU(texture: Texture): number {
    let i;
    for (i = 0; i < this.count; i++) {
      const idx = this.unitsLRU[i];
      if (this.textures[idx] === texture) {
        this.reused = true;
        break;
      }
      if (this.textures[idx] == null) {
        break;
      }
    }
    if (i >= this.count) i = this.count - 1;
    const idx = this.unitsLRU[i];
    while (i > 0) {
      this.unitsLRU[i] = this.unitsLRU[i - 1];
      i--;
    }
    this.unitsLRU[0] = idx;
    if (!this.reused) {
      this.textures[idx] = texture;
      texture.bind(this.offset + idx);
    }
    return idx;
  }

  getBindCount(): number {
    return this.bindCount;
  }

  getReuseCount(): number {
    return this.reuseCount;
  }

  resetCounts() {
    this.bindCount = this.reuseCount = 0;
  }
}
