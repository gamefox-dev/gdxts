export class UBJsonReader {
  public oldFormat = true;

  parse(buffer: ArrayBuffer): any {
    const input = new BinaryInput(buffer);
    let type = input.readByte();
    return this.parseWithType(input, type);
  }

  parseWithType(input: BinaryInput, type: number): any {
    if (type === '['.charCodeAt(0)) return this.parseArray(input);
    else if (type === '{'.charCodeAt(0)) return this.parseObject(input);
    else if (type === 'Z'.charCodeAt(0)) return null;
    else if (type === 'T'.charCodeAt(0)) return true;
    else if (type === 'F'.charCodeAt(0)) return false;
    else if (type === 'B'.charCodeAt(0)) return this.readUChar(input);
    else if (type === 'U'.charCodeAt(0)) return this.readUChar(input);
    else if (type === 'i'.charCodeAt(0)) return this.oldFormat ? input.readShort() : input.readByte();
    else if (type === 'I'.charCodeAt(0)) return this.oldFormat ? input.readInt(true) : input.readShort();
    else if (type === 'l'.charCodeAt(0)) return input.readInt(true);
    else if (type === 'L'.charCodeAt(0)) return input.readInt32();
    else if (type === 'd'.charCodeAt(0)) return input.readFloat();
    else if (type === 'D'.charCodeAt(0)) return input.readFloat();
    else if (type === 's'.charCodeAt(0) || type === 'S'.charCodeAt(0)) return this.parseString(input, type);
    else if (type === 'a'.charCodeAt(0) || type === 'A'.charCodeAt(0)) return this.parseData(input, type);
    else if (type === 'C'.charCodeAt(0)) return input.readString();
    else throw new Error('Unrecognized data type');
  }

  parseObject(input: BinaryInput) {
    const result: any = {};
    let type = input.readByte();
    let valueType = 0;
    if (type === '$'.charCodeAt(0)) {
      valueType = input.readByte();
      type = input.readByte();
    }
    let size = -1;
    if (type === '#'.charCodeAt(0)) {
      size = this.parseSize(input, input.readByte(), false, -1);
      if (size < 0) throw new Error('Unrecognized data type');
      if (size === 0) return result;
      type = input.readByte();
    }
    let c = 0;
    while (type !== '}'.charCodeAt(0)) {
      const key = this.parseString(input, type, true);
      const child = this.parseWithType(input, valueType === 0 ? input.readByte() : valueType);
      result[key] = child;
      if (size > 0 && ++c >= size) break;
      type = input.readByte();
    }
    return result;
  }

  protected parseSize(input: BinaryInput, type: number, useIntOnError: boolean, defaultValue: number): number {
    if (type === 'i'.charCodeAt(0)) return this.readUChar(input);
    if (type === 'I'.charCodeAt(0)) return this.readUShort(input);
    if (type === 'l'.charCodeAt(0)) return this.readUInt(input);
    if (type === 'L'.charCodeAt(0)) return input.readInt32();
    if (useIntOnError) {
      let result = (type & 0xff) << 24;
      result |= (input.readByte() & 0xff) << 16;
      result |= (input.readByte() & 0xff) << 8;
      result |= input.readByte() & 0xff;
      return result;
    }
    return defaultValue;
  }

  parseArray(input: BinaryInput) {
    const result: any = [];
    let type = input.readByte();
    let valueType = 0;
    if (type === '$'.charCodeAt(0)) {
      valueType = input.readByte();
      type = input.readByte();
    }
    let size = -1;
    if (type === '#'.charCodeAt(0)) {
      size = this.parseSize(input, input.readByte(), false, -1);
      if (size < 0) throw new Error('Unrecognized data type');
      if (size === 0) return result;
      type = valueType === 0 ? input.readByte() : valueType;
    }

    let c = 0;
    while (type !== ']'.charCodeAt(0)) {
      const val = this.parseWithType(input, type);
      result.push(val);
      if (size > 0 && ++c >= size) break;
      type = valueType === 0 ? input.readByte() : valueType;
    }
    return result;
  }

  parseData(input: BinaryInput, blockType: number) {
    const dataType = input.readByte();
    const size = blockType === 'A'.charCodeAt(0) ? this.readUInt(input) : this.readUChar(input);
    const result: any[] = [];
    for (let i = 0; i < size; i++) {
      const val = this.parseWithType(input, dataType);
      result.push(val);
    }
    return result;
  }

  readUChar(input: BinaryInput) {
    return input.readByte() & 0xff;
  }

  parseString(input: BinaryInput, type: number, sOptional: boolean = false) {
    let size = -1;
    if (type === 'S'.charCodeAt(0)) {
      size = this.parseSize(input, input.readByte(), true, -1);
    } else if (type === 's'.charCodeAt(0)) size = this.readUChar(input);
    else if (sOptional) size = this.parseSize(input, type, false, -1);
    if (size < 0) throw new Error('Unrecognized data type, string expected');
    return size > 0 ? this.readString(input, size) : '';
  }

  protected readUShort(input: BinaryInput): number {
    return input.readShort() & 0xffff;
  }

  protected readUInt(input: BinaryInput): number {
    return input.readInt(true) & 0xffffffff;
  }

  protected readString(input: BinaryInput, size: number): string {
    return input.readStringWithSize(size);
  }
}

