import { MathUtils } from '../../../../Utils';

export class WeightVector {
  public count: number;
  public values: number[];

  constructor(count: number = 0, max: number = 8) {
    this.count = count;
    this.values = new Array<number>(max);
  }

  public set(weights: WeightVector): WeightVector {
    if (weights.count > this.values.length) {
      this.values = new Array<number>(weights.count);
    }
    // throw new GdxRuntimeException("WeightVector out of bound");
    this.count = weights.count;
    for (let i = 0; i < weights.values.length; i++) {
      this.values[i] = weights.values[i];
    }
    return this;
  }

  public lerp(value: WeightVector, t: number) {
    if (this.count != value.count) throw new Error('WeightVector count mismatch');
    for (let i = 0; i < this.count; i++) {
      this.values[i] = MathUtils.lerp(this.values[i], value.values[i], t);
    }
  }

  public toString(): string {
    let s = 'WeightVector(';
    for (let i = 0; i < this.count; i++) {
      if (i > 0) s += ', ';
      s += this.values[i];
    }
    return s + ')';
  }

  public setEmpty(): WeightVector {
    this.count = 0;
    return this;
  }

  public cpy(): WeightVector {
    return new WeightVector(this.count, this.values.length).set(this);
  }

  public get(index: number): number {
    return this.values[index];
  }

  public scl(s: number): WeightVector {
    for (let i = 0; i < this.count; i++) {
      this.values[i] *= s;
    }
    return this;
  }

  public mulAdd(w: WeightVector, s: number): WeightVector {
    for (let i = 0; i < this.count; i++) {
      this.values[i] += w.values[i] * s;
    }
    return this;
  }
}
