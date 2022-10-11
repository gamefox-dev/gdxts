import { Attribute } from '../../../attributes';
import { Environment } from '../../../environment';

export class EnvironmentCache extends Environment {
  /**
   * fast way to copy only references
   * @param env
   */
  public setCache(env: Environment) {
    this.mask = env.getMask();
    this.attributes.length = 0;
    for (const a of env.getAttributes()) this.attributes.push(a);
    this.shadowMap = env.shadowMap;
    this.sorted = true;
  }

  /**
   * fast way to replace an attribute without sorting
   * @param attribute
   */
  public replaceCache(attribute: Attribute) {
    const idx = this.indexOf(attribute.type);
    this.attributes[idx] = attribute;
  }
}
