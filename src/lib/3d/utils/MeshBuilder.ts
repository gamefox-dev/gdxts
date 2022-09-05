import { Matrix3 } from '../../Matrix3';
import { Matrix4 } from '../../Matrix4';
import { NumberUtil } from '../../NumberUtils';
import { Shader } from '../../Shader';
import { TextureRegion } from '../../TextureRegion';
import { Color, MathUtils, Utils } from '../../Utils';
import { Vector2 } from '../../Vector2';
import { Vector3 } from '../../Vector3';
import { Usage, VertexAttribute } from '../attributes/VertexAttribute';
import { VertexAttributes } from '../attributes/VertexAttributes';
import { BoundingBox } from '../BoundingBox';
import { GL20 } from '../GL20';
import { Mesh } from '../Mesh';
import { MeshPart } from '../model/MeshPart';
import { BoxShapeBuilder } from './BoxShapeBuilder';
import { VertexInfo } from './VertexInfo';

export class MeshBuilder {
  public static MAX_VERTICES = 1 << 16;
  public static MAX_INDEX = MeshBuilder.MAX_VERTICES - 1;

  // private static tmpIndices: number[] = [];
  // private static tmpVertices: number[] = [];

  private vertTmp1 = new VertexInfo();
  private vertTmp2 = new VertexInfo();
  private vertTmp3 = new VertexInfo();
  private vertTmp4 = new VertexInfo();

  private tempC1: Color = new Color();
  private attributes: VertexAttributes;
  private vertices: number[] = [];
  private indices: number[] = [];
  private stride: number;
  private vindex: number;
  private istart: number;
  private posOffset: number;
  private posSize: number;
  private norOffset: number;
  private biNorOffset: number;
  private tangentOffset: number;
  private colOffset: number;
  private colSize: number;
  private cpOffset: number;
  private uvOffset: number;
  private meshPart: MeshPart;
  private parts: MeshPart[] = [];
  private color: Color = Color.WHITE;
  private hasColor = false;
  private primitiveType: number;

  private uOffset = 0;
  private uScale = 1;
  private vOffset = 0;
  private vScale = 1;
  private hasUVTransform = false;
  private _vertex: number[];

  private vertexTransformationEnabled = false;
  private positionTransform: Matrix4 = new Matrix4();
  private normalTransform: Matrix3 = new Matrix3();
  private bounds: BoundingBox = new BoundingBox();

  constructor(private gl: WebGLRenderingContext) {}

  public static createAttributes(usage: number): VertexAttributes {
    const attrs: VertexAttribute[] = [];

    if ((usage & Usage.Position) === Usage.Position) attrs.push(VertexAttribute.Position());
    if ((usage & Usage.ColorUnpacked) === Usage.ColorUnpacked) attrs.push(VertexAttribute.ColorUnpacked());
    if ((usage & Usage.ColorPacked) === Usage.ColorPacked) attrs.push(VertexAttribute.ColorPacked());
    if ((usage & Usage.Normal) === Usage.Normal) attrs.push(VertexAttribute.Normal());
    if ((usage & Usage.TextureCoordinates) === Usage.TextureCoordinates)
      attrs.push(new VertexAttribute(Usage.TextureCoordinates, 2, GL20.GL_FLOAT, false, Shader.TEXCOORDS + '0'));
    return new VertexAttributes(attrs);
  }

  public begin(attributes: VertexAttributes, primitiveType: number = -1) {
    if (!!this.attributes) throw new Error('Call end() first');
    this.attributes = attributes;
    this.parts.length = 0;
    this.vindex = 0;
    this.lastIndex = -1;
    this.istart = 0;
    this.meshPart = null;
    this.stride = attributes.vertexSize / 4;
    if (!this._vertex || this.vertex.length < this.stride) this._vertex = new Array<number>(this.stride);
    let a = attributes.findByUsage(Usage.Position);
    if (!a) throw new Error('Cannot build mesh without position attribute');
    this.posOffset = a.offset / 4;
    this.posSize = a.numComponents;
    a = attributes.findByUsage(Usage.Normal);
    this.norOffset = !a ? -1 : a.offset / 4;
    a = attributes.findByUsage(Usage.BiNormal);
    this.biNorOffset = !a ? -1 : a.offset / 4;
    a = attributes.findByUsage(Usage.Tangent);
    this.tangentOffset = !a ? -1 : a.offset / 4;
    a = attributes.findByUsage(Usage.ColorUnpacked);
    this.colOffset = !a ? -1 : a.offset / 4;
    this.colSize = !a ? 0 : a.numComponents;
    a = attributes.findByUsage(Usage.ColorPacked);
    this.cpOffset = !a ? -1 : a.offset / 4;
    a = attributes.findByUsage(Usage.TextureCoordinates);
    this.uvOffset = !a ? -1 : a.offset / 4;
    this.setColor(null);
    this.setVertexTransform(null);
    this.setUVRangeByRegion(null);
    this.primitiveType = primitiveType;
    this.bounds.inf();
  }

