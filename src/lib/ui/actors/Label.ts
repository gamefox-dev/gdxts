import { BitmapFont } from '../../BitmapFont';
import { GlyphLayout } from '../../GlyphLayout';
import { PolygonBatch } from '../../PolygonBatcher';
import { Align, Color } from '../../Utils';
import { Vector2 } from '../../Vector2';
import { Actor } from '../Actor';
import { Stage } from '../Stage';

export class Label extends Actor {
  font?: BitmapFont;
  align = Align.left;
  layoutSize = new Vector2(0, 0);
  private layout = new GlyphLayout();

  constructor(stage: Stage, private text = '', fontName = 'default') {
    super(stage);
    this.setFontName(fontName);
  }

  setAlign(align: number): Label {
    this.align = align;
    return this;
  }

  calculateLayoutSize() {
    this.layout.setText(this.font, this.text, 0, this.text.length, Color.WHITE, this.displaySize.x, this.align, true);
    this.layoutSize.set(this.layout.width, this.layout.height);
  }

  setText(text: string): Label {
    this.text = text;
    this.calculateLayoutSize();
    return this;
  }

  setFontName(name: string): Label {
    const font = this.stage.skin.fonts[name];
    if (!font) {
      throw new Error(`No font with name ${name} in the current skin!`);
    }
    return this.setFont(font);
  }

  setFont(font: BitmapFont): Label {
    this.font = font;
    this.calculateLayoutSize();
    return this;
  }

  public draw(batch: PolygonBatch): void {
    super.draw(batch);
    if (!this.font) {
      return;
    }
    let prevColor = batch.color;
    if (this.style.fontScale) this.font.getData().setXYScale(this.style.fontScale);
    if (this.style.color) batch.setColor(this.style.color);

    let drawY = this.displayPosition.y;
    const layoutHeight = this.layoutSize.y * (this.style.fontScale || 1);
    if (this.style.verticalAlign === 'bottom') {
      drawY = this.displayPosition.y + this.displaySize.y - layoutHeight;
    } else if (this.style.verticalAlign === 'center') {
      drawY = this.displayPosition.y + (this.displaySize.y - layoutHeight) / 2;
    }

    this.font.draw(batch, this.text, this.displayPosition.x, drawY, this.displaySize.x, this.align);
    if (this.style.color) batch.setColor(prevColor);
    if (this.style.fontScale) this.font.getData().setXYScale(1);
  }
}
