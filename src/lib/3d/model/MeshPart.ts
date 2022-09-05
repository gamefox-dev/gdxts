import { Shader } from '../../Shader';
import { Disposable } from '../../Utils';
import { Vector3 } from '../../Vector3';
import { BoundingBox } from '../BoundingBox';
import { Mesh } from '../Mesh';

export class MeshPart implements Disposable {
  public id = '';
  public primitiveType = 0;
  public offset = 0;
  public size = 0;
  public mesh: Mesh = null;
  public center = new Vector3();
  public halfExtents = new Vector3();
  public radius = -1;
  public bounds = new BoundingBox();

  public dispose() {}

  constructor(other: MeshPart = null) {
    if (!!other) {
      this.setByMeshPart(other);
    }
  }

  public setByMeshPart(other: MeshPart): MeshPart {
    this.id = other.id;
    this.mesh = other.mesh;
    this.offset = other.offset;
    this.size = other.size;
    this.primitiveType = other.primitiveType;
    this.center.set(other.center.x, other.center.y, other.center.z);
    this.halfExtents.set(other.halfExtents.x, other.halfExtents.y, other.halfExtents.z);
    this.radius = other.radius;
    return this;
  }

  public set(id: string, mesh: Mesh, offset: number, size: number, type: number): MeshPart {
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

  public update() {
    this.mesh.extendBoundingBox(this.bounds, this.offset, this.size, null);
    this.bounds.getCenter(this.center);
    this.bounds.getDimensions(this.halfExtents).scale(0.5);
    this.radius = this.halfExtents.length();
  }

  public equals(other: MeshPart): boolean {
    return (
      other === this ||
      (!!other &&
        other.mesh === this.mesh &&
        other.primitiveType === this.primitiveType &&
        other.offset === this.offset &&
        other.size === this.size)
    );
  }

  public render(shader: Shader, autoBind: boolean) {
    this.mesh.render(shader, this.primitiveType, this.offset, this.size, autoBind);
  }
}
