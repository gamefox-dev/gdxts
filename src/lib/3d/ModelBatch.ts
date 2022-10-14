import { Disposable, FlushablePool } from '../Utils';
import { Camera } from './Camera';
import { DefaultRenderableSorter } from './DefaultRenderableSorter';
import { DefaultShaderProvider } from './DefaultShaderProvider';
import { DefaultTextureBinder } from './DefaultTextureBinder';
import { Environment } from './environment/Environment';
import { Renderable } from './Renderable';
import { RenderableProvider } from './RenderableProvider';
import { RenderContext } from './RenderContext';
import { Shader3D } from './shaders/Shader3D';
import { RenderableSorter } from './utils/RenderableSorter';
import { ShaderProvider } from './utils/ShaderProvider';

class RenderablePool extends FlushablePool<Renderable> {
  obtain(): Renderable {
    const renderable = super.obtain();
    renderable.environment = null;
    renderable.material = null;
    renderable.meshPart.set('', null, 0, 0, 0);
    renderable.shader = null;
    //renderable.userData = null;
    return renderable;
  }
}

export class ModelBatch implements Disposable {
  dispose(): void {
    this.shaderProvider.dispose();
  }

  protected camera: Camera = null;
  protected renderablesPool: RenderablePool = new RenderablePool((): Renderable => {
    return new Renderable();
  });
  protected renderables: Renderable[] = [];
  protected context: RenderContext = null;
  private ownContext: boolean;
  protected shaderProvider: ShaderProvider = null;
  protected sorter: RenderableSorter = null;

  constructor(
    gl: WebGLRenderingContext,
    context: RenderContext = null,
    shaderProvider: ShaderProvider = null,
    sorter: RenderableSorter = null
  ) {
    this.sorter = !sorter ? new DefaultRenderableSorter() : sorter;
    this.ownContext = !context;
    this.context = !context ? new RenderContext(new DefaultTextureBinder(gl, DefaultTextureBinder.LRU, 1)) : context;
    this.shaderProvider = !shaderProvider ? new DefaultShaderProvider(gl) : shaderProvider;
  }

  public begin(cam: Camera) {
    if (!!this.camera) throw new Error('Call end() first.');
    this.camera = cam;
    if (this.ownContext) this.context.begin();
  }

  public setCamera(cam: Camera) {
    if (!this.camera) throw new Error('Call begin() first.');
    if (this.renderables.length > 0) this.flush();
    this.camera = cam;
  }

  public getCamera(): Camera {
    return this.camera;
  }

  public ownsRenderContext(): boolean {
    return this.ownContext;
  }

  public getRenderContext(): RenderContext {
    return this.context;
  }

  public getRenderableSorter(): RenderableSorter {
    return this.sorter;
  }

  public flush() {
    this.sorter.sort(this.camera, this.renderables);
    let currentShader: Shader3D = null;
    for (let i = 0; i < this.renderables.length; i++) {
      const renderable = this.renderables[i];
      if (currentShader !== renderable.shader) {
        if (!!currentShader) {
          currentShader.end();
        }
        currentShader = renderable.shader;
        currentShader.begin(this.camera, this.context);
      }
      currentShader.render(renderable);
    }
    if (!!currentShader) currentShader.end();
    this.renderablesPool.flush();
    this.renderables.length = 0;
  }

  public end() {
    this.flush();
    if (this.ownContext) this.context.end();
    this.camera = null;
  }

  public renderWithRenderable(renderable: Renderable) {
    renderable.shader = this.shaderProvider.getShader(renderable);
    this.renderables.push(renderable);
  }

  public render(renderableProvider: RenderableProvider, environment: Environment = null) {
    const offset = this.renderables.length;
    renderableProvider.getRenderables(this.renderables, this.renderablesPool);
    for (let i = offset; i < this.renderables.length; i++) {
      const renderable = this.renderables[i];
      if (!!environment) {
        renderable.environment = environment;
      }
      renderable.shader = this.shaderProvider.getShader(renderable);
    }
  }

  public renderWithRenderableProviders(renderableProvider: RenderableProvider[], environment: Environment = null) {
    for (const provider of renderableProvider) {
      this.render(provider, environment);
    }
  }
}
