import { DefaultShaderProvider } from './DefaultShaderProvider';
import { Renderable } from './Renderable';
import { Config } from './shaders/DefaultShader';
import { PBRShader, PBRStyleOptions } from './shaders/PBRShader';
import { Shader3D } from './shaders/Shader3D';

export class PBRShaderProvider extends DefaultShaderProvider {
  private style: Partial<PBRStyleOptions>;

  constructor(
    gl: WebGLRenderingContext,
    config: Config = null,
    style?: Partial<PBRStyleOptions>
  ) {
    super(gl, config);
    this.style = style ? { ...style } : {};
  }

  protected createShader(gl: WebGLRenderingContext, renderable: Renderable): Shader3D {
    return new PBRShader(gl, renderable, this.config, this.style);
  }

  public setStyle(style: Partial<PBRStyleOptions>) {
    this.style = style ? { ...style } : {};
    for (const shader of this.shaders) {
      if (shader instanceof PBRShader) {
        shader.setStyle(this.style);
      }
    }
  }
}
