import { VertexAttribute } from './VertexAttribute';

export class VertexAttributes {
  public attributes: VertexAttribute[];
  public vertexSize: number;
  private mask = -1;
  constructor(attributes: VertexAttribute[]) {
    if (attributes.length === 0) throw new Error('attributes must be >= 1');

    const list: VertexAttribute[] = [];
    for (let i = 0; i < attributes.length; i++) list[i] = attributes[i];

    this.attributes = list;
    this.vertexSize = this.calculateOffsets();
  }

  public getOffset(usage: number, defaultIfNotFound: number = 0) {
    const vertexAttribute = this.findByUsage(usage);
    if (vertexAttribute == null) return defaultIfNotFound;
    return vertexAttribute.offset / 4;
  }

  public findByUsage(usage: number): VertexAttribute {
    for (const att of this.attributes) {
      if (att.usage === usage) return att;
    }
    return null;
  }

  private calculateOffsets(): number {
    let count = 0;
    for (let i = 0; i < this.attributes.length; i++) {
      this.attributes[i].offset = count;
      count += this.attributes[i].getSizeInBytes();
    }

    return count;
  }

  public size(): number {
    return this.attributes.length;
  }

  public get(index: number): VertexAttribute {
    return this.attributes[index];
  }

  public toString(): string {
    let returnValue = '[';
    for (let i = 0; i < this.attributes.length; i++) {
      returnValue += '(';
      returnValue += this.attributes[i].alias;
      returnValue += ', ';
      returnValue += this.attributes[i].usage;
      returnValue += ', ';
      returnValue += this.attributes[i].numComponents;
      returnValue += ', ';
      returnValue += this.attributes[i].offset;
      returnValue += ')';
      returnValue += '\n';
    }
    returnValue += ']';
    return returnValue;
  }

  public equals(other: VertexAttributes): boolean {
    if (other === this) return true;
    if (this.attributes.length !== other.attributes.length) return false;
    for (let i = 0; i < this.attributes.length; i++) {
      if (!this.attributes[i].equals(other.attributes[i])) return false;
    }
    return true;
  }

  public getMask(): number {
    if (this.mask === -1) {
      let result = 0;
      for (let i = 0; i < this.attributes.length; i++) {
        result |= this.attributes[i].usage;
      }
      this.mask = result;
    }
    return this.mask;
  }

  public getMaskWithSizePacked(): number {
    return this.getMask() | (this.attributes.length << 32);
  }
}
