import { Mesh } from "./Mesh";
import { ShaderProgram } from "../ShaderProgram";
import { Disposable } from "../Utils";
import { Vector3 } from "../Vector3";
import { BoundingBox } from "./BoundingBox";

export class MeshPart implements Disposable {
  id = "";
  primitiveType = 0;
  offset = 0;
  size = 0;
  mesh: Mesh = null;
  center = new Vector3();
  halfExtents = new Vector3();
  radius = -1;
  bounds = new BoundingBox();

  dispose() {}

  constructor(other: MeshPart = null) {
    if (other != null) {
      this.setByMeshPart(other);
    }
  }

  setByMeshPart(other: MeshPart): MeshPart {
    this.id = other.id;
    this.mesh = other.mesh;
    this.offset = other.offset;
    this.size = other.size;
    this.primitiveType = other.primitiveType;
    this.center.set(other.center.x, other.center.y, other.center.z);
    this.halfExtents.set(
      other.halfExtents.x,
      other.halfExtents.y,
      other.halfExtents.z
    );
    this.radius = other.radius;
    return this;
  }

  set(
    id: string,
    mesh: Mesh,
    offset: number,
    size: number,
    type: number
  ): MeshPart {
    this.id = id;
    this.mesh = mesh;
    this.offset = offset;
    this.size = size;
    this.primitiveType = type;
    this.center.set(0, 0, 0);
    this.halfExtents.set(0, 0, 0);
    this.radius = -1;
    return this;
  }

  update() {
    this.mesh.extendBoundingBox(this.bounds, this.offset, this.size, null);
    this.bounds.getCenter(this.center);
    this.bounds.getDimensions(this.halfExtents).scale(0.5);
    this.radius = this.halfExtents.length();
  }

  equals(other: MeshPart): boolean {
    return (
      other == this ||
      (other != null &&
        other.mesh == this.mesh &&
        other.primitiveType == this.primitiveType &&
        other.offset == this.offset &&
        other.size == this.size)
    );
  }

  render(shader: ShaderProgram) {
    this.mesh.render(shader, this.primitiveType, this.offset, this.size);
  }
}
