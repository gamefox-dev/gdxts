import { Texture } from "./Texture";
import { TextureAtlas } from "./TextureAtlas";

export default class AssetManager {
  gl: WebGLRenderingContext;
  promises: Array<Promise<any>> = [];
  atlases: Map<string, TextureAtlas> = new Map();
  textures: Map<string, Texture> = new Map();
  done = 0;
  listeners: any[] = [];
  addListener(handler: any) {
    this.listeners.push(handler);
  }
  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
  }
  reportDone() {
    this.done++;
    for (const handler of this.listeners) {
      handler(
        (this.done / this.getTotal()) * 100,
        this.done >= this.getTotal()
      );
    }
  }
  loadAtlas(path: string, name: string): Promise<TextureAtlas> {
    const promise = TextureAtlas.load(this.gl, path, {}).then((atlas) => {
      this.atlases.set(name, atlas);
      this.reportDone();
      return atlas;
    });
    this.promises.push(promise);
    return promise;
  }
  // fonts: Map<string, BitmapFont> = new Map();
  // loadFont(path: string, name: string): Promise<BitmapFont> {
  //   const promise = loadFont(this.gl, path, {}).then(font => {
  //     this.fonts.set(name, font);
  //     this.reportDone();
  //     return font;
  //   });
  //   this.promises.push(promise);
  //   return promise;
  // }
  // getFont(name: string): BitmapFont | undefined {
  //   return this.fonts.get(name);
  // }
  getAtlas(name: string): TextureAtlas | undefined {
    return this.atlases.get(name);
  }
  loadTexture(path: string, name: string): Promise<Texture> {
    const promise = Texture.load(this.gl, path).then((texture) => {
      this.textures.set(name, texture);
      this.reportDone();
      return texture;
    });
    this.promises.push(promise);
    return promise;
  }
  getTexture(name: string): Texture | undefined {
    return this.textures.get(name);
  }
  async finishLoading() {
    await Promise.all(this.promises);
  }
  getDone(): number {
    return this.done;
  }
  getTotal(): number {
    return this.promises.length;
  }
  disposeAll(): void {
    const atlasKeys = [...this.atlases.keys()];
    atlasKeys.forEach((key) => {
      const textureRegions = this.atlases.get(key)?.getRegions() || [];
      textureRegions.forEach((texture) => {
        (texture.texture as any)?.destroy();
      });
      this.atlases.delete(key);
    });

    const localTextureKeys = [...this.textures.keys()];
    localTextureKeys.forEach((key) => {
      (this.textures.get(key) as any)?.destroy();
      this.textures.delete(key);
    });

    // const fontMapKeys = [...this.fonts.keys()];
    // fontMapKeys.forEach(key => {
    //   const textureRegions =
    //     ((this.fonts.get(key) as any)?.getRegions() as TextureRegion[]) || [];
    //   textureRegions.forEach(texture => {
    //     (texture.texture as any)?.destroy();
    //   });
    //   this.fonts.delete(key);
    // });
  }
}
