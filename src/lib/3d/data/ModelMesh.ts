import { VertexAttribute } from "../VertexAttribute";
import { ModelMeshPart } from "./ModelMeshPart";

export class ModelMesh {
  public id: string;
  public attributes: VertexAttribute[];
  public vertices: number[];
  public parts: ModelMeshPart[];
}
