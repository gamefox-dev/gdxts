import { VertexAttribute3D } from '../../attributes/VertexAttribute';
import { ModelMeshPart } from './ModelMeshPart';

export class ModelMesh {
  public id: string;
  public attributes: VertexAttribute3D[];
  public vertices: number[];
  public parts: ModelMeshPart[];
}
