import { Glyph, PAGE_SIZE } from './Glyph';
import { GlyphRun } from './GlyphRun';
import { Texture } from './Texture';
import { TextureRegion } from './TextureRegion';
import { concatAndResolveUrl } from './Utils';

const CHARACTER_MAX_VALUE = 65535;

export class BitmapFontData {
  name: string;
  regions: TextureRegion[];
  /** An array of the image paths, for multiple texture pages. */
  imagePaths: string[];
  public fontFile: any;
  flipped: boolean;
  padTop: number;
  padRight: number;
  padBottom: number;
  padLeft: number;
  public size: number;
  /** The distance from one line of text to the next. To set this value, use {@link #setLineHeight(float)}. */
  public lineHeight: number;
  /** The distance from the top of most uppercase characters to the baseline. Since the drawing position is the cap height of
   * the first line, the cap height can be used to get the location of the baseline. */
  public capHeight = 1;
  /** The distance from the cap height to the top of the tallest glyph. */
  public ascent: number;
  /** The distance from the bottom of the glyph that extends the lowest to the baseline. This number is negative. */
  public descent: number;
  /** The distance to move down when \n is encountered. */
  public down: number;
  /** Multiplier for the line height of blank lines. down * blankLineHeight is used as the distance to move down for a blank
   * line. */
  public blankLineScale = 1;
  public scaleX = 1;
  scaleY = 1;
  public markupEnabled: boolean;
  /** The amount to add to the glyph X position when drawing a cursor between glyphs. This field is not set by the BMFont
   * file, it needs to be set manually depending on how the glyphs are rendered on the backing textures. */
  public cursorX: number;

  public glyphs: { [key in number]: Glyph[] } = {};
  /** The glyph to display for characters not in the font. May be null. */
  public missingGlyph: Glyph;

  /** The width of the space character. */
  public spaceXadvance: number;
  /** The x-height, which is the distance from the top of most lowercase characters to the baseline. */
  public xHeight = 1;

  /** Additional characters besides whitespace where text is wrapped. Eg, a hypen (-). */
  public breakChars: string[];
  public xChars: string[] = ['x', 'e', 'a', 'o', 'n', 's', 'r', 'c', 'u', 'm', 'v', 'w', 'z'];
  public capChars: string[] = [
    'M',
    'N',
    'B',
    'D',
    'C',
    'E',
    'F',
    'K',
    'A',
    'G',
    'H',
    'I',
    'J',
    'L',
    'O',
    'P',
    'Q',
    'R',
    'S',
    'T',
    'U',
    'V',
    'W',
    'X',
    'Y',
    'Z'
  ];

  private textureData?: {
    data: ImageData;
    width: number;
    height: number;
  }[];

  /** Creates an empty BitmapFontData for configuration before calling {@link #load(FileHandle, boolean)}, to subclass, or to
   * populate yourself, e.g. using stb-truetype or FreeType. */
  constructor(
    fontFile: string,
    flip: boolean,
    textureData?: {
      data: ImageData;
      width: number;
      height: number;
    }[]
  ) {
    this.fontFile = fontFile;
    this.flipped = flip;
    this.textureData = textureData;
  }

  fileContent: string = '';

  setFileContent(fileContent: string) {
    this.fileContent = fileContent;
    this.fontFile = null;
  }

