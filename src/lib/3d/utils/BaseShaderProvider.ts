import { Renderable } from '../Renderable';
import { Shader3D } from '../shaders';
import { ShaderProvider } from './ShaderProvider';

export abstract class BaseShaderProvider implements ShaderProvider {
  protected shaders = new Array<Shader3D>();

  constructor(protected gl: WebGLRenderingContext) {}

  public getShader(renderable: Renderable): Shader3D {
    const suggestedShader = renderable.shader;
    if (suggestedShader != null && suggestedShader.canRender(renderable)) return suggestedShader;
    for (const shader of this.shaders) {
      if (shader.canRender(renderable)) return shader;
    }
    const shader = this.createShader(renderable);
    if (!shader.canRender(renderable)) throw new Error('unable to provide a shader for this renderable');
    shader.init();
    this.shaders.push(shader);
    return shader;
  }

  protected abstract createShader(renderable: Renderable): Shader3D;

  public dispose() {
    for (const shader of this.shaders) {
      shader.dispose();
    }
    this.shaders.length = 0;
  }
}
