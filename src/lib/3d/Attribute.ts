export class Attribute {
  private static types: string[] = [];

  static getAttributeType(alias: string): number {
    for (let i = 0; i < Attribute.types.length; i++) {
      if (Attribute.types[i] == alias) return 1 << i;
    }

    return 0;
  }

  static getAttributeAlias(type: number): string {
    let idx = -1;
    while (type != 0 && ++idx < 63 && ((type >> idx) & 1) == 0);
    return idx >= 0 && idx < Attribute.types.length
      ? Attribute.types[idx]
      : null;
  }

  static register(alias: string): number {
    const result = this.getAttributeType(alias);
    if (result > 0) return result;
    Attribute.types.push(alias);
    return 1 << (Attribute.types.length - 1);
  }

  type: number;
  typeBit: number;

  protected Attribute(type: number) {
    this.type = type;
    this.typeBit = this.numberOfTrailingZeros(type);
  }

  protected numberOfTrailingZeros(i: number): number {
    let x, y;
    if (i == 0) return 64;
    let n = 63;
    y = i;
    if (y != 0) {
      n = n - 32;
      x = y;
    } else x = i >>> 32;
    y = x << 16;
    if (y != 0) {
      n = n - 16;
      x = y;
    }
    y = x << 8;
    if (y != 0) {
      n = n - 8;
      x = y;
    }
    y = x << 4;
    if (y != 0) {
      n = n - 4;
      x = y;
    }
    y = x << 2;
    if (y != 0) {
      n = n - 2;
      x = y;
    }
    return n - ((x << 1) >>> 31);
  }

  toString(): string {
    return Attribute.getAttributeAlias(this.type);
  }
}