  public loadFont = async (gl: WebGLRenderingContext, useMipMaps = false) => {
    if (this.imagePaths != null) return;

    let i = 0;

    let fileContent = this.fileContent;

    if (this.fontFile) {
      const res = await fetch(this.fontFile);
      fileContent = await res.text();
    }

    const lines = fileContent.split(/\r?\n/).map((s: string) => s.trim());

    try {
      let line: string = lines[i];
      if (typeof line !== 'string') throw new Error('File is empty.');

      const infoFragments = line.split(' ');
      const sizeInfo = infoFragments.find(s => s.startsWith('size='));
      this.size = parseInt(sizeInfo.split('=')[1]);
      const paddingInfo = infoFragments.find(s => s.startsWith('padding='));
      const padding: string[] = paddingInfo.split('=')[1].split(',');
      if (padding.length !== 4) throw new Error('Invalid padding.');
      this.padTop = parseInt(padding[0]);
      this.padRight = parseInt(padding[1]);
      this.padBottom = parseInt(padding[2]);
      this.padLeft = parseInt(padding[3]);
      const padY = this.padTop + this.padBottom;

      i++;
      line = lines[i];
      if (typeof line !== 'string') throw new Error('Missing common header.');
      const common: string[] = line.split(' ', 9); // At most we want the 6th element; i.e. "page=N"

      // At least lineHeight and base are required.
      if (common.length < 3) throw new Error('Invalid common header.');

      if (!common[1].startsWith('lineHeight=')) throw new Error('Missing: lineHeight');
      this.lineHeight = parseInt(common[1].substring(11));

      if (!common[2].startsWith('base=')) throw new Error('Missing: base');
      const baseLine = parseInt(common[2].substring(5));

      let pageCount = 1;
      if (common.length >= 6 && common[5] != null && common[5].startsWith('pages=')) {
        try {
          pageCount = Math.max(1, parseInt(common[5].substring(6)));
        } catch {
          // Use one page.
        }
      }

      this.imagePaths = new Array(pageCount);
      const imagePaths = [];

      // Read each page definition.
      for (let p = 0; p < pageCount; p++) {
        // Read each "page" info line.
        i++;
        line = lines[i];
        if (typeof line !== 'string') throw new Error('Missing additional page definitions.');

        // Expect ID to mean "index".

        const idMatches = line.match(new RegExp('.*id=(\\d+)'));

        if (idMatches && idMatches.length > 1) {
          const id = idMatches[1];
          try {
            const pageID = parseInt(id);
            if (pageID !== p) throw new Error('Page IDs must be indices starting at 0: ' + id);
          } catch {}
        }

        const fileMatches = line.match(new RegExp('.*file="?([^"]+)"?'));
        if (!fileMatches || fileMatches.length <= 1) throw new Error('Missing: file');
        const fileName = fileMatches[1];
        imagePaths[p] = fileName;
        // this.imagePaths[p] = fontFile.parent().child(fileName).path().replaceAll("\\\\", "/");
      }
      this.descent = 0;

      while (true) {
        i++;
        line = lines[i];
        if (!line) break; // EOF
        if (line.startsWith('kernings ')) break; // Starting kernings block.
        if (line.startsWith('metrics ')) break; // Starting metrics block.
        if (!line.startsWith('char ')) continue;

        const glyph = new Glyph();

        const tokens = new StringTokenizer(line, '=');
        tokens.nextToken();
        tokens.nextToken();
        const ch = parseInt(tokens.nextToken());

        if (ch > 0 && ch > CHARACTER_MAX_VALUE) continue;

        glyph.id = ch + '';
        tokens.nextToken();
        glyph.srcX = parseInt(tokens.nextToken());
        tokens.nextToken();
        glyph.srcY = parseInt(tokens.nextToken());
        tokens.nextToken();
        glyph.width = parseInt(tokens.nextToken());
        tokens.nextToken();
        glyph.height = parseInt(tokens.nextToken());
        tokens.nextToken();
        glyph.xoffset = parseInt(tokens.nextToken());
        tokens.nextToken();

        if (this.flipped) glyph.yoffset = parseInt(tokens.nextToken());
        else glyph.yoffset = -(glyph.height + parseInt(tokens.nextToken()));
        tokens.nextToken();
        glyph.xadvance = parseInt(tokens.nextToken());

        // Check for page safely, it could be omitted or invalid.
        if (tokens.hasMoreTokens()) tokens.nextToken();
        if (tokens.hasMoreTokens()) {
          try {
            glyph.page = parseInt(tokens.nextToken());
          } catch {}
        }

        if (glyph.width > 0 && glyph.height > 0) this.descent = Math.min(baseLine + glyph.yoffset, this.descent);

        if (ch <= 0) {
          this.missingGlyph = glyph;
        } else if (ch <= CHARACTER_MAX_VALUE) {
          this.setGlyph(ch, glyph);
        }
      }
      this.descent += this.padBottom;

      while (true) {
        i++;
        line = lines[i];
        if (typeof line !== 'string') break;
        if (!line.startsWith('kerning ')) break;

        const tokens = new StringTokenizer(line, '=');
        tokens.nextToken();
        tokens.nextToken();
        let first = parseInt(tokens.nextToken());
        tokens.nextToken();
        let second = parseInt(tokens.nextToken());
        if (first < 0 || first > CHARACTER_MAX_VALUE || second < 0 || second > CHARACTER_MAX_VALUE) continue;
        const glyph: Glyph | undefined = this.getGlyph(first + '');
        tokens.nextToken();
        const amount = parseInt(tokens.nextToken());
        if (glyph) {
          // Kernings may exist for glyph pairs not contained in the font.
          glyph.setKerning(second, amount);
        }
      }

      let hasMetricsOverride = false;
      let overrideAscent = 0;
      let overrideDescent = 0;
      let overrideDown = 0;
      let overrideCapHeight = 0;
      let overrideLineHeight = 0;
      let overrideSpaceXAdvance = 0;
      let overrideXHeight = 0;

      // Metrics override
      if (line != null && line.startsWith('metrics ')) {
        hasMetricsOverride = true;

        const tokens = new StringTokenizer(line, '=');
        tokens.nextToken();
        tokens.nextToken();
        overrideAscent = parseFloat(tokens.nextToken());
        tokens.nextToken();
        overrideDescent = parseFloat(tokens.nextToken());
        tokens.nextToken();
        overrideDown = parseFloat(tokens.nextToken());
        tokens.nextToken();
        overrideCapHeight = parseFloat(tokens.nextToken());
        tokens.nextToken();
        overrideLineHeight = parseFloat(tokens.nextToken());
        tokens.nextToken();
        overrideSpaceXAdvance = parseFloat(tokens.nextToken());
        tokens.nextToken();
        overrideXHeight = parseFloat(tokens.nextToken());
      }

      let spaceGlyph: Glyph | undefined = this.getGlyph('32');

      if (!spaceGlyph) {
        spaceGlyph = new Glyph();
        spaceGlyph.id = '32';
        let xadvanceGlyph: Glyph | undefined = this.getGlyph('l');
        if (!xadvanceGlyph) xadvanceGlyph = this.getFirstGlyph();
        spaceGlyph.xadvance = xadvanceGlyph!.xadvance;
        this.setGlyph(32, spaceGlyph); // space character ascii code
      }

      if (spaceGlyph.width === 0) {
        spaceGlyph.width = this.padLeft + spaceGlyph.xadvance + this.padRight;
        spaceGlyph.xoffset = -this.padLeft;
      }
      this.spaceXadvance = spaceGlyph.xadvance;

      let xGlyph: Glyph | undefined;
      for (let i = 0; i < this.xChars.length; i++) {
        xGlyph = this.getGlyph(this.xChars[i]);
        if (xGlyph) break;
      }
      if (!xGlyph) xGlyph = this.getFirstGlyph();
      this.xHeight = xGlyph!.height - padY;

      let capGlyph: Glyph | undefined;
      for (let i = 0; i < this.capChars.length; i++) {
        capGlyph = this.getGlyph(this.capChars[i]);
        if (capGlyph) break;
      }

      if (!capGlyph) {
        const glyphValues = Object.values(this.glyphs);
        for (let i = 0; i < glyphValues.length; i++) {
          const page: Glyph[] = glyphValues[i];
          if (!page) continue;

          for (let j = 0; j < page.length; j++) {
            if (!page[j] || page[j].height === 0 || page[j].width === 0) continue;
            this.capHeight = Math.max(this.capHeight, page[j].height);
          }
        }
      } else this.capHeight = capGlyph.height;
      this.capHeight -= padY;

      this.ascent = baseLine - this.capHeight;
      this.down = -this.lineHeight;
      if (this.flipped) {
        this.ascent = -this.ascent;
        this.down = -this.down;
      }

      if (hasMetricsOverride) {
        this.ascent = overrideAscent;
        this.descent = overrideDescent;
        this.down = overrideDown;
        this.capHeight = overrideCapHeight;
        this.lineHeight = overrideLineHeight;
        this.spaceXadvance = overrideSpaceXAdvance;
        this.xHeight = overrideXHeight;
      }

      // Generate texture regions
      const regionsData = [];
      const glyphValues = Object.values(this.glyphs);
      for (let i = 0; i < glyphValues.length; i++) {
        const values = Object.values(glyphValues[i]);
        for (let j = 0; j < values.length; j++) {
          const region = {
            id: values[j].id,
            left: values[j].srcX,
            top: values[j].srcY,
            width: values[j].width,
            height: values[j].height,
            xoffset: values[j].xoffset,
            yoffset: values[j].yoffset,
            xadvance: values[j].xadvance,
            page: imagePaths[values[j].page],
            pageId: values[j].page
          };
          regionsData.push(region);
        }
      }

      const pages: {
        texture: Texture;
        invTexWidth: number;
        invTexHeight: number;
      }[] = [];

      if (this.textureData) {
        for (let i = 0; i < this.textureData.length; i++) {
          const texture = new Texture(gl, this.textureData[i].data, useMipMaps);
          const invTexWidth = 1 / texture.width;
          const invTexHeight = 1 / texture.height;
          pages.push({
            texture,
            invTexWidth,
            invTexHeight
          });
        }
      } else {
        for (let i = 0; i < pageCount; i++) {
          const texture = await Texture.load(gl, concatAndResolveUrl(this.fontFile, `../${imagePaths[i]}`), useMipMaps);
          const invTexWidth = 1 / texture.width;
          const invTexHeight = 1 / texture.height;
          pages.push({
            texture,
            invTexWidth,
            invTexHeight
          });
        }
      }

      this.regions = [];
      for (let regionData of regionsData) {
        const left = regionData.left;
        const top = regionData.top;
        const width = regionData.width;
        const height = regionData.height;
        const { texture, invTexWidth, invTexHeight } = pages[regionData.pageId];
        const region = new TextureRegion(texture, left, top, width, height, regionData, invTexWidth, invTexHeight);
        region.originalWidth = width;
        region.originalHeight = height;
        region.offsetX = 0;
        region.offsetY = 0;
        this.regions.push(region);
      }
    } catch (ex: any) {
      console.error(ex);
    }
  };