  public setColor(color: Color) {
    this.hasColor = !!color;

    const newColor = !this.hasColor ? Color.WHITE : color;
    this.color.set(newColor.r, newColor.g, newColor.b, newColor.a);
  }

  public getAttributes(): VertexAttributes {
    return this.attributes;
  }

  private lastIndex = -1;
  public getLastIndex(): number {
    return this.lastIndex;
  }

  private endpart() {
    if (!!this.meshPart) {
      this.bounds.getCenter(this.meshPart.center);
      this.bounds.getDimensions(this.meshPart.halfExtents).scale(0.5);
      this.meshPart.radius = this.meshPart.halfExtents.length();
      this.bounds.inf();
      this.meshPart.offset = this.istart;
      this.meshPart.size = this.indices.length - this.istart;
      this.istart = this.indices.length;
      this.meshPart = null;
    }
  }

  public part(id: string, primitiveType: number, meshPart: MeshPart = null): MeshPart {
    if (!this.attributes) throw new Error('Call begin() first');

    if (!meshPart) meshPart = new MeshPart();
    this.endpart();

    this.meshPart = meshPart;
    this.meshPart.id = id;
    this.primitiveType = this.meshPart.primitiveType = primitiveType;
    this.parts.push(this.meshPart);

    this.setColor(null);
    this.setVertexTransform(null);
    this.setUVRangeByRegion(null);

    return this.meshPart;
  }

  public end(mesh: Mesh = null): Mesh {
    if (!mesh) {
      mesh = new Mesh(
        this.gl,
        true,
        true,
        Math.min(this.vertices.length / this.stride, MeshBuilder.MAX_VERTICES),
        this.indices.length,
        this.attributes
      );
    }
    this.endpart();

    if (!this.attributes) throw new Error('Call begin() first');
    if (!this.attributes.equals(mesh.getVertexAttributes())) throw new Error("Mesh attributes don't match");
    if (mesh.getMaxVertices() * this.stride < this.vertices.length)
      throw new Error(
        "Mesh can't hold enough vertices: " + mesh.getMaxVertices() + ' * ' + this.stride + ' < ' + this.vertices.length
      );
    if (mesh.getMaxIndices() < this.indices.length)
      throw new Error("Mesh can't hold enough indices: " + mesh.getMaxIndices() + ' < ' + this.indices.length);

    mesh.setVertices(this.vertices, 0, this.vertices.length);
    mesh.setIndices(this.indices, 0, this.indices.length);

    for (const p of this.parts) p.mesh = mesh;
    this.parts.length = 0;

    this.attributes = null;
    this.vertices.length = 0;
    this.indices.length = 0;

    return mesh;
  }

  public clear() {
    this.vertices.length = 0;
    this.indices.length = 0;
    this.parts.length = 0;
    this.vindex = 0;
    this.lastIndex = -1;
    this.istart = 0;
    this.meshPart = null;
  }

  public getFloatsPerVertex(): number {
    return this.stride;
  }

  public setUVRange(u1: number, v1: number, u2: number, v2: number) {
    this.uOffset = u1;
    this.vOffset = v1;
    this.uScale = u2 - u1;
    this.vScale = v2 - v1;
    this.hasUVTransform = !(
      MathUtils.isZero(u1) &&
      MathUtils.isZero(v1) &&
      MathUtils.isEqual(u2, 1) &&
      MathUtils.isEqual(v2, 1)
    );
  }

