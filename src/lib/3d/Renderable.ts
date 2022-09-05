import { Matrix4 } from '../Matrix4';
import { Environment } from './environment/Environment';
import { Material } from './Material';
import { MeshPart } from './model/MeshPart';
import { Shader3D } from './shaders/Shader3D';

export class Renderable {
  worldTransform: Matrix4 = new Matrix4();
  meshPart: MeshPart = new MeshPart();

  material: Material;
  environment: Environment;
  //   userData: Object;
  bones: Matrix4[] = null;
  shader: Shader3D;

  public set(renderable: Renderable): Renderable {
    this.worldTransform.set(renderable.worldTransform.values);
    this.material = renderable.material;
    this.meshPart.setByMeshPart(renderable.meshPart);
    this.bones = renderable.bones;
    this.environment = renderable.environment;
    this.shader = renderable.shader;
    //this.userData = renderable.userData;
    return this;
  }
}
