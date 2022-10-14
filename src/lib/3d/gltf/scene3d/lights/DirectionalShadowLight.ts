import { BoundingBox } from '../../../../BoundingBox';
import { Matrix4 } from '../../../../Matrix4';
import { Texture, TextureFilter, TextureWrap } from '../../../../Texture';
import { Disposable } from '../../../../Utils';
import { Vector3 } from '../../../../Vector3';
import { Camera } from '../../../Camera';
import { ShadowMap } from '../../../environment/ShadowMap';
import { GL20 } from '../../../GL20';
import { OrthographicCamera } from '../../../OrthographicCamera';
import { TextureDescriptor } from '../../../utils/TextureDescriptor';
import { DirectionalLightEx } from './DirectionalLightEx';

export class DirectionalShadowLight extends DirectionalLightEx implements ShadowMap, Disposable {
  protected static SQRT2 = Math.sqrt(2.0);

  protected fbo: WebGLFramebuffer = null;
  protected cam: Camera;
  protected tmpV = new Vector3();
  protected center = new Vector3();
  protected textureDesc: TextureDescriptor<Texture>;

  constructor(
    protected gl: WebGLRenderingContext,
    shadowMapWidth: number = 1024,
    shadowMapHeight: number = 1024,
    shadowViewportWidth: number = 100,
    shadowViewportHeight: number = 100,
    worldWidth: number = 100,
    worldHeight: number = 100,
    shadowNear: number = 0,
    shadowFar: number = 100
  ) {
    super();

    shadowMapWidth = Math.ceil(shadowMapWidth);
    shadowMapHeight = Math.ceil(shadowMapHeight);
    const imageData = new ImageData(
      new Uint8ClampedArray(shadowMapWidth * shadowMapHeight * 4),
      shadowMapWidth,
      shadowMapHeight
    );

    this.textureDesc = new TextureDescriptor();
    this.textureDesc.minFilter = this.textureDesc.magFilter = TextureFilter.Nearest;
    this.textureDesc.uWrap = this.textureDesc.vWrap = TextureWrap.ClampToEdge;
    createImageBitmap(imageData).then(imgBitmap => {
      this.textureDesc.texture = new Texture(this.gl, imgBitmap);
    });

    this.fbo = this.gl.createFramebuffer() as WebGLFramebuffer;
    this.cam = new OrthographicCamera(shadowViewportWidth, shadowViewportHeight, worldWidth, worldHeight);
    this.cam.near = shadowNear;
    this.cam.far = shadowFar;
  }

  public setShadowMapSize(shadowMapWidth: number, shadowMapHeight: number): DirectionalShadowLight {
    if (
      this.textureDesc.texture == null ||
      this.textureDesc.texture.width != shadowMapWidth ||
      this.textureDesc.texture.height != shadowMapHeight
    ) {
      if (!!this.textureDesc.texture) {
        this.textureDesc.texture.dispose();
        this.textureDesc.texture = null;
      }

      const imageData = new ImageData(
        new Uint8ClampedArray(shadowMapWidth * shadowMapHeight * 4),
        shadowMapWidth,
        shadowMapHeight
      );
      createImageBitmap(imageData).then(imgBitmap => {
        this.textureDesc.texture = new Texture(this.gl, imgBitmap);
      });
    }
    return this;
  }

  public setViewport(
    shadowViewportWidth: number,
    shadowViewportHeight: number,
    shadowNear: number,
    shadowFar: number
  ): DirectionalShadowLight {
    this.cam.viewportWidth = shadowViewportWidth;
    this.cam.viewportHeight = shadowViewportHeight;
    this.cam.near = shadowNear;
    this.cam.far = shadowFar;
    return this;
  }

  public setCenter(x: number, y: number, z: number): DirectionalShadowLight {
    this.center.set(x, y, z);
    return this;
  }

  public setBounds(box: BoundingBox): DirectionalShadowLight {
    let w = box.getWidth();
    let h = box.getHeight();
    let d = box.getDepth();
    let s = Math.max(Math.max(w, h), d);
    w = h = d = s * DirectionalShadowLight.SQRT2;
    box.getCenter(this.center);

    return this.setViewport(w, h, 0, d);
  }

  protected validate() {
    const halfDepth = this.cam.near + 0.5 * (this.cam.far - this.cam.near);
    this.cam.position.setFrom(this.direction).scale(-halfDepth).add(this.center);
    this.cam.direction.setFrom(this.direction).normalize();
    this.cam.normalizeUp();
    this.cam.update();
  }

  public begin() {
    if (!this.textureDesc.texture) return;
    this.validate();
    const w = this.textureDesc.texture.width;
    const h = this.textureDesc.texture.height;

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo);
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      this.textureDesc.texture.getWebGLTexture(),
      0
    );

    this.gl.viewport(0, 0, w, h);
    this.gl.clearColor(1, 1, 1, 1);
    this.gl.clear(GL20.GL_COLOR_BUFFER_BIT | GL20.GL_DEPTH_BUFFER_BIT);
    this.gl.enable(GL20.GL_SCISSOR_TEST);
    this.gl.scissor(1, 1, w - 2, h - 2);
  }

  public end() {
    this.gl.disable(GL20.GL_SCISSOR_TEST);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  public getFrameBuffer(): WebGLFramebuffer {
    return this.fbo;
  }

  public getCamera(): Camera {
    return this.cam;
  }

  public getProjViewTrans(): Matrix4 {
    return this.cam.projection;
  }

  public getDepthMap(): Texture {
    return this.textureDesc.texture;
  }

  public dispose() {
    if (!!this.fbo) {
      this.gl.deleteFramebuffer(this.fbo);
    }

    if (!!this.textureDesc.texture) {
      this.textureDesc.texture.dispose();
    }
  }

  public equals(other: DirectionalLightEx): boolean {
    if (other instanceof DirectionalShadowLight) {
      return other !== null && other === this;
    } else return false;
  }
}
