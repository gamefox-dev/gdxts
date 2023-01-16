import { Affine2 } from './Affine2';
import { BitmapFont } from './BitmapFont';
import { Glyph } from './Glyph';
import { GlyphLayout } from './GlyphLayout';
import { GlyphRun } from './GlyphRun';
import { NumberUtil } from './NumberUtils';
import { PolygonBatch } from './PolygonBatcher';
import { TextureRegion } from './TextureRegion';
import { Color, Pools, Utils, Align } from './Utils';
import { Vector2 } from './Vector2';

export class BitmapFontCache {
  private tempColor: Color = new Color(1, 1, 1, 1);

  private drawingTexts: string[] = [];
  private font: BitmapFont;
  private integer: boolean;
  private layouts: GlyphLayout[] = [];
  private pooledLayouts: GlyphLayout[] = [];
  private glyphCount: number;
  private x: number;
  private y: number;
  private color: Color = new Color(1, 1, 1, 1);
  private currentTint: number;

  /** Vertex data per page. */
  private pageVertices: number[][];
  /** Number of vertex data entries per page. */
  private idx: number[];
  /** For each page, an array with a value for each glyph from that page, where the value is the index of the character in the
   * full text being cached. */
  private pageGlyphIndices: number[][];
  /** Used internally to ensure a correct capacity for multi-page font vertex data. */
  private tempGlyphCount: number[];

  /** @param integer If true, rendering positions will be at integer values to avoid filtering artifacts. */
  constructor(font: BitmapFont, integer: boolean) {
    this.font = font;
    this.integer = integer;

    const pageCount = font.regions.length;
    if (pageCount === 0) console.log('The specified font must contain at least one texture page.');

    this.pageVertices = new Array(pageCount).fill([]);
    this.idx = new Array(pageCount);
    if (pageCount > 1) {
      // Contains the indices of the glyph in the cache as they are added.
      this.pageGlyphIndices = new Array(pageCount);
      for (let i = 0, n = this.pageGlyphIndices.length; i < n; i++) this.pageGlyphIndices[i] = [];
    }
    this.tempGlyphCount = new Array(pageCount);

    Pools.get('GlyphLayout', () => new GlyphLayout(font, '', 0, 0, Color.WHITE, 0, Align.left, false));
  }

  /** Sets the position of the text, relative to the position when the cached text was created.
   * @param x The x coordinate
   * @param y The y coordinate */
  public setPosition = (x: number, y: number) => {
    this.translate(x - this.x, y - this.y);
  };

  /** Sets the position of the text, relative to its current position.
   * @param xAmount The amount in x to move the text
   * @param yAmount The amount in y to move the text */
  public translate = (xAmount: number, yAmount: number) => {
    if (xAmount === 0 && yAmount === 0) return;
    if (this.integer) {
      xAmount = Math.round(xAmount);
      yAmount = Math.round(yAmount);
    }
    this.x += xAmount;
    this.y += yAmount;

    const pageVertices: number[][] = this.pageVertices;
    for (let i = 0, n = pageVertices.length; i < n; i++) {
      const vertices: number[] = pageVertices[i];
      for (let ii = 0, nn = this.idx[i]; ii < nn; ii += 5) {
        vertices[ii] += xAmount;
        vertices[ii + 1] += yAmount;
      }
    }
  };

  /** Tints all text currently in the cache. Does not affect subsequently added text. */
  // public tint = (tint: Color) => {
  //    const newTint: number = tint.toFloatBits();
  //    if (this.currentTint == newTint) return;
  //    this.currentTint = newTint;

  //    const pageVertices: number[][] = this.pageVertices;
  //    const tempColor: Color = this.tempColor;
  //    const tempGlyphCount: number[] = this.tempGlyphCount;
  //    for (let i = 0; i < tempGlyphCount.length; i++) {
  //       tempGlyphCount[i] = 0;
  //    }

  //    for (let i = 0, n = this.layouts.length; i < n; i++) {
  //       const layout: GlyphLayout = this.layouts[i];
  //       const colors: number[] = layout.colors;
  //       let colorsIndex = 0,
  //          nextColorGlyphIndex = 0,
  //          glyphIndex = 0;
  //       let lastColorFloatBits = 0;
  //       for (let ii = 0, nn = layout.runs.length; ii < nn; ii++) {
  //          const run: GlyphRun = layout.runs[ii];
  //          const glyphs: Glyph[] = run.glyphs;
  //          for (let iii = 0, nnn = run.glyphs.length; iii < nnn; iii++) {
  //             if (glyphIndex++ === nextColorGlyphIndex) {
  //                Color.abgr8888ToColor(tempColor, colors[++colorsIndex]);
  //                lastColorFloatBits = tempColor.mul(tint).toFloatBits();
  //                nextColorGlyphIndex = ++colorsIndex < colors.length ? colors[colorsIndex] : -1;
  //             }
  //             const page: number = glyphs[iii].page;
  //             const offset = tempGlyphCount[page] * 20 + 2;
  //             tempGlyphCount[page]++;
  //             const vertices: number[] = pageVertices[page];
  //             vertices[offset] = lastColorFloatBits;
  //             vertices[offset + 5] = lastColorFloatBits;
  //             vertices[offset + 10] = lastColorFloatBits;
  //             vertices[offset + 15] = lastColorFloatBits;
  //          }
  //       }
  //    }
  // };

