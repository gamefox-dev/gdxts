import { Matrix4 } from '../../../../Matrix4';
import { Pool } from '../../../../Utils';
import { Vector3 } from '../../../../Vector3';
import { Camera } from '../../../Camera';
import { BaseLight, DirectionalLight, PointLight, SpotLight } from '../../../environment';
import { Model, Node } from '../../../model';
import { ModelInstance } from '../../../ModelInstance';
import { PerspectiveCamera } from '../../../PerspectiveCamera';
import { Renderable } from '../../../Renderable';
import { RenderableProvider } from '../../../RenderableProvider';
import { AnimationController } from '../../../utils/AnimationController';
import { AnimationControllerHack } from '../animation/AnimationControllerHack';
import { AnimationsPlayer } from '../animation/AnimationsPlayer';
import { DirectionalLightEx } from '../lights/DirectionalLightEx';
import { PointLightEx } from '../lights/PointLightEx';
import { SpotLightEx } from '../lights/SpotlightEx';
import { ModelInstanceHack } from '../model/ModelInstanceHack';
import { SceneModel } from './SceneModel';
import { Updatable } from './Updatable';

export class Scene implements RenderableProvider, Updatable {
  public modelInstance: ModelInstance;
  public animationController: AnimationController;

  public lights = new Map<Node, BaseLight>();
  public cameras = new Map<Node, Camera>();
  public animations: AnimationsPlayer;

  private static transform = new Matrix4();

  setSceneModel(sceneModel: SceneModel, rootNodeIds: string[] = null) {
    if (!rootNodeIds) {
      this.setWithInstanceAndModel(new ModelInstanceHack(sceneModel.model), sceneModel);
    } else {
      this.setWithInstanceAndModel(new ModelInstanceHack(sceneModel.model, rootNodeIds), sceneModel);
    }
  }

  private setWithInstanceAndModel(modelInstance: ModelInstance, sceneModel: SceneModel) {
    this.setModelInstance(modelInstance);

    for (const [key, value] of sceneModel.cameras) {
      const node = modelInstance.getNode(key.id, true);
      if (!!node) {
        this.cameras.set(node, this.createCamera(value));
      }
    }
    for (const [key, value] of sceneModel.lights) {
      const node = modelInstance.getNode(key.id, true);
      if (!!node) {
        this.lights.set(node, this.createLight(value));
      }
    }
    this.syncCameras();
    this.syncLights();
  }

  public setModelInstance(modelInstance: ModelInstance, animated: boolean = modelInstance.animations.length > 0) {
    //super();
    this.modelInstance = modelInstance;
    if (animated) {
      this.animationController = new AnimationControllerHack(modelInstance);
      this.animations = new AnimationsPlayer(this);
    }
  }

  public setModel(model: Model, animated: boolean) {
    this.setModelInstance(new ModelInstanceHack(model), animated);
  }

  public createCamera(from: Camera): Camera {
    let copy: Camera;
    if (from instanceof PerspectiveCamera) {
      const camera = new PerspectiveCamera(
        from.fieldOfView,
        from.viewportWidth,
        from.viewportHeight,
        from.screenWidth,
        from.screenHeight
      );
      copy = camera;
      // }else if(from instanceof OrthographicCamera){
      // 	OrthographicCamera camera = new OrthographicCamera();
      // 	camera.zoom = ((OrthographicCamera) from).zoom;
      // 	copy = camera;
      // }else{
    } else {
      throw new Error('unknown camera type ');
    }
    copy.position.setFrom(from.position);
    copy.direction.setFrom(from.direction);
    copy.up.setFrom(from.up);
    copy.near = from.near;
    copy.far = from.far;
    copy.viewportWidth = from.viewportWidth;
    copy.viewportHeight = from.viewportHeight;
    return copy;
  }

  protected createLight(from: BaseLight): BaseLight {
    if (from instanceof DirectionalLight) {
      return new DirectionalLightEx().setFrom(from);
    }
    if (from instanceof PointLight) {
      return new PointLightEx().setFrom(from);
    }
    if (from instanceof SpotLight) {
      return new SpotLightEx().setFrom(from);
    }
    throw new Error('unknown light type ');
  }

  public update(camera: Camera, delta: number) {
    this.animations.update(delta);
    this.syncCameras();
    this.syncLights();
  }

  private syncCameras() {
    for (const [key, value] of this.cameras) {
      Scene.transform.set(this.modelInstance.transform.values).multiply(key.globalTransform);
      value.position.set(0, 0, 0).multiplyMat4(Scene.transform);
      value.direction.set(0, 0, -1).rot(Scene.transform);
      value.up.setFrom(Vector3.Y).rot(Scene.transform);
      value.update();
    }
  }

  private syncLights() {
    for (const [key, value] of this.lights) {
      Scene.transform.set(this.modelInstance.transform.values).multiply(key.globalTransform);
      if (value instanceof DirectionalLight) {
        value.direction.set(0, 0, -1).rot(Scene.transform);
      } else if (value instanceof PointLight) {
        value.position.set(0, 0, 0).multiplyMat4(Scene.transform);
      } else if (value instanceof SpotLight) {
        value.position.set(0, 0, 0).multiplyMat4(Scene.transform);
        value.direction.set(0, 0, -1).rot(Scene.transform);
      }
    }
  }

  public getCamera(name: string): Camera {
    for (const [key, value] of this.cameras) {
      if (name === key.id) {
        return value;
      }
    }
    return null;
  }

  public getLight(name: string) {
    for (const [key, value] of this.lights) {
      if (name === key.id) {
        return value;
      }
    }
    return null;
  }

  public getDirectionalLightCount(): number {
    let count = 0;
    for (const [key, value] of this.lights) {
      if (value instanceof DirectionalLight) {
        count++;
      }
    }
    return count;
  }

  public getRenderables(renderables: Renderable[], pool: Pool<Renderable>) {
    this.modelInstance.getRenderables(renderables, pool);
  }
}
