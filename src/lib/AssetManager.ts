import { BitmapFont } from './BitmapFont';
import { Texture } from './Texture';
import { TextureAtlas } from './TextureAtlas';

export enum AssetType {
  Atlas = 'atlas',
  Texture = 'tex',
  Font = 'font',
  Json = 'json',
  Binary = 'bin'
}

export type AssetTypeClass<T extends AssetType> = T extends AssetType.Atlas
  ? TextureAtlas
  : T extends AssetType.Texture
  ? Texture
  : T extends AssetType.Font
  ? BitmapFont
  : T extends AssetType.Json
  ? any
  : T extends AssetType.Binary
  ? ArrayBuffer
  : never;

export class AssetManager {
  gl: WebGLRenderingContext;
  promises: Map<string, Promise<any>> = new Map();
  atlases: Map<string, TextureAtlas> = new Map();
  textures: Map<string, Texture> = new Map();
  jsonData: Map<string, any> = new Map();
  binaryData: Map<string, ArrayBuffer> = new Map();

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
      handler((this.done / this.getTotal()) * 100, this.done >= this.getTotal());
    }
  }
  loadAtlas(path: string, name: string, useMipMaps = false): Promise<TextureAtlas> {
    const promise = TextureAtlas.load(this.gl, path, useMipMaps).then(atlas => {
      this.atlases.set(name, atlas);
      this.reportDone();
      return atlas;
    });
    this.promises.set(`atlas:${name}`, promise);
    return promise;
  }
  getAtlas(name: string): TextureAtlas | undefined {
    return this.atlases.get(name);
  }
  loadJsonData(path: string, name: string): Promise<any> {
    const promise = fetch(path)
      .then(res => res.json())
      .then(json => {
        this.jsonData.set(name, json);
        this.reportDone();
        return json;
      });
    this.promises.set(`json:${name}`, promise);
    return promise;
  }
  getJsonData(name: string): any {
    return this.jsonData.get(name);
  }
  loadBinaryData(path: string, name: string): Promise<ArrayBuffer> {
    const promise = fetch(path)
      .then(res => res.arrayBuffer())
      .then(buffer => {
        this.binaryData.set(name, buffer);
        this.reportDone();
        return buffer;
      });
    this.promises.set(`bin:${name}`, promise);
    return promise;
  }
  getBinaryData(name: string): ArrayBuffer {
    return this.binaryData.get(name);
  }
  fonts: Map<string, BitmapFont> = new Map();
  loadFont(path: string, name: string, flip = false): Promise<BitmapFont> {
    const promise = BitmapFont.load(this.gl, path, flip).then(font => {
      this.fonts.set(name, font);
      this.reportDone();
      return font;
    });
    this.promises.set(`font:${name}`, promise);
    return promise;
  }
  getFont(name: string): BitmapFont | undefined {
    return this.fonts.get(name);
  }
  loadTexture(path: string, name: string, useMipMaps = false): Promise<Texture> {
    const promise = Texture.load(this.gl, path, useMipMaps).then(texture => {
      this.textures.set(name, texture);
      this.reportDone();
      return texture;
    });
    this.promises.set(`tex:${name}`, promise);
    return promise;
  }
  getTexture(name: string): Texture | undefined {
    return this.textures.get(name);
  }
  async finishLoading() {
    await Promise.all(this.promises.values());
  }
  getDone(): number {
    return this.done;
  }
  getTotal(): number {
    return this.promises.size;
  }
  getAsset<T extends AssetType>(name: string, type: T): AssetTypeClass<T> {
    switch (type) {
      case AssetType.Atlas:
        return this.getAtlas(name) as AssetTypeClass<T>;
      case AssetType.Texture:
        return this.getTexture(name) as AssetTypeClass<T>;
      case AssetType.Font:
        return this.getFont(name) as AssetTypeClass<T>;
      case AssetType.Json:
        return this.getJsonData(name) as AssetTypeClass<T>;
      case AssetType.Binary:
        return this.getBinaryData(name) as AssetTypeClass<T>;
    }
  }
  waitForAsset<T extends AssetType>(name: string, type: T): Promise<AssetTypeClass<T>> {
    return this.promises.get(`${type}:${name}`) as Promise<AssetTypeClass<T>>;
  }
  disposeAll(): void {
    const atlasKeys = [...this.atlases.keys()];
    atlasKeys.forEach(key => {
      this.atlases.get(key).dispose();
      this.atlases.delete(key);
    });

    const localTextureKeys = [...this.textures.keys()];
    localTextureKeys.forEach(key => {
      this.textures.get(key).dispose();
      this.textures.delete(key);
    });

    const fontMapKeys = [...this.fonts.keys()];
    fontMapKeys.forEach(key => {
      this.fonts.get(key).dispose();
      this.fonts.delete(key);
    });
  }
}

export default AssetManager;
