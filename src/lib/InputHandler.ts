import { EventEmitter } from "events";
import { OrthoCamera } from "./Camera";
import { Vector2 } from "./Utils";

export enum InputEvent {
  TouchStart = "touchStart",
  TouchEnd = "touchEnd",
  TouchMove = "touchMove",
}

export default class InputHandler {
  canvas: HTMLCanvasElement;
  lastX: number;
  lastY: number;
  touched: boolean;
  emitter: EventEmitter;

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
    const emitter = (this.emitter = new EventEmitter());
    this.mouseDownHandler = (evt) => {
      this.touched = true;
      this.handleMove(evt);
      emitter.emit("touchStart", this.getX(), this.getY());
    };
    this.mouseUpHandler = (evt) => {
      this.touched = false;
      emitter.emit("touchEnd", this.getX(), this.getY());
    };
    this.mouseMoveHandler = (evt) => {
      this.handleMove(evt);
      emitter.emit("touchMove", this.getX(), this.getY());
    };
    this.touchStartHandler = (evt) => {
      evt.preventDefault();
      // TODO: handle multi touch
      let touch = evt.touches[0];
      this.canvas.dispatchEvent(
        new MouseEvent("mousedown", {
          clientX: touch.clientX,
          clientY: touch.clientY,
        })
      );
    };
    this.touchEndHandler = (evt) => {
      evt.preventDefault();
      this.canvas.dispatchEvent(new MouseEvent("mouseup"));
    };
    this.touchMoveHandler = (evt) => {
      evt.preventDefault();
      let touch = evt.touches[0];
      this.canvas.dispatchEvent(
        new MouseEvent("mousemove", {
          clientX: touch.clientX,
          clientY: touch.clientY,
        })
      );
    };
    this.canvas.addEventListener("mousedown", this.mouseDownHandler, false);
    this.canvas.addEventListener("mouseup", this.mouseUpHandler, false);
    this.canvas.addEventListener("mousemove", this.mouseMoveHandler, false);
    this.canvas.addEventListener("touchstart", this.touchStartHandler, false);
    this.canvas.addEventListener("touchend", this.touchEndHandler, false);
    this.canvas.addEventListener("touchmove", this.touchMoveHandler, false);
  }
  cleanup() {
    this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
    this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
    this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
    this.canvas.removeEventListener("touchstart", this.touchStartHandler);
    this.canvas.removeEventListener("touchend", this.touchEndHandler);
    this.canvas.removeEventListener("touchmove", this.touchMoveHandler);
  }

  addEventListener(
    event: InputEvent,
    listener: (x: number, y: number) => void
  ): void {
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
    return this.touched;
  }
  private screenCoord: Vector2 = new Vector2();
  private worldCoord: Vector2 = new Vector2();
  getTouchedWorldCoord(camera: OrthoCamera) {
    this.screenCoord.set(this.getX(), this.getY());
    camera.unprojectVector2(this.worldCoord, this.screenCoord);
    return this.worldCoord;
  }
}
