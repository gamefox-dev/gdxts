import { Quaternion } from '../../../../Quaternion';

export class CubicQuaternion extends Quaternion {
  public tangentIn = new Quaternion();
  public tangentOut = new Quaternion();
}
