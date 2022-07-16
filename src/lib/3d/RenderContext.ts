import { DefaultTextureBinder } from "./DefaultTextureBinder";

export class RenderContext {
  /** used to bind textures **/
  textureBinder: DefaultTextureBinder;
  private blending: boolean;
  private blendSFactor: number;
  private blendDFactor: number;
  private depthFunc: number;
  private depthRangeNear: number;
  private depthRangeFar: number;
  private depthMask: boolean;
  private cullFace: number;
  private gl: WebGLRenderingContext;

  constructor(textureBinder: DefaultTextureBinder) {
    this.textureBinder = textureBinder;
    this.gl = DefaultTextureBinder.gl;
  }

  begin() {
    this.gl.disable(this.gl.DEPTH_TEST);
    this.depthFunc = 0;
    this.gl.depthMask(true);
    this.depthMask = true;
    this.gl.disable(this.gl.BLEND);
    this.blending = false;
    this.gl.disable(this.gl.CULL_FACE);
    this.cullFace = this.blendSFactor = this.blendDFactor = 0;
    this.textureBinder.begin();
  }

  end() {
    if (this.depthFunc !== 0) this.gl.disable(this.gl.DEPTH_TEST);
    if (!this.depthMask) this.gl.depthMask(true);
    if (this.blending) this.gl.disable(this.gl.BLEND);
    if (this.cullFace > 0) this.gl.disable(this.gl.CULL_FACE);
    this.textureBinder.end();
  }

  setDepthMask(depthMask: boolean) {
    if (this.depthMask !== depthMask)
      this.gl.depthMask((this.depthMask = depthMask));
  }

  setDepthTest(
    depthFunction: number,
    depthRangeNear: number,
    depthRangeFar: number
  ) {
    const wasEnabled = this.depthFunc !== 0;
    const enabled = depthFunction !== 0;
    if (this.depthFunc !== depthFunction) {
      this.depthFunc = depthFunction;
      if (enabled) {
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(depthFunction);
      } else this.gl.disable(this.gl.DEPTH_TEST);
    }
    if (enabled) {
      if (!wasEnabled || this.depthFunc !== depthFunction)
        this.gl.depthFunc((this.depthFunc = depthFunction));
      if (
        !wasEnabled ||
        this.depthRangeNear !== depthRangeNear ||
        this.depthRangeFar !== depthRangeFar
      )
        this.gl.depthRange(
          (this.depthRangeNear = depthRangeNear),
          (this.depthRangeFar = depthRangeFar)
        );
    }
  }

  setBlending(enabled: boolean, sFactor: number, dFactor: number) {
    if (enabled !== this.blending) {
      this.blending = enabled;
      if (enabled) this.gl.enable(this.gl.BLEND);
      else this.gl.disable(this.gl.BLEND);
    }
    if (
      enabled &&
      (this.blendSFactor !== sFactor || this.blendDFactor !== dFactor)
    ) {
      this.gl.blendFunc(sFactor, dFactor);
      this.blendSFactor = sFactor;
      this.blendDFactor = dFactor;
    }
  }

  setCullFace(face: number) {
    if (face !== this.cullFace) {
      this.cullFace = face;
      if (
        face === this.gl.FRONT ||
        face === this.gl.BACK ||
        face === this.gl.FRONT_AND_BACK
      ) {
        this.gl.enable(this.gl.CULL_FACE);
        this.gl.cullFace(face);
      } else this.gl.disable(this.gl.CULL_FACE);
    }
  }
}
