import { Matrix4 } from "../Matrix4";
import { ShaderProgram } from "../ShaderProgram";
import { Disposable } from "../Utils";
import { Vector2 } from "../Vector2";
import { Vector3 } from "../Vector3";
import { BoundingBox } from "./BoundingBox";
import { GL20 } from "./GL20";
import { Matrix3 } from "./Matrix3";
import { IndexBufferObject } from "./utils/IndexBufferObject";
import { InstanceData } from "./utils/InstanceData";
import { VertexBufferObject } from "./utils/VertexBufferObject";
import { Usage, VertexAttribute } from "./VertexAttribute";
import { VertexAttributes } from "./VertexAttributes";

export enum VertexDataType {
  VertexArray,
  VertexBufferObject,
  VertexBufferObjectSubData,
  VertexBufferObjectWithVAO,
}

export class Mesh implements Disposable {
  static meshes: Mesh[] = [];

  vertices: VertexBufferObject;
  indices: IndexBufferObject;
  autoBind = true;
  isVertexArray: boolean;

  instances: InstanceData;
  isInstanced = false;

  protected Mesh(
    vertices: VertexBufferObject,
    indices: IndexBufferObject,
    isVertexArray: boolean
  ) {
    this.vertices = vertices;
    this.indices = indices;
    this.isVertexArray = isVertexArray;

    Mesh.addManagedMesh(this);
  }

  constructor(
    private gl: WebGLRenderingContext,
    staticVertices: boolean,
    staticIndices: boolean,
    maxVertices: number,
    maxIndices: number,
    attributes: VertexAttributes
  ) {
    this.vertices = this.makeVertexBuffer(
      staticVertices,
      maxVertices,
      attributes
    );
    this.indices = new IndexBufferObject(gl, maxIndices, staticIndices);
    this.isVertexArray = false;
    Mesh.addManagedMesh(this);
  }

  private makeVertexBuffer(
    isStatic: boolean,
    maxVertices: number,
    vertexAttributes: VertexAttributes
  ): VertexBufferObject {
    return new VertexBufferObject(
      this.gl,
      isStatic,
      maxVertices,
      vertexAttributes
    );
  }

  //  public enableInstancedRendering (isStatic: boolean, maxInstances: number, attributes: VertexAttribute): Mesh {
  //      if (!this.isInstanced) {
  //         this.isInstanced = true;
  //         this.instances = new InstanceBufferObject(isStatic, maxInstances, attributes);
  //      } else {
  //          throw new Error("Trying to enable InstancedRendering on same Mesh instance twice."
  //              + " Use disableInstancedRendering to clean up old InstanceData first");
  //      }
  //      return this;
  //  }

  public disableInstancedRendering(): Mesh {
    if (this.isInstanced) {
      this.isInstanced = false;
      this.instances.dispose();
      this.instances = null;
    }
    return this;
  }

  public setInstanceDataWithArray(
    instanceData: number[],
    offset: number = 0,
    count: number = -1
  ): Mesh {
    if (this.instances != null) {
      if (count < 0) count = instanceData.length;
      this.instances.setInstanceData(instanceData, offset, count);
    } else {
      throw new Error(
        "An InstanceBufferObject must be set before setting instance data!"
      );
    }
    return this;
  }

  public setInstanceDataWithBuffer(
    instanceData: Float32Array,
    count: number = -1
  ): Mesh {
    if (this.instances != null) {
      if (count < 0) count = instanceData.length;
      this.instances.setInstanceData(instanceData, count);
    } else {
      throw new Error(
        "An InstanceBufferObject must be set before setting instance data!"
      );
    }
    return this;
  }

  public updateInstanceDataWithArray(
    targetOffset: number,
    source: number[],
    sourceOffset: number = 0,
    count: number = -1
  ): Mesh {
    if (count < 0) count = source.length;
    this.instances.updateInstanceData(
      targetOffset,
      source,
      sourceOffset,
      count
    );
    return this;
  }

  public updateInstanceDataWithBuffer(
    targetOffset: number,
    source: Float32Array,
    sourceOffset: number = 0,
    count: number = -1
  ): Mesh {
    if (count < 0) count = source.length;
    this.instances.updateInstanceData(
      targetOffset,
      source,
      sourceOffset,
      count
    );
    return this;
  }

