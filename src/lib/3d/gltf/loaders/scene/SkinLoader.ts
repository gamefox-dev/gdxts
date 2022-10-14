import { Matrix4 } from '../../../../Matrix4';
import { ArrayMap } from '../../../../Utils';
import { Node } from '../../../model';
import { GLTFNode } from '../../data/scene/GLTFNode';
import { GLTFSkin } from '../../data/scene/GLTFSkin';
import { NodeResolver } from './NodeResolver';

export class SkinLoader {
  private maxBones: number;

  public loads(glSkins: GLTFSkin[], glNodes: GLTFNode[], nodeResolver: NodeResolver, dataResolver: DataResolver) {
    if (!!glNodes) {
      for (let i = 0; i < glNodes.length; i++) {
        const glNode = glNodes[i];
        if (!!glNode.skin) {
          const glSkin = glSkins[glNode.skin];
          this.load(glSkin, glNode, nodeResolver.get(i), nodeResolver, dataResolver);
        }
      }
    }
  }

  private load(glSkin: GLTFSkin, glNode: GLTFNode, node: Node, nodeResolver: NodeResolver, dataResolver: DataResolver) {
    const ibms = new Array<Matrix4>();
    const joints = new Array<number>();

    const bonesCount = glSkin.joints.length;
    this.maxBones = Math.max(this.maxBones, bonesCount);

    const floatBuffer = dataResolver.getBufferFloat(glSkin.inverseBindMatrices);

    for (let i = 0; i < bonesCount; i++) {
      const matrixData = new Array<number>(16);
      floatBuffer.get(matrixData);
      ibms.push(new Matrix4().set(matrixData));
    }

    for (const join of glSkin.joints) {
      joints.push(join);
    }

    if (ibms.length > 0) {
      for (const nodePart of node.parts) {
        nodePart.bones = new Array<Matrix4>(ibms.length);
        nodePart.invBoneBindTransforms = new ArrayMap<Node, Matrix4>();
        for (let n = 0; n < joints.length; n++) {
          nodePart.bones[n] = new Matrix4().idt();
          const nodeIndex = joints[n];
          const key = nodeResolver.get(nodeIndex);
          if (!key) throw new Error('node not found for bone: ' + nodeIndex);
          nodePart.invBoneBindTransforms.set(key, ibms[n]);
        }
      }
    }
  }

  public getMaxBones(): number {
    return this.maxBones;
  }
}
