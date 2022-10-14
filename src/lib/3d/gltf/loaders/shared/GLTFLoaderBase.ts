import { Matrix4 } from '../../../../Matrix4';
import { Texture } from '../../../../Texture';
import { Disposable } from '../../../../Utils';
import { ViewportInfo } from '../../../../Viewport';
import { Camera } from '../../../Camera';
import { BaseLight } from '../../../environment';
import { Material } from '../../../Material';
import { Mesh3D } from '../../../Mesh';
import { MeshPart, Model, Node } from '../../../model';
import { GLTFLightNode, GLTFLights, KHRLightsPunctual } from '../../data/extensions/KHRLightsPunctual';
import { KHRMaterialsPBRSpecularGlossiness } from '../../data/extensions/KHRMaterialsPBRSpecularGlossiness';
import { KHRMaterialsUnlit } from '../../data/extensions/KHRMaterialsUnlit';
import { KHRTextureTransform } from '../../data/extensions/KHRTextureTransform';
import { GLTF } from '../../data/GLTF';
import { GLTFScene } from '../../data/scene/GLTFScene';
import { NodePlus } from '../../scene3d/model/NodePlus';
import { SceneAsset } from '../../scene3d/scene/SceneAsset';
import { SceneModel } from '../../scene3d/scene/SceneModel';
import { MaterialLoader } from '../material/MaterialLoader';
import { PBRMaterialLoader } from '../material/PBRMaterialLoader';
import { NodeResolver } from '../scene/NodeResolver';
import { SkinLoader } from '../scene/SkinLoader';
import { ImageResolver } from '../texture/ImageResolver';
import { TextureResolver } from '../texture/TextureResolver';
import { AnimationLoader } from './animation/AnimationLoader';
import { DataFileResolver } from './data/DataFileResolver';
import { MeshLoader } from './geometry/MeshLoader';
import { GLTFTypes } from './GLTFTypes';

export class GLTFLoaderBase implements Disposable {
  public static TAG = 'GLTF';

  private static materialSet = new Set<Material>();
  private static meshPartSet = new Set<MeshPart>();
  private static meshSet = new Set<Mesh3D>();

  private cameras = new Array<Camera>();
  private lights = new Array<BaseLight>();

  /** node name to light index */
  private lightMap = new Map<string, number>();

  /** node name to camera index */
  private cameraMap = new Map<string, number>();

  private scenes = new Array<SceneModel>();

  protected glModel: GLTF;

  protected dataFileResolver: DataFileResolver;
  protected materialLoader: MaterialLoader;
  protected textureResolver: TextureResolver;
  protected animationLoader: AnimationLoader;
  protected dataResolver: DataResolver;
  protected skinLoader: SkinLoader;
  protected nodeResolver: NodeResolver;
  protected meshLoader: MeshLoader;
  protected imageResolver: ImageResolver;

  constructor(
    protected gl: WebGLRenderingContext,
    protected viewportInfo: ViewportInfo,
    textureResolver: TextureResolver = null
  ) {
    this.textureResolver = textureResolver;
    this.animationLoader = new AnimationLoader();
    this.nodeResolver = new NodeResolver();
    this.meshLoader = new MeshLoader(gl);
    this.skinLoader = new SkinLoader();
  }

  public load(dataFileResolver: DataFileResolver, withData: boolean): SceneAsset {
    try {
      this.dataFileResolver = dataFileResolver;

      this.glModel = dataFileResolver.getRoot();

      // prerequists
      if (!!this.glModel.extensionsRequired) {
        for (const extension of this.glModel.extensionsRequired) {
          if (KHRMaterialsPBRSpecularGlossiness.EXT === extension) {
          } else if (KHRTextureTransform.EXT === extension) {
          } else if (KHRLightsPunctual.EXT === extension) {
          } else if (KHRMaterialsUnlit.EXT === extension) {
          } else {
            throw new Error('Extension ' + extension + ' required but not supported');
          }
        }
      }

      // load deps from lower to higher

      // images (pixmaps)
      this.dataResolver = new DataResolver(this.glModel, dataFileResolver);

      if (!this.textureResolver) {
        this.imageResolver = new ImageResolver(dataFileResolver); // TODO no longer necessary
        this.imageResolver.load(this.glModel.images);
        this.textureResolver = new TextureResolver();
        this.textureResolver.loadTextures(this.glModel.textures, this.glModel.samplers, this.imageResolver);
        this.imageResolver.dispose();
      }

      this.materialLoader = new PBRMaterialLoader(this.textureResolver);
      // materialLoader = new DefaultMaterialLoader(textureResolver);
      this.materialLoader.loadMaterials(this.glModel.materials);

      this.loadCameras();
      this.loadLights();
      this.loadScenes();

      this.animationLoader.loads(this.glModel.animations, this.nodeResolver, this.dataResolver);
      this.skinLoader.loads(this.glModel.skins, this.glModel.nodes, this.nodeResolver, this.dataResolver);

      // create scene asset
      const model = new SceneAsset();
      if (withData) model.data = this.glModel;
      model.scenes = this.scenes;
      model.scene = this.scenes[this.glModel.scene];
      model.maxBones = this.skinLoader.getMaxBones();
      model.textures = this.textureResolver.getTextures(new Array<Texture>());
      model.animations = this.animationLoader.animations;
      // XXX don't know where the animation are ...
      for (const scene of model.scenes) {
        for (const animation of this.animationLoader.animations) {
          scene.model.animations.push(animation);
        }
      }

      return model;
    } catch (e) {
      this.dispose();
      throw e;
    }
  }

