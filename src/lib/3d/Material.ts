import { Utils } from "../Utils";
import { Attributes } from "./Attributes";

export class Material extends Attributes {
  private static counter: number = 0;
  id: string;

  constructor() {
    super();
    this.id = "mtl" + ++Material.counter;
  }
}
