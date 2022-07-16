import { Texture, TextureFilter, TextureWrap } from "../../Texture";

export class FileTextureProvider {
  private minFilter: TextureFilter;
  private magFilter: TextureFilter;
  private uWrap: TextureWrap;
  private vWrap: TextureWrap;
  private useMipMaps: boolean;

  constructor(
    minFilter: TextureFilter = TextureFilter.Linear,
    magFilter: TextureFilter = TextureFilter.Linear,
    uWrap: TextureWrap = TextureWrap.Repeat,
    vWrap: TextureWrap = TextureWrap.Repeat,
    useMipMaps: boolean = false
  ) {
    this.minFilter = minFilter;
    this.magFilter = magFilter;
    this.uWrap = uWrap;
    this.vWrap = vWrap;
    this.useMipMaps = useMipMaps;
  }

  public async load(
    gl: WebGLRenderingContext,
    fileName: string
  ): Promise<Texture> {
    const result = await Texture.load(gl, "test.jpg");
    result.setFilters(this.minFilter, this.magFilter);
    result.setWraps(this.uWrap, this.vWrap);
    return result;
  }
}