  public setVertices(
    vertices: number[],
    offset: number = 0,
    count: number = -1
  ): Mesh {
    if (count < 0) count = vertices.length;
    this.vertices.setVertices(vertices, offset, vertices.length);

    return this;
  }

  public updateVertices(
    targetOffset: number,
    source: number[],
    sourceOffset: number = 0,
    count: number = -1
  ): Mesh {
    if (count < 0) count = source.length;
    this.vertices.updateVertices(targetOffset, source, sourceOffset, count);
    return this;
  }
  public getVertices(
    vertices: number[],
    srcOffset: number = 0,
    count: number = -1,
    destOffset: number = 0
  ): number[] {
    const max = (this.getNumVertices() * this.getVertexSize()) / 4;
    if (count === -1) {
      count = max - srcOffset;
      if (count > vertices.length - destOffset)
        count = vertices.length - destOffset;
    }
    if (
      srcOffset < 0 ||
      count <= 0 ||
      srcOffset + count > max ||
      destOffset < 0 ||
      destOffset >= vertices.length
    )
      throw new Error("index out of bound");
    if (vertices.length - destOffset < count)
      throw new Error(
        "not enough room in vertices array, has " +
          vertices.length +
          " floats, needs " +
          count
      );
    const buffer = this.vertices.getBuffer();
    for (let i = srcOffset; i < count; i++) {
      vertices[i] = buffer.at(i - srcOffset + destOffset);
    }
    return vertices;
  }

  public setIndices(
    indices: number[],
    offset: number = 0,
    count: number = indices.length
  ): Mesh {
    this.indices.setIndices(indices, offset, count);

    return this;
  }

  public getIndices(
    srcOffset: number,
    count: number,
    indices: number[],
    destOffset: number
  ) {
    const max = this.getNumIndices();
    if (count < 0) count = max - srcOffset;
    if (srcOffset < 0 || srcOffset >= max || srcOffset + count > max)
      throw new Error(
        "Invalid range specified, offset: " +
          srcOffset +
          ", count: " +
          count +
          ", max: " +
          max
      );
    if (indices.length - destOffset < count)
      throw new Error(
        "not enough room in indices array, has " +
          indices.length +
          " shorts, needs " +
          count
      );

    const buffer = this.indices.getBuffer();
    for (let i = srcOffset; i < count; i++) {
      indices[i] = buffer.at(i - srcOffset + destOffset);
    }
  }

  public getNumIndices(): number {
    return this.indices.getNumIndices();
  }

  public getNumVertices(): number {
    return this.vertices.getNumVertices();
  }

  public getMaxVertices(): number {
    return this.vertices.getNumMaxVertices();
  }

  public getMaxIndices(): number {
    return this.indices.getNumMaxIndices();
  }

  public getVertexSize(): number {
    return this.vertices.getAttributes().vertexSize;
  }

  public setAutoBind(autoBind: boolean) {
    this.autoBind = autoBind;
  }

  public bind(shader: ShaderProgram, locations: number[] = null) {
    this.vertices.bind(shader, locations);
    if (this.instances != null && this.instances.getNumInstances() > 0)
      this.instances.bind(shader, locations);
    if (this.indices.getNumIndices() > 0) this.indices.bind();
  }

  public unbind(shader: ShaderProgram, locations = null) {
    this.vertices.unbind(shader, locations);
    if (this.instances != null && this.instances.getNumInstances() > 0)
      this.instances.unbind(shader, locations);
    if (this.indices.getNumIndices() > 0) this.indices.unbind();
  }

