import { Color } from '../../../../Utils';
import { GL20 } from '../../../GL20';

export class GLTFTypes {
  public static TYPE_SCALAR = 'SCALAR';
  public static TYPE_VEC2 = 'VEC2';
  public static TYPE_VEC3 = 'VEC3';
  public static TYPE_VEC4 = 'VEC4';
  public static TYPE_MAT2 = 'MAT2';
  public static TYPE_MAT3 = 'MAT3';
  public static TYPE_MAT4 = 'MAT4';

  public static C_BYTE = 5120;
  public static C_UBYTE = 5121;
  public static C_SHORT = 5122;
  public static C_USHORT = 5123;
  public static C_UINT = 5125;
  public static C_FLOAT = 5126;

  /** https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#primitivemode */
  public static mapPrimitiveMode(glMode: number): number {
    if (!glMode) return GL20.GL_TRIANGLES;
    switch (glMode) {
      case 0:
        return GL20.GL_POINTS;
      case 1:
        return GL20.GL_LINES;
      case 2:
        return GL20.GL_LINE_LOOP;
      case 3:
        return GL20.GL_LINE_STRIP;
      case 4:
        return GL20.GL_TRIANGLES;
      case 5:
        return GL20.GL_TRIANGLE_STRIP;
      case 6:
        return GL20.GL_TRIANGLE_FAN;
    }
    throw new Error('unsupported mode ' + glMode);
  }

  public static mapColor(c: number[], defaultColor: Color): Color {
    if (!c) {
      return new Color().setFromColor(defaultColor);
    }
    if (c.length < 4) {
      return new Color(c[0], c[1], c[2], 1);
    } else {
      return new Color(c[0], c[1], c[2], c[3]);
    }
  }
}
