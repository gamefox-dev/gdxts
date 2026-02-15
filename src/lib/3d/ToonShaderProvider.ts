import { Renderable } from './Renderable';
import { DefaultShaderProvider } from './DefaultShaderProvider';
import { Config } from './shaders/DefaultShader';
import { ToonShader, ToonStyleOptions } from './shaders/ToonShader';
import { Shader3D } from './shaders/Shader3D';

/**
 * Shader provider that creates ToonShader instances for cel-shaded rendering.
 */
export class ToonShaderProvider extends DefaultShaderProvider {
  private style: Partial<ToonStyleOptions>;

  constructor(
    gl: WebGLRenderingContext,
    config: Config = null,
    style?: Partial<ToonStyleOptions>
  ) {
    super(gl, config);
    this.style = style ? { ...style } : {};
  }

  protected createShader(gl: WebGLRenderingContext, renderable: Renderable): Shader3D {
    return new ToonShader(gl, renderable, this.config, this.style);
  }

  public setStyle(style: Partial<ToonStyleOptions>) {
    this.style = style ? { ...style } : {};
    for (const shader of this.shaders) {
      if (shader instanceof ToonShader) {
        shader.setStyle(this.style);
      }
    }
  }
}
