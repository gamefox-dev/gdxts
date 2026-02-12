import { Disposable } from '../../Utils';
import { PerspectiveCamera } from '../PerspectiveCamera';
import { Renderable } from '../Renderable';
import { RenderContext } from '../RenderContext';

export interface Shader3D extends Disposable {
  init(): void;
  compareTo(other: Shader3D): void;
  canRender(instance: Renderable): boolean;

  begin(camera: PerspectiveCamera, context: RenderContext): void;

  render(renderable: Renderable): void;
  end(): void;
  renderOutline?(renderable: Renderable): void;
}
