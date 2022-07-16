import { ShaderProgram } from "../../ShaderProgram";
import { Disposable } from "../../Utils";
import { VertexAttributes } from "../VertexAttributes";

export interface InstanceData extends Disposable {
  getNumInstances(): number;
  getNumMaxInstances(): number;

  getAttributes(): VertexAttributes;
  setInstanceData(data: number[], offset: number, count: number): void;
  updateInstanceData(
    targetOffset: number,
    data: number[],
    sourceOffset: number,
    count: number
  ): void;
  setInstanceData(data: Float32Array, count: number): void;
  updateInstanceData(
    targetOffset: number,
    data: Float32Array,
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
