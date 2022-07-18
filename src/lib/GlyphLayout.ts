import { BitmapFont } from './BitmapFont';
import { BitmapFontData } from './BitmapFontData';
import { Glyph } from './Glyph';
import { GlyphRun } from './GlyphRun';
import { Align, Color, Pool, Poolable, Pools, Utils } from './Utils';

export class GlyphLayout implements Poolable {
  epsilon = 0.0001;
  glyphRunPool: Pool<GlyphRun> = Pools.get('GlyphRun', () => new GlyphRun());
  colorStack: number[] = new Array(4);

  runs: GlyphRun[] = [];
  colors: number[] = [];

  glyphCount: number;
  width: number;
  height: number;

  constructor(
    font: BitmapFont,
    str: string,
    start: number,
    end: number,
    color: Color,
    targetWidth: number,
    hAlign: number,
    wrap: boolean,
    truncate?: string
  ) {
    this.setText(font, str, start, end, color, targetWidth, hAlign, wrap, truncate);
  }

  setText = (
    font: BitmapFont,
    str: string,
    start: number,
    end: number,
    color: Color,
    targetWidth: number,
    hAlign: number,
    wrap: boolean,
    truncate?: string
  ) => {
    this.reset();

    const fontData: BitmapFontData = font.data;
    if (start === end) {
      // Empty string.
      this.height = fontData.capHeight;
      return;
    }

    // Avoid wrapping one line per character, which is very inefficient.
    if (wrap) targetWidth = Math.max(targetWidth, fontData.spaceXadvance * 3);
    const wrapOrTruncate: boolean = wrap || truncate != null;

    let currentColor: number = color.toIntBits();
    let nextColor = currentColor;
    this.colors.shift();
    const markupEnabled: boolean = fontData.markupEnabled;
    if (markupEnabled) this.colorStack.push(currentColor);

    let isLastRun = false;
    let y = 0;
    let down = fontData.down;
    let lineRun: GlyphRun | null = null; // Collects glyphs for the current line.
    let lastGlyph: Glyph | null = null; // Last glyph of the previous run on the same line, used for kerning between runs.
    let runStart: number = start;
    while (true) {
      let runEnd: number;
      let newline: boolean = false;

      if (start === end) {
        // End of text.
        if (runStart === end) break; // No run to process, we're done.
        runEnd = end; // Process the final run.
        isLastRun = true;
      } else {
        // Each run is delimited by newline or left square bracket.
        switch (str.charAt(start++)) {
          case '\n': // End of line.
            runEnd = start - 1;
            newline = true;
            break;
          // Fall through.
          default:
            continue;
        }
      }

      // eslint-disable-next-line no-labels
      runEnded: {
        // Store the run that has ended.
        const run: GlyphRun = this.glyphRunPool.obtain();
        run.x = 0;
        run.y = y;
        fontData.getGlyphs(run, str, runStart, runEnd, lastGlyph);
        this.glyphCount += run.glyphs.length;

        if (nextColor !== currentColor) {
          // Can only be different if markupEnabled.
          if (this.colors[this.colors.length - 2] === this.glyphCount) {
            // Consecutive color changes, or after an empty run, or at the beginning of the string.
            this.colors[this.colors.length - 1] = nextColor;
          } else {
            this.colors.push(this.glyphCount);
            this.colors.push(nextColor);
          }
          currentColor = nextColor;
        }

        if (run.glyphs.length === 0) {
          this.glyphRunPool.free(run);
          if (!lineRun) break; // Otherwise wrap and truncate must still be processed for lineRun.
        } else if (!lineRun) {
          lineRun = run;
          this.runs.push(lineRun);
        } else {
          lineRun.appendRun(run);
          this.glyphRunPool.free(run);
        }

        if (newline || isLastRun) {
          this.setLastGlyphXAdvance(fontData, lineRun);
          lastGlyph = null;
        } else lastGlyph = lineRun.glyphs[lineRun.glyphs.length - 1];

        if (!wrapOrTruncate || lineRun.glyphs.length === 0) {
          // eslint-disable-next-line no-labels
          break runEnded; // No wrap or truncate, or no glyphs.
        }

        if (newline || isLastRun) {
          // Wrap or truncate. First xadvance is the first glyph's X offset relative to the drawing position.
          let runWidth: number = lineRun.xAdvances[0] + lineRun.xAdvances[1]; // At least the first glyph will fit.
          for (let i = 2; i < lineRun!.xAdvances.length; i++) {
            const glyph: Glyph = lineRun!.glyphs[i - 1];
            let glyphWidth: number = this.getGlyphWidth(glyph, fontData);

            if (runWidth + glyphWidth - this.epsilon <= targetWidth) {
              // Glyph fits.
              runWidth += lineRun!.xAdvances[i];
              continue;
            }

            if (truncate != null) {
              // Truncate.
              this.truncate(fontData, lineRun, targetWidth, truncate);
              break;
            }

            // Wrap.
            let wrapIndex: number = fontData.getWrapIndex(lineRun!.glyphs, i);
            if (
              (wrapIndex === 0 && lineRun!.x === 0) || // Require at least one glyph per line.
              wrapIndex >= lineRun!.glyphs.length
            ) {
              // Wrap at least the glyph that didn't fit.
              wrapIndex = i - 1;
            }
            lineRun = this.wrap(fontData, lineRun, wrapIndex);

            // eslint-disable-next-line no-labels
            if (!lineRun) break runEnded; // All wrapped glyphs were whitespace.
            this.runs.push(lineRun);

            y += down;
            lineRun!.x = 0;
            lineRun!.y = y;

            // Start the wrap loop again, another wrap might be necessary.
            runWidth = lineRun!.xAdvances[0] + lineRun!.xAdvances[1]; // At least the first glyph will fit.
            i = 1;
          }
        }
      }

      if (newline) {
        lineRun = null;
        lastGlyph = null;

        // Next run will be on the next line.
        if (runEnd === runStart)
          // Blank line.
          y += down * fontData.blankLineScale;
        else y += down;
      }

      runStart = start;
    }

    this.height = fontData.capHeight + Math.abs(y);

    this.calculateWidths(fontData);

    this.alignRuns(targetWidth, hAlign);

    // Clear the color stack.
    if (markupEnabled) this.colorStack.length = 0;
  };

