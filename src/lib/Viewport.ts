import { OrthoCamera } from './Camera';
import { resizeCanvas } from './Utils';

export interface ViewportInfo {
  pixelRatio: number;
  x: number;
  y: number;
  width: number;
  height: number;
  worldWidth: number;
  worldHeight: number;
}

export interface ViewportOptions {
  autoUpdate?: Boolean;
  pixelRatio?: number;
  crop?: Boolean;
  disablePremultipliedAlpha?: Boolean;
  contextOption?: WebGLContextAttributes;
  resizeCanvasFunc?: (canvas: HTMLCanvasElement, pixelRatio: number) => [number, number];
}

export interface Viewport {
  getViewportInfo(): ViewportInfo;
  getCamera(): OrthoCamera;
  getContext(): WebGLRenderingContext;
  getCanvas(): HTMLCanvasElement;
  update(): void;
  cleanUp(): void;
  addCamera(camera: OrthoCamera): void;
}

export const createViewport = (canvas: HTMLCanvasElement, width: number, height: number, options?: ViewportOptions) => {
  const defaultOptions = {
    autoUpdate: true,
    pixelRatio: undefined,
    crop: true
  };

  options = {
    ...defaultOptions,
    ...options
  };
  let contextOption;
  if (options.disablePremultipliedAlpha) {
    contextOption = {
      premultipliedAlpha: false
    };
  }
  contextOption = {
    ...contextOption,
    ...options.contextOption
  };
  let gl = canvas.getContext('webgl2', contextOption) as WebGLRenderingContext;
  if (!gl) {
    gl = canvas.getContext('webgl', contextOption) as WebGLRenderingContext;
  }
  const additionalCameras = [];
  let { autoUpdate, pixelRatio, crop } = options;
  pixelRatio = pixelRatio || window.devicePixelRatio || 1;
  const viewportInfo = {
    pixelRatio,
    x: 0,
    y: 0,
    width,
    height,
    worldWidth: width,
    worldHeight: height
  };

  const resizeCanvasFunc = options.resizeCanvasFunc || resizeCanvas;

  let resizeHandler;
  const [vWidth, vHeight] = resizeCanvasFunc(canvas, pixelRatio);
  const camera = new OrthoCamera(width, height, vWidth, vHeight);
  if (autoUpdate) {
    resizeHandler = e => {
      viewportObject.update();
    };
    window.addEventListener('resize', resizeHandler);
  }

  const listeners: (() => void)[] = [];

  const viewportObject = {
    addUpdateListener(listener: () => void) {
      listeners.push(listener);
    },
    getViewportInfo() {
      return viewportInfo;
    },
    getCamera() {
      return camera;
    },
    addCamera(camera) {
      additionalCameras.push(camera);
    },
    getContext() {
      return gl;
    },
    getCanvas() {
      return canvas;
    },
    update() {
      let [vWidth, vHeight] = resizeCanvasFunc(canvas, pixelRatio);
      const ratio = width / height;
      const vRatio = vWidth / vHeight;

      if (crop) {
        let displayWidth, displayHeight;
        if (ratio < vRatio) {
          displayHeight = vHeight;
          displayWidth = vHeight * ratio;
        } else {
          displayWidth = vWidth;
          displayHeight = vWidth / ratio;
        }
        const displayX = (vWidth - displayWidth) / 2;
        const displayY = (vHeight - displayHeight) / 2;

        viewportInfo.x = displayX;
        viewportInfo.y = displayY;
        viewportInfo.width = displayWidth;
        viewportInfo.height = displayHeight;

        gl.viewport(displayX, displayY, displayWidth, displayHeight);
        camera.setPosition(width / 2, height / 2);
        camera.resize(width, height, displayWidth, displayHeight);
        for (let camera of additionalCameras) {
          camera.setPosition(width / 2, height / 2);
          camera.resize(width, height, displayWidth, displayHeight);
        }
      } else {
        viewportInfo.x = 0;
        viewportInfo.y = 0;
        viewportInfo.width = vWidth;
        viewportInfo.height = vHeight;

        gl.viewport(0, 0, vWidth, vHeight);
        let cameraWidth, cameraHeight, cameraX, cameraY;
        if (ratio < vRatio) {
          cameraHeight = height;
          cameraWidth = cameraHeight * vRatio;
          cameraX = -(cameraWidth - width) / 2;
          cameraY = 0;
        } else {
          cameraWidth = width;
          cameraHeight = cameraWidth / vRatio;
          cameraX = 0;
          cameraY = -(cameraHeight - height) / 2;
        }
        camera.setPosition(cameraX + cameraWidth / 2, cameraY + cameraHeight / 2);
        camera.resize(cameraWidth, cameraHeight, vWidth, vHeight);
        for (let camera of additionalCameras) {
          camera.setPosition(cameraX + cameraWidth / 2, cameraY + cameraHeight / 2);
          camera.resize(cameraWidth, cameraHeight, vWidth, vHeight);
        }
      }
      for (let listener of listeners) {
        listener();
      }
    },
    cleanUp() {
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
      }
    }
  };

  autoUpdate && viewportObject.update();
  return viewportObject;
};
