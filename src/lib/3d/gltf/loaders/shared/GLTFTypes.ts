import { Quaternion } from '../../../../Quaternion';
import { Texture, TextureFilter, TextureWrap } from '../../../../Texture';
import { Color, MathUtils } from '../../../../Utils';
import { Vector3 } from '../../../../Vector3';
import { GL20 } from '../../../GL20';
import { OrthographicCamera } from '../../../OrthographicCamera';
import { PerspectiveCamera } from '../../../PerspectiveCamera';
import { TextureDescriptor } from '../../../utils/TextureDescriptor';
import { GLTFCamera } from '../../data/camera/GLTFCamera';
import { GLTFAccessor } from '../../data/data/GLTFAccessor';
import { GLTFSampler } from '../../data/texture/GLTFSampler';
import { CubicQuaternion } from '../../scene3d/model/CubicQuaternion';
import { CubicVector3 } from '../../scene3d/model/CubicVector3';
import { CubicWeightVector } from '../../scene3d/model/CubicWeightVector';
import { WeightVector } from '../../scene3d/model/WeightVector';
import { Interpolation } from './animation/Interpolation';

export class GLTFTypes {
  public static TYPE_SCALAR = 'SCALAR';
  public static TYPE_VEC2 = 'VEC2';
  public static TYPE_VEC3 = 'VEC3';
  public static TYPE_VEC4 = 'VEC4';
  public static TYPE_MAT2 = 'MAT2';
  public static TYPE_MAT3 = 'MAT3';
  public static TYPE_MAT4 = 'MAT4';

  public static C_BYTE = 5120;
  public static C_UBYTE = 5121;
  public static C_SHORT = 5122;
  public static C_USHORT = 5123;
  public static C_UINT = 5125;
  public static C_FLOAT = 5126;

  /** https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#primitivemode */
  public static mapPrimitiveMode(glMode: number): number {
    if (!glMode) return GL20.GL_TRIANGLES;
    switch (glMode) {
      case 0:
        return GL20.GL_POINTS;
      case 1:
        return GL20.GL_LINES;
      case 2:
        return GL20.GL_LINE_LOOP;
      case 3:
        return GL20.GL_LINE_STRIP;
      case 4:
        return GL20.GL_TRIANGLES;
      case 5:
        return GL20.GL_TRIANGLE_STRIP;
      case 6:
        return GL20.GL_TRIANGLE_FAN;
    }
    throw new Error('unsupported mode ' + glMode);
  }

  public static mapColor(c: number[], defaultColor: Color): Color {
    if (!c) {
      return new Color().setFromColor(defaultColor);
    }
    if (c.length < 4) {
      return new Color(c[0], c[1], c[2], 1);
    } else {
      return new Color(c[0], c[1], c[2], c[3]);
    }
  }

  public static accessorStrideSize(accessor: GLTFAccessor): number {
    return this.accessorTypeSize(accessor) * this.accessorComponentTypeSize(accessor);
  }

  public static accessorTypeSize(accessor: GLTFAccessor): number {
    if (this.TYPE_SCALAR === accessor.type) {
      return 1;
    } else if (this.TYPE_VEC2 === accessor.type) {
      return 2;
    } else if (this.TYPE_VEC3 === accessor.type) {
      return 3;
    } else if (this.TYPE_VEC4 === accessor.type) {
      return 4;
    } else if (this.TYPE_MAT2 === accessor.type) {
      return 4;
    } else if (this.TYPE_MAT3 === accessor.type) {
      return 9;
    } else if (this.TYPE_MAT4 === accessor.type) {
      return 16;
    } else {
      throw new Error('illegal accessor type: ' + accessor.type);
    }
  }

  public static accessorComponentTypeSize(accessor: GLTFAccessor): number {
    switch (accessor.componentType) {
      case this.C_UBYTE:
      case this.C_BYTE:
        return 1;
      case this.C_SHORT:
      case this.C_USHORT:
        return 2;
      case this.C_UINT:
      case this.C_FLOAT:
        return 4;
      default:
        throw new Error('illegal accessor component type: ' + accessor.componentType);
    }
  }

  public static mapTextureMinFilter(filter: number): TextureFilter {
    if (!filter) return TextureFilter.Linear;
    switch (filter) {
      case 9728:
        return TextureFilter.Nearest;
      case 9729:
        return TextureFilter.Linear;
      case 9984:
        return TextureFilter.MipMapNearestNearest;
      case 9985:
        return TextureFilter.MipMapLinearNearest;
      case 9986:
        return TextureFilter.MipMapNearestLinear;
      case 9987:
        return TextureFilter.MipMapLinearLinear;
    }
    throw new Error('unexpected texture mag filter ' + filter);
  }

  public static mapTextureMagFilter(filter: number): TextureFilter {
    if (!filter) return TextureFilter.Linear;
    switch (filter) {
      case 9728:
        return TextureFilter.Nearest;
      case 9729:
        return TextureFilter.Linear;
    }
    throw new Error('unexpected texture mag filter ' + filter);
  }

  private static mapTextureWrap(wrap: number): TextureWrap {
    if (!wrap) return TextureWrap.Repeat;
    switch (wrap) {
      case 33071:
        return TextureWrap.ClampToEdge;
      case 33648:
        return TextureWrap.MirroredRepeat;
      case 10497:
        return TextureWrap.Repeat;
    }
    throw new Error('unexpected texture wrap ' + wrap);
  }

