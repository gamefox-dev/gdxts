import { Renderable } from '../Renderable';
import { DepthShader, DepthShaderConfig } from '../shaders/DepthShader';
import { BaseShaderProvider } from './BaseShaderProvider';

export class DepthShaderProvider extends BaseShaderProvider {
  public config: DepthShaderConfig;

  constructor(
    gl: WebGLRenderingContext,
    config: DepthShaderConfig = null,
    vertexShader: string = '',
    fragmentShader: string = ''
  ) {
    super(gl);
    this.config = !config ? new DepthShaderConfig(vertexShader, fragmentShader) : config;
  }

  protected createShader(renderable: Renderable): DepthShader {
    return new DepthShader(this.gl, renderable, this.config);
  }
}
