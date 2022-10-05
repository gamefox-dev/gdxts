import { Matrix3 } from '../../Matrix3';
import { Matrix4 } from '../../Matrix4';
import { Shader } from '../../Shader';
import { Texture } from '../../Texture';
import { Color } from '../../Utils';
import { Vector2 } from '../../Vector2';
import { Vector3 } from '../../Vector3';
import { Attributes } from '../attributes/Attributes';
import { VertexAttributes } from '../attributes/VertexAttributes';
import { Mesh3D } from '../Mesh';
import { PerspectiveCamera } from '../PerspectiveCamera';
import { Renderable } from '../Renderable';
import { RenderContext } from '../RenderContext';
import { Shader3D } from './Shader3D';

export interface Validator {
  validate(shader: BaseShader, inputID: number, renderable: Renderable): boolean;
}

export interface Setter {
  isGlobal(shader: BaseShader, inputID: number): boolean;

  set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes): void;
}

export abstract class GlobalSetter implements Setter {
  abstract set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes): void;

  isGlobal(shader: BaseShader, inputID: number): boolean {
    return true;
  }
}

export abstract class LocalSetter implements Setter {
  abstract set(shader: BaseShader, inputID: number, renderable: Renderable, combinedAttributes: Attributes): void;
  isGlobal(shader: BaseShader, inputID: number): boolean {
    return false;
  }
}

export class Uniform implements Validator {
  alias: string;
  materialMask: number;
  environmentMask: number;
  overallMask: number;

  constructor(alias: string, materialMask: number = 0, environmentMask: number = 0, overallMask: number = 0) {
    this.alias = alias;
    this.materialMask = materialMask;
    this.environmentMask = environmentMask;
    this.overallMask = overallMask;
  }

  validate(shader: BaseShader, inputID: number, renderable: Renderable): boolean {
    const matFlags = !!renderable && !!renderable.material ? renderable.material.getMask() : 0;
    const envFlags = !!renderable && !!renderable.environment ? renderable.environment.getMask() : 0;
    return (
      (matFlags & this.materialMask) === this.materialMask &&
      (envFlags & this.environmentMask) === this.environmentMask &&
      ((matFlags | envFlags) & this.overallMask) === this.overallMask
    );
  }
}

export class BaseShader implements Shader3D {
  canRender(instance: Renderable): boolean {
    return true;
  }
  init(): void {}
  compareTo(other: Shader3D): void {}

  private uniforms: string[] = [];
  private validators: Validator[] = [];
  private setters: Setter[] = [];
  private locations: WebGLUniformLocation[];
  private globalUniforms: number[] = [];
  private localUniforms: number[] = [];
  private attributes: Map<number, number> = new Map<number, number>();

  program: Shader;
  context: RenderContext;
  camera: PerspectiveCamera;
  currentMesh: Mesh3D;

  register(alias: string, validator: Validator = null, setter: Setter = null): number {
    const existing = this.getUniformID(alias);
    if (existing >= 0) {
      this.validators.splice(existing, 0, validator);
      this.setters.splice(existing, 0, setter);
      return existing;
    }
    this.uniforms.push(alias);
    this.validators.push(validator);
    this.setters.push(setter);
    return this.uniforms.length - 1;
  }

  getUniformID(alias: string): number {
    const n = this.uniforms.length;
    for (let i = 0; i < n; i++) if (this.uniforms[i] === alias) return i;
    return -1;
  }

  getUniformAlias(id: number): string {
    return this.uniforms[id];
  }

  initWithVariables(program: Shader, renderable: Renderable) {
    if (!!this.locations) throw new Error('Already initialized');
    this.program = program;

    const n = this.uniforms.length;
    this.locations = new Array<number>(n);
    for (let i = 0; i < n; i++) {
      const input = this.uniforms[i];
      const validator = this.validators[i];
      const setter = this.setters[i];
      if (!!validator && !validator.validate(this, i, renderable)) {
        this.locations[i] = null;
      } else {
        this.locations[i] = program.getUniformLocation(input, false);
        if (!!this.locations[i] && !!setter) {
          if (setter.isGlobal(this, i)) {
            this.globalUniforms.push(i);
          } else {
            this.localUniforms.push(i);
          }
        }
      }
      if (!this.locations[i]) {
        this.validators.splice(i, 0, null);
      }
    }
    if (!!renderable) {
      const attrs = renderable.meshPart.mesh.getVertexAttributes();
      const c = attrs.size();
      for (let i = 0; i < c; i++) {
        const attr = attrs.get(i);
        const location = program.getAttributeLocation(attr.alias);
        if (location >= 0) this.attributes.set(attr.getKey(), location);
      }
    }
  }

