import { Config, DefaultShader } from "./DefaultShader";
import { Renderable } from "./Renderable";
import { Shader } from "./Shader";
import { Disposable } from "../Utils";

export class DefaultShaderProvider implements Disposable {
  public config: Config;
  protected shaders: Shader[] = [];

  constructor(
    config: Config = null,
    vertexShader: string = "",
    fragmentShader: string = ""
  ) {
    this.config =
      config == null ? new Config(vertexShader, fragmentShader) : config;
  }
  dispose(): void {}

  public getShader(renderable: Renderable) {
    const suggestedShader = renderable.shader;
    if (suggestedShader != null && suggestedShader.canRender(renderable))
      return suggestedShader;
    for (const shader of this.shaders) {
      if (shader.canRender(renderable)) return shader;
    }
    const shader = this.createShader(renderable);
    if (!shader.canRender(renderable))
      throw new Error("unable to provide a shader for this renderable");
    shader.init();
    this.shaders.push(shader);
    return shader;
  }

  protected createShader(renderable: Renderable): Shader {
    return new DefaultShader(renderable, this.config);
  }
}
