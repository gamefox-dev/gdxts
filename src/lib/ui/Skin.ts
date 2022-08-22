import { BitmapFont } from '../BitmapFont';
import { TextureAtlas } from '../TextureAtlas';
import { concatAndResolveUrl } from '../Utils';

export interface Skin {
  fonts: BitmapFont[];
  atlases: TextureAtlas[];
}

export const loadSkin = async (gl: WebGLRenderingContext, url: string): Promise<Skin> => {
  const skin: Skin = {
    fonts: [],
    atlases: []
  };
  const fileData = await fetch(url).then(res => res.json());
  const fontPromises: Promise<BitmapFont>[] = [];
  const atlasPromises: Promise<TextureAtlas>[] = [];
  if (fileData.fonts && Array.isArray(fileData.fonts)) {
    for (let fontUrl of fileData.fonts) {
      fontUrl = concatAndResolveUrl(url, `../${fontUrl}`);
      fontPromises.push(
        BitmapFont.load(gl, fontUrl).then(font => {
          skin.fonts.push(font);
          return font;
        })
      );
    }
  }
  if (fileData.atlases && Array.isArray(fileData.atlases)) {
    for (let atlasUrl of fileData.atlases) {
      atlasUrl = concatAndResolveUrl(url, `../${atlasUrl}`);
      atlasPromises.push(
        TextureAtlas.load(gl, atlasUrl).then(atlas => {
          skin.atlases.push(atlas);
          return atlas;
        })
      );
    }
  }
  await Promise.all([Promise.all(fontPromises), Promise.all(atlasPromises)]);
  return skin;
};