  /** Sets the alpha component of all text currently in the cache. Does not affect subsequently added text. */
  // public setAlphas = (alpha: number) => {
  //    const alphaBits: number = (254 * alpha) << 24;
  //    let prev = 0,
  //       newColor = 0;
  //    for (let j = 0, length = this.pageVertices.length; j < length; j++) {
  //       const vertices: number[] = this.pageVertices[j];
  //       for (let i = 2, n = this.idx[j]; i < n; i += 5) {
  //          const c: number = vertices[i];
  //          if (c == prev && i != 2) {
  //             vertices[i] = newColor;
  //          } else {
  //             prev = c;
  //             let rgba = NumberUtils.floatToIntColor(c);
  //             rgba = (rgba & 0x00ffffff) | alphaBits;
  //             newColor = NumberUtils.intToFloatColor(rgba);
  //             vertices[i] = newColor;
  //          }
  //       }
  //    }
  // };

  public setColors = (r: number, g: number, b: number, a: number) => {
    const intBits = (255 << 24) | ((255 * b) << 16) | ((255 * g) << 8) | (255 * r);
    const value = NumberUtil.intToFloatColor(intBits);

    for (let j = 0, length = this.pageVertices.length; j < length; j++) {
      const vertices: number[] = this.pageVertices[j];
      for (let i = 2, n = this.idx[j]; i < n; i += 5) vertices[i] = value;
    }
  };

  /** Returns the color used for subsequently added text. Modifying the color affects text subsequently added to the cache, but
   * does not affect existing text currently in the cache. */
  public getColor = (): Color => {
    return this.color;
  };

  /** A convenience method for setting the cache color. The color can also be set by modifying {@link #getColor()}. */
  public setColor = (r: number, g: number, b: number, a: number) => {
    this.color.set(r, g, b, a);
  };

  public draw(batch: PolygonBatch) {
    const regions: TextureRegion[] = this.font.getRegions();
    for (let i = 0; i < this.pageVertices.length; i++) {
      if (this.idx[i] > 0) {
        const vertices = this.pageVertices[i];
        for (let j = 0; j < this.idx[i] / 20; j++) {
          const offset = 20 * j;
          const region = regions.find(item => (item as any).id === this.drawingTexts?.[j]);
          if (region) {
            region.draw(
              batch,
              vertices[0 + offset],
              vertices[1 + offset],
              vertices[10 + offset] - vertices[0 + offset],
              vertices[11 + offset] - vertices[1 + offset]
            );
          }
        }
      }
    }
  }

  temVec2 = new Vector2();
  public drawTransformed(batch: PolygonBatch, transform: Affine2) {
    const regions: TextureRegion[] = this.font.getRegions();
    for (let i = 0; i < this.pageVertices.length; i++) {
      if (this.idx[i] > 0) {
        const vertices = this.pageVertices[i];
        for (let j = 0; j < this.idx[i] / 20; j++) {
          const offset = 20 * j;
          const region = regions.find(item => (item as any).id === this.drawingTexts?.[j]);
          if (region) {
            transform.getTranslation(this.temVec2);
            const det = transform.det();

            const x = vertices[0 + offset] * det;
            const y = vertices[1 + offset] * det;

            region.draw(
              batch,
              x + this.temVec2.x,
              y + this.temVec2.y,
              (vertices[10 + offset] - vertices[0 + offset]) * det,
              (vertices[11 + offset] - vertices[1 + offset]) * det
            );
          }
        }
      }
    }
  }

  /** Removes all glyphs in the cache. */
  public clear = () => {
    this.x = 0;
    this.y = 0;
    Pools.freeAll('GlyphLayout', this.pooledLayouts);
    this.pooledLayouts.length = 0;
    this.layouts.length = 0;
    for (let i = 0, n = this.idx.length; i < n; i++) {
      if (this.pageGlyphIndices != null) this.pageGlyphIndices[i].length = 0;
      this.idx[i] = 0;
    }
  };

