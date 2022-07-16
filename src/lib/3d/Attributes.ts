import { Attribute } from "./Attribute";

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

  getMask(): number {
    return this.mask;
  }

  get(type: number): Attribute {
    for (const att of this.attributes) {
      if (att.type === type) return att;
    }
    return null;
  }

  getArrayAttribute(out: Attribute[], type: number): Attribute[] {
    for (const att of this.attributes) {
      if (att.type === type) out.push(att);
    }
    return out;
  }

  clear() {
    this.mask = 0;
    this.attributes = [];
  }

  size() {
    return this.attributes.length;
  }

  private enable(mask: number) {
    this.mask |= mask;
  }

  private disable(mask: number) {
    this.mask &= ~mask;
  }

  set(attribute: Attribute) {
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

  getAttributes(): Attribute[] {
    return this.attributes;
  }

  setAttributes(attributes: Attribute[]) {
    for (const att of attributes) {
      this.set(att);
    }
  }

  has(type: number) {
    return type !== 0 && (this.mask & type) === type;
  }

  indexOf(type: number): number {
    if (this.has(type))
      for (let i = 0; i < this.attributes.length; i++)
        if (this.attributes[i].type === type) return i;
    return -1;
  }

  set2Attributes(attribute1: Attribute, attribute2: Attribute) {
    this.set(attribute1);
    this.set(attribute2);
  }

  set3Attributes(
    attribute1: Attribute,
    attribute2: Attribute,
    attribute3: Attribute
  ) {
    this.set(attribute1);
    this.set(attribute2);
    this.set(attribute3);
  }

  set4Attributes(
    attribute1: Attribute,
    attribute2: Attribute,
    attribute3: Attribute,
    attribute4: Attribute
  ) {
    this.set(attribute1);
    this.set(attribute2);
    this.set(attribute3);
    this.set(attribute4);
  }

  setArrayAttribute(attributes: Attribute[]) {
    for (const attr of attributes) this.set(attr);
  }

  remove(mask: number) {
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

  compare(arg0: Attribute, arg1: Attribute): number {
    return arg0.type - arg1.type;
  }
}
