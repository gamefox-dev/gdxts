import { MultiTextureBatch } from './MultiTextureBatch';
import { PolygonBatch } from './PolygonBatcher';
import { TextureRegion } from './TextureRegion';
import { Color, Rectangle } from './Utils';
import { Vector2 } from './Vector2';

/* eslint-disable */
const X1 = 0;
const Y1 = 1;
const C1R = 2;
const C1G = 3;
const C1B = 4;
const C1A = 5;
const U1 = 6;
const V1 = 7;
const C1R2 = 8;
const C1G2 = 9;
const C1B2 = 10;
const C1A2 = 11;
const X2 = 12;
const Y2 = 13;
const C2R = 14;
const C2G = 15;
const C2B = 16;
const C2A = 17;
const U2 = 18;
const V2 = 19;
const C2R2 = 20;
const C2G2 = 21;
const C2B2 = 22;
const C2A2 = 23;
const X3 = 24;
const Y3 = 25;
const C3R = 26;
const C3G = 27;
const C3B = 28;
const C3A = 29;
const U3 = 30;
const V3 = 31;
const C3R2 = 32;
const C3G2 = 33;
const C3B2 = 34;
const C3A2 = 35;
const X4 = 36;
const Y4 = 37;
const C4R = 38;
const C4G = 39;
const C4B = 40;
const C4A = 41;
const U4 = 42;
const V4 = 43;
const C4R2 = 44;
const C4G2 = 45;
const C4B2 = 46;
const C4A2 = 47;
/* eslint-enable */

/**
 * An unoptimized version of Sprite. Always calculate all vertices, never update partially. Will improve later after refactoring the SpriteBatch.
 */
export class Sprite {
  dirty = false;
  position = new Vector2(0, 0);
  size = new Vector2(0, 0);
  origin = new Vector2(0, 0);
  scale = new Vector2(1, 1);
  color = new Color(1, 1, 1, 1);
  rotation = 0;

  vertices = new Float32Array(48);

  public constructor(public region: TextureRegion) {
    this.setSize(region.width, region.height);
    this.setOrigin(region.width / 2, region.height / 2);
  }

  public set(sprite: Sprite) {
    this.region = sprite.region;
    this.position.setVector(sprite.position);
    this.size.setVector(sprite.size);
    this.origin.setVector(sprite.origin);
    this.rotation = sprite.rotation;
    this.scale.setVector(sprite.scale);
    this.color.setFromColor(sprite.color);
    this.dirty = true;
  }

  public setBounds(x: number, y: number, width: number, height: number) {
    this.setPosition(x, y);
    this.setSize(width, height);
    this.dirty = true;
  }

  public setSize(width: number, height: number) {
    this.size.set(width, height);
    this.dirty = true;
  }

  public setPosition(x: number, y: number) {
    this.position.set(x, y);
    this.dirty = true;
  }

  public setOriginBasedPosition(x: number, y: number) {
    this.setPosition(x - this.origin.x, y - this.origin.y);
  }

  public setX(x: number) {
    this.position.x = x;
    this.dirty = true;
  }

  public setY(y: number) {
    this.position.y = y;
    this.dirty = true;
  }

  /** Sets the x position so that it is centered on the given x parameter */
  public setCenterX(x: number) {
    this.setX(x - this.size.x / 2);
  }

  /** Sets the y position so that it is centered on the given y parameter */
  public setCenterY(y: number) {
    this.setY(y - this.size.y / 2);
  }

  /** Sets the position so that the sprite is centered on (x, y) */
  public setCenter(x: number, y: number) {
    this.setPosition(x - this.size.x / 2, y - this.size.y / 2);
  }

  /** Sets the x position relative to the current position where the sprite will be drawn. If origin, rotation, or scale are
   * changed, it is slightly more efficient to translate after those operations. */
  public translateX(xAmount: number) {
    this.translate(xAmount, 0);
  }

