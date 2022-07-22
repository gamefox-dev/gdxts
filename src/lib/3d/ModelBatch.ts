import { Disposable, FlushablePool } from '../Utils';
import { DefaultRenderableSorter } from './DefaultRenderableSorter';
import { DefaultShaderProvider } from './DefaultShaderProvider';
import { DefaultTextureBinder } from './DefaultTextureBinder';
import { Environment } from './environment/Environment';
import { ModelInstance } from './ModelInstance';
import { PerspectiveCamera } from './PerspectiveCamera';
import { Renderable } from './Renderable';
import { RenderContext } from './RenderContext';
import { Shader3D } from './shaders/Shader3D';

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

  protected camera: PerspectiveCamera = null;
  protected renderablesPool: RenderablePool = new RenderablePool((): Renderable => {
    return new Renderable();
  });
  protected renderables: Renderable[] = [];
  protected context: RenderContext;
  private ownContext: boolean;
  protected shaderProvider: DefaultShaderProvider;
  protected sorter: DefaultRenderableSorter;

  public constructor(gl: WebGLRenderingContext, context: RenderContext = null, sorter: DefaultRenderableSorter = null) {
    this.sorter = sorter == null ? new DefaultRenderableSorter() : sorter;
    this.ownContext = context == null;
    this.context =
      context == null ? new RenderContext(new DefaultTextureBinder(gl, DefaultTextureBinder.LRU, 1)) : context;
    this.shaderProvider = this.shaderProvider == null ? new DefaultShaderProvider(gl) : this.shaderProvider;
  }

  public begin(cam: PerspectiveCamera) {
    if (this.camera != null) throw new Error('Call end() first.');
    this.camera = cam;
    if (this.ownContext) this.context.begin();
  }

  public setCamera(cam: PerspectiveCamera) {
    if (this.camera == null) throw new Error('Call begin() first.');
    if (this.renderables.length > 0) this.flush();
    this.camera = cam;
  }

  public getCamera(): PerspectiveCamera {
    return this.camera;
  }

  public ownsRenderContext(): boolean {
    return this.ownContext;
  }

  public getRenderContext(): RenderContext {
    return this.context;
  }

  public getRenderableSorter(): DefaultRenderableSorter {
    return this.sorter;
  }

  public flush() {
    this.sorter.sort(this.camera, this.renderables);
    let currentShader: Shader3D = null;
    for (let i = 0; i < this.renderables.length; i++) {
      const renderable = this.renderables[i];
      if (currentShader !== renderable.shader) {
        if (currentShader !== null) {
          currentShader.end();
        }
        currentShader = renderable.shader;
        currentShader.begin(this.camera, this.context);
      }
      currentShader.render(renderable);
    }
    if (currentShader != null) currentShader.end();
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

  public render(renderableProvider: ModelInstance, environment: Environment = null) {
    const offset = this.renderables.length;
    renderableProvider.getRenderables(this.renderables, this.renderablesPool);
    for (let i = offset; i < this.renderables.length; i++) {
      const renderable = this.renderables[i];
      if (environment !== null) {
        renderable.environment = environment;
      }
      renderable.shader = this.shaderProvider.getShader(renderable);
    }
  }
}
