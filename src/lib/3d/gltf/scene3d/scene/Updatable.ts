import { Camera } from '../../../Camera';

export abstract class Updatable {
  public abstract update(camera: Camera, delta: number);
}