  /** Sets the y position relative to the current position where the sprite will be drawn. If origin, rotation, or scale are
   * changed, it is slightly more efficient to translate after those operations. */
  public translateY(yAmount: number) {
    this.translate(0, yAmount);
  }

  public translate(xAmount: number, yAmount: number) {
    this.position.add(xAmount, yAmount);
    this.dirty = true;
  }

  /** Sets the color used to tint this sprite. Default is {@link Color#WHITE}. */
  public setColor(tint: Color) {
    this.color.setFromColor(tint);
    this.dirty = true;
  }

  /** Sets the alpha portion of the color used to tint this sprite. */
  public setAlpha(a: number) {
    this.color.a = a;
    this.dirty = true;
  }

  /** Sets the origin in relation to the sprite's position for scaling and rotation. */
  public setOrigin(originX: number, originY: number) {
    this.origin.set(originX, originY);
    this.dirty = true;
  }

  /** Place origin in the center of the sprite */
  public setOriginCenter() {
    this.origin.set(this.size.x / 2, this.size.y / 2);
    this.dirty = true;
  }

  public setRotation(rad: number) {
    this.rotation = rad;
    this.dirty = true;
  }

  public getRotation() {
    return this.rotation;
  }

  public rotate(rad: number) {
    if (rad === 0) return;
    this.rotation += rad;
    this.dirty = true;
  }

  /** Sets the sprite's scale for both X and Y. The sprite scales out from the origin. This will not affect the values returned
   * by {@link #getWidth()} and {@link #getHeight()} */
  public setScale(scaleX: number, scaleY: number) {
    this.scale.set(scaleX, scaleY);
    this.dirty = true;
  }

  public setScaleXY(scale: number) {
    this.scale.set(scale, scale);
    this.dirty = true;
  }

  /** Sets the sprite's scale relative to the current scale. for example: original scale 2 -> sprite.scale(4) -> final scale 6.
   * The sprite scales out from the origin. This will not affect the values returned by {@link #getWidth()} and
   * {@link #getHeight()} */
  public applyScale(amount: number) {
    this.scale.scale(amount);
    this.dirty = true;
  }