  setGlyphRegion = (glyph: Glyph, region: TextureRegion) => {
    const texture = region.texture;
    const invTexWidth = 1 / texture.width;
    const invTexHeight = 1 / texture.height;

    let offsetX = 0,
      offsetY = 0;
    const u = region.u;
    const v = region.v;
    const regionWidth = region.originalWidth;
    const regionHeight = region.originalHeight;
    // if (region instanceof AtlasRegion) {
    //    // Compensate for whitespace stripped from left and top edges.
    //    AtlasRegion atlasRegion = (AtlasRegion)region;
    //    offsetX = atlasRegion.offsetX;
    //    offsetY = atlasRegion.originalHeight - atlasRegion.packedHeight - atlasRegion.offsetY;
    // }

    let x = glyph.srcX;
    let x2 = glyph.srcX + glyph.width;
    let y = glyph.srcY;
    let y2 = glyph.srcY + glyph.height;

    // Shift glyph for left and top edge stripped whitespace. Clip glyph for right and bottom edge stripped whitespace.
    // Note if the font region has padding, whitespace stripping must not be used.
    if (offsetX > 0) {
      x -= offsetX;
      if (x < 0) {
        glyph.width += x;
        glyph.xoffset -= x;
        x = 0;
      }
      x2 -= offsetX;
      if (x2 > regionWidth) {
        glyph.width -= x2 - regionWidth;
        x2 = regionWidth;
      }
    }
    if (offsetY > 0) {
      y -= offsetY;
      if (y < 0) {
        glyph.height += y;
        if (glyph.height < 0) glyph.height = 0;
        y = 0;
      }
      y2 -= offsetY;
      if (y2 > regionHeight) {
        const amount = y2 - regionHeight;
        glyph.height -= amount;
        glyph.yoffset += amount;
        y2 = regionHeight;
      }
    }

    glyph.u = u + x * invTexWidth;
    glyph.u2 = u + x2 * invTexWidth;
    if (this.flipped) {
      glyph.v = v + y * invTexHeight;
      glyph.v2 = v + y2 * invTexHeight;
    } else {
      glyph.v2 = v + y * invTexHeight;
      glyph.v = v + y2 * invTexHeight;
    }
  };

