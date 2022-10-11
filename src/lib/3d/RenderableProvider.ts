import { Pool } from '../Utils';
import { Renderable } from './Renderable';

export abstract class RenderableProvider {
  /** Returns {@link Renderable} instances. Renderables are obtained from the provided {@link Pool} and added to the provided
   * array. The Renderables obtained using {@link Pool#obtain()} will later be put back into the pool, do not store them
   * internally. The resulting array can be rendered via a {@link ModelBatch}.
   * @param renderables the output array
   * @param pool the pool to obtain Renderables from */
  public abstract getRenderables(renderables: Renderable[], pool: Pool<Renderable>);
}
