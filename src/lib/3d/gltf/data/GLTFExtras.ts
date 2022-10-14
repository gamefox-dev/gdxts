export class GLTFExtras {
  public value: any;

  public read(jsonData: any) {
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