  private calculateWidths = (fontData: BitmapFontData) => {
    let width = 0;
    const runsItems: any[] = [...this.runs];
    for (let i = 0, n = this.runs.length; i < n; i++) {
      const run = runsItems[i];
      const xAdvances: number[] = run.xAdvances;
      let runWidth: number = run.x + xAdvances[0];
      let max = 0; // run.x is needed to ensure floats are rounded same as above.
      const glyphs: any[] = run.glyphs;
      for (let ii = 0; ii < run.glyphs.length; ) {
        const glyph: Glyph = glyphs[ii];
        const glyphWidth: number = this.getGlyphWidth(glyph, fontData);
        max = Math.max(max, runWidth + glyphWidth); // A glyph can extend past the right edge of subsequent glyphs.
        ii++;
        runWidth += xAdvances[ii] ?? 0;
      }
      run.width = Math.max(runWidth, max) - run.x;
      width = Math.max(width, run.x + (isNaN(run.width) ? runWidth : run.width));
    }
    this.width = width;
  };

  private alignRuns = (targetWidth: number, halign: number) => {
    if ((halign & Align.left) === 0) {
      // Not left aligned, so must be center or right aligned.
      const center: boolean = (halign & Align.center) !== 0;
      const runsItems: any[] = [...this.runs];

      for (let i = 0, n = this.runs.length; i < n; i++) {
        const run: GlyphRun = runsItems[i];
        run.x += center ? 0.5 * (targetWidth - run.width) : targetWidth - run.width;
      }
    }
  };

