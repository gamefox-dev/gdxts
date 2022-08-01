import { Matrix4 } from '../../../Matrix4';

export class ModelNodePart {
  public materialId: string;
  public meshPartId: string;
  public bones: Map<string, Matrix4>;
  public uvMapping: number[][];
}