  /** Sets the line height, which is the distance from one line of text to the next. */
  setLineHeight = (height: number) => {
    this.lineHeight = height * this.scaleY;
    this.down = this.flipped ? this.lineHeight : -this.lineHeight;
  };

  setGlyph = (ch: number, glyph: Glyph) => {
    let page: Glyph[] = this.glyphs[ch / PAGE_SIZE];
    if (!page) {
      page = new Array<Glyph>(PAGE_SIZE);
      this.glyphs[ch / PAGE_SIZE] = page;
      // this.glyphs[ch / PAGE_SIZE] = page = new Glyph[PAGE_SIZE];
    }
    page[ch & (PAGE_SIZE - 1)] = glyph;
  };

  getFirstGlyph = (): Glyph | undefined => {
    const glyphValues = Object.values(this.glyphs);
    for (let i = 0; i < glyphValues.length; i++) {
      const page = glyphValues[i];
      if (!page) continue;
      for (let j = 0; j < page.length; j++) {
        const glyph = page[j];
        if (!glyph || glyph.height === 0 || glyph.width === 0) continue;
        return glyph;
      }
    }
  };

  /** Returns true if the font has the glyph, or if the font has a {@link #missingGlyph}. */
  hasGlyph = (ch: string): boolean => {
    if (this.missingGlyph) return true;
    return this.getGlyph(ch) != null;
  };