  /** @param truncate May be empty string. */
  private truncate = (fontData: BitmapFontData, run: GlyphRun, targetWidth: number, truncate: string) => {
    let glyphCount: number = run.glyphs.length;

    // Determine truncate string size.
    const truncateRun: GlyphRun = this.glyphRunPool.obtain();
    fontData.getGlyphs(truncateRun, truncate, 0, truncate.length, null);
    let truncateWidth = 0;
    if (truncateRun.xAdvances.length > 0) {
      this.setLastGlyphXAdvance(fontData, truncateRun);
      const xAdvances: number[] = truncateRun.xAdvances;
      // Skip first for tight bounds.
      for (let i = 1; i < truncateRun.xAdvances.length; i++) {
        truncateWidth += xAdvances[i];
      }
    }
    targetWidth -= truncateWidth;

    // Determine visible glyphs.
    let count = 0;
    let width = run.x;
    const xAdvances: number[] = run.xAdvances;
    while (count < run.xAdvances.length) {
      const xAdvance = xAdvances[count];
      width += xAdvance;
      if (width > targetWidth) break;
      count++;
    }

    if (count > 1) {
      // Some run glyphs fit, append truncate glyphs.
      if (count - 1 >= 0 && run.glyphs.length > count - 1) {
        for (let i = count - 1; i < run.glyphs.length; i++) {
          run.glyphs.splice(i, 1);
        }
      }
      if (count >= 0 && run.xAdvances.length > count) {
        for (let i = count; i < run.xAdvances.length; i++) {
          run.xAdvances.splice(i, 1);
        }
      }

      this.setLastGlyphXAdvance(fontData, run);
      if (truncateRun.xAdvances.length > 0) {
        Utils.arrayCopy(
          truncateRun.xAdvances,
          1,
          run.xAdvances,
          run.xAdvances.length,
          truncateRun.xAdvances.length - 1
        );
      }
    } else {
      // No run glyphs fit, use only truncate glyphs.
      run.glyphs.length = 0;
      run.xAdvances.length = 0;
      // run.xAdvances.addAll(truncateRun.xAdvances);
      Utils.arrayCopy(truncateRun.xAdvances, 0, run.xAdvances, run.xAdvances.length, truncateRun.xAdvances.length);
    }

    const droppedGlyphCount = glyphCount - run.glyphs.length;
    if (droppedGlyphCount > 0) {
      this.glyphCount -= droppedGlyphCount;
      if (fontData.markupEnabled) {
        while (this.colors.length > 2 && this.colors[this.colors.length - 2] >= this.glyphCount)
          this.colors.length -= 2;
      }
    }

    Utils.arrayCopy(truncateRun.glyphs, 0, run.glyphs, run.glyphs.length, truncateRun.glyphs.length);

    this.glyphCount += truncate.length;

    this.glyphRunPool.free(truncateRun);
  };