  private requireGlyphs = (layout: GlyphLayout) => {
    if (this.pageVertices.length === 1) {
      // Simple if we just have one page.
      this.requirePageGlyphs(0, layout.glyphCount);
    } else {
      const tempGlyphCount: number[] = this.tempGlyphCount;
      for (let i = 0; i < tempGlyphCount.length; i++) {
        tempGlyphCount[i] = 0;
      }

      // Determine # of glyphs in each page.
      for (let i = 0, n = layout.runs.length; i < n; i++) {
        const glyphs: Glyph[] = layout.runs[i].glyphs;
        const glyphItems: Glyph[] = glyphs;
        for (let ii = 0, nn = glyphs.length; ii < nn; ii++) tempGlyphCount[glyphItems[ii].page]++;
      }
      // Require that many for each page.
      for (let i = 0, n = tempGlyphCount.length; i < n; i++) this.requirePageGlyphs(i, tempGlyphCount[i]);
    }
  };

  private requirePageGlyphs = (page: number, glyphCount: number) => {
    // if (this.pageGlyphIndices != null) {
    //    if (glyphCount > this.pageGlyphIndices[page].length)
    //       this.pageGlyphIndices[page].ensureCapacity(glyphCount - this.pageGlyphIndices[page].length);
    // }

    const vertexCount = this.idx[page] + glyphCount * 20;
    const vertices: number[] = this.pageVertices[page];
    if (!vertices) {
      this.pageVertices[page] = new Array(vertexCount);
    } else if (vertices.length < vertexCount) {
      const newVertices: number[] = new Array(vertexCount);
      Utils.arrayCopy(vertices, 0, newVertices, 0, this.idx[page]);
      this.pageVertices[page] = newVertices;
    }
  };

  private setPageCount = (pageCount: number) => {
    const newPageVertices: number[][] = new Array(pageCount).fill([]);
    Utils.arrayCopy(this.pageVertices, 0, newPageVertices, 0, this.pageVertices.length);
    this.pageVertices = [...newPageVertices];

    const newIdx: number[] = new Array(pageCount);
    Utils.arrayCopy(this.idx, 0, newIdx, 0, this.idx.length);
    this.idx = newIdx;

    const newPageGlyphIndices: number[][] = new Array(pageCount);
    let pageGlyphIndicesLength = 0;
    if (this.pageGlyphIndices != null) {
      pageGlyphIndicesLength = this.pageGlyphIndices.length;
      Utils.arrayCopy(this.pageGlyphIndices, 0, newPageGlyphIndices, 0, this.pageGlyphIndices.length);
    }
    for (let i = pageGlyphIndicesLength; i < pageCount; i++) newPageGlyphIndices[i] = [];
    this.pageGlyphIndices = newPageGlyphIndices;

    this.tempGlyphCount = new Array(pageCount);
  };

  private addToCache = (layout: GlyphLayout, x: number, y: number) => {
    const runCount = layout.runs.length;
    if (runCount === 0) return;

    // Check if the number of font pages has changed.
    if (this.pageVertices.length < this.font.regions.length) this.setPageCount(this.font.regions.length);

    this.layouts.push(layout);
    this.requireGlyphs(layout);

    const colors = layout.colors;
    let colorsIndex = 0,
      nextColorGlyphIndex = 0,
      glyphIndex = 0;
    let lastColorFloatBits = 0;
    this.drawingTexts.length = 0;
    for (let i = 0; i < runCount; i++) {
      const run: GlyphRun = layout.runs[i];
      const glyphs: Glyph[] = run.glyphs;
      const xAdvances: number[] = run.xAdvances;
      let gx = x + run.x,
        gy = y + run.y;
      for (let ii = 0, nn = run.glyphs.length; ii < nn; ii++) {
        if (glyphIndex++ === nextColorGlyphIndex) {
          lastColorFloatBits = NumberUtil.intToFloatColor(colors[++colorsIndex]);
          nextColorGlyphIndex = ++colorsIndex < colors.length ? colors[colorsIndex] : -1;
        }
        gx += xAdvances[ii];
        this.drawingTexts.push(glyphs[ii].id);
        this.addGlyph(glyphs[ii], gx, gy, lastColorFloatBits);
      }
    }

    const whiteIntBits = (255 << 24) | (255 << 16) | (255 << 8) | 255;
    this.currentTint = NumberUtil.intToFloatColor(whiteIntBits); // Cached glyphs have changed, reset the current tint.
  };

