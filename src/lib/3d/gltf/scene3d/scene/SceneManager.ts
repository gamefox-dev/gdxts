import { Color, Disposable } from '../../../../Utils';
import {
  ColorAttribute3D,
  DirectionalLightsAttribute,
  PointLightsAttribute,
  SpotLightsAttribute
} from '../../../attributes';
import { Camera } from '../../../Camera';
import { DefaultRenderableSorter } from '../../../DefaultRenderableSorter';
import { DirectionalLight, Environment } from '../../../environment';
import { ModelBatch } from '../../../ModelBatch';
import { RenderableProvider } from '../../../RenderableProvider';
import { DepthShaderProvider } from '../../../utils/DepthShaderProvider';
import { RenderableSorter } from '../../../utils/RenderableSorter';
import { ShaderProvider } from '../../../utils/ShaderProvider';
import { PBRMatrixAttribute } from '../attributes/PBRMatrixAttribute';
import { DirectionalShadowLight } from '../lights/DirectionalShadowLight';
import { PointLightEx } from '../lights/PointLightEx';
import { SpotLightEx } from '../lights/SpotlightEx';
import { PBRShaderProvider } from '../shaders/PBRShaderProvider';
import { EnvironmentCache } from '../utils/EnvironmentCache';
import { EnvironmentUtil } from '../utils/EnvironmentUtil';
import { Scene } from './Scene';
import { Updatable } from './Updatable';

const MAX_BONE = 24;
export class SceneManager implements Disposable {
  private renderableProviders = new Array<RenderableProvider>();

  private batch: ModelBatch;
  private depthBatch: ModelBatch;
  //private skyBox: SceneSkybox;

  /** Shouldn't be null. */
  public environment = new Environment();
  protected computedEnvironement = new EnvironmentCache();

  public camera: Camera;

  private renderableSorter: RenderableSorter;

  private pointLights = new PointLightsAttribute();
  private spotLights = new SpotLightsAttribute();

  constructor(
    protected gl: WebGLRenderingContext,
    shaderProvider: ShaderProvider = PBRShaderProvider.createDefaultWithNumBones(gl, MAX_BONE),
    depthShaderProvider: DepthShaderProvider = PBRShaderProvider.createDefaultDepthtWithNumBones(gl, MAX_BONE),
    renderableSorter: RenderableSorter = new DefaultRenderableSorter()
  ) {
    this.renderableSorter = renderableSorter;
    this.batch = new ModelBatch(this.gl, null, shaderProvider, renderableSorter);
    this.depthBatch = new ModelBatch(this.gl, null, depthShaderProvider);

    const lum = 1;
    this.environment.set(new ColorAttribute3D(ColorAttribute3D.AmbientLight, new Color(lum, lum, lum, 1)));
  }

  public setEnvironmentRotation(azymuthAngleDegree: number) {
    const attribute = this.environment.get(PBRMatrixAttribute.EnvRotation) as PBRMatrixAttribute;
    if (attribute != null) {
      attribute.set(azymuthAngleDegree);
    } else {
      this.environment.set(PBRMatrixAttribute.createEnvRotation(azymuthAngleDegree));
    }
  }

  public removeEnvironmentRotation() {
    this.environment.remove(PBRMatrixAttribute.EnvRotation);
  }

  public getBatch(): ModelBatch {
    return this.batch;
  }

  public setBatch(batch: ModelBatch) {
    this.batch = batch;
  }

  public setShaderProvider(shaderProvider: ShaderProvider) {
    this.batch.dispose();
    this.batch = new ModelBatch(this.gl, null, shaderProvider, this.renderableSorter);
  }

  public setDepthShaderProvider(depthShaderProvider: DepthShaderProvider) {
    this.depthBatch.dispose();
    this.depthBatch = new ModelBatch(this.gl, null, depthShaderProvider);
  }

  public addScene(scene: Scene, appendLights = true) {
    this.renderableProviders.push(scene);
    if (appendLights) {
      for (const [key, value] of scene.lights) {
        this.environment.addLight(value);
      }
    }
  }

  /**
   * should be called in order to perform light culling, skybox update and animations.
   * @param delta
   */
  public update(delta: number) {
    if (!this.camera) {
      this.updateEnvironment();
      for (const r of this.renderableProviders) {
        if (r instanceof Updatable) {
          (r as Updatable).update(this.camera, delta);
        }
      }
      //if(this.skyBox != null) this.skyBox.update(this.camera, delta);
    }
  }

  /**
   * Automatically set skybox rotation matching this environement rotation.
   * Subclasses could override this method in order to change this behavior.
   */
  protected updateSkyboxRotation() {
    // if(this.skyBox != null){
    // 	const rotationAttribute = this.environment.get(PBRMatrixAttribute.EnvRotation) as PBRMatrixAttribute;
    // 	if(rotationAttribute != null){
    // 		this.skyBox.setRotation(rotationAttribute.matrix);
    // 	}
    // }
  }