  /** Returns the glyph for the specified character, or null if no such glyph exists. Note that
   * {@link #getGlyphs(GlyphRun, CharSequence, int, int, Glyph)} should be be used to shape a string of characters into a list
   * of glyphs. */
  getGlyph = (ch: string): Glyph | undefined => {
    const page: Glyph[] = this.glyphs[ch.charCodeAt(0) / PAGE_SIZE];
    if (page != null) return page[ch.charCodeAt(0) & (PAGE_SIZE - 1)];
    return undefined;
  };

  /** Using the specified string, populates the glyphs and positions of the specified glyph run.
   * @param str Characters to convert to glyphs. Will not contain newline or color tags. May contain "[[" for an escaped left
   *           square bracket.
   * @param lastGlyph The glyph immediately before this run, or null if this is run is the first on a line of text. Used tp
   *           apply kerning between the specified glyph and the first glyph in this run. */
  getGlyphs = (run: GlyphRun, str: string, start: number, end: number, lastGlyph: Glyph | null) => {
    const max = end - start;
    if (max === 0) return;
    let markupEnabled = this.markupEnabled;
    const scaleX = this.scaleX;
    const glyphs = run.glyphs;
    const xAdvances = run.xAdvances;

    // Guess at number of glyphs needed.
    // glyphs.ensureCapacity(max);
    // run.xAdvances.ensureCapacity(max + 1);

    do {
      const ch = str.charAt(start++);
      if (ch === '\r') continue; // Ignore.
      let glyph = this.getGlyph(ch);

      if (!glyph) {
        if (!this.missingGlyph) continue;
        glyph = this.missingGlyph;
      }
      glyphs.push(glyph);
      xAdvances.push(
        !lastGlyph // First glyph on line, adjust the position so it isn't drawn left of 0.
          ? glyph.fixedWidth
            ? 0
            : -glyph.xoffset * scaleX - this.padLeft
          : (lastGlyph.xadvance + lastGlyph.getKerning(ch)) * scaleX
      );
      lastGlyph = glyph;

      // "[[" is an escaped left square bracket, skip second character.
      if (markupEnabled && ch === '[' && start < end && str.charAt(start) === '[') start++;
    } while (start < end);
    if (lastGlyph) {
      const lastGlyphWidth = lastGlyph.fixedWidth
        ? lastGlyph.xadvance * scaleX
        : (lastGlyph.width + lastGlyph.xoffset) * scaleX - this.padRight;
      xAdvances.push(lastGlyphWidth);
    }
  };

