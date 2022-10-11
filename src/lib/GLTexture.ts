import { GL20 } from './3d/GL20';
import { TextureFilter, TextureWrap } from './Texture';
import { Disposable, MathUtils } from './Utils';

export abstract class GLTexture implements Disposable {
  /** The target of this texture, used when binding the texture, e.g. GL_TEXTURE_2D */
  public glTarget: number;
  protected glHandle: WebGLTexture = null;
  protected minFilter = TextureFilter.Nearest;
  protected magFilter = TextureFilter.Nearest;
  protected uWrap = TextureWrap.ClampToEdge;
  protected vWrap = TextureWrap.ClampToEdge;
  protected anisotropicFilterLevel = 1.0;
  private static maxAnisotropicFilterLevel = 0;

  /** @return the width of the texture in pixels */
  public abstract getWidth(): number;

  /** @return the height of the texture in pixels */
  public abstract getHeight(): number;

  /** @return the depth of the texture in pixels */
  public abstract getDepth(): number;

  constructor(protected gl: WebGLRenderingContext, glTarget: number, glHandle: WebGLTexture = null) {
    this.glTarget = glTarget;
    if (glHandle === null) {
      this.glHandle = this.gl.createTexture();
    } else {
      this.glHandle = glHandle;
    }
  }

  public abstract isManaged(): boolean;

  protected abstract reload(): void;

  /** Binds the texture to the given texture unit. Sets the currently active texture unit via {@link GL20#glActiveTexture(int)}.
   * @param unit the unit (0 to MAX_TEXTURE_UNITS). */
  public bind(unit: number = null) {
    if (!!unit) {
      this.gl.activeTexture(GL20.GL_TEXTURE0 + unit);
    }
    this.gl.bindTexture(this.glTarget, this.glHandle);
  }

  /** @return The {@link Texture.TextureFilter} used for minification. */
  public getMinFilter(): TextureFilter {
    return this.minFilter;
  }

  /** @return The {@link Texture.TextureFilter} used for magnification. */
  public getMagFilter(): TextureFilter {
    return this.magFilter;
  }

  /** @return The {@link Texture.TextureWrap} used for horizontal (U) texture coordinates. */
  public getUWrap(): TextureWrap {
    return this.uWrap;
  }

  /** @return The {@link Texture.TextureWrap} used for vertical (V) texture coordinates. */
  public getVWrap(): TextureWrap {
    return this.vWrap;
  }

  /** @return The OpenGL handle for this texture. */
  public getTextureObjectHandle(): WebGLTexture {
    return this.glHandle;
  }

  /** Sets the {@link TextureWrap} for this texture on the u and v axis. Assumes the texture is bound and active!
   * @param u the u wrap
   * @param v the v wrap
   * @param force True to always set the values, even if they are the same as the current values. */
  public unsafeSetWrap(u: TextureWrap, v: TextureWrap, force = false) {
    if (u != null && (force || this.uWrap != u)) {
      this.gl.texParameteri(this.glTarget, GL20.GL_TEXTURE_WRAP_S, u);
      this.uWrap = u;
    }
    if (v != null && (force || this.vWrap != v)) {
      this.gl.texParameteri(this.glTarget, GL20.GL_TEXTURE_WRAP_T, v);
      this.vWrap = v;
    }
  }

  /** Sets the {@link TextureWrap} for this texture on the u and v axis. This will bind this texture!
   * @param u the u wrap
   * @param v the v wrap */
  public setWrap(u: TextureWrap, v: TextureWrap) {
    this.uWrap = u;
    this.vWrap = v;
    this.bind();
    this.gl.texParameteri(this.glTarget, GL20.GL_TEXTURE_WRAP_S, u);
    this.gl.texParameteri(this.glTarget, GL20.GL_TEXTURE_WRAP_T, v);
  }

