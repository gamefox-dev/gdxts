import { Matrix4 } from '../../Matrix4';
import { Utils } from '../../Utils';
import { Vector3 } from '../../Vector3';
import { BoundingBox } from '../BoundingBox';
import { Plane, PlaneSide } from './Plane';

export class Frustum {
  protected static clipSpacePlanePoints: Vector3[] = [
    new Vector3(-1, -1, -1),
    new Vector3(1, -1, -1),
    new Vector3(1, 1, -1),
    new Vector3(-1, 1, -1),
    new Vector3(-1, -1, 1),
    new Vector3(1, -1, 1),
    new Vector3(1, 1, 1),
    new Vector3(-1, 1, 1)
  ];

  protected static clipSpacePlanePointsArray: number[] = new Array<number>(8 * 3);

  static {
    let j = 0;
    for (const v of Frustum.clipSpacePlanePoints) {
      Frustum.clipSpacePlanePointsArray[j++] = v.x;
      Frustum.clipSpacePlanePointsArray[j++] = v.y;
      Frustum.clipSpacePlanePointsArray[j++] = v.z;
    }
  }

  private static tmpV = new Vector3();

  public planes: Plane[] = new Array<Plane>(6);

  public planePoints: Vector3[] = [
    new Vector3(),
    new Vector3(),
    new Vector3(),
    new Vector3(),
    new Vector3(),
    new Vector3(),
    new Vector3(),
    new Vector3()
  ];
  protected planePointsArray: number[] = new Array<number>(8 * 3);

  public constructor() {
    for (let i = 0; i < 6; i++) {
      this.planes[i] = new Plane(new Vector3(), 0);
    }
  }

  public update(inverseProjectionView: Matrix4) {
    Utils.arrayCopy(
      Frustum.clipSpacePlanePointsArray,
      0,
      this.planePointsArray,
      0,
      Frustum.clipSpacePlanePointsArray.length
    );

    Matrix4.prj(inverseProjectionView, this.planePointsArray, 0, 8, 3);
    for (let i = 0, j = 0; i < 8; i++) {
      const v = this.planePoints[i];
      v.x = this.planePointsArray[j++];
      v.y = this.planePointsArray[j++];
      v.z = this.planePointsArray[j++];
    }

    this.planes[0].set(this.planePoints[1], this.planePoints[0], this.planePoints[2]);
    this.planes[1].set(this.planePoints[4], this.planePoints[5], this.planePoints[7]);
    this.planes[2].set(this.planePoints[0], this.planePoints[4], this.planePoints[3]);
    this.planes[3].set(this.planePoints[5], this.planePoints[1], this.planePoints[6]);
    this.planes[4].set(this.planePoints[2], this.planePoints[3], this.planePoints[6]);
    this.planes[5].set(this.planePoints[4], this.planePoints[0], this.planePoints[1]);
  }

  public pointInFrustum(point: Vector3): boolean {
    for (let i = 0; i < this.planes.length; i++) {
      const result = this.planes[i].testPoint(point.x, point.y, point.z);
      if (result === PlaneSide.Back) return false;
    }
    return true;
  }

  public sphereInFrustum(center: Vector3, radius: number): boolean {
    for (let i = 0; i < 6; i++)
      if (
        this.planes[i].normal.x * center.x + this.planes[i].normal.y * center.y + this.planes[i].normal.z * center.z <
        -radius - this.planes[i].d
      )
        return false;
    return true;
  }

  public sphereInFrustumWithoutNearFar(center: Vector3, radius: number): boolean {
    for (let i = 2; i < 6; i++)
      if (
        this.planes[i].normal.x * center.x + this.planes[i].normal.y * center.y + this.planes[i].normal.z * center.z <
        -radius - this.planes[i].d
      )
        return false;
    return true;
  }

  public boundsInFrustrum(center: Vector3, dimensions: Vector3): boolean {
    for (let i = 0, len2 = this.planes.length; i < len2; i++) {
      if (
        this.planes[i].testPoint(
          center.x + dimensions.x / 2,
          center.y + dimensions.y / 2,
          center.z + dimensions.z / 2
        ) !== PlaneSide.Back
      )
        continue;
      if (
        this.planes[i].testPoint(
          center.x + dimensions.x / 2,
          center.y + dimensions.y / 2,
          center.z - dimensions.z / 2
        ) !== PlaneSide.Back
      )
        continue;
      if (
        this.planes[i].testPoint(
          center.x + dimensions.x / 2,
          center.y - dimensions.y / 2,
          center.z + dimensions.z / 2
        ) !== PlaneSide.Back
      )
        continue;
      if (
        this.planes[i].testPoint(
          center.x + dimensions.x / 2,
          center.y - dimensions.y / 2,
          center.z - dimensions.z / 2
        ) !== PlaneSide.Back
      )
        continue;
      if (
        this.planes[i].testPoint(
          center.x - dimensions.x / 2,
          center.y + dimensions.y / 2,
          center.z + dimensions.z / 2
        ) !== PlaneSide.Back
      )
        continue;
      if (
        this.planes[i].testPoint(
          center.x - dimensions.x / 2,
          center.y + dimensions.y / 2,
          center.z - dimensions.z / 2
        ) !== PlaneSide.Back
      )
        continue;
      if (
        this.planes[i].testPoint(
          center.x - dimensions.x / 2,
          center.y - dimensions.y / 2,
          center.z + dimensions.z / 2
        ) !== PlaneSide.Back
      )
        continue;
      if (
        this.planes[i].testPoint(
          center.x - dimensions.x / 2,
          center.y - dimensions.y / 2,
          center.z - dimensions.z / 2
        ) !== PlaneSide.Back
      )
        continue;
      return false;
    }

    return true;
  }
}
