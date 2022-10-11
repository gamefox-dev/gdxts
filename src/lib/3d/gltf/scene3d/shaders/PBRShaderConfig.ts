import { DefaultShaderConfig } from '../../../shaders';

export enum SRGB {
  NONE,
  FAST,
  ACCURATE
}

export class PBRShaderConfig extends DefaultShaderConfig {
  /**
   * Enable conversion of SRGB space textures into linear space in shader.
   * Should be {@link SRGB#NONE} if your textures are already in linear space
   * or automatically converted by OpenGL when using {@link com.badlogic.gdx.graphics.GL30#GL_SRGB} format.
   */
  public manualSRGB: SRGB = SRGB.ACCURATE;

  /**
   * Enable/Disable gamma correction.
   * Since gamma correction should only be done once as a final step,
   * this should be disabled when you want to apply it later (eg. in case of post process lighting calculation).
   * It also should be disabled when drawing to SRGB framebuffers since gamma correction will
   * be automatically done by OpenGL.
   * Default is true.
   */
  public manualGammaCorrection = true;

  /** Default gamma factor that gives good results on most monitors. */
  public static DEFAULT_GAMMA = 2.2;

  /**
   * Gamma value used when {@link #manualGammaCorrection} is enabled.
   * Default is 2.2 which is a standard value that gives good results on most monitors
   */
  public gamma = PBRShaderConfig.DEFAULT_GAMMA;

  /** string to prepend to shaders (version), automatic if null */
  public glslVersion: string = null;

  /** Max vertex color layers. Default {@link PBRShader} only use 1 layer,
   * custom shaders can implements more.
   */
  public numVertexColors = 1;

  /**
   * Some custom GLSL code to inject in shaders.
   * If not null it will be added after #version
   */
  public prefix: string = null;
}
