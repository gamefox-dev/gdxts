import { Pixmap } from '../../../../Pixmap';
import { Disposable } from '../../../../Utils';
import { GLTFImage } from '../../data/texture/GLTFImage';
import { DataFileResolver } from '../shared/data/DataFileResolver';

export class ImageResolver implements Disposable {
  private pixmaps = new Array<Pixmap>();

  private dataFileResolver: DataFileResolver;

  constructor(dataFileResolver: DataFileResolver) {
    this.dataFileResolver = dataFileResolver;
  }

  public load(glImages: GLTFImage[]) {
    if (!!glImages) {
      for (let i = 0; i < glImages.length; i++) {
        const pixmap = this.dataFileResolver.loadGLTFImage(glImages[i]);
        this.pixmaps.push(pixmap);
      }
    }
  }

  public get(index: number): Pixmap {
    return this.pixmaps[index];
  }

  public dispose() {
    for (const pixmap of this.pixmaps) {
      pixmap.dispose();
    }
    this.pixmaps.length = 0;
  }
}
