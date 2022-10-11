import { Node } from '../../../model';
import { WeightVector } from './WeightVector';

export class NodePlus extends Node {
  /**
   * null if no morph targets
   */
  public weights: WeightVector;

  /**
   * optionnal morph target names (eg. exported from Blender with custom properties enabled).
   * shared with others nodes with same mesh.
   */
  public morphTargetNames: string[];

  public copy(): Node {
    return new NodePlus().set(this);
  }

  protected set(other: Node): Node {
    if (other instanceof NodePlus) {
      if (!!(other as NodePlus).weights) {
        this.weights = (other as NodePlus).weights.cpy();
        this.morphTargetNames = (other as NodePlus).morphTargetNames;
      }
    }
    return super.set(other);
  }
}
