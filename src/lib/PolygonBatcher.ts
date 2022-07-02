import { Color, Disposable } from "./Utils";
import { GLTexture } from "./GLTexture";
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

export class PolygonBatcher implements Disposable {
  private context: ManagedWebGLRenderingContext;
  private drawCalls: number;
  private isDrawing = false;
  private mesh: Mesh;
  private shader: Shader = null;
  private lastTexture: GLTexture = null;
  private verticesLength = 0;
  private indicesLength = 0;
  private srcColorBlend: number;
  private srcAlphaBlend: number;
  private dstBlend: number;
  private projectionValues: Float32Array = new Float32Array(16);
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
    let gl = this.context.gl;
    this.srcColorBlend = gl.SRC_ALPHA;
    this.srcAlphaBlend = gl.ONE;
    this.dstBlend = gl.ONE_MINUS_SRC_ALPHA;
    this.twoColorTint = twoColorTint;
  }

  setProjection(projectionValues: Float32Array) {
    this.projectionValues = projectionValues;
  }

  begin(shader: Shader) {
    if (this.isDrawing)
      throw new Error(
        "PolygonBatch is already drawing. Call PolygonBatch.end() before calling PolygonBatch.begin()"
      );
    this.drawCalls = 0;
    this.shader = shader;
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

  draw(
    texture: GLTexture,
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

    this.shader = null;
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

  drawTexture(
    texture: GLTexture,
    x: number,
    y: number,
    width: number,
    height: number,
    color: Color = null
  ) {
    if (color === null) color = WHITE;
    var i = 0;
    quad[i++] = x;
    quad[i++] = y;
    quad[i++] = color.r;
    quad[i++] = color.g;
    quad[i++] = color.b;
    quad[i++] = color.a;
    quad[i++] = 0;
    quad[i++] = 1;
    if (this.twoColorTint) {
      quad[i++] = 0;
      quad[i++] = 0;
      quad[i++] = 0;
      quad[i++] = 0;
    }
    quad[i++] = x + width;
    quad[i++] = y;
    quad[i++] = color.r;
    quad[i++] = color.g;
    quad[i++] = color.b;
    quad[i++] = color.a;
    quad[i++] = 1;
    quad[i++] = 1;
    if (this.twoColorTint) {
      quad[i++] = 0;
      quad[i++] = 0;
      quad[i++] = 0;
      quad[i++] = 0;
    }
    quad[i++] = x + width;
    quad[i++] = y + height;
    quad[i++] = color.r;
    quad[i++] = color.g;
    quad[i++] = color.b;
    quad[i++] = color.a;
    quad[i++] = 1;
    quad[i++] = 0;
    if (this.twoColorTint) {
      quad[i++] = 0;
      quad[i++] = 0;
      quad[i++] = 0;
      quad[i++] = 0;
    }
    quad[i++] = x;
    quad[i++] = y + height;
    quad[i++] = color.r;
    quad[i++] = color.g;
    quad[i++] = color.b;
    quad[i++] = color.a;
    quad[i++] = 0;
    quad[i++] = 0;
    if (this.twoColorTint) {
      quad[i++] = 0;
      quad[i++] = 0;
      quad[i++] = 0;
      quad[i] = 0;
    }
    this.draw(texture, quad, QUAD_TRIANGLES);
  }
}
