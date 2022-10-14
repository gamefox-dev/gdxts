import { Texture } from '../../../../Texture';
import { Disposable } from '../../../../Utils';
import { Animation3D } from '../../../model';
import { GLTF } from '../../data/GLTF';
import { SceneModel } from './SceneModel';

export class SceneAsset implements Disposable {
  /** underlying GLTF data structure, null if loaded without "withData" option. */
  public data: GLTF;

  public scenes: SceneModel[];
  public scene: SceneModel;

  public animations: Animation3D[];
  public maxBones: number;

  /** Keep track of loaded texture in order to dispose them. Textures handled by AssetManager are excluded. */
  public textures: Texture[];

  public dispose() {
    if (!!this.scenes) {
      for (const scene of this.scenes) {
        scene.dispose();
      }
    }
    if (!!this.textures) {
      for (const texture of this.textures) {
        texture.dispose();
      }
    }
  }
}