  private loadLights() {
    if (!!this.glModel.extensions) {
      const lightExt = this.glModel.extensions.get(KHRLightsPunctual.EXT) as GLTFLights;
      if (!!lightExt) {
        for (const light of lightExt.lights) {
          this.lights.push(KHRLightsPunctual.map(light));
        }
      }
    }
  }

  public dispose() {
    if (!!this.imageResolver) {
      this.imageResolver.dispose();
    }
    if (!!this.textureResolver) {
      this.textureResolver.dispose();
    }
    for (const scene of this.scenes) {
      scene.dispose();
    }
  }

  private loadScenes() {
    for (let i = 0; i < this.glModel.scenes.length; i++) {
      this.scenes.push(this.loadScene(this.glModel.scenes[i]));
    }
  }

  private loadCameras() {
    if (!!this.glModel.cameras) {
      for (const glCamera of this.glModel.cameras) {
        this.cameras.push(
          GLTFTypes.mapCamera(
            glCamera,
            this.viewportInfo.width,
            this.viewportInfo.height,
            this.viewportInfo.worldWidth,
            this.viewportInfo.worldHeight
          )
        );
      }
    }
  }

  private loadScene(gltfScene: GLTFScene): SceneModel {
    const sceneModel = new SceneModel();
    sceneModel.name = gltfScene.name;
    sceneModel.model = new Model(this.gl);

    // add root nodes
    if (!!gltfScene.nodes) {
      for (const id of gltfScene.nodes) {
        sceneModel.model.nodes.push(this.getNode(id));
      }
    }
    // add scene cameras (filter from all scenes cameras)
    for (const [key, value] of this.cameraMap) {
      const node = sceneModel.model.getNode(key, true);
      if (!!node) {
        sceneModel.cameras.set(node, this.cameras[value]);
      }
    }
    // add scene lights (filter from all scenes lights)
    for (const [key, value] of this.lightMap) {
      const node = sceneModel.model.getNode(key, true);
      if (!!node) sceneModel.lights.set(node, this.lights[value]);
    }

    // collect data references to store in model
    this.collectData(sceneModel.model, sceneModel.model.nodes);

    this.copy(GLTFLoaderBase.meshSet, sceneModel.model.meshes);
    this.copy(GLTFLoaderBase.meshPartSet, sceneModel.model.meshParts);
    this.copy(GLTFLoaderBase.materialSet, sceneModel.model.materials);

    GLTFLoaderBase.meshSet.clear();
    GLTFLoaderBase.meshPartSet.clear();
    GLTFLoaderBase.materialSet.clear();

    return sceneModel;
  }

  private collectData(model: Model, nodes: Node[]) {
    for (const node of nodes) {
      for (const part of node.parts) {
        GLTFLoaderBase.meshSet.add(part.meshPart.mesh);
        GLTFLoaderBase.meshPartSet.add(part.meshPart);
        GLTFLoaderBase.materialSet.add(part.material);
      }
      this.collectData(model, node.getChildren());
    }
  }

  private copy<T>(src: Set<T>, dst: Array<T>) {
    for (const e of src) dst.push(e);
  }

  private getNode(id: number): Node {
    let node = this.nodeResolver.get(id);
    if (!node) {
      node = new NodePlus();
      this.nodeResolver.put(id, node);

      const glNode = this.glModel.nodes[id];

      if (!!glNode.matrix) {
        const matrix = new Matrix4().set(glNode.matrix);
        matrix.getTranslation(node.translation);
        matrix.getScale(node.scale);
        matrix.getRotation(node.rotation);
      } else {
        if (!!glNode.translation) {
          GLTFTypes.mapVector3(node.translation, glNode.translation);
        }
        if (!!glNode.rotation) {
          GLTFTypes.mapQuaternion(node.rotation, glNode.rotation);
        }
        if (!!glNode.scale) {
          GLTFTypes.mapVector3(node.scale, glNode.scale);
        }
      }

      node.id = !glNode.name ? 'glNode ' + id : glNode.name;

      if (!!glNode.children) {
        for (const childId of glNode.children) {
          node.addChild(this.getNode(childId));
        }
      }

      if (!!glNode.mesh) {
        this.meshLoader.load(node, this.glModel.meshes[glNode.mesh], this.dataResolver, this.materialLoader);
      }

      if (!!glNode.camera) {
        this.cameraMap.set(node.id, glNode.camera);
      }

      // node extensions
      if (!!glNode.extensions) {
        const nodeLight = glNode.extensions.get(KHRLightsPunctual.EXT) as GLTFLightNode;
        if (!!nodeLight) {
          this.lightMap.set(node.id, nodeLight.light);
        }
      }
    }
    return node;
  }
}
