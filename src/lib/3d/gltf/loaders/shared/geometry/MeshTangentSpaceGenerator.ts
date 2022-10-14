import { Vector3 } from '../../../../../Vector3';
import { Usage, VertexAttribute3D, VertexAttributes } from '../../../../attributes';
import { Material } from '../../../../Material';
import { Mesh3D } from '../../../../Mesh';
import { PBRTextureAttribute } from '../../../scene3d/attributes/PBRTextureAttribute';

export class MeshTangentSpaceGenerator {
  public static computeTangentSpace(
    mesh: Mesh3D,
    material: Material,
    computeNormals: boolean,
    computeTangents: boolean
  ) {
    if (mesh.getNumIndices() == 0) throw new Error('non indexed mesh not implemented');

    const vertices = new Array<number>((mesh.getNumVertices() * mesh.getVertexAttributes().vertexSize) / 4);
    const indices = new Array<number>(mesh.getNumIndices());
    mesh.getVertices(vertices);
    mesh.getIndices(0, -1, indices, 0);

    const normalMap = material.get(PBRTextureAttribute.NormalTexture) as PBRTextureAttribute;
    if (normalMap == null) throw new Error('normal map not found in material');

    const attributesGroup = mesh.getVertexAttributes();
    let normalMapUVs: VertexAttribute3D = null;
    for (const a of attributesGroup.attributes) {
      if (a.usage == Usage.TextureCoordinates && a.unit == normalMap.uvIndex) {
        normalMapUVs = a;
      }
    }

    if (normalMapUVs == null) throw new Error('texture coordinates not found');

    this.computeTangentSpaceWithData(vertices, indices, attributesGroup, computeNormals, computeTangents, normalMapUVs);

    mesh.setVertices(vertices);
    mesh.setIndices(indices);
  }

  public static computeTangentSpaceWithData(
    vertices: number[],
    indices: number[],
    attributesGroup: VertexAttributes,
    computeNormals: boolean,
    computeTangents: boolean,
    normalMapUVs: VertexAttribute3D
  ) {
    if (computeNormals) this.computeNormals(vertices, indices, attributesGroup);
    if (computeTangents) this.computeTangents(vertices, indices, attributesGroup, normalMapUVs);
  }

  static temp = new Vector3();
  private static computeNormals(vertices: number[], indices: number[], attributesGroup: VertexAttributes) {
    const posOffset = attributesGroup.getOffset(Usage.Position);
    const normalOffset = attributesGroup.getOffset(Usage.Normal);
    const stride = attributesGroup.vertexSize / 4;

    const vab = new Vector3();
    const vac = new Vector3();
    if (indices != null) {
      for (let index = 0, count = indices.length; index < count; ) {
        const vIndexA = indices[index++] & 0xffff;
        const ax = vertices[vIndexA * stride + posOffset];
        const ay = vertices[vIndexA * stride + posOffset + 1];
        const az = vertices[vIndexA * stride + posOffset + 2];

        const vIndexB = indices[index++] & 0xffff;
        const bx = vertices[vIndexB * stride + posOffset];
        const by = vertices[vIndexB * stride + posOffset + 1];
        const bz = vertices[vIndexB * stride + posOffset + 2];

        const vIndexC = indices[index++] & 0xffff;
        const cx = vertices[vIndexC * stride + posOffset];
        const cy = vertices[vIndexC * stride + posOffset + 1];
        const cz = vertices[vIndexC * stride + posOffset + 2];

        this.temp.set(ax, ay, az);
        vab.set(bx, by, bz).sub(this.temp);
        vac.set(cx, cy, cz).sub(this.temp);
        const n = vab.cross(vac).normalize();

        vertices[vIndexA * stride + normalOffset] = n.x;
        vertices[vIndexA * stride + normalOffset + 1] = n.y;
        vertices[vIndexA * stride + normalOffset + 2] = n.z;

        vertices[vIndexB * stride + normalOffset] = n.x;
        vertices[vIndexB * stride + normalOffset + 1] = n.y;
        vertices[vIndexB * stride + normalOffset + 2] = n.z;

        vertices[vIndexC * stride + normalOffset] = n.x;
        vertices[vIndexC * stride + normalOffset + 1] = n.y;
        vertices[vIndexC * stride + normalOffset + 2] = n.z;
      }
    } else {
      for (let index = 0, count = vertices.length / stride; index < count; ) {
        const vIndexA = index++;
        const ax = vertices[vIndexA * stride + posOffset];
        const ay = vertices[vIndexA * stride + posOffset + 1];
        const az = vertices[vIndexA * stride + posOffset + 2];

        const vIndexB = index++;
        const bx = vertices[vIndexB * stride + posOffset];
        const by = vertices[vIndexB * stride + posOffset + 1];
        const bz = vertices[vIndexB * stride + posOffset + 2];

        const vIndexC = index++;
        const cx = vertices[vIndexC * stride + posOffset];
        const cy = vertices[vIndexC * stride + posOffset + 1];
        const cz = vertices[vIndexC * stride + posOffset + 2];

        this.temp.set(ax, ay, az);
        vab.set(bx, by, bz).sub(this.temp);
        vac.set(cx, cy, cz).sub(this.temp);
        const n = vab.cross(vac).normalize();

        vertices[vIndexA * stride + normalOffset] = n.x;
        vertices[vIndexA * stride + normalOffset + 1] = n.y;
        vertices[vIndexA * stride + normalOffset + 2] = n.z;

        vertices[vIndexB * stride + normalOffset] = n.x;
        vertices[vIndexB * stride + normalOffset + 1] = n.y;
        vertices[vIndexB * stride + normalOffset + 2] = n.z;

        vertices[vIndexC * stride + normalOffset] = n.x;
        vertices[vIndexC * stride + normalOffset + 1] = n.y;
        vertices[vIndexC * stride + normalOffset + 2] = n.z;
      }
    }
  }

