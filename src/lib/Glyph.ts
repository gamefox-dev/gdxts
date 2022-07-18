export const LOG2_PAGE_SIZE = 9;
export const PAGE_SIZE = 1 << LOG2_PAGE_SIZE;
export const PAGES = 0x10000 / PAGE_SIZE;

export class Glyph {
  id: string;
  srcX: number;
  srcY: number;
  width: number;
  height: number;
  u: number;
  v: number;
  u2: number;
  v2: number;
  xoffset: number;
  yoffset: number;
  xadvance: number;
  kerning?: Array<Uint32Array>;
  fixedWidth: boolean;

  /** The index to the texture page that holds this glyph. */
  page = 0;

  getKerning(ch: string) {
    if (this.kerning) {
      const page = this.kerning[ch.charCodeAt(0) >>> LOG2_PAGE_SIZE];
      if (page != null) return page[ch.charCodeAt(0) & (PAGE_SIZE - 1)];
    }
    return 0;
  }

  setKerning(ch: number, value: number) {
    if (!this.kerning) {
      this.kerning = [];
    }
    let page = this.kerning[ch >>> LOG2_PAGE_SIZE];
    if (!page) {
      this.kerning[ch >>> LOG2_PAGE_SIZE] = page = new Uint32Array(new ArrayBuffer(PAGE_SIZE));
    }
    page[ch & (PAGE_SIZE - 1)] = value;
  }
}
