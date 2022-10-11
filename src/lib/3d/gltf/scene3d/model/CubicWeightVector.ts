import { WeightVector } from './WeightVector';

export class CubicWeightVector extends WeightVector {
  public tangentIn: WeightVector;
  public tangentOut: WeightVector;

  constructor(count: number) {
    super(count);
    this.tangentIn = new WeightVector(count);
    this.tangentOut = new WeightVector(count);
  }
}