  /** Breaks a run into two runs at the specified wrapIndex.
   * @return May be null if second run is all whitespace. */
  private wrap(fontData: BitmapFontData, first: GlyphRun, wrapIndex: number): GlyphRun {
    const glyphCount: number = first.glyphs.length;
    let glyphs2: Glyph[] = first.glyphs; // Starts with all the glyphs.
    let xAdvances2: number[] = first.xAdvances; // Starts with all the xadvances.

    // Skip whitespace before the wrap index.
    let firstEnd = wrapIndex;
    for (; firstEnd > 0; firstEnd--) if (!fontData.isWhitespace(glyphs2[firstEnd - 1].id)) break;

    // Skip whitespace after the wrap index.
    let secondStart = wrapIndex;
    for (; secondStart < glyphCount; secondStart++) if (!fontData.isWhitespace(glyphs2[secondStart].id)) break;

    // Copy wrapped glyphs and xadvances to second run.
    // The second run will contain the remaining glyph data, so swap instances rather than copying.
    let second: GlyphRun | undefined;

    if (secondStart < glyphCount) {
      second = this.glyphRunPool.obtain();

      const glyphs1: Glyph[] = second!.glyphs; // Starts empty.
      Utils.arrayCopy(glyphs2, 0, glyphs1, glyphs1.length, firstEnd);
      // glyphs2.removeRange(0, secondStart - 1);
      glyphs2.splice(0, secondStart - 1 + 1);
      first.glyphs = glyphs1;
      second!.glyphs = glyphs2;

      const xAdvances1: number[] = second!.xAdvances; // Starts empty.
      Utils.arrayCopy(xAdvances2, 0, xAdvances1, xAdvances1.length, firstEnd + 1);
      // xAdvances2.removeRange(1, secondStart); // Leave first entry to be overwritten by next line.
      xAdvances2.splice(1, secondStart); // Leave first entry to be overwritten by next line.
      xAdvances2[0] = this.getLineOffset(glyphs2, fontData);
      first.xAdvances = xAdvances1;
      second!.xAdvances = xAdvances2;

      const firstGlyphCount = first.glyphs.length; // After wrapping it.
      const secondGlyphCount = second!.glyphs.length;
      const droppedGlyphCount = glyphCount - firstGlyphCount - secondGlyphCount;
      this.glyphCount -= droppedGlyphCount;

      if (fontData.markupEnabled && droppedGlyphCount > 0) {
        const reductionThreshold = this.glyphCount - secondGlyphCount;
        for (let i = this.colors.length - 2; i >= 2; i -= 2) {
          // i >= 1 because first 2 values always determine the base color.
          const colorChangeIndex = this.colors[i];
          if (colorChangeIndex <= reductionThreshold) break;
          this.colors[i] = colorChangeIndex - droppedGlyphCount;
        }
      }
    } else {
      // Second run is empty, just trim whitespace glyphs from end of first run.
      glyphs2 = glyphs2.slice(0, firstEnd);
      xAdvances2 = xAdvances2.slice(0, firstEnd + 1);

      const droppedGlyphCount = secondStart - firstEnd;
      if (droppedGlyphCount > 0) {
        this.glyphCount -= droppedGlyphCount;
        if (fontData.markupEnabled && this.colors[this.colors.length - 2] > this.glyphCount) {
          // Many color changes can be hidden in the dropped whitespace, so keep only the very last color entry.
          const lastColor = this.colors[this.colors.length - 1];
          while (this.colors[this.colors.length - 2] > this.glyphCount) this.colors.length -= 2;
          this.colors[this.colors.length - 2] = this.glyphCount; // Update color change index.
          this.colors[this.colors.length - 1] = lastColor; // Update color entry.
        }
      }
    }

    if (firstEnd === 0) {
      // If the first run is now empty, remove it.
      this.glyphRunPool.free(first);
      this.runs.pop();
    } else this.setLastGlyphXAdvance(fontData, first);

    return second as GlyphRun;
  }

  /** Sets the xadvance of the last glyph to use its width instead of xadvance. */
  private setLastGlyphXAdvance = (fontData: BitmapFontData, run: GlyphRun) => {
    const last: Glyph = run.glyphs[run.glyphs.length - 1];
    if (!last.fixedWidth) run.xAdvances[run.xAdvances.length - 1] = this.getGlyphWidth(last, fontData);
  };

  /** Returns the distance from the glyph's drawing position to the right edge of the glyph. */
  private getGlyphWidth = (glyph: Glyph, fontData: BitmapFontData): number => {
    return (glyph.width + glyph.xoffset) * fontData.scaleX - fontData.padRight;
  };

  /** Returns an X offset for the first glyph so when drawn, none of it is left of the line's drawing position. */
  private getLineOffset = (glyphs: Glyph[], fontData: BitmapFontData): number => {
    return -glyphs[0].xoffset * fontData.scaleX - fontData.padLeft;
  };

  public reset = () => {
    this.glyphRunPool.freeAll(this.runs);
    this.runs.length = 0;
    this.colors.length = 0;
    this.glyphCount = 0;
    this.width = 0;
    this.height = 0;
  };
}
