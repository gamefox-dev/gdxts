import { Matrix4 } from '../../../Matrix4';
import { ArrayMap } from '../../../Utils';

export class ModelNodePart {
  public materialId: string;
  public meshPartId: string;
  public bones: ArrayMap<string, Matrix4>;
  public uvMapping: number[][];
}
