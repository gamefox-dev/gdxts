import { GLTFAccessor } from '../../../data/data/GLTFAccessor';
import { GLTFBufferView } from '../../../data/data/GLTFBufferView';
import { GLTF } from '../../../data/GLTF';
import { GLTFTypes } from '../GLTFTypes';
import { DataFileResolver } from './DataFileResolver';

export class DataResolver {
  private glModel: GLTF;
  private dataFileResolver: DataFileResolver;

  constructor(glModel: GLTF, dataFileResolver: DataFileResolver) {
    this.glModel = glModel;
    this.dataFileResolver = dataFileResolver;
  }

  public getAccessor(accessorID: number): GLTFAccessor {
    return this.glModel.accessors[accessorID];
  }

  public readBufferFloat(accessorID: number): number[] {
    const accessor = this.glModel.accessors[accessorID];
    const floatBuffer = getBufferFloat(accessorID);
    const data = new Array<number>(GLTFTypes.accessorSize(accessor) / 4);
    floatBuffer.get(data);
    return data;
  }

  public readBufferUByte(accessorID: number): number[] {
    const accessor = this.glModel.accessors[accessorID];
    const bufferView = this.glModel.bufferViews[accessor.bufferView];
    const bytes = this.dataFileResolver.getBuffer(bufferView.buffer);
    bytes.position(bufferView.byteOffset + accessor.byteOffset);
    const data = new Array<number>(GLTFTypes.accessorSize(accessor));
    for (let i = 0; i < data.length; i++) {
      data[i] = bytes.get() & 0xff;
    }
    return data;
  }

  public readBufferUShort(accessorID: number): number[] {
    const accessor = this.glModel.accessors[accessorID];
    const bufferView = this.glModel.bufferViews[accessor.bufferView];
    const bytes = this.dataFileResolver.getBuffer(bufferView.buffer);
    bytes.position(bufferView.byteOffset + accessor.byteOffset);
    const shorts = bytes.asShortBuffer();
    const data = new Array<number>(GLTFTypes.accessorSize(accessor) / 2);
    for (let i = 0; i < data.length; i++) {
      data[i] = shorts.get() & 0xffff;
    }
    return data;
  }

  public getBufferFloat(accessorID: number): FloatBuffer {
    return getBufferFloat(this.glModel.accessors.get(accessorID));
  }

  public getBufferView(bufferViewID: number): GLTFBufferView {
    return this.glModel.bufferViews[bufferViewID];
  }

  public getBufferFloat(glAccessor: GLTFAccessor): FloatBuffer {
    return getBufferByte(glAccessor).asFloatBuffer();
  }

  public getBufferInt(glAccessor: GLTFAccessor): IntBuffer {
    return getBufferByte(glAccessor).asIntBuffer();
  }

  public getBufferShort(glAccessor: GLTFAccessor): ShortBuffer {
    return getBufferByte(glAccessor).asShortBuffer();
  }

  public getBufferByte(glAccessor: GLTFAccessor): ByteBuffer {
    const bufferView = this.glModel.bufferViews[glAccessor.bufferView];
    const bytes = this.dataFileResolver.getBuffer(bufferView.buffer);
    bytes.position(bufferView.byteOffset + glAccessor.byteOffset);
    return bytes;
  }

  public getBufferByte(bufferView: GLTFBufferView): ByteBuffer {
    const bytes = this.dataFileResolver.getBuffer(bufferView.buffer);
    bytes.position(bufferView.byteOffset);
    return bytes;
  }
}
