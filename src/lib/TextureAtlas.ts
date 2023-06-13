import { Texture, TextureFilter, TextureWrap } from './Texture';
import { TextureRegion } from './TextureRegion';
import { Disposable, concatAndResolveUrl } from './Utils';

export class TextureAtlas implements Disposable {
  pages: { texture: Texture }[];
  regions: TextureRegion[];

  constructor(pages: { texture: Texture }[], regions: TextureRegion[]) {
    this.pages = pages;
    this.regions = regions;
  }
  dispose(): void {
    for (let page of this.pages) {
      page.texture.dispose();
    }
  }

  getPages(): Texture[] {
    return this.pages.map(page => page.texture);
  }
  getRegions(): TextureRegion[] {
    return this.regions;
  }
  findRegion(name: string, index?: number): TextureRegion | null {
    for (let i = 0; i < this.regions.length; i++) {
      let region = this.regions[i];
      if (region.name !== name) continue;
      if (index !== undefined && region.index !== index) continue;
      return region;
    }
    return null;
  }
  findRegions(name: string): TextureRegion[] {
    return this.regions.filter(region => region.name === name).sort((a, b) => a.index - b.index);
  }

  static async load(gl: WebGLRenderingContext, packFileUrl: string, textureOptions?: any): Promise<TextureAtlas> {
    const packFileContent = await fetch(packFileUrl).then(res => res.text());

    const pageData: any[] = [];
    const pages: { texture: Texture }[] = [];
    const regionsData: any[] = [];

    let pageImage;

    const lines = packFileContent.split(/\r?\n/);

    let i = 0;
    let tuple;

    while (true) {
      let line = lines[i];
      if (line === undefined) {
        break;
      }
      if (line.trim().length === 0) {
        pageImage = null;
      } else if (!pageImage) {
        const file = concatAndResolveUrl(packFileUrl, `../${line}`);

        i++;
        line = lines[i];
        tuple = line
          .split(':')[1]
          .split(',')
          .map(s => s.trim());

        const width = parseInt(tuple[0], 10);
        const height = parseInt(tuple[1], 10);

        i++;
        line = lines[i];
        tuple = line
          .split(':')[1]
          .split(',')
          .map(s => s.trim());

        const format = tuple[0];

        i++;
        line = lines[i];
        tuple = line
          .split(':')[1]
          .split(',')
          .map(s => s.trim());

        const [min, max] = tuple;

        i++;
        line = lines[i];
        tuple = line
          .split(':')[1]
          .split(',')
          .map(s => s.trim());

        const direction = tuple[0];

        let repeatX = TextureWrap.ClampToEdge;
        let repeatY = TextureWrap.ClampToEdge;

        if (direction === 'x') {
          repeatX = TextureWrap.Repeat;
        } else if (direction === 'y') {
          repeatY = TextureWrap.Repeat;
        } else if (direction === 'xy') {
          repeatX = TextureWrap.Repeat;
          repeatY = TextureWrap.Repeat;
        }

        const mipMaps = min !== 'Nearest' && min !== 'Linear';

        pageImage = {
          file,
          width,
          height,
          format,
          mipMaps,
          min,
          max,
          direction,
          repeatX,
          repeatY
        };
        pageData.push(pageImage);
      } else {
        const name = line;

        i++;
        line = lines[i];
        tuple = line
          .split(':')[1]
          .split(',')
          .map(s => s.trim());

        const rotate = tuple[0] === 'true';

        i++;
        line = lines[i];
        tuple = line
          .split(':')[1]
          .split(',')
          .map(s => s.trim());

        const left = parseInt(tuple[0], 10);
        const top = parseInt(tuple[1], 10);

        i++;
        line = lines[i];
        tuple = line
          .split(':')[1]
          .split(',')
          .map(s => s.trim());

        const width = parseInt(tuple[0], 10);
        const height = parseInt(tuple[1], 10);

        const region: any = {
          name,
          rotate,
          left,
          top,
          width,
          height,
          page: pageImage
        };

        i++;
        line = lines[i];
        tuple = line
          .split(':')[1]
          .split(',')
          .map(s => s.trim());

        if (tuple.length === 4) {
          region.splits = tuple.map(i => parseInt(i, 10));

          i++;
          line = lines[i];
          tuple = line
            .split(':')[1]
            .split(',')
            .map(s => s.trim());

          if (tuple.length === 4) {
            region.pads = tuple.map(i => parseInt(i, 10));

            i++;
            line = lines[i];
            tuple = line
              .split(':')[1]
              .split(',')
              .map(s => s.trim());
          }
        }

        region.originalWidth = parseInt(tuple[0], 10);
        region.originalHeight = parseInt(tuple[1], 10);

        i++;
        line = lines[i];
        tuple = line
          .split(':')[1]
          .split(',')
          .map(s => s.trim());

        region.offsetX = parseInt(tuple[0], 10);
        region.offsetY = parseInt(tuple[1], 10);

        i++;
        line = lines[i];
        tuple = line
          .split(':')[1]
          .split(',')
          .map(s => s.trim());

        region.index = parseInt(tuple[0], 10);

        regionsData.push(region);
      }
      i++;
    }

    for (let page of pageData) {
      page.texture = await Texture.load(gl, page.file, textureOptions);
      const minFilter = page.min === 'Nearest' ? TextureFilter.Nearest : TextureFilter.Linear;
      const maxFilter = page.max === 'Nearest' ? TextureFilter.Nearest : TextureFilter.Linear;
      page.texture.setFilters(minFilter, maxFilter);
      page.invTexWidth = 1 / page.texture.width;
      page.invTexHeight = 1 / page.texture.height;
      pages.push(page);
    }

    const regions: TextureRegion[] = [];

    for (let regionData of regionsData) {
      const { left: x, top: y } = regionData;

      const width = regionData.rotate ? regionData.height : regionData.width;
      const height = regionData.rotate ? regionData.width : regionData.height;
      const { texture, invTexWidth, invTexHeight } = regionData.page;

      regions.push(
        new TextureRegion(texture, x, y, width, height, regionData, invTexWidth, invTexHeight, regionData.rotate)
      );
    }

    return new TextureAtlas(pages, regions);
  }
}
