import { GL20 } from '../../../GL20';
import { Renderable } from '../../../Renderable';

export class PBRCommon {
  public static MAX_MORPH_TARGETS = 8;
  static gl: WebGLRenderingContext;
  constructor(gl: WebGLRenderingContext) {
    PBRCommon.gl = gl;
  }

  public static getCapability(pname: number): number {
    // intBuffer.clear();
    // Gdx.gl.glGetIntegerv(pname, intBuffer);
    // return intBuffer.get();

    return this.gl.getParameter(pname) as number;
  }

  public static checkVertexAttributes(renderable: Renderable) {
    const numVertexAttributes = renderable.meshPart.mesh.getVertexAttributes().size();
    const maxVertexAttribs = this.getCapability(GL20.GL_MAX_VERTEX_ATTRIBS);
    if (numVertexAttributes > maxVertexAttribs) {
      throw new Error('too many vertex attributes : ' + numVertexAttributes + ' > ' + maxVertexAttribs);
    }
  }
}
