import { Renderable } from '../../../Renderable';
import { DepthShaderConfig } from '../../../shaders/DepthShader';
import { DepthShaderProvider } from '../../../utils/DepthShaderProvider';
import { fragment, vertex } from '../../shaders/depth';
import { PBRUsage } from '../attributes/PBRVertexAttributes';
import { PBRCommon } from './PBRCommon';
import { PBRDepthShader } from './PBRDepthShader';

export class PBRDepthShaderProvider extends DepthShaderProvider {
  private static defaultVertexShader: string = vertex;

  public static getDefaultVertexShader(): string {
    return PBRDepthShaderProvider.defaultVertexShader;
  }

  private static defaultFragmentShader: string = fragment;

  public static getDefaultFragmentShader(): string {
    return PBRDepthShaderProvider.defaultFragmentShader;
  }

  public static createDefaultConfig(): DepthShaderConfig {
    const config = new DepthShaderConfig();
    config.vertexShader = this.getDefaultVertexShader();
    config.fragmentShader = this.getDefaultFragmentShader();
    return config;
  }

  constructor(gl: WebGLRenderingContext, config: DepthShaderConfig) {
    super(gl, config == null ? new DepthShaderConfig() : config);
    if (config.vertexShader == null) config.vertexShader = PBRDepthShaderProvider.getDefaultVertexShader();
    if (config.fragmentShader == null) config.fragmentShader = PBRDepthShaderProvider.getDefaultFragmentShader();
  }

  protected morphTargetsPrefix(renderable: Renderable): string {
    let prefix = '';
    for (const att of renderable.meshPart.mesh.getVertexAttributes().attributes) {
      for (let i = 0; i < PBRCommon.MAX_MORPH_TARGETS; i++) {
        if (att.usage == PBRUsage.PositionTarget && att.unit == i) {
          prefix += '#define ' + 'position' + i + 'Flag\n';
        }
      }
    }
    return prefix;
  }

  protected createShader(renderable: Renderable) {
    // TODO only count used attributes, depth shader only require a few of them.
    PBRCommon.checkVertexAttributes(this.gl, renderable);

    return new PBRDepthShader(
      this.gl,
      renderable,
      this.config,
      PBRDepthShader.createPrefix(renderable, this.config) + this.morphTargetsPrefix(renderable)
    );
  }
}
