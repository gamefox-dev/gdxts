import { Disposable } from "../Utils";
import { PerspectiveCamera } from "./PerspectiveCamera";
import { Renderable } from "./Renderable";
import { RenderContext } from "./RenderContext";

export interface Shader extends Disposable {
  init(): void;
  compareTo(other: Shader): void;
  canRender(instance: Renderable): boolean;

  begin(camera: PerspectiveCamera, context: RenderContext): void;

  render(renderable: Renderable): void;
  end(): void;
}
