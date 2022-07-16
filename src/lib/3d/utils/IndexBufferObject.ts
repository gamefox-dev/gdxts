import { GL20 } from "../GL20";

export class IndexBufferObject {
  byteBuffer: Uint16Array;
  ownsBuffer: boolean;
  bufferHandle: WebGLBuffer;
  isDirect: boolean;
  isDirty = true;
  isBound = false;
  usage: number;

  indicesLength = 0;

  private empty: boolean;
  private gl: WebGLRenderingContext;
  arrayBuffer: ArrayBuffer;

  constructor(
    gl: WebGLRenderingContext,
    maxIndices: number,
    isStatic: boolean = true
  ) {
    this.gl = gl;
    this.empty = maxIndices === 0;
    if (this.empty) {
      maxIndices = 1;
    }

    this.byteBuffer = new Uint16Array(maxIndices);
    this.isDirect = true;
    this.ownsBuffer = true;

    this.indicesLength = 0;

    this.bufferHandle = this.gl.createBuffer();
    this.usage = isStatic ? GL20.GL_STATIC_DRAW : GL20.GL_DYNAMIC_DRAW;
  }

  //  public IndexBufferObjectWithBuffer (data: Uint8Array, isStatic: boolean = true) {

  //      this.empty = data.length == 0;
  //      this.byteBuffer = data;
  //      this.isDirect = true;

  //      this.buffer = this.byteBuffer.asShortBuffer();
  //      this.ownsBuffer = false;
  //      this.bufferHandle = this.gl.createBuffer();
  //      this.usage = isStatic ? GL20.GL_STATIC_DRAW : GL20.GL_DYNAMIC_DRAW;
  //  }

  public getNumIndices(): number {
    return this.indicesLength;
  }

  public getNumMaxIndices(): number {
    return this.byteBuffer.length;
  }

  public setIndices(
    indices: number[],
    offset: number = 0,
    count: number = indices.length
  ) {
    this.isDirty = true;
    this.byteBuffer.set(indices.slice(offset, offset + count), 0);
    this.indicesLength = count;

    if (this.isBound) {
      this.gl.bufferData(
        GL20.GL_ELEMENT_ARRAY_BUFFER,
        this.byteBuffer,
        this.usage
      );
      this.isDirty = false;
    }
  }

  public updateIndices(
    targetOffset: number,
    indices: number[],
    offset: number,
    count: number
  ) {
    this.isDirty = true;
    this.byteBuffer.set(indices.slice(offset, offset + count), targetOffset);
    this.indicesLength = targetOffset + count;

    if (this.isBound) {
      this.gl.bufferData(
        GL20.GL_ELEMENT_ARRAY_BUFFER,
        this.byteBuffer.subarray(0, this.indicesLength),
        this.usage
      );
      this.isDirty = false;
    }
  }

  public getBuffer(): Uint16Array {
    this.isDirty = true;
    return this.byteBuffer;
  }

  public bind() {
    if (this.bufferHandle === 0) throw new Error("No buffer allocated!");

    this.gl.bindBuffer(GL20.GL_ELEMENT_ARRAY_BUFFER, this.bufferHandle);
    if (this.isDirty) {
      this.gl.bufferData(
        GL20.GL_ELEMENT_ARRAY_BUFFER,
        this.byteBuffer,
        this.usage
      );
      this.isDirty = false;
    }
    this.isBound = true;
  }

  public unbind() {
    this.gl.bindBuffer(GL20.GL_ELEMENT_ARRAY_BUFFER, 0);
    this.isBound = false;
  }

  public invalidate() {
    this.bufferHandle = this.gl.createBuffer();
    this.isDirty = true;
  }
  public dispose() {
    this.gl.bindBuffer(GL20.GL_ELEMENT_ARRAY_BUFFER, 0);
    this.gl.deleteBuffer(this.bufferHandle);
    this.bufferHandle = new WebGLBuffer();
  }
}
