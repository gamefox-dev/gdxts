import { GLTFObject } from './GLTFObject';

export class GLTFAsset extends GLTFObject {
  public generator: string;
  public version: string;
  public copyright: string;
  public minVersion: string;
}
