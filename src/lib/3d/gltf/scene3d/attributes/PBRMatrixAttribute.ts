import { Matrix4 } from '../../../../Matrix4';
import { Vector3 } from '../../../../Vector3';
import { Attribute } from '../../../attributes';

export class PBRMatrixAttribute extends Attribute {
  public static EnvRotationAlias = 'envRotation';
  public static EnvRotation: number = this.register(PBRMatrixAttribute.EnvRotationAlias);

  public static createEnvRotation(azymuthAngleDegree: number): PBRMatrixAttribute {
    return new PBRMatrixAttribute(PBRMatrixAttribute.EnvRotation).set(azymuthAngleDegree);
  }

  public static createEnvRotationWithMatrix(matrix: Matrix4): PBRMatrixAttribute {
    return new PBRMatrixAttribute(PBRMatrixAttribute.EnvRotation).setMatrix(matrix);
  }

  public matrix = new Matrix4();

  constructor(type: number) {
    super();
    this.setType(type);
  }

  private setMatrix(matrix: Matrix4): PBRMatrixAttribute {
    this.matrix.set(matrix.values);
    return this;
  }

  public set(azymuthAngleDegree: number): PBRMatrixAttribute {
    this.matrix.setToRotation(Vector3.Y, azymuthAngleDegree);
    return this;
  }

  public copy(): Attribute {
    return new PBRMatrixAttribute(this.type).setMatrix(this.matrix);
  }

  public compareTo(o: Attribute): number {
    return this.type - o.type;
  }
}
