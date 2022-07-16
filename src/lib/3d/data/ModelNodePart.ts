import { Matrix4 } from "../../Matrix4";

export class ModelNodePart {
  public materialId: string;
  public meshPartId: string;
  public bones: Map<String, Matrix4>;
  public uvMapping: number[][];
}
