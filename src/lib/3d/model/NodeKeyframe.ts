export class NodeKeyframe<T> {
  public keytime: number;
  public value: T = null;

  constructor(t: number, v: T) {
    this.keytime = t;
    this.value = v;
  }
}