  private addGlyph = (glyph: Glyph, x: number, y: number, color: number) => {
    let scaleX = this.font.data.scaleX,
      scaleY = this.font.data.scaleY;
    x += glyph.xoffset * scaleX;
    y += glyph.yoffset * scaleY;
    let width = glyph.width * scaleX,
      height = glyph.height * scaleY;
    let u = glyph.u,
      u2 = glyph.u2,
      v = glyph.v,
      v2 = glyph.v2;

    if (this.integer) {
      x = Math.round(x);
      y = Math.round(y);
      width = Math.round(width);
      height = Math.round(height);
    }
    let x2 = x + width,
      y2 = y + height;

    const page = glyph.page;
    let idx = this.idx[page];
    this.idx[page] += 20;

    if (this.pageGlyphIndices != null) this.pageGlyphIndices[page].push(this.glyphCount++);

    const vertices: number[] = this.pageVertices[page];
    vertices[idx++] = x;
    vertices[idx++] = y;
    vertices[idx++] = color;
    vertices[idx++] = u;
    vertices[idx++] = v;

    vertices[idx++] = x;
    vertices[idx++] = y2;
    vertices[idx++] = color;
    vertices[idx++] = u;
    vertices[idx++] = v2;

    vertices[idx++] = x2;
    vertices[idx++] = y2;
    vertices[idx++] = color;
    vertices[idx++] = u2;
    vertices[idx++] = v2;

    vertices[idx++] = x2;
    vertices[idx++] = y;
    vertices[idx++] = color;
    vertices[idx++] = u2;
    vertices[idx] = v;
  };

  // public GlyphLayout setText (CharSequence str, float x, float y) {
  // 	clear();
  // 	return addText(str, x, y, 0, str.length(), 0, Align.left, false);
  // }

  // public GlyphLayout setText (CharSequence str, float x, float y, float targetWidth, int halign, boolean wrap) {
  // 	clear();
  // 	return addText(str, x, y, 0, str.length(), targetWidth, halign, wrap);
  // }

  // public GlyphLayout setText (CharSequence str, float x, float y, int start, int end, float targetWidth, int halign,
  // 	boolean wrap) {
  // 	clear();
  // 	return addText(str, x, y, start, end, targetWidth, halign, wrap);
  // }

  public setText = (
    str: string,
    x: number,
    y: number,
    start: number,
    end: number,
    targetWidth: number,
    halign: number,
    wrap: boolean,
    truncate?: string
  ): GlyphLayout => {
    this.clear();
    return this.addText(str, x, y, start, end, targetWidth, halign, wrap, truncate);
  };

  public setTextToCache = (layout: GlyphLayout, x: number, y: number) => {
    this.clear();
    this.addTextToCache(layout, x, y);
  };

  // public GlyphLayout addText (CharSequence str, float x, float y) {
  // 	return addText(str, x, y, 0, str.length(), 0, Align.left, false, null);
  // }

  // public GlyphLayout addText (CharSequence str, float x, float y, float targetWidth, int halign, boolean wrap) {
  // 	return addText(str, x, y, 0, str.length(), targetWidth, halign, wrap, null);
  // }

  // public GlyphLayout addText (CharSequence str, float x, float y, int start, int end, float targetWidth, int halign,
  // 	boolean wrap) {
  // 	return addText(str, x, y, start, end, targetWidth, halign, wrap, null);
  // }

  public addText = (
    str: string,
    x: number,
    y: number,
    start: number,
    end: number,
    targetWidth: number,
    halign: number,
    wrap: boolean,
    truncate?: string
  ): GlyphLayout => {
    const layout: GlyphLayout = Pools.obtain('GlyphLayout');

    this.pooledLayouts.push(layout);
    layout.setText(this.font, str, start, end, this.color, targetWidth, halign, wrap, truncate);
    this.addTextToCache(layout, x, y);
    return layout;
  };

  public addTextToCache = (layout: GlyphLayout, x: number, y: number) => {
    this.addToCache(layout, x, y + this.font.data.ascent);
  };

  /** Returns the x position of the cached string, relative to the position when the string was cached. */
  public getX = (): number => {
    return this.x;
  };

  /** Returns the y position of the cached string, relative to the position when the string was cached. */
  public getY = (): number => {
    return this.y;
  };

  public getFont = (): BitmapFont => {
    return this.font;
  };

  public setUseIntegerPositions = (use: boolean) => {
    this.integer = use;
  };

  /** @return whether this font uses integer positions for drawing. */
  public usesIntegerPositions = (): boolean => {
    return this.integer;
  };

  public getVertices = (page: number): number[] => {
    return this.pageVertices[page];
  };

  public getVertexCount = (page: number) => {
    return this.idx[page];
  };

  public getLayouts = (): GlyphLayout[] => {
    return this.layouts;
  };
}
