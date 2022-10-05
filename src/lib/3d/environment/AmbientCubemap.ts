import { Color, Utils } from '../../Utils';
import { Vector3 } from '../../Vector3';

export class AmbientCubemap {
  private static NUM_VALUES = 6 * 3;

  private static clamp(v: number): number {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  public data: number[];

  constructor(copyFrom: number[] = null) {
    if (!copyFrom) {
      this.data = new Array<number>(AmbientCubemap.NUM_VALUES);
    } else {
      if (copyFrom.length !== AmbientCubemap.NUM_VALUES) throw new Error('Incorrect array size');
      this.data = new Array<number>(copyFrom.length);
      Utils.arrayCopy(copyFrom, 0, this.data, 0, this.data.length);
    }
  }

  public setData(values: number[]) {
    for (let i = 0; i < this.data.length; i++) this.data[i] = values[i];
    return this;
  }

  public setColor(r: number, g: number, b: number): AmbientCubemap {
    for (let idx = 0; idx < AmbientCubemap.NUM_VALUES; ) {
      this.data[idx] = r;
      this.data[idx + 1] = g;
      this.data[idx + 2] = b;
      idx += 3;
    }
    return this;
  }

  public getColor(out: Color, side: number): Color {
    side *= 3;
    return out.set(this.data[side], this.data[side + 1], this.data[side + 2], 1);
  }

  public clear(): AmbientCubemap {
    for (let i = 0; i < this.data.length; i++) this.data[i] = 0;
    return this;
  }

  public clamp(): AmbientCubemap {
    for (let i = 0; i < this.data.length; i++) this.data[i] = AmbientCubemap.clamp(this.data[i]);
    return this;
  }

  public addColor(r: number, g: number, b: number): AmbientCubemap {
    for (let idx = 0; idx < this.data.length; ) {
      this.data[idx++] += r;
      this.data[idx++] += g;
      this.data[idx++] += b;
    }
    return this;
  }

  public add(r: number, g: number, b: number, x: number, y: number, z: number): AmbientCubemap {
    const x2 = x * x,
      y2 = y * y,
      z2 = z * z;
    let d = x2 + y2 + z2;
    if (d === 0) return this;
    d = (1 / d) * (d + 1);
    const rd = r * d,
      gd = g * d,
      bd = b * d;
    let idx = x > 0 ? 0 : 3;
    this.data[idx] += x2 * rd;
    this.data[idx + 1] += x2 * gd;
    this.data[idx + 2] += x2 * bd;
    idx = y > 0 ? 6 : 9;
    this.data[idx] += y2 * rd;
    this.data[idx + 1] += y2 * gd;
    this.data[idx + 2] += y2 * bd;
    idx = z > 0 ? 12 : 15;
    this.data[idx] += z2 * rd;
    this.data[idx + 1] += z2 * gd;
    this.data[idx + 2] += z2 * bd;
    return this;
  }

  public addWithColorAndDirection(color: Color, direction: Vector3) {
    return this.add(color.r, color.g, color.b, direction.x, direction.y, direction.z);
  }

  public addWithPointTarget(color: Color, point: Vector3, target: Vector3): AmbientCubemap {
    return this.add(color.r, color.g, color.b, target.x - point.x, target.y - point.y, target.z - point.z);
  }

  public addWithPointTargetIntensity(color: Color, point: Vector3, target: Vector3, intensity: number): AmbientCubemap {
    const t = intensity / (1 + target.distance(point));
    return this.add(color.r * t, color.g * t, color.b * t, target.x - point.x, target.y - point.y, target.z - point.z);
  }

  public toString(): string {
    let result = '';
    for (let i = 0; i < this.data.length; i += 3) {
      result += this.data[i] + ', ' + this.data[i + 1] + ', ' + this.data[i + 2] + '\n';
    }
    return result;
  }
}