  public render(
    shader: ShaderProgram,
    primitiveType: number,
    offset: number = 0,
    count: number = -1,
    autoBind: boolean = this.autoBind
  ) {
    if (count < 0)
      count =
        this.indices.getNumMaxIndices() > 0
          ? this.getNumIndices()
          : this.getNumVertices();
    if (count === 0) return;
    if (autoBind) this.bind(shader);
    if (this.isVertexArray) {
      if (this.indices.getNumIndices() > 0) {
        //  const buffer = this.indices.getBuffer();
        //  const oldPosition = buffer.position();
        //  const oldLimit = buffer.limit();
        //  ((Buffer)buffer).position(offset);
        //  this.gl.drawElements(primitiveType, count, GL20.GL_UNSIGNED_SHORT, buffer);
        //  ((Buffer)buffer).position(oldPosition);

        this.gl.drawElements(
          primitiveType,
          count,
          GL20.GL_UNSIGNED_SHORT,
          offset * 2
        );
      } else {
        this.gl.drawArrays(primitiveType, offset, count);
      }
    } else {
      if (this.indices.getNumIndices() > 0) {
        if (count + offset > this.indices.getNumMaxIndices()) {
          throw new Error(
            "Mesh attempting to access memory outside of the index buffer (count: " +
              count +
              ", offset: " +
              offset +
              ", max: " +
              this.indices.getNumMaxIndices() +
              ")"
          );
        }

        this.gl.drawElements(
          primitiveType,
          count,
          GL20.GL_UNSIGNED_SHORT,
          offset * 2
        );
      } else {
        this.gl.drawArrays(primitiveType, offset, count);
      }
    }

    if (autoBind) this.unbind(shader);
  }

  public dispose() {
    const index = Mesh.meshes.indexOf(this);
    if (index > -1) {
      Mesh.meshes.splice(index, 1);
    }

    this.vertices.dispose();
    if (this.instances != null) this.instances.dispose();
    this.indices.dispose();
  }

  public getVertexAttribute(usage: number): VertexAttribute {
    const attributes = this.vertices.getAttributes();
    const len = attributes.size();
    for (let i = 0; i < len; i++)
      if (attributes.get(i).usage === usage) return attributes.get(i);

    return null;
  }

  public getVertexAttributes(): VertexAttributes {
    return this.vertices.getAttributes();
  }

  public getVerticesBuffer(): Float32Array {
    return this.vertices.getBuffer();
  }

  public calculateBoundingBox(bbox: BoundingBox = null) {
    if (!bbox) {
      bbox = new BoundingBox();
    }
    const numVertices = this.getNumVertices();
    if (numVertices === 0) throw new Error("No vertices defined");

    const verts = this.vertices.getBuffer();
    bbox.inf();
    const posAttrib = this.getVertexAttribute(Usage.Position);
    const offset = posAttrib.offset / 4;
    const vertexSize = this.vertices.getAttributes().vertexSize / 4;
    let idx = offset;

    switch (posAttrib.numComponents) {
      case 1:
        for (let i = 0; i < numVertices; i++) {
          bbox.ext(verts[idx], 0, 0);
          idx += vertexSize;
        }
        break;
      case 2:
        for (let i = 0; i < numVertices; i++) {
          bbox.ext(verts[idx], verts[idx + 1], 0);
          idx += vertexSize;
        }
        break;
      case 3:
        for (let i = 0; i < numVertices; i++) {
          bbox.ext(verts[idx], verts[idx + 1], verts[idx + 2]);
          idx += vertexSize;
        }
        break;
    }
  }

