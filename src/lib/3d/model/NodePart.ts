import { Matrix4 } from "../../Matrix4";
import { Node } from "./Node";
import { Material } from "../Material";
import { MeshPart } from "./MeshPart";
import { Renderable } from "../Renderable";

export class NodePart {
  public meshPart: MeshPart;
  public material: Material;
  public invBoneBindTransforms: Map<Node, Matrix4>;
  public bones: Matrix4[];
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
    if (other.invBoneBindTransforms == null) {
      this.invBoneBindTransforms = null;
      this.bones = null;
    } else {
      if (this.invBoneBindTransforms == null)
        this.invBoneBindTransforms = new Map<Node, Matrix4>();
      else this.invBoneBindTransforms.clear();

      other.invBoneBindTransforms.forEach((value: Matrix4, key: Node) => {
        this.invBoneBindTransforms.set(key, value);
      });
    }

    if (
      this.bones == null ||
      this.bones.length !== this.invBoneBindTransforms.size
    )
      this.bones = new Array<Matrix4>(this.invBoneBindTransforms.size);

    for (let i = 0; i < this.bones.length; i++) {
      if (this.bones[i] == null) this.bones[i] = new Matrix4();
    }
    return this;
  }
}
