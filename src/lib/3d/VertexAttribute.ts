import { Shader } from '../Shader';
import { GL20 } from './GL20';

export class Usage {
  public static Position = 1;
  public static ColorUnpacked = 2;
  public static ColorPacked = 4;
  public static Normal = 8;
  public static TextureCoordinates = 16;
  public static Generic = 32;
  public static BoneWeight = 64;
  public static Tangent = 128;
  public static BiNormal = 256;
}

export class VertexAttribute {
  usage: number;
  type: number;
  offset: number;
  alias: string;
  unit: number;
  usageIndex: number;
  numComponents: number;
  normalized: boolean;

  constructor(
    usage: number,
    numComponents: number,
    type: number,
    normalized: boolean,
    alias: string,
    unit: number = 0
  ) {
    this.usage = usage;
    this.numComponents = numComponents;
    this.type = type;
    this.normalized = normalized;
    this.alias = alias;
    this.unit = unit;
    this.usageIndex = this.numberOfTrailingZeros(usage);
  }

  copy(): VertexAttribute {
    return new VertexAttribute(this.usage, this.numComponents, this.type, this.normalized, this.alias, this.unit);
  }

  public static Position(): VertexAttribute {
    return new VertexAttribute(Usage.Position, 3, GL20.GL_FLOAT, false, Shader.POSITION, 0);
  }

  public static TexCoords(unit: number): VertexAttribute {
    return new VertexAttribute(Usage.TextureCoordinates, 2, GL20.GL_FLOAT, false, Shader.TEXCOORDS + unit, unit);
  }

  public static Normal(): VertexAttribute {
    return new VertexAttribute(Usage.Normal, 3, GL20.GL_FLOAT, false, Shader.NORMAL);
  }

  public static ColorPacked(): VertexAttribute {
    return new VertexAttribute(Usage.ColorPacked, 4, GL20.GL_UNSIGNED_BYTE, true, Shader.COLOR);
  }

  public static ColorUnpacked(): VertexAttribute {
    return new VertexAttribute(Usage.ColorUnpacked, 4, GL20.GL_FLOAT, false, Shader.COLOR);
  }

  getKey(): number {
    return (this.usageIndex << 8) + (this.unit & 0xff);
  }

  numberOfTrailingZeros(n: number): number {
    let result = 0;
    for (let i = 5; i <= n; i += 5) {
      var num = i;
      while (num % 5 === 0) {
        num /= 5;
        result++;
      }
    }
    return result;
  }

  public getSizeInBytes(): number {
    switch (this.type) {
      case GL20.GL_FLOAT:
      case GL20.GL_FIXED:
        return 4 * this.numComponents;
      case GL20.GL_UNSIGNED_BYTE:
      case GL20.GL_BYTE:
        return this.numComponents;
      case GL20.GL_UNSIGNED_SHORT:
      case GL20.GL_SHORT:
        return 2 * this.numComponents;
    }
    return 0;
  }

  public equals(other: VertexAttribute): boolean {
    return (
      other !== null &&
      this.usage === other.usage &&
      this.numComponents === other.numComponents &&
      this.type === other.type &&
      this.normalized === other.normalized &&
      this.alias === other.alias &&
      this.unit === other.unit
    );
  }
}