  public setUVRangeByRegion(region: TextureRegion) {
    if (!region) {
      this.hasUVTransform = false;
      this.uOffset = this.vOffset = 0;
      this.uScale = this.vScale = 1;
    } else {
      this.hasUVTransform = true;
      this.setUVRange(region.u, region.v, region.u2, region.v2);
    }
  }

  public setVertexTransform(transform: Matrix4) {
    this.vertexTransformationEnabled = !!transform;
    if (this.vertexTransformationEnabled) {
      this.positionTransform.set(transform.values);
      this.normalTransform.setByMatrix4(transform).inv().transpose();
    } else {
      this.positionTransform.idt();
      this.normalTransform.idt();
    }
  }

  private static vTmp: Vector3 = new Vector3();

  private static transformPosition(values: number[], offset: number, size: number, transform: Matrix4) {
    if (size > 2) {
      this.vTmp.set(values[offset], values[offset + 1], values[offset + 2]).multiply(transform);
      values[offset] = this.vTmp.x;
      values[offset + 1] = this.vTmp.y;
      values[offset + 2] = this.vTmp.z;
    } else if (size > 1) {
      this.vTmp.set(values[offset], values[offset + 1], 0).multiply(transform);
      values[offset] = this.vTmp.x;
      values[offset + 1] = this.vTmp.y;
    } else values[offset] = this.vTmp.set(values[offset], 0, 0).multiply(transform).x;
  }

  private static transformNormal(values: number[], offset: number, size: number, transform: Matrix3) {
    if (size > 2) {
      this.vTmp
        .set(values[offset], values[offset + 1], values[offset + 2])
        .multiplyMat3(transform)
        .normalize();
      values[offset] = this.vTmp.x;
      values[offset + 1] = this.vTmp.y;
      values[offset + 2] = this.vTmp.z;
    } else if (size > 1) {
      this.vTmp
        .set(values[offset], values[offset + 1], 0)
        .multiplyMat3(transform)
        .normalize();
      values[offset] = this.vTmp.x;
      values[offset + 1] = this.vTmp.y;
    } else values[offset] = this.vTmp.set(values[offset], 0, 0).multiplyMat3(transform).normalize().x;
  }

  private addVertex(values: number[], offset: number) {
    const o = this.vertices.length;
    Utils.arrayCopy(values, offset, this.vertices, this.vertices.length, this.stride);
    //this.vertices.addAll(values, offset, this.stride);
    this.lastIndex = this.vindex++;

    if (this.vertexTransformationEnabled) {
      MeshBuilder.transformPosition(this.vertices, o + this.posOffset, this.posSize, this.positionTransform);
      if (this.norOffset >= 0) MeshBuilder.transformNormal(this.vertices, o + this.norOffset, 3, this.normalTransform);
      if (this.biNorOffset >= 0)
        MeshBuilder.transformNormal(this.vertices, o + this.biNorOffset, 3, this.normalTransform);
      if (this.tangentOffset >= 0)
        MeshBuilder.transformNormal(this.vertices, o + this.tangentOffset, 3, this.normalTransform);
    }

    const x = this.vertices[o + this.posOffset];
    const y = this.posSize > 1 ? this.vertices[o + this.posOffset + 1] : 0;
    const z = this.posSize > 2 ? this.vertices[o + this.posOffset + 2] : 0;
    this.bounds.ext(x, y, z);

    if (this.hasColor) {
      if (this.colOffset >= 0) {
        this.vertices[o + this.colOffset] *= this.color.r;
        this.vertices[o + this.colOffset + 1] *= this.color.g;
        this.vertices[o + this.colOffset + 2] *= this.color.b;
        if (this.colSize > 3) this.vertices[o + this.colOffset + 3] *= this.color.a;
      } else if (this.cpOffset >= 0) {
        Color.rgba8888ToColor(this.tempC1, this.vertices[o + this.cpOffset]);

        const col = this.tempC1.mul(this.color.r, this.color.g, this.color.b, this.color.a);
        NumberUtil.colorToFloat(col.r, col.g, col.b, col.a);
        this.vertices[o + this.cpOffset] = NumberUtil.colorToFloat(col.r, col.g, col.b, col.a);
      }
    }

    if (this.hasUVTransform && this.uvOffset >= 0) {
      this.vertices[o + this.uvOffset] = this.uOffset + this.uScale * this.vertices[o + this.uvOffset];
      this.vertices[o + this.uvOffset + 1] = this.vOffset + this.vScale * this.vertices[o + this.uvOffset + 1];
    }
  }