export class BinaryInput {
  constructor(
    data: ArrayBuffer,
    public strings = new Array<string>(),
    private index: number = 0,
    private buffer = new DataView(data)
  ) {}

  readByte(): number {
    return this.buffer.getInt8(this.index++);
  }

  readUnsignedByte(): number {
    return this.buffer.getUint8(this.index++);
  }

  readShort(): number {
    let value = this.buffer.getInt16(this.index);
    this.index += 2;
    return value;
  }

  readInt32(): number {
    let value = this.buffer.getInt32(this.index);
    this.index += 4;
    return value;
  }

  readInt(optimizePositive: boolean) {
    const ch1 = this.readByte();
    const ch2 = this.readByte();
    const ch3 = this.readByte();
    const ch4 = this.readByte();
    const result = (ch1 << 24) + (ch2 << 16) + (ch3 << 8) + (ch4 << 0);
    return optimizePositive ? result : (result >>> 1) ^ -(result & 1);
  }

  readStringRef(): string | null {
    let index = this.readInt(true);
    return index === 0 ? null : this.strings[index - 1];
  }

  readStringWithSize(size: number): string | null {
    switch (size) {
      case 0:
        return null;
      case 1:
        return '';
    }
    let chars = '';
    for (let i = 0; i < size; ) {
      let b = this.readUnsignedByte();
      switch (b >> 4) {
        case 12:
        case 13:
          chars += String.fromCharCode(((b & 0x1f) << 6) | (this.readByte() & 0x3f));
          i += 2;
          break;
        case 14:
          chars += String.fromCharCode(((b & 0x0f) << 12) | ((this.readByte() & 0x3f) << 6) | (this.readByte() & 0x3f));
          i += 3;
          break;
        default:
          chars += String.fromCharCode(b);
          i++;
      }
    }
    return chars;
  }

  readString(): string | null {
    let byteCount = this.readInt(true);
    switch (byteCount) {
      case 0:
        return null;
      case 1:
        return '';
    }
    byteCount--;
    let chars = '';
    let charCount = 0;
    for (let i = 0; i < byteCount; ) {
      let b = this.readUnsignedByte();
      switch (b >> 4) {
        case 12:
        case 13:
          chars += String.fromCharCode(((b & 0x1f) << 6) | (this.readByte() & 0x3f));
          i += 2;
          break;
        case 14:
          chars += String.fromCharCode(((b & 0x0f) << 12) | ((this.readByte() & 0x3f) << 6) | (this.readByte() & 0x3f));
          i += 3;
          break;
        default:
          chars += String.fromCharCode(b);
          i++;
      }
    }
    return chars;
  }

  readFloat(): number {
    let value = this.buffer.getFloat32(this.index);
    this.index += 4;
    return value;
  }

  readBoolean(): boolean {
    return this.readByte() !== 0;
  }
}
