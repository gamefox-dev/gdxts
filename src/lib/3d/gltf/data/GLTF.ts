import { GLTFAnimation } from './animation/GLTFAnimation';
import { GLTFCamera } from './camera/GLTFCamera';
import { GLTFAccessor } from './data/GLTFAccessor';
import { GLTFBuffer } from './data/GLTFBuffer';
import { GLTFBufferView } from './data/GLTFBufferView';
import { GLTFMesh } from './geometry/GLTFMesh';
import { GLTFAsset } from './GLTFAsset';
import { GLTFObject } from './GLTFObject';
import { GLTFMaterial } from './material/GLTFMaterial';
import { GLTFNode } from './scene/GLTFNode';
import { GLTFScene } from './scene/GLTFScene';
import { GLTFSkin } from './scene/GLTFSkin';
import { GLTFImage } from './texture/GLTFImage';
import { GLTFSampler } from './texture/GLTFSampler';
import { GLTFTexture } from './texture/GLTFTexture';

export class GLTF extends GLTFObject {
  public asset: GLTFAsset;
  public scene: number;
  public scenes: GLTFScene[];
  public nodes: GLTFNode[];
  public cameras: GLTFCamera[];
  public meshes: GLTFMesh[];

  public images: GLTFImage[];
  public samplers: GLTFSampler[];
  public textures: GLTFTexture[];

  public animations: GLTFAnimation[];
  public skins: GLTFSkin[];

  public accessors: GLTFAccessor[];
  public materials: GLTFMaterial[];
  public bufferViews: GLTFBufferView[];
  public buffers: GLTFBuffer[];

  public extensionsUsed: string[];
  public extensionsRequired: string[];
}
