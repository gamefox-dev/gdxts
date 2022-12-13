import { EventEmitter } from 'events';
import { OrthoCamera } from './Camera';
import { Vector2 } from './Vector2';

export enum InputEvent {
  TouchStart = 'touchStart',
  TouchEnd = 'touchEnd',
  TouchMove = 'touchMove'
}

export interface TouchData {
  x: number;
  y: number;
  id: number;
}

const eventMaps = {
  [InputEvent.TouchStart]: 'mousedown',
  [InputEvent.TouchEnd]: 'mouseup',
  [InputEvent.TouchMove]: 'mousemove'
};

const getMouseEvent = (inputEvent: InputEvent, touch: TouchData): MouseEvent => {
  const mevt = new MouseEvent(eventMaps[inputEvent], {
    clientX: touch.x,
    clientY: touch.y
  });
  (mevt as any).id = touch.id;
  return mevt;
};

export class InputHandler {
  canvas: HTMLCanvasElement;
  emitter: EventEmitter;
  lastX: number;
  lastY: number;
  touched: boolean;
  touches: TouchData[];

  mouseDownHandler: (evt: any) => void;
  mouseUpHandler: (evt: any) => void;
  mouseMoveHandler: (evt: any) => void;
  touchStartHandler: (evt: any) => void;
  touchEndHandler: (evt: any) => void;
  touchMoveHandler: (evt: any) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.lastX = 0;
    this.lastY = 0;
    this.touched = false;
    this.touches = [];
    const emitter = (this.emitter = new EventEmitter());
    this.mouseDownHandler = evt => {
      this.touched = true;
      this.handleMove(evt);
      emitter.emit(InputEvent.TouchStart, this.getX(), this.getY());
    };
    this.mouseUpHandler = evt => {
      this.touched = false;
      emitter.emit(InputEvent.TouchEnd, this.getX(), this.getY());
    };
    this.mouseMoveHandler = evt => {
      this.handleMove(evt);
      emitter.emit(InputEvent.TouchMove, this.getX(), this.getY());
    };
    this.touchStartHandler = (evt: TouchEvent) => {
      evt.preventDefault();
      for (const changeTouch of evt.changedTouches) {
        const touch: TouchData = {
          x: changeTouch.clientX,
          y: changeTouch.clientY,
          id: changeTouch.identifier
        };
        this.touches.push(touch);
        const mevt = getMouseEvent(InputEvent.TouchStart, touch);
        this.canvas.dispatchEvent(mevt);
      }
    };
    this.touchEndHandler = (evt: TouchEvent) => {
      evt.preventDefault();
      for (const changeTouch of evt.changedTouches) {
        const touch = this.touches.find(element => element.id === changeTouch.identifier);
        if (!touch) continue;
        const mevt = getMouseEvent(InputEvent.TouchEnd, touch);
        this.canvas.dispatchEvent(mevt);

        const index = this.touches.indexOf(touch);
        this.touches.splice(index, 1);
      }
    };
    this.touchMoveHandler = (evt: TouchEvent) => {
      evt.preventDefault();

      for (const changeTouch of evt.changedTouches) {
        for (const touch of this.touches) {
          if (touch.id === changeTouch.identifier) {
            touch.x = changeTouch.clientX;
            touch.y = changeTouch.clientY;
            const mevt = getMouseEvent(InputEvent.TouchMove, touch);
            this.canvas.dispatchEvent(mevt);
            break;
          }
        }
      }
    };
    this.canvas.addEventListener('mousedown', this.mouseDownHandler, false);
    this.canvas.addEventListener('mouseup', this.mouseUpHandler, false);
    this.canvas.addEventListener('mousemove', this.mouseMoveHandler, false);
    this.canvas.addEventListener('touchstart', this.touchStartHandler, false);
    this.canvas.addEventListener('touchend', this.touchEndHandler, false);
    this.canvas.addEventListener('touchmove', this.touchMoveHandler, false);
  }
  cleanup() {
    this.canvas.removeEventListener('mousedown', this.mouseDownHandler);
    this.canvas.removeEventListener('mouseup', this.mouseUpHandler);
    this.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
    this.canvas.removeEventListener('touchstart', this.touchStartHandler);
    this.canvas.removeEventListener('touchend', this.touchEndHandler);
    this.canvas.removeEventListener('touchmove', this.touchMoveHandler);
  }

  addEventListener(event: InputEvent, listener: (x: number, y: number) => void): void {
    this.emitter.addListener(event, listener);
  }

  private handleMove(evt: any) {
    const rect = this.canvas.getBoundingClientRect();
    const x = evt.clientX - rect.left;
    const y = evt.clientY - rect.top;
    this.lastX = x;
    this.lastY = y;
  }
  getX(): number {
    return this.lastX;
  }
  getY(): number {
    return this.lastY;
  }
  isTouched(): boolean {
    if (this.touches.length > 0) return true;
    else {
      return this.touched;
    }
  }
  private screenCoord: Vector2 = new Vector2();
  private worldCoord: Vector2 = new Vector2();
  getTouchedWorldCoord(camera: OrthoCamera) {
    this.screenCoord.set(this.getX(), this.getY());
    camera.unprojectVector2(this.worldCoord, this.screenCoord);
    return this.worldCoord;
  }
}
