import { NodePart } from '../../../model';
import { Renderable } from '../../../Renderable';
import { WeightVector } from './WeightVector';

export class NodePartPlus extends NodePart {
  /**
   * null if no morph targets
   */
  public morphTargets: WeightVector;

  public setRenderable(out: Renderable): Renderable {
    out.material = this.material;
    out.meshPart.setFrom(this.meshPart);
    out.bones = this.bones;
    out.userData = this.morphTargets;
    return out;
  }

  public copy(): NodePart {
    return new NodePartPlus().set(this);
  }

  protected set(other: NodePart): NodePart {
    super.set(other);
    if (other instanceof NodePartPlus) {
      this.morphTargets = (other as NodePartPlus).morphTargets;
    }
    return this;
  }
}
