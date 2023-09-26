import { Affine2 } from './Affine2';
import { Color2Attribute, ColorAttribute, Mesh, Position2Attribute, TexCoordAttribute } from './Mesh';
import { Shader } from './Shader';
import { Texture } from './Texture';
import { Color, Disposable } from './Utils';

// prettier-ignore
const quad = [
  0, 0, 1, 1, 1, 1, 0, 0,
  0, 0, 1, 1, 1, 1, 0, 0,
  0, 0, 1, 1, 1, 1, 0, 0,
  0, 0, 1, 1, 1, 1, 0, 0,
];

export class PolygonBatch implements Disposable {
  public static PMA = true;
  public static QUAD_TRIANGLES = [0, 1, 2, 2, 3, 0];
  public static totalDrawCalls = 0;

  private context: WebGLRenderingContext;
  private drawCalls: number;
  private isDrawing = false;
  private mesh: Mesh;
  private shader: Shader = null;
  private lastTexture: Texture = null;
  private verticesLength = 0;
  private indicesLength = 0;
  private srcColorBlend: number;
  private srcAlphaBlend: number;
  private dstColorBlend: number;
  private dstAlphaBlend: number;
  private projectionValues: Float32Array = new Float32Array(16);
  public color: Color = new Color(1, 1, 1, 1);
  twoColorTint: boolean = true;

  constructor(context: WebGLRenderingContext, twoColorTint: boolean = true, maxVertices: number = 10920) {
    if (maxVertices > 10920) throw new Error("Can't have more than 10920 triangles per batch: " + maxVertices);
    this.context = context;
    let attributes = twoColorTint
      ? [new Position2Attribute(), new ColorAttribute(), new TexCoordAttribute(), new Color2Attribute()]
      : [new Position2Attribute(), new ColorAttribute(), new TexCoordAttribute()];
    this.mesh = new Mesh(context, attributes, maxVertices, maxVertices * 3);
    if (twoColorTint) {
      this.shader = Shader.newTwoColoredTextured(context, PolygonBatch.PMA);
    } else {
      this.shader = Shader.newColoredTextured(context, PolygonBatch.PMA);
    }
    let gl = this.context;
    this.srcColorBlend = gl.ONE;
    this.srcAlphaBlend = gl.SRC_ALPHA;
    this.dstColorBlend = gl.ONE_MINUS_SRC_ALPHA;
    this.dstAlphaBlend = gl.ONE_MINUS_SRC_ALPHA;
    this.twoColorTint = twoColorTint;
  }

  setColor(r: number, g: number, b: number, a: number);
  setColor(color: Color);
  setColor(r: number | Color, g?: number, b?: number, a?: number) {
    if (r instanceof Color) {
      this.color.unsafeSet(r.r, r.g, r.b, r.a);
    } else {
      this.color.unsafeSet(r, g, b, a);
    }
  }

  setShader(shader: Shader) {
    this.shader.dispose();
    this.shader = shader;
  }

  setProjection(projectionValues: Float32Array) {
    this.projectionValues = projectionValues;
  }

  begin() {
    if (this.isDrawing)
      throw new Error('PolygonBatch is already drawing. Call PolygonBatch.end() before calling PolygonBatch.begin()');
    this.drawCalls = 0;
    const shader = this.shader;
    this.lastTexture = null;
    this.isDrawing = true;

    shader.bind();
    shader.setUniform4x4f(Shader.MVP_MATRIX, this.projectionValues);
    shader.setUniformi('u_texture', 0);

    let gl = this.context;
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(this.srcColorBlend, this.dstColorBlend, this.srcAlphaBlend, this.dstAlphaBlend);
  }

  setBlendFunc(srcBlend: number, dstBlend: number) {
    this.setBlendMode(srcBlend, srcBlend, dstBlend);
  }

