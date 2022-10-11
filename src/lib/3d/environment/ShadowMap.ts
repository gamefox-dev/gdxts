import { Matrix4 } from '../../Matrix4';
import { Texture } from '../../Texture';

export abstract class ShadowMap {
  public abstract getProjViewTrans(): Matrix4;

  public abstract getDepthMap(): Texture;
}
