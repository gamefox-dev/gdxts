import { Disposable, Restorable } from './Utils';

export class Shader implements Disposable, Restorable {
  public static MVP_MATRIX = 'u_projTrans';
  public static POSITION = 'a_position';
  public static COLOR = 'a_color';
  public static COLOR2 = 'a_color2';
  public static TEXCOORDS = 'a_texCoords';
  public static SAMPLER = 'u_texture';
  public static NORMAL = 'a_normal';
  public static TANGENT = 'a_tangent';
  public static BINORMAL = 'a_binormal';
  public static BONEWEIGHT = 'a_boneWeight';

  private context: WebGLRenderingContext;
  private vs: WebGLShader = null;
  private vsSource: string;
  private fs: WebGLShader = null;
  private fsSource: string;
  private program: WebGLProgram = null;
  private tmp2x2: Float32Array = new Float32Array(2 * 2);
  private tmp3x3: Float32Array = new Float32Array(3 * 3);
  private tmp4x4: Float32Array = new Float32Array(4 * 4);

  public getProgram() {
    return this.program;
  }
  public getVertexShader() {
    return this.vertexShader;
  }
  public getFragmentShader() {
    return this.fragmentShader;
  }
  public getVertexShaderSource() {
    return this.vsSource;
  }
  public getFragmentSource() {
    return this.fsSource;
  }

  constructor(context: WebGLRenderingContext, private vertexShader: string, private fragmentShader: string) {
    this.vsSource = vertexShader;
    this.fsSource = fragmentShader;
    this.context = context;
    this.compile();
  }

  private compile() {
    let gl = this.context;
    try {
      this.vs = this.compileShader(gl.VERTEX_SHADER, this.vertexShader);
      this.fs = this.compileShader(gl.FRAGMENT_SHADER, this.fragmentShader);
      this.program = this.compileProgram(this.vs, this.fs);
    } catch (e) {
      this.dispose();
      throw e;
    }
  }