  /** Returns the first valid glyph index to use to wrap to the next line, starting at the specified start index and
   * (typically) moving toward the beginning of the glyphs array. */
  getWrapIndex = (glyphs: Glyph[], start: number): number => {
    let i = start - 1;
    const glyphsItems = glyphs;
    let ch = glyphsItems[i].id;

    if (this.isWhitespace(ch + '')) return i;
    if (this.isBreakChar(ch + '')) i--;
    for (; i > 0; i--) {
      ch = glyphsItems[i].id;
      if (this.isWhitespace(ch + '') || this.isBreakChar(ch + '')) {
        return i + 1;
      }
    }

    return 0;
  };

  isBreakChar = (c: string): boolean => {
    if (!this.breakChars) return false;
    const character = String.fromCharCode(parseInt(c));
    for (let i = 0; i < this.breakChars.length; i++) {
      if (character === this.breakChars[i]) return true;
    }
    return false;
  };

  isWhitespace = (c: string): boolean => {
    const character = String.fromCharCode(parseInt(c));
    switch (character) {
      case '\n':
      case '\r':
      case '\t':
      case ' ':
        return true;
      default:
        return false;
    }
  };

  /** Returns the image path for the texture page at the given index (the "id" in the BMFont file). */
  getImagePath = (index: number) => {
    return this.imagePaths[index];
  };

  getImagePaths = (): string[] => {
    return this.imagePaths;
  };

  /** Scales the font by the specified amounts on both axes
   * <p>
   * Note that smoother scaling can be achieved if the texture backing the BitmapFont is using {@link TextureFilter#Linear}.
   * The default is Nearest, so use a BitmapFont constructor that takes a {@link TextureRegion}.
   * @throws IllegalArgumentException if scaleX or scaleY is zero. */
  setScale = (scaleX: number, scaleY: number) => {
    if (scaleX === 0 || scaleY === 0) return;
    const x = scaleX / this.scaleX;
    const y = scaleY / this.scaleY;
    this.lineHeight *= y;
    this.spaceXadvance *= x;
    this.xHeight *= y;
    this.capHeight *= y;
    this.ascent *= y;
    this.descent *= y;
    this.down *= y;
    this.padLeft *= x;
    this.padRight *= x;
    this.padTop *= y;
    this.padBottom *= y;
    this.scaleX = scaleX;
    this.scaleY = scaleY;
  };

  /** Scales the font by the specified amount in both directions.
   * @see #setScale(float, float)
   * @throws IllegalArgumentException if scaleX or scaleY is zero. */
  setXYScale(scaleXY: number) {
    this.setScale(scaleXY, scaleXY);
  }

  /** Sets the font's scale relative to the current scale.
   * @see #setScale(float, float)
   * @throws IllegalArgumentException if the resulting scale is zero. */
  scale = (amount: number) => {
    this.setScale(this.scaleX + amount, this.scaleY + amount);
  };
}

class StringTokenizer {
  private strArray: string[] = [];
  private currentIndex = 0;

  constructor(str: string, delimitter: string) {
    const strings = str.split(/\s+/);

    for (let i = 0; i < strings.length; i++) {
      const st = strings[i];

      this.strArray.push(...st.split(delimitter));
    }
  }

  hasMoreTokens(): boolean {
    return this.currentIndex >= this.strArray.length;
  }

  nextToken(): string {
    return this.strArray[this.currentIndex++];
  }
}
