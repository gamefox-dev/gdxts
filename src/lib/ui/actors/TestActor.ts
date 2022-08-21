import { PolygonBatch } from '../../PolygonBatcher';
import { Texture } from '../../Texture';
import { Color } from '../../Utils';
import { Actor } from '../Actor';
import { Stage } from '../Stage';

export class TestActor extends Actor {
  color: Color;
  constructor(stage: Stage, private texture: Texture) {
    super(stage);
  }

  setColor(color: Color): TestActor {
    this.color = color;
    return this;
  }

  public draw(batch: PolygonBatch): void {
    const prevColor = batch.color;
    batch.setColor(this.color);
    batch.draw(this.texture, this.displayPosition.x, this.displayPosition.y, this.displaySize.x, this.displaySize.y);
    batch.setColor(prevColor);
  }
}
