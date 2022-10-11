export class GLTFExtras {
  public value: Object;

  public read(jsonData: Object) {
    this.value = jsonData;
  }

  public keys(): string[] {
    const keys = Object.keys(this.value);
    return keys;
  }

  public entries(): any[] {
    const entries = Object.values(this.value);
    return entries;
  }
}
