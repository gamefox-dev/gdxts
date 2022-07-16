import { ModelMaterial } from "./ModelMaterial";
import { ModelMesh } from "./ModelMesh";
import { ModelNode } from "./ModelNode";

export class ModelData {
  public id: string;
  //public short version[] = new short[2];
  public meshes: ModelMesh[] = [];
  public materials: ModelMaterial[] = [];
  public nodes: ModelNode[] = [];
  //public Array<ModelAnimation> animations = new Array<ModelAnimation>();

  public addMesh(mesh: ModelMesh) {
    for (const other of this.meshes) {
      if (other.id == mesh.id) {
        throw new Error("Mesh with id '" + other.id + "' already in model");
      }
    }
    this.meshes.push(mesh);
  }
}
