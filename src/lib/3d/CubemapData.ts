export abstract class CubemapData {
  /** @return whether the TextureData is prepared or not. */
  public abstract isPrepared(): boolean;

  /** Prepares the TextureData for a call to {@link #consumeCubemapData()}. This method can be called from a non OpenGL thread
   * and should thus not interact with OpenGL. */
  public abstract prepare();

  /** Uploads the pixel data for the 6 faces of the cube to the OpenGL ES texture. The caller must bind an OpenGL ES texture. A
   * call to {@link #prepare()} must preceed a call to this method. Any internal data structures created in {@link #prepare()}
   * should be disposed of here. */
  public abstract consumeCubemapData();

  /** @return the width of the pixel data */
  public abstract getWidth(): number;

  /** @return the height of the pixel data */
  public abstract getHeight(): number;

  /** @return whether this implementation can cope with a EGL context loss. */
  public abstract isManaged(): boolean;
}
