import { Color } from '../../Utils';

export abstract class BaseLight {
  public color = new Color(0, 0, 0, 1);

  public setColor(r: number, g: number, b: number, a: number): BaseLight {
    this.color.set(r, g, b, a);
    return this;
  }
}
