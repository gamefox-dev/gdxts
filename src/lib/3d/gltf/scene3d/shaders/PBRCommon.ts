import { GL20 } from '../../../GL20';
import { Renderable } from '../../../Renderable';

export class PBRCommon {
  public static MAX_MORPH_TARGETS = 8;
  public static getCapability(gl: WebGLRenderingContext, pname: number): number {
    // intBuffer.clear();
    // Gdx.gl.glGetIntegerv(pname, intBuffer);
    // return intBuffer.get();

    return gl.getParameter(pname) as number;
  }

  public static checkVertexAttributes(gl: WebGLRenderingContext, renderable: Renderable) {
    const numVertexAttributes = renderable.meshPart.mesh.getVertexAttributes().size();
    const maxVertexAttribs = this.getCapability(gl, GL20.GL_MAX_VERTEX_ATTRIBS);
    if (numVertexAttributes > maxVertexAttribs) {
      throw new Error('too many vertex attributes : ' + numVertexAttributes + ' > ' + maxVertexAttribs);
    }
  }
}
