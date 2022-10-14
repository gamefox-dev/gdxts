import { Utils } from '../../../../../Utils';
import { VertexAttributes } from '../../../../attributes';

export class MeshSpliter {
  public static split(
    splitVertices: Array<number[]>,
    splitIndices: Array<number[]>,
    vertices: number[],
    attributes: VertexAttributes,
    indices: number[],
    verticesPerPrimitive: number
  ) {
    // Values used by some graphics APIs as "primitive restart" values are disallowed.
    // Specifically, the value 65535 (in UINT16) cannot be used as a vertex index.
    const size16 = 65535;

    const stride = attributes.vertexSize / 4;

    const vertexMaxSize = size16 * stride;

    const primitiveIndices = new Array<number>();
    let remainingIndices = new Array<number>();

    let maxIndexFound = 0;
    for (let i = 0; i < indices.length; i++) {
      maxIndexFound = Math.max(maxIndexFound, indices[i]);
    }

    const groups = new Map<number, Array<number>>();
    for (let i = 0, count = indices.length; i < count; ) {
      const index0 = indices[i++];
      primitiveIndices.push(index0);
      const group0 = index0 / size16;
      let sameGroup = true;
      for (let j = 1; j < verticesPerPrimitive; j++) {
        const indexI = indices[i++];
        primitiveIndices.push(indexI);
        let groupI = indexI / size16;
        if (groupI != group0) {
          sameGroup = false;
        }
      }
      if (sameGroup) {
        let group = groups.get(group0);
        if (group === undefined) groups.set(group0, (group = new Array<number>()));
        for (let j = 0; j < verticesPerPrimitive; j++) {
          group.push(primitiveIndices[j] - group0 * size16);
        }
      } else {
        for (const index of primitiveIndices) {
          remainingIndices.push(index);
        }
      }

      primitiveIndices.length = 0;
    }

    let maxGroup = 0;
    for (const [key, value] of groups) {
      maxGroup = Math.max(maxGroup, key);
    }

    let lastGroup = groups.get(maxGroup);
    let maxIndex = 0;
    for (let i = 0; i < lastGroup.length; i++) {
      maxIndex = Math.max(maxIndex, lastGroup[i]);
    }

    for (let i = 0; i <= maxGroup; i++) {
      const groupVertices = new Array<number>(vertexMaxSize);
      const offset = i * size16 * stride;
      const size = Math.min(vertices.length - offset, groupVertices.length);
      Utils.arrayCopy(vertices, offset, groupVertices, 0, size);
      splitVertices.push(groupVertices);
    }

    let lastVertices = splitVertices[splitVertices.length - 1];

    let toProcess = new Array<number>();

    while (remainingIndices.length > 0) {
      if (maxIndex < 0 || maxIndex >= size16 - 1) {
        maxIndex = -1;
        groups.set(++maxGroup, (lastGroup = new Array<number>()));
        splitVertices.push((lastVertices = new Array<number>(vertexMaxSize)));
      }
      const reindex = new Map<number, number>();
      for (let i = 0; i < remainingIndices.length; i++) {
        const oindex = remainingIndices[i];
        let tindex = reindex.get(oindex);
        if (tindex === undefined) {
          tindex = -1;
        }

        if (tindex < 0) {
          tindex = maxIndex + 1;
          if (tindex >= size16) {
            toProcess.push(oindex);
          } else {
            reindex.set(oindex, tindex);
            maxIndex = tindex;
          }
        }
        lastGroup.push(tindex);
      }

      for (const [key, value] of reindex) {
        Utils.arrayCopy(vertices, key * stride, lastVertices, value * stride, stride);
      }

      if (toProcess.length == 0) break;

      remainingIndices.length = 0;
      const tmp = toProcess;
      toProcess = remainingIndices;
      remainingIndices = tmp;
      maxIndex = -1;
    }

    for (let i = 0; i <= maxGroup; i++) {
      const group = groups.get(i);
      const shortIndices = new Array<number>(group.length);
      for (let j = 0; j < group.length; j++) {
        const index = group[j];
        shortIndices[j] = index;
      }
      splitIndices.push(shortIndices);
    }

    let size = (maxIndex + 1) * stride;
    const tmp = new Array<number>(size);
    Utils.arrayCopy(lastVertices, 0, tmp, 0, size);
    splitVertices[splitIndices.length - 1] = tmp;
  }
}