  /** Sets the {@link TextureFilter} for this texture for minification and magnification. Assumes the texture is bound and
   * active!
   * @param minFilter the minification filter
   * @param magFilter the magnification filter
   * @param force True to always set the values, even if they are the same as the current values. */
  public unsafeSetFilter(minFilter: TextureFilter, magFilter: TextureFilter, force = false) {
    if (minFilter != null && (force || this.minFilter != minFilter)) {
      this.gl.texParameteri(this.glTarget, GL20.GL_TEXTURE_MIN_FILTER, minFilter);
      this.minFilter = minFilter;
    }
    if (magFilter != null && (force || this.magFilter != magFilter)) {
      this.gl.texParameteri(this.glTarget, GL20.GL_TEXTURE_MAG_FILTER, magFilter);
      this.magFilter = magFilter;
    }
  }

  /** Sets the {@link TextureFilter} for this texture for minification and magnification. This will bind this texture!
   * @param minFilter the minification filter
   * @param magFilter the magnification filter */
  public setFilter(minFilter: TextureFilter, magFilter: TextureFilter) {
    this.minFilter = minFilter;
    this.magFilter = magFilter;
    this.bind();
    this.gl.texParameteri(this.glTarget, GL20.GL_TEXTURE_MIN_FILTER, minFilter);
    this.gl.texParameteri(this.glTarget, GL20.GL_TEXTURE_MAG_FILTER, magFilter);
  }

  /** Sets the anisotropic filter level for the texture. Assumes the texture is bound and active!
   *
   * @param level The desired level of filtering. The maximum level supported by the device up to this value will be used.
   * @param force True to always set the value, even if it is the same as the current values.
   * @return The actual level set, which may be lower than the provided value due to device limitations. */
  public unsafeSetAnisotropicFilter(level: number, force = false): number {
    const max = GLTexture.getMaxAnisotropicFilterLevel();
    if (max == 1) return 1;
    level = Math.min(level, max);
    if (!force && MathUtils.isEqual(level, this.anisotropicFilterLevel)) return this.anisotropicFilterLevel;
    this.gl.texParameteri(GL20.GL_TEXTURE_2D, GL20.GL_TEXTURE_MAX_ANISOTROPY_EXT, level);
    return (this.anisotropicFilterLevel = level);
  }

  /** Sets the anisotropic filter level for the texture. This will bind the texture!
   *
   * @param level The desired level of filtering. The maximum level supported by the device up to this value will be used.
   * @return The actual level set, which may be lower than the provided value due to device limitations. */
  public setAnisotropicFilter(level: number) {
    const max = GLTexture.getMaxAnisotropicFilterLevel();
    if (max == 1) return 1;
    level = Math.min(level, max);
    if (MathUtils.isEqual(level, this.anisotropicFilterLevel)) return level;
    this.bind();
    this.gl.texParameteri(GL20.GL_TEXTURE_2D, GL20.GL_TEXTURE_MAX_ANISOTROPY_EXT, level);
    return (this.anisotropicFilterLevel = level);
  }

  /** @return The currently set anisotropic filtering level for the texture, or 1.0f if none has been set. */
  public getAnisotropicFilter(): number {
    return this.anisotropicFilterLevel;
  }

  /** @return The maximum supported anisotropic filtering level supported by the device. */
  public static getMaxAnisotropicFilterLevel(): number {
    if (this.maxAnisotropicFilterLevel > 0) return this.maxAnisotropicFilterLevel;
    //  if (this.gl.getExtension("GL_EXT_texture_filter_anisotropic")) {
    //    FloatBuffer buffer = BufferUtils.newFloatBuffer(16);
    //    ((Buffer)buffer).position(0);
    //    ((Buffer)buffer).limit(buffer.capacity());
    //    Gdx.gl20.glGetFloatv(GL20.GL_MAX_TEXTURE_MAX_ANISOTROPY_EXT, buffer);
    //    return maxAnisotropicFilterLevel = buffer.get(0);
    //  }
    return (this.maxAnisotropicFilterLevel = 1);
  }

  /** Destroys the OpenGL Texture as specified by the glHandle. */
  protected delete() {
    if (this.glHandle != null) {
      this.gl.deleteTexture(this.glHandle);
      this.glHandle = null;
    }
  }

  public dispose() {
    this.delete();
  }
}
