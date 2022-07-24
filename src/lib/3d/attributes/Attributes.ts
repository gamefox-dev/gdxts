import { Attribute } from './Attribute';

export class Attributes {
  protected mask: number;
  protected attributes: Attribute[] = [];
  protected sorted = true;

  //  public final void sort () {
  // 	if (!sorted) {
  // 		attributes.sort(this);
  // 		sorted = true;
  // 	}
  //  }

  public getMask(): number {
    return this.mask;
  }

  public get(type: number): Attribute {
    for (const att of this.attributes) {
      if (att.type === type) return att;
    }
    return null;
  }

  public getArrayAttribute(out: Attribute[], type: number): Attribute[] {
    for (const att of this.attributes) {
      if (att.type === type) out.push(att);
    }
    return out;
  }

  public clear() {
    this.mask = 0;
    this.attributes = [];
  }

  public size() {
    return this.attributes.length;
  }

  private enable(mask: number) {
    this.mask |= mask;
  }

  private disable(mask: number) {
    this.mask &= ~mask;
  }

  public set(attribute: Attribute) {
    const idx = this.indexOf(attribute.type);
    if (idx < 0) {
      this.enable(attribute.type);
      this.attributes.push(attribute);
      this.sorted = false;
    } else {
      this.attributes[idx] = attribute;
    }
    //sort(); // FIXME: See #4186
  }

  public getAttributes(): Attribute[] {
    return this.attributes;
  }

  public setAttributes(attributes: Attribute[]) {
    for (const att of attributes) {
      this.set(att);
    }
  }

  public has(type: number) {
    return type !== 0 && (this.mask & type) === type;
  }

  public indexOf(type: number): number {
    if (this.has(type)) for (let i = 0; i < this.attributes.length; i++) if (this.attributes[i].type === type) return i;
    return -1;
  }

  public set2Attributes(attribute1: Attribute, attribute2: Attribute) {
    this.set(attribute1);
    this.set(attribute2);
  }

  public set3Attributes(attribute1: Attribute, attribute2: Attribute, attribute3: Attribute) {
    this.set(attribute1);
    this.set(attribute2);
    this.set(attribute3);
  }

  public set4Attributes(attribute1: Attribute, attribute2: Attribute, attribute3: Attribute, attribute4: Attribute) {
    this.set(attribute1);
    this.set(attribute2);
    this.set(attribute3);
    this.set(attribute4);
  }

  public setArrayAttribute(attributes: Attribute[]) {
    for (const attr of attributes) this.set(attr);
  }

  public setAttribute(attribute: Attribute) {
    this.set(attribute);
  }

  public remove(mask: number) {
    for (let i = this.attributes.length - 1; i >= 0; i--) {
      const type = this.attributes[i].type;
      if ((mask & type) === type) {
        this.attributes.splice(i, 1);
        this.disable(type);
        this.sorted = false;
      }
    }
    //sort(); // FIXME: See #4186
  }

  public compare(arg0: Attribute, arg1: Attribute): number {
    return arg0.type - arg1.type;
  }

  public same(other: Attributes, compareValues: boolean): boolean {
    if (other === this) return true;
    if (other === null || this.mask !== other.mask) return false;
    if (!compareValues) return true;
    // sort();
    // other.sort();
    for (let i = 0; i < this.attributes.length; i++) if (!this.attributes[i].equals(other.attributes[i])) return false;
    return true;
  }

  public equals(other: Attributes): boolean {
    if (!other) return false;
    if (other === this) return true;
    return this.same(other, true);
  }
}
