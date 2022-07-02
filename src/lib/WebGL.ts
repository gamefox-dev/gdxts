import { Restorable } from "./Utils";

export class ManagedWebGLRenderingContext {
  public canvas: HTMLCanvasElement | OffscreenCanvas;
  public gl: WebGLRenderingContext;
  private restorables = new Array<Restorable>();

  constructor(
    canvasOrContext: HTMLCanvasElement | WebGLRenderingContext | EventTarget,
    contextConfig: any = { alpha: "true" }
  ) {
    if (
      !(
        canvasOrContext instanceof WebGLRenderingContext ||
        (typeof WebGL2RenderingContext !== "undefined" &&
          canvasOrContext instanceof WebGL2RenderingContext)
      )
    )
      this.setupCanvas(canvasOrContext, contextConfig);
    else {
      this.gl = canvasOrContext;
      this.canvas = this.gl.canvas;
    }
  }

  private setupCanvas(canvas: any, contextConfig: any) {
    this.gl = (canvas.getContext("webgl2", contextConfig) ||
      canvas.getContext("webgl", contextConfig)) as WebGLRenderingContext;
    this.canvas = canvas;
    canvas.addEventListener("webglcontextlost", (e: any) => {
      let event = e as WebGLContextEvent;
      if (event) event.preventDefault();
    });

    canvas.addEventListener("webglcontextrestored", (e: any) => {
      for (let i = 0, n = this.restorables.length; i < n; i++)
        this.restorables[i].restore();
    });
  }

  addRestorable(restorable: Restorable) {
    this.restorables.push(restorable);
  }

  removeRestorable(restorable: Restorable) {
    let index = this.restorables.indexOf(restorable);
    if (index > -1) this.restorables.splice(index, 1);
  }
}

// const ONE = 1;
// const ONE_MINUS_SRC_COLOR = 0x0301;
// const SRC_ALPHA = 0x0302;
// const ONE_MINUS_SRC_ALPHA = 0x0303;
// const ONE_MINUS_DST_ALPHA = 0x0305;
// const DST_COLOR = 0x0306;
