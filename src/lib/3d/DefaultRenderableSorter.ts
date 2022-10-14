import { Matrix4 } from '../Matrix4';
import { Vector3 } from '../Vector3';
import { BlendingAttribute } from './attributes/BlendingAttribute';
import { Camera } from './Camera';
import { Renderable } from './Renderable';
import { RenderableSorter } from './utils/RenderableSorter';

export class DefaultRenderableSorter implements RenderableSorter {
  private camera: Camera;
  private tmpV1: Vector3 = new Vector3();
  private tmpV2: Vector3 = new Vector3();

  public sort(camera: Camera, renderables: Renderable[]) {
    this.camera = camera;
    //renderables.sort(this.compare.bind(this));
  }

  private getTranslation(worldTransform: Matrix4, center: Vector3, output: Vector3): Vector3 {
    if (center.isZero()) worldTransform.getTranslation(output);
    else if (!worldTransform.hasRotationOrScaling()) worldTransform.getTranslation(output).add(center);
    else output.set(center.x, center.y, center.z).multiply(worldTransform);
    return output;
  }

  public compare(o1: Renderable, o2: Renderable): number {
    const b1 =
      o1.material.has(BlendingAttribute.Type) && (o1.material.get(BlendingAttribute.Type) as BlendingAttribute).blended;
    const b2 =
      o2.material.has(BlendingAttribute.Type) && (o2.material.get(BlendingAttribute.Type) as BlendingAttribute).blended;
    if (b1 !== b2) return b1 ? 1 : -1;
    this.getTranslation(o1.worldTransform, o1.meshPart.center, this.tmpV1);
    this.getTranslation(o2.worldTransform, o2.meshPart.center, this.tmpV2);

    const dst = 1000 * this.camera.position.dst2(this.tmpV1) - 1000 * this.camera.position.dst2(this.tmpV2);
    const result = dst < 0 ? -1 : dst > 0 ? 1 : 0;
    return b1 ? -result : result;
  }
}