  private tmpV: Vector3 = new Vector3();
  public extendBoundingBox(
    out: BoundingBox,
    offset: number,
    count: number,
    transform: Matrix4
  ): BoundingBox {
    const numIndices = this.getNumIndices();
    const numVertices = this.getNumVertices();
    const max = numIndices === 0 ? numVertices : numIndices;
    if (offset < 0 || count < 1 || offset + count > max)
      throw new Error(
        "Invalid part specified ( offset=" +
          offset +
          ", count=" +
          count +
          ", max=" +
          max +
          " )"
      );

    const verts = this.vertices.getBuffer();
    const index = this.indices.getBuffer();
    const posAttrib = this.getVertexAttribute(Usage.Position);
    const posoff = posAttrib.offset / 4;
    const vertexSize = this.vertices.getAttributes().vertexSize / 4;
    const end = offset + count;

    switch (posAttrib.numComponents) {
      case 1:
        if (numIndices > 0) {
          for (let i = offset; i < end; i++) {
            const idx = (index[i] & 0xffff) * vertexSize + posoff;
            this.tmpV.set(verts[idx], 0, 0);
            if (transform != null) this.tmpV.multiply(transform);
            out.ext(this.tmpV.x, this.tmpV.y, this.tmpV.z);
          }
        } else {
          for (let i = offset; i < end; i++) {
            const idx = i * vertexSize + posoff;
            this.tmpV.set(verts[idx], 0, 0);
            if (transform != null) this.tmpV.multiply(transform);
            out.ext(this.tmpV.x, this.tmpV.y, this.tmpV.z);
          }
        }
        break;
      case 2:
        if (numIndices > 0) {
          for (let i = offset; i < end; i++) {
            const idx = (index[i] & 0xffff) * vertexSize + posoff;
            this.tmpV.set(verts[idx], verts[idx + 1], 0);
            if (transform != null) this.tmpV.multiply(transform);
            out.ext(this.tmpV.x, this.tmpV.y, this.tmpV.z);
          }
        } else {
          for (let i = offset; i < end; i++) {
            const idx = i * vertexSize + posoff;
            this.tmpV.set(verts[idx], verts[idx + 1], 0);
            if (transform != null) this.tmpV.multiply(transform);
            out.ext(this.tmpV.x, this.tmpV.y, this.tmpV.z);
          }
        }
        break;
      case 3:
        if (numIndices > 0) {
          for (let i = offset; i < end; i++) {
            const idx = (index[i] & 0xffff) * vertexSize + posoff;
            this.tmpV.set(verts[idx], verts[idx + 1], verts[idx + 2]);
            if (transform != null) this.tmpV.multiply(transform);
            out.ext(this.tmpV.x, this.tmpV.y, this.tmpV.z);
          }
        } else {
          for (let i = offset; i < end; i++) {
            const idx = i * vertexSize + posoff;
            this.tmpV.set(verts[idx], verts[idx + 1], verts[idx + 2]);
            if (transform != null) this.tmpV.multiply(transform);
            out.ext(this.tmpV.x, this.tmpV.y, this.tmpV.z);
          }
        }
        break;
    }
    return out;
  }

  public calculateRadiusSquared(
    centerX: number,
    centerY: number,
    centerZ: number,
    offset: number,
    count: number,
    transform: Matrix4
  ): number {
    const numIndices = this.getNumIndices();
    if (offset < 0 || count < 1 || offset + count > numIndices)
      throw new Error("Not enough indices");

    const verts = this.vertices.getBuffer();
    const index = this.indices.getBuffer();
    const posAttrib = this.getVertexAttribute(Usage.Position);
    const posoff = posAttrib.offset / 4;
    const vertexSize = this.vertices.getAttributes().vertexSize / 4;
    const end = offset + count;

    let result = 0;

    switch (posAttrib.numComponents) {
      case 1:
        for (let i = offset; i < end; i++) {
          const idx = (index[i] & 0xffff) * vertexSize + posoff;
          this.tmpV.set(verts[idx], 0, 0);
          if (transform != null) this.tmpV.multiply(transform);
          const r = this.tmpV
            .sub(new Vector3(centerX, centerY, centerZ))
            .length2();
          if (r > result) result = r;
        }
        break;
      case 2:
        for (let i = offset; i < end; i++) {
          const idx = (index[i] & 0xffff) * vertexSize + posoff;
          this.tmpV.set(verts[i], verts[idx + 1], 0);
          if (transform != null) this.tmpV.multiply(transform);
          const r = this.tmpV
            .sub(new Vector3(centerX, centerY, centerZ))
            .length2();
          if (r > result) result = r;
        }
        break;
      case 3:
        for (let i = offset; i < end; i++) {
          const idx = (index[i] & 0xffff) * vertexSize + posoff;
          this.tmpV.set(verts[i], verts[idx + 1], verts[idx + 2]);
          if (transform != null) this.tmpV.multiply(transform);
          const r = this.tmpV
            .sub(new Vector3(centerX, centerY, centerZ))
            .length2();
          if (r > result) result = r;
        }
        break;
    }
    return result;
  }

  public calculateRadius(
    centerX: number,
    centerY: number,
    centerZ: number,
    offset: number = 0,
    count: number = this.getNumIndices(),
    transform: Matrix4 = null
  ): number {
    return Math.sqrt(
      this.calculateRadiusSquared(
        centerX,
        centerY,
        centerZ,
        offset,
        count,
        transform
      )
    );
  }