  /** Returns the packed vertices, colors, and texture coordinates for this sprite. */
  public getVertices(yDown = false): Float32Array {
    const { vertices, region } = this;
    if (!this.dirty) {
      return vertices;
    }
    let x: number = this.position.x;
    let y: number = this.position.y;
    let width: number = this.size.x;
    let height: number = this.size.y;
    let originX = this.origin.x;
    let originY = this.origin.y;
    let rotation = this.rotation;
    let scaleX = this.flipX ? -this.scale.x : this.scale.x;
    let scaleY = this.flipY ? -this.scale.y : this.scale.y;

    let ou1 = region.u;
    let ov1 = region.v;
    let ou2 = region.u2;
    let ov2 = region.v2;

    const color = this.color;

    let rotate = region.rotated;

    const xRatio = width / region.originalWidth;
    const yRatio = height / region.originalHeight;

    const drawWidth = region.width * xRatio;
    const drawHeight = region.height * yRatio;

    const drawX = x + region.offsetX * xRatio;

    let drawY = 0;
    if (yDown) {
      drawY = y + height - region.offsetY * yRatio - drawHeight;
    } else {
      drawY = y + region.offsetY * yRatio;
    }

    x = drawX;
    y = drawY;
    width = drawWidth;
    height = drawHeight;

    if (yDown) {
      const tmpV1 = ov1;
      ov1 = ov2;
      ov2 = tmpV1;
    }

    let x1 = -originX;
    let x2 = width - originX;
    let x3 = width - originX;
    let x4 = -originX;

    let y1 = -originY;
    let y2 = -originY;
    let y3 = height - originY;
    let y4 = height - originY;

    if (scaleX !== 1) {
      x1 = x1 * scaleX;
      x2 = x2 * scaleX;
      x3 = x3 * scaleX;
      x4 = x4 * scaleX;
    }

    if (scaleY !== 1) {
      y1 = y1 * scaleY;
      y2 = y2 * scaleY;
      y3 = y3 * scaleY;
      y4 = y4 * scaleY;
    }

    if (rotation !== 0) {
      var cos = Math.cos(rotation);
      var sin = Math.sin(rotation);

      var rotatedX1 = cos * x1 - sin * y1;
      var rotatedY1 = sin * x1 + cos * y1;

      var rotatedX2 = cos * x2 - sin * y2;
      var rotatedY2 = sin * x2 + cos * y2;

      var rotatedX3 = cos * x3 - sin * y3;
      var rotatedY3 = sin * x3 + cos * y3;

      var rotatedX4 = cos * x4 - sin * y4;
      var rotatedY4 = sin * x4 + cos * y4;

      x1 = rotatedX1;
      x2 = rotatedX2;
      x3 = rotatedX3;
      x4 = rotatedX4;

      y1 = rotatedY1;
      y2 = rotatedY2;
      y3 = rotatedY3;
      y4 = rotatedY4;
    }

    x1 += x + originX;
    x2 += x + originX;
    x3 += x + originX;
    x4 += x + originX;

    y1 += y + originY;
    y2 += y + originY;
    y3 += y + originY;
    y4 += y + originY;

    let u1 = ou1;
    let v1 = ov1;
    let u2 = ou2;
    let v2 = ov2;
    let u3 = u2;
    let v3 = v1;
    let u4 = u1;
    let v4 = v2;

    if (rotate) {
      if (yDown) {
        u1 = ou1;
        v1 = ov2;
        u2 = ou2;
        v2 = ov1;
        u3 = ou1;
        v3 = ov1;
        u4 = ou2;
        v4 = ov2;
      } else {
        u1 = ou2;
        v1 = ov1;
        u2 = ou1;
        v2 = ov2;
        u3 = ou2;
        v3 = ov2;
        u4 = ou1;
        v4 = ov1;
      }
    }

    var i = 0;
    vertices[i++] = x1;
    vertices[i++] = y1;
    vertices[i++] = color.r;
    vertices[i++] = color.g;
    vertices[i++] = color.b;
    vertices[i++] = color.a;
    vertices[i++] = u1;
    vertices[i++] = v1;
    vertices[i++] = 0;
    vertices[i++] = 0;
    vertices[i++] = 0;
    vertices[i++] = 0;
    vertices[i++] = x2;
    vertices[i++] = y2;
    vertices[i++] = color.r;
    vertices[i++] = color.g;
    vertices[i++] = color.b;
    vertices[i++] = color.a;
    vertices[i++] = u3;
    vertices[i++] = v3;
    vertices[i++] = 0;
    vertices[i++] = 0;
    vertices[i++] = 0;
    vertices[i++] = 0;
    vertices[i++] = x3;
    vertices[i++] = y3;
    vertices[i++] = color.r;
    vertices[i++] = color.g;
    vertices[i++] = color.b;
    vertices[i++] = color.a;
    vertices[i++] = u2;
    vertices[i++] = v2;
    vertices[i++] = 0;
    vertices[i++] = 0;
    vertices[i++] = 0;
    vertices[i++] = 0;
    vertices[i++] = x4;
    vertices[i++] = y4;
    vertices[i++] = color.r;
    vertices[i++] = color.g;
    vertices[i++] = color.b;
    vertices[i++] = color.a;
    vertices[i++] = u4;
    vertices[i++] = v4;
    vertices[i++] = 0;
    vertices[i++] = 0;
    vertices[i++] = 0;
    vertices[i] = 0;

    return vertices;
  }