  public static isMipMapFilter(sampler: GLTFSampler): boolean {
    const filter = this.mapTextureMinFilter(sampler.minFilter);
    switch (filter) {
      case TextureFilter.Nearest:
      case TextureFilter.Linear:
        return false;
      case TextureFilter.MipMapNearestNearest:
      case TextureFilter.MipMapLinearNearest:
      case TextureFilter.MipMapNearestLinear:
      case TextureFilter.MipMapLinearLinear:
        return true;
      default:
        throw new Error('unexpected texture min filter ' + filter);
    }
  }

  public static mapTextureSampler(textureDescriptor: TextureDescriptor<Texture>, glSampler: GLTFSampler) {
    textureDescriptor.minFilter = GLTFTypes.mapTextureMinFilter(glSampler.minFilter);
    textureDescriptor.magFilter = GLTFTypes.mapTextureMagFilter(glSampler.magFilter);
    textureDescriptor.uWrap = GLTFTypes.mapTextureWrap(glSampler.wrapS);
    textureDescriptor.vWrap = GLTFTypes.mapTextureWrap(glSampler.wrapT);
  }

  public static mapInterpolation(type: string): Interpolation {
    if (!type) return Interpolation.LINEAR;
    if ('LINEAR' === type) {
      return Interpolation.LINEAR;
    } else if ('STEP' === type) {
      return Interpolation.STEP;
    } else if ('CUBICSPLINE' === type) {
      return Interpolation.CUBICSPLINE;
    } else {
      throw new Error('unexpected interpolation type ' + type);
    }
  }

  public static mapQuaternion(q: Quaternion, fv: number[], offset = 0): Quaternion {
    return q.set(fv[offset + 0], fv[offset + 1], fv[offset + 2], fv[offset + 3]);
  }

  public static mapVector3(v: Vector3, fv: number[], offset = 0): Vector3 {
    return v.set(fv[offset + 0], fv[offset + 1], fv[offset + 2]);
  }

  public static mapCubicVector3(v: CubicVector3, fv: number[], offset: number): CubicVector3 {
    v.tangentIn.set(fv[offset + 0], fv[offset + 1], fv[offset + 2]);
    v.set(fv[offset + 3], fv[offset + 4], fv[offset + 5]);
    v.tangentOut.set(fv[offset + 6], fv[offset + 7], fv[offset + 8]);
    return v;
  }

  public static mapCubicQuaternion(v: CubicQuaternion, fv: number[], offset: number): CubicQuaternion {
    v.tangentIn.set(fv[offset + 0], fv[offset + 1], fv[offset + 2], fv[offset + 3]);
    v.set(fv[offset + 4], fv[offset + 5], fv[offset + 6], fv[offset + 7]);
    v.tangentOut.set(fv[offset + 8], fv[offset + 9], fv[offset + 10], fv[offset + 11]);
    return v;
  }

  public static mapWeightVector(w: WeightVector, outputData: number, offset: number): WeightVector {
    for (let i = 0; i < w.count; i++) {
      w.values[i] = outputData[offset + i];
    }
    return w;
  }

  public static map(w: CubicWeightVector, outputData: number, offset: number): CubicWeightVector {
    for (let i = 0; i < w.count; i++) {
      w.tangentIn.values[i] = outputData[offset + i];
    }
    offset += w.count;
    for (let i = 0; i < w.count; i++) {
      w.values[i] = outputData[offset + i];
    }
    offset += w.count;
    for (let i = 0; i < w.count; i++) {
      w.tangentOut.values[i] = outputData[offset + i];
    }
    return w;
  }

  public static mapCamera(
    glCamera: GLTFCamera,
    viewportWidth: number,
    viewportHeight: number,
    screenWidth: number,
    screenHeight: number
  ) {
    if ('perspective' === glCamera.type) {
      // see https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#perspectivezfar
      // emulate an infinite matrix (based on 16 bits depth buffer)
      // TODO is it the proper ay to do it?
      const znear = glCamera.perspective.znear;
      const zfar = !!glCamera.perspective.zfar ? glCamera.perspective.zfar : znear * 16384;

      // convert scale ratio to canvas size
      const canvasRatio = viewportWidth / viewportHeight;
      const aspectRatio = !!glCamera.perspective.aspectRatio ? glCamera.perspective.aspectRatio : canvasRatio;
      const yfov = Math.atan((Math.tan(glCamera.perspective.yfov * 0.5) * aspectRatio) / canvasRatio) * 2.0;
      const fieldOfView = yfov * MathUtils.radiansToDegrees;
      const camera = new PerspectiveCamera(fieldOfView, viewportWidth, viewportHeight, screenWidth, screenHeight);
      camera.near = znear;
      camera.far = zfar;
      return camera;
    } else if ('orthographic' === glCamera.type) {
      const camera = new OrthographicCamera(viewportWidth, viewportHeight, screenWidth, screenHeight);
      camera.near = glCamera.orthographic.znear;
      camera.far = glCamera.orthographic.zfar;
      // const canvasRatio =  Gdx.graphics.getWidth() / Gdx.graphics.getHeight();
      // camera.viewportWidth = glCamera.orthographic.xmag;
      // camera.viewportHeight = glCamera.orthographic.ymag / canvasRatio;
      return camera;
    } else {
      throw new Error('unknow camera type ' + glCamera.type);
    }
  }

  public static accessorSize(accessor: GLTFAccessor): number {
    return this.accessorStrideSize(accessor) * accessor.count;
  }
}