  public getIndicesBuffer(): Uint16Array {
    return this.indices.getBuffer();
  }

  private static addManagedMesh(mesh: Mesh) {
    if (Mesh.meshes == null) Mesh.meshes = new Array<Mesh>();
    Mesh.meshes.push(mesh);
  }

  public static invalidateAllMeshes() {
    if (Mesh.meshes == null) return;
    for (let i = 0; i < Mesh.meshes.length; i++) {
      Mesh.meshes[i].vertices.invalidate();
      Mesh.meshes[i].indices.invalidate();
    }
  }

  public static clearAllMeshes() {
    Mesh.meshes.length = 0;
  }

  public scale(scaleX: number, scaleY: number, scaleZ: number) {
    const posAttr = this.getVertexAttribute(Usage.Position);
    const offset = posAttr.offset / 4;
    const numComponents = posAttr.numComponents;
    const numVertices = this.getNumVertices();
    const vertexSize = this.getVertexSize() / 4;

    const vertices = new Array<number>(numVertices * vertexSize);
    this.getVertices(vertices);

    let idx = offset;
    switch (numComponents) {
      case 1:
        for (let i = 0; i < numVertices; i++) {
          vertices[idx] *= scaleX;
          idx += vertexSize;
        }
        break;
      case 2:
        for (let i = 0; i < numVertices; i++) {
          vertices[idx] *= scaleX;
          vertices[idx + 1] *= scaleY;
          idx += vertexSize;
        }
        break;
      case 3:
        for (let i = 0; i < numVertices; i++) {
          vertices[idx] *= scaleX;
          vertices[idx + 1] *= scaleY;
          vertices[idx + 2] *= scaleZ;
          idx += vertexSize;
        }
        break;
    }

    this.setVertices(vertices);
  }

  public transform(
    matrix: Matrix4,
    start: number = 0,
    count = this.getNumIndices()
  ) {
    const posAttr = this.getVertexAttribute(Usage.Position);
    const posOffset = posAttr.offset / 4;
    const stride = this.getVertexSize() / 4;
    const numComponents = posAttr.numComponents;

    const vertices = new Array<number>(count * stride);
    this.getVertices(vertices, start * stride, count * stride);
    Mesh.transform(
      matrix,
      vertices,
      stride,
      posOffset,
      numComponents,
      0,
      count
    );
    this.updateVertices(start * stride, vertices);
  }

  public static transform(
    matrix: Matrix4,
    vertices: number[],
    vertexSize: number,
    offset: number,
    dimensions: number,
    start: number,
    count: number
  ) {
    if (offset < 0 || dimensions < 1 || offset + dimensions > vertexSize)
      throw new Error();
    if (
      start < 0 ||
      count < 1 ||
      (start + count) * vertexSize > vertices.length
    )
      throw new Error(
        "start = " +
          start +
          ", count = " +
          count +
          ", vertexSize = " +
          vertexSize +
          ", length = " +
          vertices.length
      );

    const tmp = new Vector3();

    let idx = offset + start * vertexSize;
    switch (dimensions) {
      case 1:
        for (let i = 0; i < count; i++) {
          tmp.set(vertices[idx], 0, 0).multiply(matrix);
          vertices[idx] = tmp.x;
          idx += vertexSize;
        }
        break;
      case 2:
        for (let i = 0; i < count; i++) {
          tmp.set(vertices[idx], vertices[idx + 1], 0).multiply(matrix);
          vertices[idx] = tmp.x;
          vertices[idx + 1] = tmp.y;
          idx += vertexSize;
        }
        break;
      case 3:
        for (let i = 0; i < count; i++) {
          tmp
            .set(vertices[idx], vertices[idx + 1], vertices[idx + 2])
            .multiply(matrix);
          vertices[idx] = tmp.x;
          vertices[idx + 1] = tmp.y;
          vertices[idx + 2] = tmp.z;
          idx += vertexSize;
        }
        break;
    }
  }

  public transformUV(
    matrix: Matrix3,
    start: number = 0,
    count = this.getNumVertices()
  ) {
    const posAttr = this.getVertexAttribute(Usage.TextureCoordinates);
    const offset = posAttr.offset / 4;
    const vertexSize = this.getVertexSize() / 4;
    const numVertices = this.getNumVertices();

    const vertices = new Array<number>(numVertices * vertexSize);
    this.getVertices(vertices, 0, vertices.length);
    Mesh.transformUV(matrix, vertices, vertexSize, offset, start, count);
    this.setVertices(vertices, 0, vertices.length);
  }

