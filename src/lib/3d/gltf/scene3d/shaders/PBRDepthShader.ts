import { Attributes } from '../../../attributes';
import { Renderable } from '../../../Renderable';
import { DepthShader, DepthShaderConfig } from '../../../shaders/DepthShader';
import { PBRUsage } from '../attributes/PBRVertexAttributes';
import { WeightVector } from '../model/WeightVector';

export class PBRDepthShader extends DepthShader {
  public morphTargetsMask: number;

  // morph targets
  private u_morphTargets1: WebGLUniformLocation = null;
  private u_morphTargets2: WebGLUniformLocation = null;

  public constructor(gl: WebGLRenderingContext, renderable: Renderable, config: DepthShaderConfig, prefix: string) {
    super(gl, renderable, config, prefix, config.vertexShader, config.fragmentShader);
    this.morphTargetsMask = this.computeMorphTargetsMask(renderable);
  }

  protected computeMorphTargetsMask(renderable: Renderable): number {
    let morphTargetsFlag = 0;
    const vertexAttributes = renderable.meshPart.mesh.getVertexAttributes();
    let n = vertexAttributes.size();
    for (let i = 0; i < n; i++) {
      const attr = vertexAttributes.get(i);
      if (attr.usage == PBRUsage.PositionTarget) morphTargetsFlag |= 1 << attr.unit;
    }
    return morphTargetsFlag;
  }

  public canRender(renderable: Renderable): boolean {
    if (this.morphTargetsMask != this.computeMorphTargetsMask(renderable)) return false;

    return super.canRender(renderable);
  }

  public init() {
    super.init();

    this.u_morphTargets1 = this.program.getUniformLocation('u_morphTargets1', false);
    this.u_morphTargets2 = this.program.getUniformLocation('u_morphTargets2', false);
  }

  public renderWithCombinedAttributes(renderable: Renderable, combinedAttributes: Attributes) {
    if (!!this.u_morphTargets1) {
      if (renderable.userData instanceof WeightVector) {
        const weightVector = renderable.userData as WeightVector;
        this.program.setUniform4fWithLocation(
          this.u_morphTargets1,
          weightVector.get(0),
          weightVector.get(1),
          weightVector.get(2),
          weightVector.get(3)
        );
      } else {
        this.program.setUniform4fWithLocation(this.u_morphTargets1, 0, 0, 0, 0);
      }
    }
    if (this.u_morphTargets2 >= 0) {
      if (renderable.userData instanceof WeightVector) {
        const weightVector = renderable.userData as WeightVector;
        this.program.setUniform4fWithLocation(
          this.u_morphTargets2,
          weightVector.get(4),
          weightVector.get(5),
          weightVector.get(6),
          weightVector.get(7)
        );
      } else {
        this.program.setUniform4fWithLocation(this.u_morphTargets2, 0, 0, 0, 0);
      }
    }

    super.renderWithCombinedAttributes(renderable, combinedAttributes);
  }
}