  protected updateEnvironment() {
    this.updateSkyboxRotation();

    this.computedEnvironement.setCache(this.environment);
    this.pointLights.lights.length = 0;
    this.spotLights.lights.length = 0;
    if (this.environment != null) {
      for (const a of this.environment.getAttributes()) {
        if (a instanceof PointLightsAttribute) {
          for (const light of a.lights) {
            this.pointLights.lights.push(light);
          }
          this.computedEnvironement.replaceCache(this.pointLights);
        } else if (a instanceof SpotLightsAttribute) {
          for (const light of a.lights) {
            this.spotLights.lights.push(light);
          }
          this.computedEnvironement.replaceCache(this.spotLights);
        } else {
          this.computedEnvironement.set(a);
        }
      }
    }
    this.cullLights();
  }
  protected cullLights() {
    const pla = this.environment.get(PointLightsAttribute.Type) as PointLightsAttribute;
    if (pla != null) {
      for (const light of pla.lights) {
        if (light instanceof PointLightEx) {
          const l = light as PointLightEx;
          if (l.range != null && !this.camera.frustum.sphereInFrustum(l.position, l.range)) {
            const index = this.pointLights.lights.indexOf(l);
            if (index >= 0) {
              this.pointLights.lights.splice(index, 1);
            }
          }
        }
      }
    }
    const sla = this.environment.get(SpotLightsAttribute.Type) as SpotLightsAttribute;
    if (sla != null) {
      for (const light of sla.lights) {
        if (light instanceof SpotLightEx) {
          const l = light as SpotLightEx;
          if (l.range != null && !this.camera.frustum.sphereInFrustum(l.position, l.range)) {
            const index = this.spotLights.lights.indexOf(l);
            if (index >= 0) {
              this.spotLights.lights.splice(index, 1);
            }
          }
        }
      }
    }
  }

  /**
   * render all scenes.
   * because shadows use frame buffers, if you need to render scenes to a frame buffer, you should instead
   * first call {@link #renderShadows()}, bind your frame buffer and then call {@link #renderColors()}
   */
  public render() {
    if (!this.camera) return;

    this.renderShadows();

    this.renderColors();
  }

  /**
   * Render shadows only to interal frame buffers.
   * (useful when you're using your own frame buffer to render scenes)
   */
  public renderShadows() {
    const light = this.getFirstDirectionalLight();
    if (light instanceof DirectionalShadowLight) {
      light.begin();
      this.renderDepth(light.getCamera());
      light.end();

      this.environment.shadowMap = light;
    } else {
      this.environment.shadowMap = null;
    }
  }

  private renderDepth(camera: Camera = this.camera) {
    this.depthBatch.begin(camera);
    this.depthBatch.renderWithRenderableProviders(this.renderableProviders);
    this.depthBatch.end();
  }

  /**
   * Render colors only. You should call {@link #renderShadows()} before.
   * (useful when you're using your own frame buffer to render scenes)
   */
  public renderColors() {
    this.computedEnvironement.shadowMap = this.environment.shadowMap;
    this.batch.begin(this.camera);
    this.batch.renderWithRenderableProviders(this.renderableProviders, this.computedEnvironement);
    //if(skyBox != null) batch.render(skyBox);
    this.batch.end();
  }

  public getFirstDirectionalLight(): DirectionalLight {
    const dla = this.environment.get(DirectionalLightsAttribute.Type) as DirectionalLightsAttribute;
    if (dla != null) {
      for (const dl of dla.lights) {
        if (dl instanceof DirectionalLight) {
          return dl;
        }
      }
    }
    return null;
  }

  // public setSkyBox(skyBox: SceneSkybox) {
  // 	this.skyBox = skyBox;
  // }

  // public getSkyBox(): SceneSkybox {
  // 	return this.skyBox;
  // }

  public setAmbientLight(lum: number) {
    (this.environment.get(ColorAttribute3D.AmbientLight) as ColorAttribute3D).color.set(lum, lum, lum, 1);
  }

  public setCamera(camera: Camera) {
    this.camera = camera;
  }

  public removeScene(scene: Scene) {
    const index = this.renderableProviders.indexOf(scene);
    if (index >= 0) {
      this.renderableProviders.splice(index, 1);
    }
    for (const [key, value] of scene.lights) {
      this.environment.removeLight(value);
    }
  }

  public getRenderableProviders(): RenderableProvider[] {
    return this.renderableProviders;
  }

  public updateViewport(width: number, height: number) {
    if (this.camera != null) {
      this.camera.viewportWidth = width;
      this.camera.viewportHeight = height;
      this.camera.update(true);
    }
  }

  public getActiveLightsCount(): number {
    return EnvironmentUtil.getLightCount(this.computedEnvironement);
  }
  public getTotalLightsCount(): number {
    return EnvironmentUtil.getLightCount(this.environment);
  }

  public dispose() {
    this.batch.dispose();
    this.depthBatch.dispose();
  }
}