  setBlendFuncSeparate(srcColorBlend: number, srcAlphaBlend: number, dstBlend: number) {
    if (
      this.srcColorBlend === srcColorBlend &&
      this.srcAlphaBlend === srcAlphaBlend &&
      this.dstColorBlend === dstBlend &&
      this.dstAlphaBlend === dstBlend
    )
      return;
    this.srcColorBlend = srcColorBlend;
    this.srcAlphaBlend = srcAlphaBlend;
    this.dstColorBlend = dstBlend;
    this.dstAlphaBlend = dstBlend;
    if (this.isDrawing) {
      this.flush();
      let gl = this.context;
      gl.blendFuncSeparate(srcColorBlend, dstBlend, srcAlphaBlend, dstBlend);
    }
  }

  setBlendMode(srcColorBlend: number, srcAlphaBlend: number, dstBlend: number) {
    if (
      this.srcColorBlend === srcColorBlend &&
      this.srcAlphaBlend === srcAlphaBlend &&
      this.dstColorBlend === dstBlend &&
      this.dstAlphaBlend === dstBlend
    )
      return;
    this.srcColorBlend = srcColorBlend;
    this.srcAlphaBlend = srcAlphaBlend;
    this.dstColorBlend = dstBlend;
    this.dstAlphaBlend = dstBlend;
    if (this.isDrawing) {
      this.flush();
      let gl = this.context;
      gl.blendFuncSeparate(srcColorBlend, dstBlend, srcAlphaBlend, dstBlend);
    }
  }
  drawVerticesWithOffset(texture: Texture, vertices: ArrayLike<number>, offset: number, count: number) {
    const newVertices = [];
    for (let i = 0; i < count; i++) {
      newVertices[i] = vertices[i + offset];
    }
    this.drawVertices(texture, newVertices, PolygonBatch.QUAD_TRIANGLES);
  }
  drawVertices(texture: Texture, vertices: ArrayLike<number>, indices: Array<number> = PolygonBatch.QUAD_TRIANGLES) {
    if (texture !== this.lastTexture) {
      this.flush();
      this.lastTexture = texture;
    } else if (
      this.verticesLength + vertices.length > this.mesh.getVertices().length ||
      this.indicesLength + indices.length > this.mesh.getIndices().length
    ) {
      this.flush();
    }

    let indexStart = this.mesh.numVertices();
    this.mesh.getVertices().set(vertices, this.verticesLength);
    this.verticesLength += vertices.length;
    this.mesh.setVerticesLength(this.verticesLength);

    let indicesArray = this.mesh.getIndices();
    for (let i = this.indicesLength, j = 0; j < indices.length; i++, j++) indicesArray[i] = indices[j] + indexStart;
    this.indicesLength += indices.length;
    this.mesh.setIndicesLength(this.indicesLength);
  }

