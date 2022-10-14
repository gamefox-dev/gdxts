export class GLTFExtensions {
  private value: any;
  private extentions = new Map<string, any>();

  public get(ext: string): any {
    let result = this.extentions.get(ext);
    if (result == undefined && this.value != undefined) {
      result = this.value[ext];
      this.extentions.set(ext, result);
    }
    return result;
  }

  public set(ext: string, object: any) {
    this.extentions.set(ext, object);
  }
}
