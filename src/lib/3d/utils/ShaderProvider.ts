import { Disposable } from '../../Utils';
import { Renderable } from '../Renderable';
import { Shader3D } from '../shaders';

export abstract class ShaderProvider implements Disposable {
  public abstract getShader(renderable: Renderable): Shader3D;
  public abstract dispose(): void;
}