  drawTransformed(
    texture: Texture,
    width: number,
    height: number,
    transform: Affine2,
    ou1 = 0,
    ov1 = 1,
    ou2 = 1,
    ov2 = 0,
    rotate = false
  ) {
    if (this.yDown) {
      const tmpV1 = ov1;
      ov1 = ov2;
      ov2 = tmpV1;
    }

    let u1 = ou1;
    let v1 = ov1;
    let u2 = ou2;
    let v2 = ov2;
    let u3 = u2;
    let v3 = v1;
    let u4 = u1;
    let v4 = v2;

    if (rotate) {
      if (this.yDown) {
        u1 = ou1;
        v1 = ov2;
        u2 = ou2;
        v2 = ov1;
        u3 = ou1;
        v3 = ov1;
        u4 = ou2;
        v4 = ov2;
      } else {
        u1 = ou2;
        v1 = ov1;
        u2 = ou1;
        v2 = ov2;
        u3 = ou2;
        v3 = ov2;
        u4 = ou1;
        v4 = ov1;
      }
    }

    const x1 = transform.m02;
    const y1 = transform.m12;
    const x2 = transform.m01 * height + transform.m02;
    const y2 = transform.m11 * height + transform.m12;
    const x3 = transform.m00 * width + transform.m01 * height + transform.m02;
    const y3 = transform.m10 * width + transform.m11 * height + transform.m12;
    const x4 = transform.m00 * width + transform.m02;
    const y4 = transform.m10 * width + transform.m12;

    const color = this.color;

    let i = 0;
    quad[i++] = x1;
    quad[i++] = y1;
    quad[i++] = color.r;
    quad[i++] = color.g;
    quad[i++] = color.b;
    quad[i++] = color.a;
    quad[i++] = u1;
    quad[i++] = v1;
    if (this.twoColorTint) {
      quad[i++] = 0;
      quad[i++] = 0;
      quad[i++] = 0;
      quad[i++] = 0;
    }
    quad[i++] = x2;
    quad[i++] = y2;
    quad[i++] = color.r;
    quad[i++] = color.g;
    quad[i++] = color.b;
    quad[i++] = color.a;
    quad[i++] = u4;
    quad[i++] = v4;
    if (this.twoColorTint) {
      quad[i++] = 0;
      quad[i++] = 0;
      quad[i++] = 0;
      quad[i++] = 0;
    }
    quad[i++] = x3;
    quad[i++] = y3;
    quad[i++] = color.r;
    quad[i++] = color.g;
    quad[i++] = color.b;
    quad[i++] = color.a;
    quad[i++] = u2;
    quad[i++] = v2;
    if (this.twoColorTint) {
      quad[i++] = 0;
      quad[i++] = 0;
      quad[i++] = 0;
      quad[i++] = 0;
    }
    quad[i++] = x4;
    quad[i++] = y4;
    quad[i++] = color.r;
    quad[i++] = color.g;
    quad[i++] = color.b;
    quad[i++] = color.a;
    quad[i++] = u3;
    quad[i++] = v3;
    if (this.twoColorTint) {
      quad[i++] = 0;
      quad[i++] = 0;
      quad[i++] = 0;
      quad[i] = 0;
    }
    this.drawVertices(texture, quad, PolygonBatch.QUAD_TRIANGLES);
  }

  flush() {
    if (this.verticesLength === 0) return;

    this.lastTexture.bind();
    this.mesh.draw(this.shader, this.context.TRIANGLES);

    this.verticesLength = 0;
    this.indicesLength = 0;
    this.mesh.setVerticesLength(0);
    this.mesh.setIndicesLength(0);
    this.drawCalls++;
  }

  end() {
    if (!this.isDrawing)
      throw new Error('PolygonBatch is not drawing. Call PolygonBatch.begin() before calling PolygonBatch.end()');
    if (this.verticesLength > 0 || this.indicesLength > 0) this.flush();

    this.shader.unbind();

    this.lastTexture = null;
    this.isDrawing = false;

    PolygonBatch.totalDrawCalls += this.drawCalls;

    let gl = this.context;
    gl.disable(gl.BLEND);
  }

  public static resetTotalDrawCalls() {
    PolygonBatch.totalDrawCalls = 0;
  }

  getDrawCalls() {
    return this.drawCalls;
  }

  dispose() {
    this.mesh.dispose();
  }

  yDown = false;
  setYDown(yDown: boolean) {
    this.yDown = yDown;
  }

