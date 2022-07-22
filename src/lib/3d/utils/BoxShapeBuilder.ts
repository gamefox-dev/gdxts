import { FlushablePool } from '../../Utils';
import { Vector3 } from '../../Vector3';
import { BoundingBox } from '../BoundingBox';
import { VertexInfo } from '../data/VertexInfo';
import { GL20 } from '../GL20';
import { Usage } from '../attributes/VertexAttribute';
import { MeshBuilder } from './MeshBuilder';

export class BoxShapeBuilder {
  protected static tmpV0 = new Vector3();
  protected static tmpV1 = new Vector3();
  protected static tmpV2 = new Vector3();
  protected static tmpV3 = new Vector3();
  protected static tmpV4 = new Vector3();
  protected static tmpV5 = new Vector3();
  protected static tmpV6 = new Vector3();
  protected static tmpV7 = new Vector3();

  protected static vertTmp0 = new VertexInfo();
  protected static vertTmp1 = new VertexInfo();
  protected static vertTmp2 = new VertexInfo();
  protected static vertTmp3 = new VertexInfo();
  protected static vertTmp4 = new VertexInfo();
  protected static vertTmp5 = new VertexInfo();
  protected static vertTmp6 = new VertexInfo();
  protected static vertTmp7 = new VertexInfo();
  protected static vertTmp8 = new VertexInfo();

  private static vectorPool: FlushablePool<Vector3> = new FlushablePool<Vector3>((): Vector3 => {
    return new Vector3();
  });

  protected static obtainV3(): Vector3 {
    return BoxShapeBuilder.vectorPool.obtain();
  }

  protected static freeAll() {
    BoxShapeBuilder.vectorPool.flush();
  }

  public static buildWithWidthHeight(builder: MeshBuilder, width: number, height: number, depth: number) {
    this.buildWithRect(builder, 0, 0, 0, width, height, depth);
  }

  public static buildWithVertexInfo(
    builder: MeshBuilder,
    corner000: VertexInfo,
    corner010: VertexInfo,
    corner100: VertexInfo,
    corner110: VertexInfo,
    corner001: VertexInfo,
    corner011: VertexInfo,
    corner101: VertexInfo,
    corner111: VertexInfo
  ) {
    builder.ensureVertices(8);
    const i000 = builder.vertex(corner000);
    const i100 = builder.vertex(corner100);
    const i110 = builder.vertex(corner110);
    const i010 = builder.vertex(corner010);
    const i001 = builder.vertex(corner001);
    const i101 = builder.vertex(corner101);
    const i011 = builder.vertex(corner011);
    const i111 = builder.vertex(corner111);

    const primitiveType = builder.getPrimitiveType();
    if (primitiveType === GL20.GL_LINES) {
      builder.ensureIndices(24);
      builder.rect(i000, i100, i110, i010);
      builder.rect(i101, i001, i011, i111);
      builder.index8Values(i000, i001, i010, i011, i110, i111, i100, i101);
    } else if (primitiveType === GL20.GL_POINTS) {
      builder.ensureRectangleIndices(2);
      builder.rect(i000, i100, i110, i010);
      builder.rect(i101, i001, i011, i111);
    } else {
      // GL20.GL_TRIANGLES
      builder.ensureRectangleIndices(6);
      builder.rect(i000, i100, i110, i010);
      builder.rect(i101, i001, i011, i111);
      builder.rect(i000, i010, i011, i001);
      builder.rect(i101, i111, i110, i100);
      builder.rect(i101, i100, i000, i001);
      builder.rect(i110, i111, i011, i010);
    }
  }

  public static buildWithVectorCorner(
    builder: MeshBuilder,
    corner000: Vector3,
    corner010: Vector3,
    corner100: Vector3,
    corner110: Vector3,
    corner001: Vector3,
    corner011: Vector3,
    corner101: Vector3,
    corner111: Vector3
  ) {
    if (
      (builder.getAttributes().getMask() &
        (Usage.Normal | Usage.BiNormal | Usage.Tangent | Usage.TextureCoordinates)) ==
      0
    ) {
      this.buildWithVertexInfo(
        builder,
        this.vertTmp1.set(corner000, null, null, null),
        this.vertTmp2.set(corner010, null, null, null),
        this.vertTmp3.set(corner100, null, null, null),
        this.vertTmp4.set(corner110, null, null, null),
        this.vertTmp5.set(corner001, null, null, null),
        this.vertTmp6.set(corner011, null, null, null),
        this.vertTmp7.set(corner101, null, null, null),
        this.vertTmp8.set(corner111, null, null, null)
      );
    } else {
      builder.ensureVertices(24);
      builder.ensureRectangleIndices(6);
      let nor = this.tmpV1
        .set(corner000.x, corner000.y, corner000.z)
        .lerp(corner110, 0.5)
        .sub(this.tmpV2.set(corner001.x, corner001.y, corner001.z).lerp(corner111, 0.5))
        .normalize();
      builder.rectWithVectorCorner(corner000, corner010, corner110, corner100, nor);
      builder.rectWithVectorCorner(corner011, corner001, corner101, corner111, nor.scale(-1));
      nor = this.tmpV1
        .set(corner000.x, corner000.y, corner000.z)
        .lerp(corner101, 0.5)
        .sub(this.tmpV2.set(corner010.x, corner010.y, corner010.z).lerp(corner111, 0.5))
        .normalize();
      builder.rectWithVectorCorner(corner001, corner000, corner100, corner101, nor);
      builder.rectWithVectorCorner(corner010, corner011, corner111, corner110, nor.scale(-1));
      nor = this.tmpV1
        .set(corner000.x, corner000.y, corner000.z)
        .lerp(corner011, 0.5)
        .sub(this.tmpV2.set(corner100.x, corner100.y, corner100.z).lerp(corner111, 0.5))
        .normalize();
      builder.rectWithVectorCorner(corner001, corner011, corner010, corner000, nor);
      builder.rectWithVectorCorner(corner100, corner110, corner111, corner101, nor.scale(-1));
    }
  }

  public static buildWithRect(
    builder: MeshBuilder,
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    depth: number
  ) {
    const hw = width * 0.5;
    const hh = height * 0.5;
    const hd = depth * 0.5;
    const x0 = x - hw,
      y0 = y - hh,
      z0 = z - hd,
      x1 = x + hw,
      y1 = y + hh,
      z1 = z + hd;
    this.buildWithVectorCorner(
      builder, //
      this.obtainV3().set(x0, y0, z0),
      this.obtainV3().set(x0, y1, z0),
      this.obtainV3().set(x1, y0, z0),
      this.obtainV3().set(x1, y1, z0),
      this.obtainV3().set(x0, y0, z1),
      this.obtainV3().set(x0, y1, z1),
      this.obtainV3().set(x1, y0, z1),
      this.obtainV3().set(x1, y1, z1)
    );
    this.freeAll();
  }
}