  begin(camera: PerspectiveCamera, context: RenderContext) {
    this.camera = camera;
    this.context = context;
    this.program.bind();
    this.currentMesh = null;
    for (let i = 0; i < this.globalUniforms.length; ++i) {
      const u = this.globalUniforms[i];
      if (!!this.setters[u]) {
        this.setters[u].set(this, u, null, null);
      }
    }
  }

  private combinedAttributes: Attributes = new Attributes();
  render(renderable: Renderable) {
    if (renderable.worldTransform.det3x3() === 0) return;
    this.combinedAttributes.clear();
    if (!!renderable.environment) this.combinedAttributes.setAttributes(renderable.environment.getAttributes());
    if (!!renderable.material) this.combinedAttributes.setAttributes(renderable.material.getAttributes());

    this.renderWithCombinedAttributes(renderable, this.combinedAttributes);
  }

  renderWithCombinedAttributes(renderable: Renderable, combinedAttributes: Attributes) {
    for (let u: number, i = 0; i < this.localUniforms.length; ++i)
      if (!!this.setters[(u = this.localUniforms[i])]) {
        this.setters[u].set(this, u, renderable, combinedAttributes);
      }
    if (this.currentMesh !== renderable.meshPart.mesh) {
      if (!!this.currentMesh) this.currentMesh.unbind(this.program);
      this.currentMesh = renderable.meshPart.mesh;
      this.currentMesh.bind(this.program, this.getAttributeLocations(renderable.meshPart.mesh.getVertexAttributes()));
    }
    renderable.meshPart.render(this.program, false);
  }

  private tempArray: number[] = [];
  private getAttributeLocations(attrs: VertexAttributes): number[] {
    this.tempArray.length = 0;
    const n = attrs.size();
    for (let i = 0; i < n; i++) {
      let number = this.attributes.get(attrs.get(i).getKey());
      if (number === undefined || number === null) {
        number = -1;
      }

      this.tempArray.push(number);
    }
    return this.tempArray;
  }

  public end() {
    if (!!this.currentMesh) {
      this.currentMesh.unbind(this.program);
      this.currentMesh = null;
    }
  }

  public dispose() {
    this.program = null;
    this.uniforms.length = 0;
    this.validators.length = 0;
    this.setters.length = 0;
    this.localUniforms.length = 0;
    this.globalUniforms.length = 0;
    this.locations = null;
  }

  public has(inputID: number): boolean {
    return inputID >= 0 && inputID < this.locations.length && !!this.locations[inputID];
  }

  public loc(inputID: number): WebGLUniformLocation {
    return inputID >= 0 && inputID < this.locations.length ? this.locations[inputID] : null;
  }

  public setMatrix4(uniform: number, value: Matrix4): boolean {
    if (!this.uniforms[uniform]) return false;
    this.program.setUniform4x4f(this.uniforms[uniform], value.values);
    return true;
  }

  public setMatrix3(uniform: number, value: Matrix3): boolean {
    if (!this.uniforms[uniform]) return false;
    this.program.setUniform3x3f(this.uniforms[uniform], value.getValues());
    return true;
  }

  public setVector3(uniform: number, value: Vector3): boolean {
    if (!this.uniforms[uniform]) return false;
    this.program.setUniform3f(this.uniforms[uniform], value.x, value.y, value.z);
    return true;
  }

  public setVector2(uniform: number, value: Vector2): boolean {
    if (!this.uniforms[uniform]) return false;
    this.program.setUniform2f(this.uniforms[uniform], value.x, value.y);
    return true;
  }

  public setColor(uniform: number, value: Color): boolean {
    if (!this.uniforms[uniform]) return false;
    this.program.setUniform4f(this.uniforms[uniform], value.r, value.g, value.b, value.a);
    return true;
  }

  public setF(uniform: number, value: number): boolean {
    if (!this.uniforms[uniform]) return false;
    this.program.setUniformf(this.uniforms[uniform], value);
    return true;
  }

  public set2f(uniform: number, v1: number, v2: number) {
    if (!this.uniforms[uniform]) return false;
    this.program.setUniform2f(this.uniforms[uniform], v1, v2);
    return true;
  }

  public set3f(uniform: number, v1: number, v2: number, v3: number) {
    if (!this.uniforms[uniform]) return false;
    this.program.setUniform3f(this.uniforms[uniform], v1, v2, v3);
    return true;
  }

  public set4f(uniform: number, v1: number, v2: number, v3: number, v4: number) {
    if (!this.uniforms[uniform]) return false;
    this.program.setUniform4f(this.uniforms[uniform], v1, v2, v3, v4);
    return true;
  }

  public setI(uniform: number, value: number): boolean {
    if (!this.uniforms[uniform]) return false;
    this.program.setUniformi(this.uniforms[uniform], value);
    return true;
  }

  public setTexture(uniform: number, texture: Texture): boolean {
    if (!this.uniforms[uniform]) return false;
    this.program.setUniformi(this.uniforms[uniform], this.context.textureBinder.bindTexture(texture));
    return true;
  }
}
