import { Renderable } from './Renderable';
import { DefaultShaderProvider } from './DefaultShaderProvider';
import { Config } from './shaders/DefaultShader';
import { ToonShader, ToonStyleOptions } from './shaders/ToonShader';
import { Shader3D } from './shaders/Shader3D';

/**
 * Shader provider that creates ToonShader instances for cel-shaded rendering.
 */
export class ToonShaderProvider extends DefaultShaderProvider {
  constructor(
    gl: WebGLRenderingContext,
    config: Config = null,
    private readonly style?: Partial<ToonStyleOptions>
  ) {
    super(gl, config);
  }

  protected createShader(gl: WebGLRenderingContext, renderable: Renderable): Shader3D {
    return new ToonShader(gl, renderable, this.config, this.style);
  }
}
