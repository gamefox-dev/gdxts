import { Vector3 } from "../../Vector3";
import { Quaternion } from "../Quaternion";
import { ModelNodePart } from "./ModelNodePart";

export class ModelNode {
  public id: string;
  public translation: Vector3;
  public rotation: Quaternion;
  public scale: Vector3;
  public meshId: string;
  public parts: ModelNodePart[];
  public children: ModelNode[];
}
