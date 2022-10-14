import { Node } from '../../../model';
export class NodeResolver {
  public nodeMap = new Map<number, Node>();

  public get(index: number): Node {
    return this.nodeMap.get(index);
  }

  public put(index: number, node: Node) {
    this.nodeMap.set(index, node);
  }
}
