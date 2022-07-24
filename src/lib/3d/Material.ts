import { Attributes } from './attributes/Attributes';

export class Material extends Attributes {
  private static counter: number = 0;
  id: string;

  constructor() {
    super();
    this.id = 'mtl' + ++Material.counter;
  }

  public equals(other: Material): boolean {
    return other && (other === this || (other.id === this.id && super.equals(other)));
  }

  public copy(): Material {
    const m = new Material();
    m.id = this.id;
    for (const attr of this.attributes) {
      m.set(attr.copy());
    }
    return m;
  }
}
