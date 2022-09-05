import { Matrix4 } from '../../Matrix4';
import { ArrayMap } from '../../Utils';
import { Material } from '../Material';
import { Renderable } from '../Renderable';
import { MeshPart } from './MeshPart';
import { Node } from './Node';

export class NodePart {
  public meshPart: MeshPart;
  public material: Material;
  public invBoneBindTransforms: ArrayMap<Node, Matrix4> = null;
  public bones: Matrix4[] = null;
  public enabled = true;

  constructor(meshPart: MeshPart = null, material = null) {
    this.meshPart = meshPart;
    this.material = material;
  }

  public copy(): NodePart {
    return new NodePart().set(this);
  }

  public setRenderable(out: Renderable): Renderable {
    out.material = this.material;
    out.meshPart.setByMeshPart(this.meshPart);
    out.bones = this.bones;
    return out;
  }

  protected set(other: NodePart): NodePart {
    this.meshPart = new MeshPart(other.meshPart);
    this.material = other.material;
    this.enabled = other.enabled;
    if (!other.invBoneBindTransforms) {
      this.invBoneBindTransforms = null;
      this.bones = null;
    } else {
      if (!this.invBoneBindTransforms) {
        this.invBoneBindTransforms = new ArrayMap<Node, Matrix4>();
      } else {
        this.invBoneBindTransforms.clear();
      }

      this.invBoneBindTransforms.clear();
      for (let i = 0; i < other.invBoneBindTransforms.size; i++) {
        this.invBoneBindTransforms.set(other.invBoneBindTransforms.keys[i], other.invBoneBindTransforms.values[i]);
      }

      if (!this.bones || this.bones.length !== this.invBoneBindTransforms.size) this.bones = new Array<Matrix4>();

      for (let i = 0; i < this.invBoneBindTransforms.size; i++) {
        if (this.bones[i] === undefined) this.bones[i] = new Matrix4();
      }
    }
    return this;
  }
}
