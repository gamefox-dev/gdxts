import { Shader } from '../../Shader';
import { VertexAttributes } from '../attributes/VertexAttributes';
import { GL20 } from '../GL20';

export class VertexBufferObject {
  private attributes: VertexAttributes;
  private buffer: Float32Array;
  private ownsBuffer: boolean;
  private bufferHandle: WebGLBuffer;
  private verticesLength: number = 0;
  private usage: number;
  isDirty = false;
  isBound = false;

  constructor(private gl: WebGLRenderingContext, isStatic: boolean, numVertices: number, attributes: VertexAttributes) {
    this.bufferHandle = this.gl.createBuffer();

    const data = new Float32Array(attributes.vertexSize * numVertices);
    this.setBuffer(data, true, attributes);
    this.setUsage(isStatic ? GL20.GL_STATIC_DRAW : GL20.GL_DYNAMIC_DRAW);
  }

  public getAttributes(): VertexAttributes {
    return this.attributes;
  }

  public getNumVertices(): number {
    return this.buffer.length / this.attributes.vertexSize;
  }

  public getNumMaxVertices(): number {
    return this.buffer.length;
  }

  public getBuffer(): Float32Array {
    this.isDirty = true;
    return this.buffer;
  }

  protected setBuffer(data: Float32Array, ownsBuffer: boolean, value: VertexAttributes) {
    if (this.isBound) throw new Error('Cannot change attributes while VBO is bound');
    this.attributes = value;
    this.ownsBuffer = ownsBuffer;
    this.buffer = data;
  }

  private bufferChanged() {
    if (this.isBound) {
      this.gl.bufferData(GL20.GL_ARRAY_BUFFER, this.buffer.subarray(0, this.verticesLength), this.usage);
      this.isDirty = false;
    }
  }

  public setVertices(vertices: number[], offset: number, count: number) {
    this.isDirty = true;
    this.buffer.set(vertices.slice(offset, offset + count), 0);
    if (this.verticesLength < count) {
      this.verticesLength = count;
    }
    this.bufferChanged();
  }

  public updateVertices(targetOffset: number, vertices: number[], sourceOffset: number, count: number) {
    this.isDirty = true;
    this.buffer.set(vertices.slice(sourceOffset, sourceOffset + count), targetOffset);
    this.verticesLength = targetOffset + count;
    this.bufferChanged();
  }

  protected getUsage(): number {
    return this.usage;
  }

  protected setUsage(value: number) {
    if (this.isBound) throw new Error('Cannot change usage while VBO is bound');
    this.usage = value;
  }

  public bind(shader: Shader, locations: number[] = null) {
    this.gl.bindBuffer(GL20.GL_ARRAY_BUFFER, this.bufferHandle);
    if (this.isDirty) {
      this.gl.bufferData(GL20.GL_ARRAY_BUFFER, this.buffer.subarray(0, this.verticesLength), this.usage);
      this.isDirty = false;
    }

    const numAttributes = this.attributes.size();
    if (!locations) {
      for (let i = 0; i < numAttributes; i++) {
        const attribute = this.attributes.get(i);
        const location = shader.getAttributeLocation(attribute.alias);
        if (location < 0) continue;
        this.gl.enableVertexAttribArray(location);
        this.gl.vertexAttribPointer(
          location,
          attribute.numComponents,
          attribute.type,
          attribute.normalized,
          this.attributes.vertexSize,
          attribute.offset
        );
      }
    } else {
      for (let i = 0; i < numAttributes; i++) {
        const attribute = this.attributes.get(i);
        const location = locations[i];
        if (location < 0) continue;
        this.gl.enableVertexAttribArray(location);
        this.gl.vertexAttribPointer(
          location,
          attribute.numComponents,
          attribute.type,
          attribute.normalized,
          this.attributes.vertexSize,
          attribute.offset
        );
      }
    }
    this.isBound = true;
  }

  public unbind(shader: Shader, locations: number[] = null) {
    const numAttributes = this.attributes.size();
    if (!locations) {
      for (let i = 0; i < numAttributes; i++) {
        const name = this.attributes.get(i).alias;
        const location = shader.getAttributeLocation(name);
        if (location >= 0) this.gl.disableVertexAttribArray(location);
      }
    } else {
      for (let i = 0; i < numAttributes; i++) {
        const location = locations[i];
        if (location >= 0) this.gl.disableVertexAttribArray(location);
      }
    }
    this.gl.bindBuffer(GL20.GL_ARRAY_BUFFER, null);
    this.isBound = false;
  }

  public invalidate() {
    this.bufferHandle = this.gl.createBuffer();
    this.isDirty = true;
  }

  public dispose() {
    this.gl.bindBuffer(GL20.GL_ARRAY_BUFFER, null);
    this.gl.deleteBuffer(this.bufferHandle);
  }
}
