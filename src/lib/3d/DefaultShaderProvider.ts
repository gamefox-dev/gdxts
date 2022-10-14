import { Disposable } from '../Utils';
import { Renderable } from './Renderable';
import { DefaultShader, DefaultShaderConfig } from './shaders/DefaultShader';
import { Shader3D } from './shaders/Shader3D';
import { BaseShaderProvider } from './utils/BaseShaderProvider';

export class DefaultShaderProvider extends BaseShaderProvider implements Disposable {
  public config: DefaultShaderConfig;
  protected shaders: Shader3D[] = [];

  constructor(
    gl: WebGLRenderingContext,
    config: DefaultShaderConfig = null,
    vertexShader: string = '',
    fragmentShader: string = ''
  ) {
    super(gl);
    this.config = !config ? new DefaultShaderConfig(vertexShader, fragmentShader) : config;
  }
  dispose(): void {}

  public getShader(renderable: Renderable) {
    const suggestedShader = renderable.shader;
    if (!!suggestedShader && suggestedShader.canRender(renderable)) return suggestedShader;
    for (const shader of this.shaders) {
      if (shader.canRender(renderable)) return shader;
    }
    const shader = this.createShader(renderable);
    if (!shader.canRender(renderable)) throw new Error('unable to provide a shader for this renderable');
    shader.init();
    this.shaders.push(shader);
    return shader;
  }

  protected createShader(renderable: Renderable): Shader3D {
    return new DefaultShader(this.gl, renderable, this.config);
  }
}
