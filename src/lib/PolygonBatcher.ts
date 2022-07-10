import { Color, Disposable } from "./Utils";
import { Texture } from "./Texture";
import {
  Mesh,
  Position2Attribute,
  ColorAttribute,
  TexCoordAttribute,
  Color2Attribute,
} from "./Mesh";
import { Shader } from "./Shader";
import { ManagedWebGLRenderingContext } from "./WebGL";

// prettier-ignore
const quad = [
  0, 0, 1, 1, 1, 1, 0, 0,
  0, 0, 1, 1, 1, 1, 0, 0,
  0, 0, 1, 1, 1, 1, 0, 0,
  0, 0, 1, 1, 1, 1, 0, 0,
];
const QUAD_TRIANGLES = [0, 1, 2, 2, 3, 0];
const WHITE = new Color(1, 1, 1, 1);

export class PolygonBatch implements Disposable {
  private context: ManagedWebGLRenderingContext;
  private drawCalls: number;
  private isDrawing = false;
  private mesh: Mesh;
  private shader: Shader = null;
  private lastTexture: Texture = null;
  private verticesLength = 0;
  private indicesLength = 0;
  private srcColorBlend: number;
  private srcAlphaBlend: number;
  private dstBlend: number;
  private projectionValues: Float32Array = new Float32Array(16);
  public color: Color = WHITE;
  twoColorTint: boolean = true;

  constructor(
    context: ManagedWebGLRenderingContext | WebGLRenderingContext,
    twoColorTint: boolean = true,
    maxVertices: number = 10920
  ) {
    if (maxVertices > 10920)
      throw new Error(
        "Can't have more than 10920 triangles per batch: " + maxVertices
      );
    this.context =
      context instanceof ManagedWebGLRenderingContext
        ? context
        : new ManagedWebGLRenderingContext(context);
    let attributes = twoColorTint
      ? [
          new Position2Attribute(),
          new ColorAttribute(),
          new TexCoordAttribute(),
          new Color2Attribute(),
        ]
      : [
          new Position2Attribute(),
          new ColorAttribute(),
          new TexCoordAttribute(),
        ];
    this.mesh = new Mesh(context, attributes, maxVertices, maxVertices * 3);
    this.shader = Shader.newTwoColoredTextured(context);
    let gl = this.context.gl;
    this.srcColorBlend = gl.SRC_ALPHA;
    this.srcAlphaBlend = gl.ONE;
    this.dstBlend = gl.ONE_MINUS_SRC_ALPHA;
    this.twoColorTint = twoColorTint;
  }

  setColor(color: Color) {
    this.color = color;
  }

  setShader(shader: Shader) {
    this.shader = shader;
  }

  setProjection(projectionValues: Float32Array) {
    this.projectionValues = projectionValues;
  }

  begin() {
    if (this.isDrawing)
      throw new Error(
        "PolygonBatch is already drawing. Call PolygonBatch.end() before calling PolygonBatch.begin()"
      );
    this.drawCalls = 0;
    const shader = this.shader;
    this.lastTexture = null;
    this.isDrawing = true;

    shader.bind();
    shader.setUniform4x4f(Shader.MVP_MATRIX, this.projectionValues);
    shader.setUniformi("u_texture", 0);

    let gl = this.context.gl;
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(
      this.srcColorBlend,
      this.dstBlend,
      this.srcAlphaBlend,
      this.dstBlend
    );
  }

  setBlendMode(srcColorBlend: number, srcAlphaBlend: number, dstBlend: number) {
    if (
      this.srcColorBlend === srcColorBlend &&
      this.srcAlphaBlend === srcAlphaBlend &&
      this.dstBlend === dstBlend
    )
      return;
    this.srcColorBlend = srcColorBlend;
    this.srcAlphaBlend = srcAlphaBlend;
    this.dstBlend = dstBlend;
    if (this.isDrawing) {
      this.flush();
      let gl = this.context.gl;
      gl.blendFuncSeparate(srcColorBlend, dstBlend, srcAlphaBlend, dstBlend);
    }
  }

  drawVertices(
    texture: Texture,
    vertices: ArrayLike<number>,
    indices: Array<number>
  ) {
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
    for (let i = this.indicesLength, j = 0; j < indices.length; i++, j++)
      indicesArray[i] = indices[j] + indexStart;
    this.indicesLength += indices.length;
    this.mesh.setIndicesLength(this.indicesLength);
  }

  flush() {
    if (this.verticesLength === 0) return;

    this.lastTexture.bind();
    this.mesh.draw(this.shader, this.context.gl.TRIANGLES);

    this.verticesLength = 0;
    this.indicesLength = 0;
    this.mesh.setVerticesLength(0);
    this.mesh.setIndicesLength(0);
    this.drawCalls++;
  }

  end() {
    if (!this.isDrawing)
      throw new Error(
        "PolygonBatch is not drawing. Call PolygonBatch.begin() before calling PolygonBatch.end()"
      );
    if (this.verticesLength > 0 || this.indicesLength > 0) this.flush();

    this.shader.unbind();

    this.lastTexture = null;
    this.isDrawing = false;

    let gl = this.context.gl;
    gl.disable(gl.BLEND);
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
    u1 = 0,
    v1 = 1,
    u2 = 1,
    v2 = 0
  ) {
    const color = this.color;

    if (this.yDown) {
      const tmpV1 = v1;
      v1 = v2;
      v2 = tmpV1;
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

    var i = 0;
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
    quad[i++] = u2;
    quad[i++] = v1;
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
    quad[i++] = u1;
    quad[i++] = v2;
    if (this.twoColorTint) {
      quad[i++] = 0;
      quad[i++] = 0;
      quad[i++] = 0;
      quad[i] = 0;
    }
    this.drawVertices(texture, quad, QUAD_TRIANGLES);
  }
}
