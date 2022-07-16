import { BitmapFontCache } from "./BitmapFontCache";
import { BitmapFontData } from "./BitmapFontData";
import { Glyph } from "./Glyph";
import { PolygonBatch } from "./PolygonBatcher";
import { TextureRegion } from "./TextureRegion";
import { Color } from "./Utils";

export class BitmapFont {
  data: BitmapFontData;
  regions: TextureRegion[];
  private cache: BitmapFontCache;
  private flipped: boolean;
  integer: boolean;
  private ownsTexture: boolean;

  /** Constructs a new BitmapFont from the given {@link BitmapFontData} and array of {@link TextureRegion}. If the TextureRegion
   * is null or empty, the image path(s) will be read from the BitmapFontData. The dispose() method will not dispose the texture
   * of the region(s) if the regions array is != null and not empty.
   * @param integer If true, rendering positions will be at integer values to avoid filtering artifacts. */
  constructor(
    data: BitmapFontData,
    regions: TextureRegion[],
    integer: boolean
  ) {
    this.regions = regions;

    this.flipped = data.flipped;
    this.data = data;
    this.integer = integer;

    if (this.regions.length === 0) {
      console.log("No texture region were found");
      return;
    } else {
      this.ownsTexture = false;
    }

    this.cache = this.newFontCache();

    this.load(data);
  }

  public static load = async (
    fontFile: string,
    gl: WebGLRenderingContext,
    flip: boolean,
    interger: boolean
  ) => {
    const fontData = new BitmapFontData(fontFile, flip);
    await fontData.loadFont(gl);
    return new BitmapFont(fontData, fontData.regions, interger);
  };

  load = (data: BitmapFontData) => {
    const glyphValues = Object.values(data.glyphs);
    for (let i = 0; i < glyphValues.length; i++) {
      const page = glyphValues[i];
      if (!page) continue;
      for (let j = 0; j < page.length; j++) {
        const glyph = page[j];
        if (glyph) {
          data.setGlyphRegion(glyph, this.regions[glyph.page]);
        }
      }
    }

    if (data.missingGlyph != null)
      data.setGlyphRegion(
        data.missingGlyph,
        this.regions[data.missingGlyph.page]
      );
  };

  /** Draws text at the specified position.
   * @see BitmapFontCache#addText(CharSequence, float, float, int, int, float, int, boolean, String) */
  draw = (
    batch: PolygonBatch,
    str: string,
    x: number,
    y: number,
    start: number,
    end: number,
    targetWidth: number,
    halign: number,
    wrap: boolean,
    truncate?: string
  ) => {
    this.cache.clear();
    this.cache.addText(
      str,
      x,
      y,
      start,
      end,
      targetWidth,
      halign,
      wrap,
      truncate
    );
    this.cache.draw(batch);
  };

  /** Returns the color of text drawn with this font. */
  getColor = (): Color => {
    return this.cache.getColor();
  };

  /** A convenience method for setting the font color. The color can also be set by modifying {@link #getColor()}. */
  // setColor = (r: number, g: number, b: number, a: number) => {
  //    this.cache.getColor().set(r, g, b, a);
  // };

  getScaleX = (): number => {
    return this.data.scaleX;
  };

  getScaleY = (): number => {
    return this.data.scaleY;
  };

  /** Returns the array of TextureRegions that represents each texture page of glyphs.
   * @return the array of texture regions; modifying it may produce undesirable results */
  getRegions = (): TextureRegion[] => {
    return this.regions;
  };

  /** Returns the texture page at the given index.
   * @return the texture page at the given index */
  getRegion = (index: number): TextureRegion => {
    return this.regions[index];
  };

  /** Returns the line height, which is the distance from one line of text to the next. */
  getLineHeight = (): number => {
    return this.data.lineHeight;
  };

  /** Returns the x-advance of the space character. */
  getSpaceXadvance = (): number => {
    return this.data.spaceXadvance;
  };

  /** Returns the x-height, which is the distance from the top of most lowercase characters to the baseline. */
  getXHeight = (): number => {
    return this.data.xHeight;
  };

  /** Returns the cap height, which is the distance from the top of most uppercase characters to the baseline. Since the drawing
   * position is the cap height of the first line, the cap height can be used to get the location of the baseline. */
  getCapHeight = (): number => {
    return this.data.capHeight;
  };

  /** Returns the ascent, which is the distance from the cap height to the top of the tallest glyph. */
  getAscent = (): number => {
    return this.data.ascent;
  };

  /** Returns the descent, which is the distance from the bottom of the glyph that extends the lowest to the baseline. This
   * number is negative. */
  getDescent = (): number => {
    return this.data.descent;
  };

  /** Returns true if this BitmapFont has been flipped for use with a y-down coordinate system. */
  isFlipped = (): boolean => {
    return this.flipped;
  };

  /** Disposes the texture used by this BitmapFont's region IF this BitmapFont created the texture. */
  dispose = () => {
    if (this.ownsTexture) {
      for (let i = 0; i < this.regions.length; i++) {
        this.regions[i].texture.dispose();
      }
    }
  };

  /** Makes the specified glyphs fixed width. This can be useful to make the numbers in a font fixed width. Eg, when horizontally
   * centering a score or loading percentage text, it will not jump around as different numbers are shown. */
  setFixedWidthGlyphs = (glyphs: string) => {
    const data: BitmapFontData = this.data;
    let maxAdvance = 0;
    for (let index = 0, end = glyphs.length; index < end; index++) {
      const g: Glyph | undefined = data.getGlyph(glyphs.charAt(index));
      if (g != null && g.xadvance > maxAdvance) maxAdvance = g.xadvance;
    }
    for (let index = 0, end = glyphs.length; index < end; index++) {
      const g: Glyph | undefined = data.getGlyph(glyphs.charAt(index));
      if (!g) continue;
      g.xoffset += (maxAdvance - g.xadvance) / 2;
      g.xadvance = maxAdvance;
      g.kerning = [];
      g.kerning = null;
      g.fixedWidth = true;
    }
  };

  /** Specifies whether to use integer positions. Default is to use them so filtering doesn't kick in as badly. */
  setUseIntegerPositions = (integer: boolean) => {
    this.integer = integer;
    this.cache.setUseIntegerPositions(integer);
  };

  /** Checks whether this font uses integer positions for drawing. */
  usesIntegerPositions = (): boolean => {
    return this.integer;
  };

  /** For expert usage -- returns the BitmapFontCache used by this font, for rendering to a sprite batch. This can be used, for
   * example, to manipulate glyph colors within a specific index.
   * @return the bitmap font cache used by this font */
  getCache = (): BitmapFontCache => {
    return this.cache;
  };

  /** Gets the underlying {@link BitmapFontData} for this BitmapFont. */
  getData = (): BitmapFontData => {
    return this.data;
  };

  /** @return whether the texture is owned by the font, font disposes the texture itself if true */
  getOwnsTexture = (): boolean => {
    return this.ownsTexture;
  };

  /** Sets whether the font owns the texture. In case it does, the font will also dispose of the texture when {@link #dispose()}
   * is called. Use with care!
   * @param ownsTexture whether the font owns the texture */
  setOwnsTexture = (ownsTexture: boolean) => {
    this.ownsTexture = ownsTexture;
  };

  /** Creates a new BitmapFontCache for this font. Using this method allows the font to provide the BitmapFontCache
   * implementation to customize rendering.
   * <p>
   * Note this method is called by the BitmapFont constructors. If a subclass overrides this method, it will be called before the
   * subclass constructors. */
  newFontCache = (): BitmapFontCache => {
    return new BitmapFontCache(this, this.integer);
  };
}
