import { Texture, TextureFilter, TextureWrap } from '../../../../Texture';
import { Disposable } from '../../../../Utils';
import { TextureDescriptor } from '../../../utils/TextureDescriptor';
import { GLTFSampler } from '../../data/texture/GLTFSampler';
import { GLTFTexture } from '../../data/texture/GLTFTexture';
import { GLTFTextureInfo } from '../../data/texture/GLTFTextureInfo';
import { GLTFTypes } from '../shared/GLTFTypes';
import { ImageResolver } from './ImageResolver';

export class TextureResolver implements Disposable {
  protected texturesSimple = new Map<number, Texture>();
  protected texturesMipmap = new Map<number, Texture>();
  protected glTextures: GLTFTexture[];
  protected glSamplers: GLTFSampler[];

  public loadTextures(glTextures: GLTFTexture[], glSamplers: GLTFSampler[], imageResolver: ImageResolver) {
    this.glTextures = glTextures;
    this.glSamplers = glSamplers;
    if (!!glTextures) {
      for (let i = 0; i < glTextures.length; i++) {
        const glTexture = glTextures[i];

        // check if mipmap needed for this texture configuration
        let useMipMaps = false;
        if (!!glTexture.sampler) {
          const sampler = glSamplers[glTexture.sampler];
          if (GLTFTypes.isMipMapFilter(sampler)) {
            useMipMaps = true;
          }
        }

        const textureMap = useMipMaps ? this.texturesMipmap : this.texturesSimple;

        if (!textureMap.has(glTexture.source)) {
          // const pixmap = imageResolver.get(glTexture.source);
          // const texture = new Texture(pixmap, useMipMaps);
          // textureMap.put(glTexture.source, texture);
        }
      }
    }
  }

  public getTexture(glMap: GLTFTextureInfo): Texture {
    const glTexture = this.glTextures[glMap.index];

    const textureDescriptor = new TextureDescriptor<Texture>();

    let useMipMaps: boolean;
    if (!!glTexture.sampler) {
      const glSampler = this.glSamplers[glTexture.sampler];
      GLTFTypes.mapTextureSampler(textureDescriptor, glSampler);
      useMipMaps = GLTFTypes.isMipMapFilter(glSampler);
    } else {
      // default sampler options.
      // https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#texture
      textureDescriptor.minFilter = TextureFilter.Linear;
      textureDescriptor.magFilter = TextureFilter.Linear;
      textureDescriptor.uWrap = TextureWrap.Repeat;
      textureDescriptor.vWrap = TextureWrap.Repeat;
      useMipMaps = false;
    }

    const textureMap = useMipMaps ? this.texturesMipmap : this.texturesSimple;

    const texture = textureMap.get(glTexture.source);
    if (!texture) {
      throw new Error('texture not loaded');
    }
    return texture;
  }

  public dispose() {
    for (const [key, value] of this.texturesSimple) {
      value.dispose();
    }
    for (const [key, value] of this.texturesMipmap) {
      value.dispose();
    }
    this.texturesMipmap.clear();
  }

  public getTextures(textures: Texture[]): Texture[] {
    for (const [key, value] of this.texturesSimple) {
      textures.push(value);
    }
    for (const [key, value] of this.texturesMipmap) {
      textures.push(value);
    }
    return textures;
  }
}