  //   public addMeshByMestPart(meshpart: MeshPart) {
  //     this.addMeshByMesh(meshpart.mesh, meshpart.offset, meshpart.size);
  //   }

  //   public addMeshByMesh(
  //     mesh: Mesh,
  //     indexOffset: number = 0,
  //     numIndices: number = mesh.getNumIndices()
  //   ) {
  //     if (!this.attributes.equals(mesh.getVertexAttributes()))
  //       throw new Error("Vertex attributes do not match");
  //     if (numIndices <= 0) return;
  //     const numFloats = mesh.getNumVertices() * this.stride;
  //     MeshBuilder.tmpVertices.length = 0;
  //     MeshBuilder.tmpVertices.ensureCapacity(numFloats);
  //     MeshBuilder.tmpVertices.length = numFloats;
  //     mesh.getVertices(MeshBuilder.tmpVertices);

  //     MeshBuilder.tmpIndices.clear();
  //     MeshBuilder.tmpIndices.ensureCapacity(numIndices);
  //     MeshBuilder.tmpIndices.length = numIndices;
  //     mesh.getIndices(indexOffset, numIndices, MeshBuilder.tmpIndices, 0);

  //     this.addMeshByData(MeshBuilder.tmpVertices, MeshBuilder.tmpIndices, 0, numIndices);
  //   }

  public box(width: number, height: number, depth: number) {
    BoxShapeBuilder.buildWithWidthHeight(this, width, height, depth);
  }

  private static indicesMap: Map<number, number> = null;

  //   public addMeshByData(
  //     vertices: number[],
  //     indices: number[],
  //     indexOffset: number,
  //     numIndices: number
  //   ) {
  //     if (MeshBuilder.indicesMap === null)
  //       MeshBuilder.indicesMap = new IntIntMap(numIndices);
  //     else {
  //       MeshBuilder.indicesMap.clear();
  //       MeshBuilder.indicesMap.ensureCapacity(numIndices);
  //     }
  //     this.ensureIndices(numIndices);
  //     const numVertices = vertices.length / this.stride;
  //     this.ensureVertices(numVertices < numIndices ? numVertices : numIndices);
  //     for (let i = 0; i < numIndices; i++) {
  //       const sidx = indices[indexOffset + i] & 0xffff;
  //       const didx = MeshBuilder.indicesMap.get(sidx, -1);
  //       if (didx < 0) {
  //         this.addVertex(vertices, sidx * this.stride);
  //         MeshBuilder.indicesMap.put(sidx, (didx = lastIndex));
  //       }
  //       this.index(didx);
  //     }
  //   }

  private tmpNormal = new Vector3();

  public vertexWithData(pos: Vector3, nor: Vector3, col: Color, uv: Vector2): number {
    if (this.vindex > MeshBuilder.MAX_INDEX) throw new Error('Too many vertices used');

    this._vertex[this.posOffset] = pos.x;
    if (this.posSize > 1) this._vertex[this.posOffset + 1] = pos.y;
    if (this.posSize > 2) this._vertex[this.posOffset + 2] = pos.z;

    if (this.norOffset >= 0) {
      if (!nor) nor = this.tmpNormal.set(pos.x, pos.y, pos.z).normalize();
      this._vertex[this.norOffset] = nor.x;
      this._vertex[this.norOffset + 1] = nor.y;
      this._vertex[this.norOffset + 2] = nor.z;
    }

    if (this.colOffset >= 0) {
      if (!col) col = Color.WHITE;
      this._vertex[this.colOffset] = col.r;
      this._vertex[this.colOffset + 1] = col.g;
      this._vertex[this.colOffset + 2] = col.b;
      if (this.colSize > 3) this._vertex[this.colOffset + 3] = col.a;
    } else if (this.cpOffset > 0) {
      if (!col) col = Color.WHITE;
      this._vertex[this.cpOffset] = NumberUtil.colorToFloat(col.r, col.g, col.b, col.a); // FIXME cache packed color?
    }

    if (!!uv && this.uvOffset >= 0) {
      this._vertex[this.uvOffset] = uv.x;
      this._vertex[this.uvOffset + 1] = uv.y;
    }

    this.addVertex(this._vertex, 0);
    return this.lastIndex;
  }

