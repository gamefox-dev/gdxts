import { PolygonBatch } from '../../PolygonBatcher';
import { TextureRegion } from '../../TextureRegion';
import { Vector2 } from '../../Vector2';
import { Actor } from '../Actor';
import { ImageTransform } from '../ActorStyle';
import { Stage } from '../Stage';

export enum ImageMode {
  Cover,
  Contain,
  Center,
  Stretch
}

const defaultImageTransform: ImageTransform = {
  originX: 0,
  originY: 0,
  rotation: 0,
  scaleX: 1,
  scaleY: 1
};

export class Image extends Actor {
  region?: TextureRegion;
  imageMode = ImageMode.Center;
  vertices = new Float32Array(48);
  layoutNeedUpdate = true;

  constructor(stage: Stage, regionName = '', atlasName = 'default', index?: number) {
    super(stage);
    this.setRegionKey(regionName, atlasName, index);
  }

  setRegionKey(regionName: string, atlasName = 'default', index?: number): Image {
    const atlas = this.stage.skin.atlases[atlasName];
    if (!atlas) return;
    const region = atlas.findRegion(regionName, index);
    if (!region) return;

    return this.setRegion(region);
  }

  setRegion(region: TextureRegion): Image {
    this.region = region;
    this.layoutNeedUpdate = true;
    return this;
  }

  setImageMode(mode: ImageMode): Image {
    this.imageMode = mode;
    this.layoutNeedUpdate = true;
    return this;
  }

  drawPos = new Vector2(0, 0);
  drawSize = new Vector2(0, 0);

  setLayout(drawX: number, drawY: number, drawWidth: number, drawHeight: number) {
    this.drawPos.set(drawX, drawY);
    this.drawSize.set(drawWidth, drawHeight);
  }

  calculateLayout() {
    // TODO: using vertices for clipping uv? or using scissor?

    const regionWidth = this.region.originalWidth;
    const regionHeight = this.region.originalHeight;
    const regionRatio = regionWidth / regionHeight;
    const displayRatio = this.displaySize.x / this.displaySize.y;

    if (this.imageMode === ImageMode.Stretch) {
      this.setLayout(this.displayPosition.x, this.displayPosition.y, this.displaySize.x, this.displaySize.y);
    } else if (this.imageMode === ImageMode.Contain) {
      if (regionRatio < displayRatio) {
        this.setLayout(
          this.displayPosition.x,
          this.displayPosition.y,
          this.displaySize.y * regionRatio,
          this.displaySize.y
        );
      } else {
        this.setLayout(
          this.displayPosition.x,
          this.displayPosition.y,
          this.displaySize.x,
          this.displaySize.x / regionRatio
        );
      }
    } else if (this.imageMode === ImageMode.Center) {
      if (regionRatio < displayRatio) {
        this.setLayout(
          this.displayPosition.x + (this.displaySize.x - this.displaySize.y * regionRatio) / 2,
          this.displayPosition.y,
          this.displaySize.y * regionRatio,
          this.displaySize.y
        );
      } else {
        this.setLayout(
          this.displayPosition.x,
          this.displayPosition.y + (this.displaySize.y - this.displaySize.x / regionRatio) / 2,
          this.displaySize.x,
          this.displaySize.x / regionRatio
        );
      }
    } else if (this.imageMode === ImageMode.Cover) {
      if (regionRatio < displayRatio) {
        this.setLayout(
          this.displayPosition.x,
          this.displayPosition.y,
          this.displaySize.x,
          this.displaySize.x / regionRatio
        );
      } else {
        this.setLayout(
          this.displayPosition.x,
          this.displayPosition.y,
          this.displaySize.y * regionRatio,
          this.displaySize.x
        );
      }
    }
    this.layoutNeedUpdate = false;
  }

  public draw(batch: PolygonBatch): void {
    super.draw(batch);
    if (!this.region) return;
    if (this.layoutNeedUpdate) this.calculateLayout();

    let imageTransform = this.style.imageTransform || defaultImageTransform;
    this.region.draw(
      batch,
      this.drawPos.x,
      this.drawPos.y,
      this.drawSize.x,
      this.drawSize.y,
      imageTransform.originX * this.drawSize.x,
      imageTransform.originY * this.drawSize.y,
      imageTransform.rotation,
      imageTransform.scaleX,
      imageTransform.scaleY
    );
  }
}
