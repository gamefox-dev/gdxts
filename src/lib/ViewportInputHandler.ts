import { OrthoCamera } from './Camera';
import { InputEvent, InputHandler, TouchData } from './InputHandler';
import { Vector2 } from './Vector2';
import { Viewport } from './Viewport';

const createViewportAwareInputListener = (handler, viewport) => {
  return (x, y) => {
    const { x: vX, y: vY, pixelRatio } = viewport.getViewportInfo();
    x = x * pixelRatio - vX;
    y = y * pixelRatio - vY;
    handler(x, y);
  };
};

export class ViewportInputHandler {
  viewport: Viewport;
  canvas: HTMLCanvasElement;

  inputHandler: InputHandler;
  screenCoord = new Vector2();
  worldCoord = new Vector2();

  constructor(viewport: Viewport) {
    this.viewport = viewport;
    this.canvas = viewport.getCanvas();

    this.inputHandler = new InputHandler(this.canvas);
  }
  isTouched(): boolean {
    return this.inputHandler.isTouched();
  }
  cleanup() {
    this.inputHandler.cleanup();
  }
  addEventListener(event: InputEvent, listener: (x: number, y: number) => void) {
    this.inputHandler.addEventListener(event, createViewportAwareInputListener(listener, this.viewport));
  }
  getX(index = 0): number {
    const { pixelRatio, offsetX } = this.viewport.getViewportInfo();
    return this.inputHandler.getX(index) * pixelRatio - offsetX;
  }
  getY(index = 0): number {
    const { pixelRatio, offsetY } = this.viewport.getViewportInfo();
    return this.inputHandler.getY(index) * pixelRatio - offsetY;
  }
  getTouchedWorldCoord(camera?: OrthoCamera): Vector2 {
    if (!camera) {
      camera = this.viewport.getCamera();
    }
    this.screenCoord.set(this.getX(), this.getY());
    camera.unprojectVector2(this.worldCoord, this.screenCoord);
    return this.worldCoord;
  }

  getTotalTouched(): TouchData[] {
    return this.inputHandler.touches;
  }
}
