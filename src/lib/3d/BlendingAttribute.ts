import { Attribute } from "./Attribute";
import { GL20 } from "./GL20";

export class BlendingAttribute extends Attribute {
  public static Alias: string = "blended";
  public static Type: number = this.register(this.Alias);

  public static is(mask: number): boolean {
    return (mask & this.Type) == mask;
  }

  blended: boolean;
  sourceFunction: number;
  destFunction: number;
  opacity = 1;

  constructor(
    sourceFunc: number = GL20.GL_SRC_ALPHA,
    destFunc: number = GL20.GL_ONE_MINUS_SRC_ALPHA,
    blended: boolean = true,
    opacity: number = 1
  ) {
    super();
    this.Attribute(this.type);
    this.blended = blended;
    this.sourceFunction = sourceFunc;
    this.destFunction = destFunc;
    this.opacity = opacity;
  }

  set(
    blended: boolean = true,
    sourceFunc: number = GL20.GL_SRC_ALPHA,
    destFunc: number = GL20.GL_ONE_MINUS_SRC_ALPHA,
    opacity: number = 1
  ) {
    this.type = BlendingAttribute.Type;
    this.typeBit = this.numberOfTrailingZeros(this.type);
    this.blended = blended;
    this.sourceFunction = sourceFunc;
    this.destFunction = destFunc;
    this.opacity = opacity;
  }
}
