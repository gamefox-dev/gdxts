import { Camera } from '../Camera';
import { Renderable } from '../Renderable';

export abstract class RenderableSorter {
  /** Sorts the array of {@link Renderable} instances based on some criteria, e.g. material, distance to camera etc.
   * @param renderables the array of renderables to be sorted */
  public abstract sort(camera: Camera, renderables: Renderable[]);
}