  private compileShader(type: number, source: string) {
    let gl = this.context;
    let shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      let error = "Couldn't compile shader: " + gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      if (!gl.isContextLost()) throw new Error(error);
    }
    return shader;
  }

  private compileProgram(vs: WebGLShader, fs: WebGLShader) {
    let gl = this.context;
    let program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      let error = "Couldn't compile shader program: " + gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      if (!gl.isContextLost()) throw new Error(error);
    }
    return program;
  }

  restore() {
    this.compile();
  }

  public bind() {
    this.context.useProgram(this.program);
  }

  public unbind() {
    this.context.useProgram(null);
  }

  public setUniformi(uniform: string, value: number) {
    this.context.uniform1i(this.getUniformLocation(uniform), value);
  }

  public setUniformf(uniform: string, value: number) {
    this.context.uniform1f(this.getUniformLocation(uniform), value);
  }

  public setUniform2f(uniform: string, value: number, value2: number) {
    this.context.uniform2f(this.getUniformLocation(uniform), value, value2);
  }

  public setUniform3f(uniform: string, value: number, value2: number, value3: number) {
    this.context.uniform3f(this.getUniformLocation(uniform), value, value2, value3);
  }

  public setUniform1fWithLocation(location: WebGLUniformLocation, value: number) {
    this.context.uniform1f(location, value);
  }

  public setUniform3fWithLocation(location: WebGLUniformLocation, value: number, value2: number, value3: number) {
    this.context.uniform3f(location, value, value2, value3);
  }

  public setUniform4f(uniform: string, value: number, value2: number, value3: number, value4: number) {
    this.context.uniform4f(this.getUniformLocation(uniform), value, value2, value3, value4);
  }

  public setUniform2x2f(uniform: string, value: ArrayLike<number>) {
    this.tmp2x2.set(value);
    this.context.uniformMatrix2fv(this.getUniformLocation(uniform), false, this.tmp2x2);
  }

  public setUniform3x3f(uniform: string, value: ArrayLike<number>) {
    this.tmp3x3.set(value);
    this.context.uniformMatrix3fv(this.getUniformLocation(uniform), false, this.tmp3x3);
  }

  public setUniform4x4f(uniform: string, value: ArrayLike<number>) {
    this.tmp4x4.set(value);
    this.context.uniformMatrix4fv(this.getUniformLocation(uniform), false, this.tmp4x4);
  }

  public setUniform4x4fWithLocation(location: WebGLUniformLocation, value: number[]) {
    this.context.uniformMatrix4fv(location, false, value);
  }

  public setUniform3fv(uniform: string, value: number[]) {
    this.context.uniform3fv(this.getUniformLocation(uniform), value);
  }

  public getUniformLocation(uniform: string, pedantic: boolean = true): WebGLUniformLocation {
    let location = this.context.getUniformLocation(this.program, uniform);
    if (pedantic && !location && !this.context.isContextLost())
      throw new Error(`Couldn't find location for uniform ${uniform}`);
    return location;
  }

  public getAttributeLocation(attribute: string): number {
    let location = this.context.getAttribLocation(this.program, attribute);
    //if (location === -1 && !gl.isContextLost()) throw new Error(`Couldn't find location for attribute ${attribute}`);
    return location;
  }

  public dispose() {
    if (this.vs) {
      this.context.deleteShader(this.vs);
      this.vs = null;
    }

    if (this.fs) {
      this.context.deleteShader(this.fs);
      this.fs = null;
    }

    if (this.program) {
      this.context.deleteProgram(this.program);
      this.program = null;
    }
  }

  public static newColoredTextured(context: WebGLRenderingContext, pma = false): Shader {
    let vs = `
         attribute vec4 ${Shader.POSITION};
         attribute vec4 ${Shader.COLOR};
         attribute vec2 ${Shader.TEXCOORDS};
         uniform mat4 ${Shader.MVP_MATRIX};
         varying vec4 v_color;
         varying vec2 v_texCoords;
 
         void main () {
           v_color = ${Shader.COLOR};
           v_color.a = v_color.a * (256.0/255.0);
           v_texCoords = ${Shader.TEXCOORDS};
           gl_Position = ${Shader.MVP_MATRIX} * ${Shader.POSITION};
         }
       `;

    let fs = `
         #ifdef GL_ES
           #define LOWP lowp
           precision mediump float;
         #else
           #define LOWP
         #endif
         varying LOWP vec4 v_color;
         varying vec2 v_texCoords;
         uniform sampler2D u_texture;
 
         void main () {
           gl_FragColor = v_color * texture2D(u_texture, v_texCoords);
           ${pma ? 'gl_FragColor.rgb *= gl_FragColor.a;' : ''}
         }
       `;

    return new Shader(context, vs, fs);
  }

  public static newTwoColoredTextured(context: WebGLRenderingContext, pma = false): Shader {
    let vs = `
         attribute vec4 ${Shader.POSITION};
         attribute vec4 ${Shader.COLOR};
         attribute vec4 ${Shader.COLOR2};
         attribute vec2 ${Shader.TEXCOORDS};
         uniform mat4 ${Shader.MVP_MATRIX};
         varying vec4 v_light;
         varying vec4 v_dark;
         varying vec2 v_texCoords;
 
         void main () {
           v_light = ${Shader.COLOR};
           v_light.a = v_light.a * (256.0/255.0);
           v_dark = ${Shader.COLOR2};
           v_dark.a = v_dark.a * (256.0/255.0);
           v_texCoords = ${Shader.TEXCOORDS};
           gl_Position = ${Shader.MVP_MATRIX} * ${Shader.POSITION};
         }
       `;

    let fs = `
         #ifdef GL_ES
           #define LOWP lowp
           precision mediump float;
         #else
           #define LOWP
         #endif
         varying LOWP vec4 v_light;
         varying LOWP vec4 v_dark;
         varying vec2 v_texCoords;
         uniform sampler2D u_texture;
 
         void main () {
           vec4 texColor = texture2D(u_texture, v_texCoords);
           gl_FragColor.a = texColor.a * v_light.a;
           gl_FragColor.rgb = ((texColor.a - 1.0) * v_dark.a + 1.0 - texColor.rgb) * v_dark.rgb + texColor.rgb * v_light.rgb;
           ${pma ? 'gl_FragColor.rgb *= gl_FragColor.a;' : ''}
         }
       `;

    return new Shader(context, vs, fs);
  }

  public static newColored(context: WebGLRenderingContext): Shader {
    let vs = `
         attribute vec4 ${Shader.POSITION};
         attribute vec4 ${Shader.COLOR};
         uniform mat4 ${Shader.MVP_MATRIX};
         varying vec4 v_color;
 
         void main () {
           v_color = ${Shader.COLOR};
           gl_Position = ${Shader.MVP_MATRIX} * ${Shader.POSITION};
         }
       `;

    let fs = `
         #ifdef GL_ES
           #define LOWP lowp
           precision mediump float;
         #else
           #define LOWP
         #endif
         varying LOWP vec4 v_color;
 
         void main () {
           gl_FragColor = v_color;
         }
       `;

    return new Shader(context, vs, fs);
  }
}