  draw(
    texture: Texture,
    x: number,
    y: number,
    width: number,
    height: number,
    originX = 0,
    originY = 0,
    rotation = 0,
    scaleX = 1,
    scaleY = 1,
    ou1 = 0,
    ov1 = 1,
    ou2 = 1,
    ov2 = 0,
    rotate = false
  ) {
    const color = this.color;

    if (this.yDown) {
      const tmpV1 = ov1;
      ov1 = ov2;
      ov2 = tmpV1;
    }

    width = width === 0 ? width : width || texture.width;
    height = height === 0 ? height : height || texture.height;
    x = x || 0;
    y = y || 0;

    let x1 = -originX;
    let x2 = width - originX;
    let x3 = width - originX;
    let x4 = -originX;

    let y1 = -originY;
    let y2 = -originY;
    let y3 = height - originY;
    let y4 = height - originY;

    if (scaleX !== 1) {
      x1 = x1 * scaleX;
      x2 = x2 * scaleX;
      x3 = x3 * scaleX;
      x4 = x4 * scaleX;
    }

    if (scaleY !== 1) {
      y1 = y1 * scaleY;
      y2 = y2 * scaleY;
      y3 = y3 * scaleY;
      y4 = y4 * scaleY;
    }

    if (rotation !== 0) {
      var cos = Math.cos(rotation);
      var sin = Math.sin(rotation);

      var rotatedX1 = cos * x1 - sin * y1;
      var rotatedY1 = sin * x1 + cos * y1;

      var rotatedX2 = cos * x2 - sin * y2;
      var rotatedY2 = sin * x2 + cos * y2;

      var rotatedX3 = cos * x3 - sin * y3;
      var rotatedY3 = sin * x3 + cos * y3;

      var rotatedX4 = cos * x4 - sin * y4;
      var rotatedY4 = sin * x4 + cos * y4;

      x1 = rotatedX1;
      x2 = rotatedX2;
      x3 = rotatedX3;
      x4 = rotatedX4;

      y1 = rotatedY1;
      y2 = rotatedY2;
      y3 = rotatedY3;
      y4 = rotatedY4;
    }

    x1 += x + originX;
    x2 += x + originX;
    x3 += x + originX;
    x4 += x + originX;

    y1 += y + originY;
    y2 += y + originY;
    y3 += y + originY;
    y4 += y + originY;

    let u1 = ou1;
    let v1 = ov1;
    let u2 = ou2;
    let v2 = ov2;
    let u3 = u2;
    let v3 = v1;
    let u4 = u1;
    let v4 = v2;

    if (rotate) {
      if (this.yDown) {
        u1 = ou1;
        v1 = ov2;
        u2 = ou2;
        v2 = ov1;
        u3 = ou1;
        v3 = ov1;
        u4 = ou2;
        v4 = ov2;
      } else {
        u1 = ou2;
        v1 = ov1;
        u2 = ou1;
        v2 = ov2;
        u3 = ou2;
        v3 = ov2;
        u4 = ou1;
        v4 = ov1;
      }
    }

    let i = 0;
    quad[i++] = x1;
    quad[i++] = y1;
    quad[i++] = color.r;
    quad[i++] = color.g;
    quad[i++] = color.b;
    quad[i++] = color.a;
    quad[i++] = u1;
    quad[i++] = v1;
    if (this.twoColorTint) {
      quad[i++] = 0;
      quad[i++] = 0;
      quad[i++] = 0;
      quad[i++] = 0;
    }
    quad[i++] = x2;
    quad[i++] = y2;
    quad[i++] = color.r;
    quad[i++] = color.g;
    quad[i++] = color.b;
    quad[i++] = color.a;
    quad[i++] = u3;
    quad[i++] = v3;
    if (this.twoColorTint) {
      quad[i++] = 0;
      quad[i++] = 0;
      quad[i++] = 0;
      quad[i++] = 0;
    }
    quad[i++] = x3;
    quad[i++] = y3;
    quad[i++] = color.r;
    quad[i++] = color.g;
    quad[i++] = color.b;
    quad[i++] = color.a;
    quad[i++] = u2;
    quad[i++] = v2;
    if (this.twoColorTint) {
      quad[i++] = 0;
      quad[i++] = 0;
      quad[i++] = 0;
      quad[i++] = 0;
    }
    quad[i++] = x4;
    quad[i++] = y4;
    quad[i++] = color.r;
    quad[i++] = color.g;
    quad[i++] = color.b;
    quad[i++] = color.a;
    quad[i++] = u4;
    quad[i++] = v4;
    if (this.twoColorTint) {
      quad[i++] = 0;
      quad[i++] = 0;
      quad[i++] = 0;
      quad[i] = 0;
    }
    this.drawVertices(texture, quad, PolygonBatch.QUAD_TRIANGLES);
  }
}

export type SpriteBatch = PolygonBatch;
