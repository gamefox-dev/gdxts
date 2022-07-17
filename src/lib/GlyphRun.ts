import { Glyph } from './Glyph';
import { Poolable } from './Utils';

export class GlyphRun implements Poolable {
  glyphs: Glyph[] = [];
  xAdvances: number[] = [];
  float: number;
  x: number;
  y: number;
  width: number;

  appendRun = (run: GlyphRun) => {
    this.glyphs.concat(run.glyphs);
    // Remove the width of the last glyph. The first xadvance of the appended run has kerning for the last glyph of this run.
    if (!this.xAdvances.length) this.xAdvances.length--;
    this.xAdvances.concat(run.xAdvances);
  };

  public reset = () => {
    this.glyphs.length = 0;
    this.xAdvances.length = 0;
  };
}
