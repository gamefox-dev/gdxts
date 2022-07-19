import { Color } from '../../Utils';
import { Vector2 } from '../../Vector2';
import { Vector3 } from '../../Vector3';

export class VertexInfo {
  public position = new Vector3();
  public hasPosition: boolean;
  public normal = new Vector3(0, 1, 0);
  public hasNormal: boolean;
  public color = new Color(1, 1, 1, 1);
  public hasColor: boolean;
  public uv = new Vector2();
  public hasUV: boolean;

  public reset() {
    this.position.set(0, 0, 0);
    this.normal.set(0, 1, 0);
    this.color.set(1, 1, 1, 1);
    this.uv.set(0, 0);
  }

  public set(pos: Vector3, nor: Vector3, col: Color, uv: Vector2): VertexInfo {
    this.reset();
    this.hasPosition = pos != null;
    if (this.hasPosition) this.position.set(pos.x, pos.y, pos.z);
    this.hasNormal = nor != null;
    if (this.hasNormal) this.normal.set(nor.x, nor.y, nor.z);
    this.hasColor = col != null;
    if (this.hasColor) this.color.set(col.r, col.g, col.b, col.a);
    this.hasUV = uv != null;
    if (this.hasUV) this.uv.set(uv.x, uv.y);
    return this;
  }

  public setWithVertextInfo(other: VertexInfo): VertexInfo {
    if (other === null) return this.set(null, null, null, null);
    this.hasPosition = other.hasPosition;
    this.position.set(other.position.x, other.position.y, other.position.z);
    this.hasNormal = other.hasNormal;
    this.normal.set(other.normal.x, other.normal.y, other.normal.z);
    this.hasColor = other.hasColor;
    this.color.set(other.color.r, other.color.g, other.color.b, other.color.a);
    this.hasUV = other.hasUV;
    this.uv.set(other.uv.x, other.uv.y);
    return this;
  }

  public setPos(x: number, y: number, z: number): VertexInfo {
    this.position.set(x, y, z);
    this.hasPosition = true;
    return this;
  }

  public setNor(x: number, y: number, z: number): VertexInfo {
    this.normal.set(x, y, z);
    this.hasNormal = true;
    return this;
  }

  public setCol(r: number, g: number, b: number, a: number): VertexInfo {
    this.color.set(r, g, b, a);
    this.hasColor = true;
    return this;
  }

  public setUV(u: number, v: number): VertexInfo {
    this.uv.set(u, v);
    this.hasUV = true;
    return this;
  }

  public lerp(target: VertexInfo, alpha: number): VertexInfo {
    if (this.hasPosition && target.hasPosition) this.position.lerp(target.position, alpha);
    if (this.hasNormal && target.hasNormal) this.normal.lerp(target.normal, alpha);
    if (this.hasColor && target.hasColor) this.color.lerp(target.color, alpha);
    if (this.hasUV && target.hasUV) this.uv.lerp(target.uv, alpha);
    return this;
  }
}