  public vertex(info: VertexInfo): number {
    return this.vertexWithData(
      info.hasPosition ? info.position : null,
      info.hasNormal ? info.normal : null,
      info.hasColor ? info.color : null,
      info.hasUV ? info.uv : null
    );
  }

  public index(value: number) {
    this.indices.push(value);
  }

  public index2Values(value1: number, value2: number, value3: number) {
    this.indices.push(value1);
    this.indices.push(value2);
  }

  public index3Values(value1: number, value2: number, value3: number) {
    this.indices.push(value1);
    this.indices.push(value2);
    this.indices.push(value3);
  }

  public index4Values(value1: number, value2: number, value3: number, value4: number) {
    this.indices.push(value1);
    this.indices.push(value2);
    this.indices.push(value3);
    this.indices.push(value4);
  }

  public index6Values(value1: number, value2: number, value3: number, value4: number, value5: number, value6: number) {
    this.indices.push(value1);
    this.indices.push(value2);
    this.indices.push(value3);
    this.indices.push(value4);
    this.indices.push(value5);
    this.indices.push(value6);
  }

  public index8Values(
    value1: number,
    value2: number,
    value3: number,
    value4: number,
    value5: number,
    value6: number,
    value7: number,
    value8: number
  ) {
    this.indices.push(value1);
    this.indices.push(value2);
    this.indices.push(value3);
    this.indices.push(value4);
    this.indices.push(value5);
    this.indices.push(value6);
    this.indices.push(value7);
    this.indices.push(value8);
  }

  public rect(corner00: number, corner10: number, corner11: number, corner01: number) {
    if (this.primitiveType === GL20.GL_TRIANGLES) {
      this.index6Values(corner00, corner10, corner11, corner11, corner01, corner00);
    } else if (this.primitiveType === GL20.GL_LINES) {
      this.index8Values(corner00, corner10, corner10, corner11, corner11, corner01, corner01, corner00);
    } else if (this.primitiveType === GL20.GL_POINTS) {
      this.index4Values(corner00, corner10, corner11, corner01);
    } else throw new Error('Incorrect primitive type');
  }

  public rectWithVertexInfo(corner00: VertexInfo, corner10: VertexInfo, corner11: VertexInfo, corner01: VertexInfo) {
    this.rect(this.vertex(corner00), this.vertex(corner10), this.vertex(corner11), this.vertex(corner01));
  }

  public rectWithVectorCorner(
    corner00: Vector3,
    corner10: Vector3,
    corner11: Vector3,
    corner01: Vector3,
    normal: Vector3
  ) {
    this.rectWithVertexInfo(
      this.vertTmp1.set(corner00, normal, null, null).setUV(0, 1),
      this.vertTmp2.set(corner10, normal, null, null).setUV(1, 1),
      this.vertTmp3.set(corner11, normal, null, null).setUV(1, 0),
      this.vertTmp4.set(corner01, normal, null, null).setUV(0, 0)
    );
  }

  public rectWithValue(
    x00: number,
    y00: number,
    z00: number,
    x10: number,
    y10: number,
    z10: number,
    x11: number,
    y11: number,
    z11: number,
    x01: number,
    y01: number,
    z01: number,
    normalX: number,
    normalY: number,
    normalZ: number
  ) {
    this.rectWithVertexInfo(
      this.vertTmp1.set(null, null, null, null).setPos(x00, y00, z00).setNor(normalX, normalY, normalZ).setUV(0, 1),
      this.vertTmp2.set(null, null, null, null).setPos(x10, y10, z10).setNor(normalX, normalY, normalZ).setUV(1, 1),
      this.vertTmp3.set(null, null, null, null).setPos(x11, y11, z11).setNor(normalX, normalY, normalZ).setUV(1, 0),
      this.vertTmp4.set(null, null, null, null).setPos(x01, y01, z01).setNor(normalX, normalY, normalZ).setUV(0, 0)
    );
  }

  public getVertexTransform(out: Matrix4): Matrix4 {
    return out.set(this.positionTransform.values);
  }

  public getPrimitiveType(): number {
    return this.primitiveType;
  }
}
