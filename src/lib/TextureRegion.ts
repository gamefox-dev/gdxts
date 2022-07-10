import { PolygonBatch } from "./PolygonBatcher";
import { Texture } from "./Texture";

export class TextureRegion {
  static splitTexture(texture, cols, rows): TextureRegion[] {
    const { width, height } = texture;
    const regionWidth = width / cols;
    const regionHeight = height / rows;

    const regions = [];

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        regions.push(
          new TextureRegion(
            texture,
            x * regionWidth,
            y * regionHeight,
            regionWidth,
            regionHeight,
            {}
          )
        );
      }
    }
    return regions;
  }

  name: string | null = null;
  index = 0;
  texture: Texture = null;
  x = 0;
  y = 0;
  width = 0;
  height = 0;
  invTexWidth = 0;
  invTexHeight = 0;
  originalWidth = 0;
  originalHeight = 0;
  offsetX = 0;
  offsetY = 0;
  u = 0;
  v = 0;
  u2 = 0;
  v2 = 0;
  rotate = false;

  constructor(
    tex: Texture,
    x: number,
    y: number,
    width: number,
    height: number,
    extraData: any,
    invTexWidth?: number,
    invTexHeight?: number,
    rotate: boolean = false
  ) {
    if (!invTexWidth || !invTexHeight) {
      invTexWidth = 1 / tex.width;
      invTexHeight = 1 / tex.height;
    }
    const u = x * invTexWidth;
    const v = (y + height) * invTexHeight;
    const u2 = (x + width) * invTexWidth;
    const v2 = y * invTexHeight;

    this.texture = tex;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;

    this.originalWidth = width;
    this.originalHeight = height;
    this.offsetX = 0;
    this.offsetY = 0;

    this.u = u;
    this.v = v;
    this.u2 = u2;
    this.v2 = v2;

    this.rotate = rotate;

    for (let key in extraData) {
      this[key] = extraData[key];
    }
  }

  draw(
    batch: PolygonBatch,
    x: number,
    y: number,
    width: number,
    height: number,
    originX = 0,
    originY = 0,
    rotation = 0,
    scaleX = 1,
    scaleY = 1
  ) {
    const originalWidth = this.originalWidth;
    const offsetX = this.offsetX;
    const offsetY = this.offsetY;

    const ratio = width / originalWidth;

    const drawWidth = this.width * ratio;
    const drawHeight = this.height * ratio;

    const drawX = x + offsetX * ratio;
    const drawY = y + height - offsetY * ratio - drawHeight;

    originX = originX - (drawX - x);
    originY = originY - (drawY - y);

    batch.draw(
      this.texture,
      drawX,
      drawY,
      drawWidth,
      drawHeight,
      originX,
      originY,
      rotation,
      scaleX,
      scaleY,
      this.u,
      this.v,
      this.u2,
      this.v2,
      this.rotate
    );
  }
}
