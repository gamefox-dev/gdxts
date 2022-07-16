import { ShaderProgram } from "../../ShaderProgram";
import { Disposable } from "../../Utils";
import { VertexAttributes } from "../VertexAttributes";

export interface VertexData extends Disposable {
  getNumVertices(): number;
  getNumMaxVertices(): number;
  getAttributes(): VertexAttributes;
  setVertices(vertices: number[], offset: number, count: number): void;
  updateVertices(
    targetOffset: number,
    vertices: number[],
    sourceOffset: number,
    count: number
  ): void;
  getBuffer(): Float32Array;

  bind(shader: ShaderProgram): void;
  bind(shader: ShaderProgram, locations: number[]): void;
  unbind(shader: ShaderProgram): void;
  unbind(shader: ShaderProgram, locations: number[]): void;
  invalidate(): void;
  dispose(): void;
}
