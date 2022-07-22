import { Shader } from '../../Shader';
import { Disposable } from '../../Utils';
import { VertexAttributes } from '../attributes/VertexAttributes';

export interface VertexData extends Disposable {
  getNumVertices(): number;
  getNumMaxVertices(): number;
  getAttributes(): VertexAttributes;
  setVertices(vertices: number[], offset: number, count: number): void;
  updateVertices(targetOffset: number, vertices: number[], sourceOffset: number, count: number): void;
  getBuffer(): Float32Array;

  bind(shader: Shader): void;
  bind(shader: Shader, locations: number[]): void;
  unbind(shader: Shader): void;
  unbind(shader: Shader, locations: number[]): void;
  invalidate(): void;
  dispose(): void;
}
