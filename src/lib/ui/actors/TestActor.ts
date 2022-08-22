import { PolygonBatch } from '../../PolygonBatcher';
import { Color } from '../../Utils';
import { Actor } from '../Actor';

export class TestActor extends Actor {
  color: Color;

  setColor(color: Color): TestActor {
    this.color = color;
    return this;
  }

  public draw(batch: PolygonBatch): void {
    const prevColor = batch.color;
    batch.setColor(this.color);
    batch.draw(
      this.stage.whiteTexture,
      this.displayPosition.x,
      this.displayPosition.y,
      this.displaySize.x,
      this.displaySize.y
    );
    batch.setColor(prevColor);
  }
}
