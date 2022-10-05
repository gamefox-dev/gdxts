import { Attributes } from '../attributes/Attributes';
import { DirectionalLightsAttribute } from '../attributes/DirectionalLightsAttribute';
import { PointLightsAttribute } from '../attributes/PointLightAttribute';
import { SpotLightsAttribute } from '../attributes/SpotLightAttribute';
import { BaseLight } from './BaseLight';
import { DirectionalLight } from './DirectionalLight';
import { PointLight } from './PointLight';
import { SpotLight } from './SpotLight';

export class Environment extends Attributes {
  public addLights(lights: BaseLight[]): Environment {
    for (const light of lights) this.addLight(light);
    return this;
  }

  public addLight(light: BaseLight): Environment {
    if (light instanceof DirectionalLight) this.addDirectionalLight(light as DirectionalLight);
    else if (light instanceof PointLight) {
      this.addPointLight(light as PointLight);
    } else if (light instanceof SpotLight) this.addSpotLight(light as SpotLight);
    else throw new Error('Unknown light type');
    return this;
  }

  public addDirectionalLight(light: DirectionalLight): Environment {
    let dirLights = this.get(DirectionalLightsAttribute.Type) as DirectionalLightsAttribute;
    if (!dirLights) this.set((dirLights = new DirectionalLightsAttribute()));
    dirLights.lights.push(light);
    return this;
  }

  public addPointLight(light: PointLight): Environment {
    let pointLights = this.get(PointLightsAttribute.Type) as PointLightsAttribute;
    if (!pointLights) this.set((pointLights = new PointLightsAttribute()));
    pointLights.lights.push(light);
    return this;
  }

  public addSpotLight(light: SpotLight): Environment {
    let spotLights = this.get(SpotLightsAttribute.Type) as SpotLightsAttribute;
    if (!spotLights) this.set((spotLights = new SpotLightsAttribute()));
    spotLights.lights.push(light);
    return this;
  }

  public removeLights(lights: BaseLight[]): Environment {
    for (const light of lights) this.removeLight(light);
    return this;
  }

  public removeLight(light: BaseLight): Environment {
    if (light instanceof DirectionalLight) this.removeDirectionalLight(light as DirectionalLight);
    else if (light instanceof PointLight) this.removePointLight(light as PointLight);
    else if (light instanceof SpotLight) this.removeSpotLight(light as SpotLight);
    else throw new Error('Unknown light type');
    return this;
  }

  public removeDirectionalLight(light: DirectionalLight): Environment {
    if (this.has(DirectionalLightsAttribute.Type)) {
      const dirLights = this.get(DirectionalLightsAttribute.Type) as DirectionalLightsAttribute;
      const index = dirLights.lights.indexOf(light, 0);
      if (index > -1) {
        dirLights.lights.splice(index, 1);
      }
      if (dirLights.lights.length === 0) this.remove(DirectionalLightsAttribute.Type);
    }
    return this;
  }

  public removePointLight(light: PointLight): Environment {
    if (this.has(PointLightsAttribute.Type)) {
      const pointLights = this.get(PointLightsAttribute.Type) as PointLightsAttribute;
      const index = pointLights.lights.indexOf(light, 0);
      if (index > -1) {
        pointLights.lights.splice(index, 1);
      }
      if (pointLights.lights.length === 0) this.remove(PointLightsAttribute.Type);
    }
    return this;
  }

  public removeSpotLight(light: SpotLight): Environment {
    if (this.has(SpotLightsAttribute.Type)) {
      const spotLights = this.get(SpotLightsAttribute.Type) as SpotLightsAttribute;
      const index = spotLights.lights.indexOf(light, 0);
      if (index > -1) {
        spotLights.lights.splice(index, 1);
      }
      if (spotLights.lights.length === 0) this.remove(SpotLightsAttribute.Type);
    }
    return this;
  }
}