  bounds: Rectangle = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
  };
  /** Returns the bounding axis aligned {@link Rectangle} that bounds this sprite. The rectangles x and y coordinates describe
   * its bottom left corner. If you change the position or size of the sprite, you have to fetch the triangle again for it to be
   * recomputed.
   *
   * @return the bounding Rectangle */
  public getBoundingRectangle(): Rectangle {
    const vertices = this.vertices;
    let minx = vertices[X1];
    let miny = vertices[Y1];
    let maxx = vertices[X1];
    let maxy = vertices[Y1];

    minx = minx > vertices[X2] ? vertices[X2] : minx;
    minx = minx > vertices[X3] ? vertices[X3] : minx;
    minx = minx > vertices[X4] ? vertices[X4] : minx;

    maxx = maxx < vertices[X2] ? vertices[X2] : maxx;
    maxx = maxx < vertices[X3] ? vertices[X3] : maxx;
    maxx = maxx < vertices[X4] ? vertices[X4] : maxx;

    miny = miny > vertices[Y2] ? vertices[Y2] : miny;
    miny = miny > vertices[Y3] ? vertices[Y3] : miny;
    miny = miny > vertices[Y4] ? vertices[Y4] : miny;

    maxy = maxy < vertices[Y2] ? vertices[Y2] : maxy;
    maxy = maxy < vertices[Y3] ? vertices[Y3] : maxy;
    maxy = maxy < vertices[Y4] ? vertices[Y4] : maxy;

    this.bounds.x = minx;
    this.bounds.y = miny;
    this.bounds.width = maxx - minx;
    this.bounds.height = maxy - miny;

    return this.bounds;
  }

  public draw(batch: PolygonBatch) {
    // TODO: fix this, for the particle
    if (batch instanceof MultiTextureBatch || !batch.twoColorTint) {
      throw new Error('Sprite only works with normal PolygonBatch with twoColorTint enabled');
    }
    batch.drawVertices(this.region.texture, this.getVertices(batch.yDown));
  }

  public drawWithAlpha(batch: PolygonBatch, alphaModulation: number) {
    const oldAlpha = this.getColor().a;
    this.setAlpha(oldAlpha * alphaModulation);
    this.draw(batch);
    this.setAlpha(oldAlpha);
  }

  public getX(): number {
    return this.position.x;
  }

  public getY(): number {
    return this.position.y;
  }

  /** @return the width of the sprite, not accounting for scale. */
  public getWidth(): number {
    return this.size.x;
  }

  /** @return the height of the sprite, not accounting for scale. */
  public getHeight(): number {
    return this.size.y;
  }

  /** The origin influences {@link #setPosition(float, float)}, {@link #setRotation(float)} and the expansion direction of
   * scaling {@link #setScale(float, float)} */
  public getOriginX(): number {
    return this.origin.x;
  }

  /** The origin influences {@link #setPosition(float, float)}, {@link #setRotation(float)} and the expansion direction of
   * scaling {@link #setScale(float, float)} */
  public getOriginY(): number {
    return this.origin.y;
  }

  /** X scale of the sprite, independent of size set by {@link #setSize(float, float)} */
  public getScaleX(): number {
    return this.scale.x;
  }

  /** Y scale of the sprite, independent of size set by {@link #setSize(float, float)} */
  public getScaleY(): number {
    return this.scale.y;
  }

  /** Returns the color of this sprite. If the returned instance is manipulated, {@link #setColor(Color)} must be called
   * afterward. */
  public getColor(): Color {
    return this.color;
  }

  private flipX = false;
  private flipY = false;

  public isFlipX() {
    return this.flipX;
  }

  public isFlipY() {
    return this.flipY;
  }

  /** Set the sprite's flip state regardless of current condition
   * @param x the desired horizontal flip state
   * @param y the desired vertical flip state */
  public setFlip(x: boolean, y: boolean) {
    this.flipX = x;
    this.flipY = y;
    this.dirty = true;
  }

  /** boolean parameters x,y are not setting a state, but performing a flip
   * @param x perform horizontal flip
   * @param y perform vertical flip */
  public flip(x: boolean, y: boolean) {
    if (x) {
      this.flipX = !this.flipX;
    }
    if (y) {
      this.flipY = !this.flipY;
    }
    if (x || y) {
      this.dirty = true;
    }
  }
}