  public static transformUV(
    matrix: Matrix3,
    vertices: number[],
    vertexSize: number,
    offset: number,
    start: number,
    count: number
  ) {
    if (
      start < 0 ||
      count < 1 ||
      (start + count) * vertexSize > vertices.length
    )
      throw new Error(
        "start = " +
          start +
          ", count = " +
          count +
          ", vertexSize = " +
          vertexSize +
          ", length = " +
          vertices.length
      );

    const tmp = new Vector2();

    let idx = offset + start * vertexSize;
    for (let i = 0; i < count; i++) {
      tmp.set(vertices[idx], vertices[idx + 1]).mul(matrix);
      vertices[idx] = tmp.x;
      vertices[idx + 1] = tmp.y;
      idx += vertexSize;
    }
  }

  public copy(
    isStatic: boolean,
    removeDuplicates: boolean = false,
    usage: number[] = null
  ): Mesh {
    const vertexSize = this.getVertexSize() / 4;
    let numVertices = this.getNumVertices();
    let vertices = new Array<number>(numVertices * vertexSize);
    this.getVertices(vertices, 0, vertices.length);
    let checks: number[] = null;
    let attrs: VertexAttribute[] = null;
    let newVertexSize = 0;
    if (usage != null) {
      let size = 0;
      let as = 0;
      for (let i = 0; i < usage.length; i++)
        if (this.getVertexAttribute(usage[i]) != null) {
          size += this.getVertexAttribute(usage[i]).numComponents;
          as++;
        }
      if (size > 0) {
        attrs = new Array<VertexAttribute>(as);
        checks = new Array<number>(size);
        let idx = -1;
        let ai = -1;
        for (let i = 0; i < usage.length; i++) {
          const a = this.getVertexAttribute(usage[i]);
          if (a == null) continue;
          for (let j = 0; j < a.numComponents; j++)
            checks[++idx] = a.offset + j;
          attrs[++ai] = a.copy();
          newVertexSize += a.numComponents;
        }
      }
    }
    if (checks == null) {
      checks = new Array<number>(vertexSize);
      for (let i = 0; i < vertexSize; i++) checks[i] = i;
      newVertexSize = vertexSize;
    }

    const numIndices = this.getNumIndices();
    let indices: number[] = null;
    if (numIndices > 0) {
      indices = new Array<number>(numIndices);
      this.getIndices(0, -1, indices, 0);
      if (removeDuplicates || newVertexSize !== vertexSize) {
        const tmp = new Array<number>(vertices.length);
        let size = 0;
        for (let i = 0; i < numIndices; i++) {
          const idx1 = indices[i] * vertexSize;
          let newIndex = -1;
          if (removeDuplicates) {
            for (let j = 0; j < size && newIndex < 0; j++) {
              const idx2 = j * newVertexSize;
              let found = true;
              for (let k = 0; k < checks.length && found; k++) {
                if (tmp[idx2 + k] !== vertices[idx1 + checks[k]]) found = false;
              }
              if (found) newIndex = j;
            }
          }
          if (newIndex > 0) indices[i] = newIndex;
          else {
            const idx = size * newVertexSize;
            for (let j = 0; j < checks.length; j++)
              tmp[idx + j] = vertices[idx1 + checks[j]];
            indices[i] = size;
            size++;
          }
        }
        vertices = tmp;
        numVertices = size;
      }
    }

    let result: Mesh;
    if (attrs == null)
      result = new Mesh(
        this.gl,
        isStatic,
        isStatic,
        numVertices,
        indices == null ? 0 : indices.length,
        this.getVertexAttributes()
      );
    else
      result = new Mesh(
        this.gl,
        isStatic,
        isStatic,
        numVertices,
        indices == null ? 0 : indices.length,
        new VertexAttributes(attrs)
      );
    result.setVertices(vertices, 0, numVertices * newVertexSize);
    if (indices != null) result.setIndices(indices);
    return result;
  }
}
