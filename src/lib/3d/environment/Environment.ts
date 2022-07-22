import { Attributes } from '../attributes/Attributes';
import { DirectionalLightsAttribute } from '../attributes/DirectionalLightsAttribute';
import { BaseLight } from './BaseLight';
import { DirectionalLight } from './DirectionalLight';

export class Environment extends Attributes {
  public addLights(lights: BaseLight[]): Environment {
    for (const light of lights) this.addLight(light);
    return this;
  }

  public addLight(light: BaseLight): Environment {
    if (light instanceof DirectionalLight) this.addDirectionalLight(light as DirectionalLight);
    //  else if (light instanceof PointLight) {
    //      add((PointLight)light);
    //  } else if (light instanceof SpotLight)
    //      add((SpotLight)light);
    else throw new Error('Unknown light type');
    return this;
  }

  public addDirectionalLight(light: DirectionalLight): Environment {
    let dirLights = this.get(DirectionalLightsAttribute.Type) as DirectionalLightsAttribute;
    if (dirLights == null) this.set((dirLights = new DirectionalLightsAttribute()));
    dirLights.lights.push(light);
    return this;
  }

  public removeLights(lights: BaseLight[]): Environment {
    for (const light of lights) this.removeLight(light);
    return this;
  }

  public removeLight(light: BaseLight): Environment {
    if (light instanceof DirectionalLight) this.removeDirectionalLight(light as DirectionalLight);
    //  else if (light instanceof PointLight)
    //      remove((PointLight)light);
    //  else if (light instanceof SpotLight)
    //      remove((SpotLight)light);
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
      if (dirLights.lights.length == 0) this.remove(DirectionalLightsAttribute.Type);
    }
    return this;
  }
}
