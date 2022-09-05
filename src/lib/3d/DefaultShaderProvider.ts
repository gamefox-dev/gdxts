import { Disposable } from '../Utils';
import { Renderable } from './Renderable';
import { Config, DefaultShader } from './shaders/DefaultShader';
import { Shader3D } from './shaders/Shader3D';

export class DefaultShaderProvider implements Disposable {
  public config: Config;
  protected shaders: Shader3D[] = [];

  constructor(
    private gl: WebGLRenderingContext,
    config: Config = null,
    vertexShader: string = '',
    fragmentShader: string = ''
  ) {
    this.config = !config ? new Config(vertexShader, fragmentShader) : config;
  }
  dispose(): void {}

  public getShader(renderable: Renderable) {
    const suggestedShader = renderable.shader;
    if (!!suggestedShader && suggestedShader.canRender(renderable)) return suggestedShader;
    for (const shader of this.shaders) {
      if (shader.canRender(renderable)) return shader;
    }
    const shader = this.createShader(this.gl, renderable);
    if (!shader.canRender(renderable)) throw new Error('unable to provide a shader for this renderable');
    shader.init();
    this.shaders.push(shader);
    return shader;
  }

  protected createShader(gl: WebGLRenderingContext, renderable: Renderable): Shader3D {
    return new DefaultShader(gl, renderable, this.config);
  }
}