  // inspired by: https://gamedev.stackexchange.com/questions/68612/how-to-compute-tangent-and-bitangent-vectors
  //
  private static computeTangents(
    vertices: number[],
    indices: number[],
    attributesGroup: VertexAttributes,
    normalMapUVs: VertexAttribute3D
  ) {
    const posOffset = attributesGroup.getOffset(Usage.Position);
    const normalOffset = attributesGroup.getOffset(Usage.Normal);
    const tangentOffset = attributesGroup.getOffset(Usage.Tangent);
    const texCoordOffset = normalMapUVs.offset / 4;
    const stride = attributesGroup.vertexSize / 4;
    const vertexCount = vertices.length / stride;

    const vu = new Vector3();
    const vv = new Vector3();
    const tan1 = new Array<Vector3>(indices.length);
    const tan2 = new Array<Vector3>(indices.length);
    for (let i = 0; i < indices.length; i++) {
      tan1[i] = new Vector3();
      tan2[i] = new Vector3();
    }

    for (let index = 0, count = indices.length; index < count; ) {
      const vIndexA = indices[index++] & 0xffff;
      const ax = vertices[vIndexA * stride + posOffset];
      const ay = vertices[vIndexA * stride + posOffset + 1];
      const az = vertices[vIndexA * stride + posOffset + 2];

      const vIndexB = indices[index++] & 0xffff;
      const bx = vertices[vIndexB * stride + posOffset];
      const by = vertices[vIndexB * stride + posOffset + 1];
      const bz = vertices[vIndexB * stride + posOffset + 2];

      const vIndexC = indices[index++] & 0xffff;
      const cx = vertices[vIndexC * stride + posOffset];
      const cy = vertices[vIndexC * stride + posOffset + 1];
      const cz = vertices[vIndexC * stride + posOffset + 2];

      const au = vertices[vIndexA * stride + texCoordOffset];
      const av = vertices[vIndexA * stride + texCoordOffset + 1];

      const bu = vertices[vIndexB * stride + texCoordOffset];
      const bv = vertices[vIndexB * stride + texCoordOffset + 1];

      const cu = vertices[vIndexC * stride + texCoordOffset];
      const cv = vertices[vIndexC * stride + texCoordOffset + 1];

      const dx1 = bx - ax;
      const dx2 = cx - ax;

      const dy1 = by - ay;
      const dy2 = cy - ay;

      const dz1 = bz - az;
      const dz2 = cz - az;

      const du1 = bu - au;
      const du2 = cu - au;

      const dv1 = bv - av;
      const dv2 = cv - av;

      const r = 1 / (du1 * dv2 - du2 * dv1);

      vu.set((dv2 * dx1 - dv1 * dx2) * r, (dv2 * dy1 - dv1 * dy2) * r, (dv2 * dz1 - dv1 * dz2) * r);

      vv.set((du1 * dx2 - du2 * dx1) * r, (du1 * dy2 - du2 * dy1) * r, (du1 * dz2 - du2 * dz1) * r);

      tan1[vIndexA].add(vu);
      tan2[vIndexA].add(vv);

      tan1[vIndexB].add(vu);
      tan2[vIndexB].add(vv);

      tan1[vIndexC].add(vu);
      tan2[vIndexC].add(vv);
    }

    const tangent = new Vector3();
    const normal = new Vector3();
    const biNormal = new Vector3();
    for (let i = 0; i < vertexCount; i++) {
      const nx = vertices[i * stride + normalOffset];
      const ny = vertices[i * stride + normalOffset + 1];
      const nz = vertices[i * stride + normalOffset + 2];
      normal.set(nx, ny, nz);

      const t1 = tan1[i];
      tangent.setFrom(t1).mulAdd(normal, -normal.dot(t1)).normalize();

      const t2 = tan2[i];
      biNormal.setFrom(normal).cross(tangent);
      const tangentW = biNormal.dot(t2) < 0 ? -1 : 1;

      vertices[i * stride + tangentOffset] = tangent.x;
      vertices[i * stride + tangentOffset + 1] = tangent.y;
      vertices[i * stride + tangentOffset + 2] = tangent.z;
      vertices[i * stride + tangentOffset + 3] = tangentW;
    }
  }
}
