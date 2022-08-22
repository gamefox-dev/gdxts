import { BitmapFont } from '../BitmapFont';
import { TextureAtlas } from '../TextureAtlas';
import { concatAndResolveUrl, Disposable } from '../Utils';

export class Skin implements Disposable {
  constructor(public fonts: { [key: string]: BitmapFont } = {}, public atlases: { [key: string]: TextureAtlas } = {}) {}

  static async loadSkin(gl: WebGLRenderingContext, url: string, yDown = true): Promise<Skin> {
    const skin = new Skin();
    const fileData = await fetch(url).then(res => res.json());
    const fontPromises: Promise<BitmapFont>[] = [];
    const atlasPromises: Promise<TextureAtlas>[] = [];
    if (fileData.fonts) {
      for (let fontName in fileData.fonts) {
        let fontUrl = fileData.fonts[fontName];
        fontUrl = concatAndResolveUrl(url, `../${fontUrl}`);
        fontPromises.push(
          BitmapFont.load(gl, fontUrl, yDown).then(font => {
            skin.fonts[fontName] = font;
            return font;
          })
        );
      }
    }
    if (fileData.atlases) {
      for (let atlasName in fileData.atlases) {
        let atlasUrl = fileData.atlases[atlasName];
        atlasUrl = concatAndResolveUrl(url, `../${atlasUrl}`);
        atlasPromises.push(
          TextureAtlas.load(gl, atlasUrl).then(atlas => {
            skin.atlases[atlasName] = atlas;
            return atlas;
          })
        );
      }
    }
    await Promise.all([Promise.all(fontPromises), Promise.all(atlasPromises)]);
    return skin;
  }

  dispose(): void {
    for (let fontName in this.fonts) {
      this.fonts[fontName].dispose();
    }
    for (let atlasName in this.atlases) {
      this.atlases[atlasName].dispose();
    }
  }
}
