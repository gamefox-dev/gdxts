export class Align {
  public static center: number = 1 << 0;
  public static top: number = 1 << 1;
  public static bottom: number = 1 << 2;
  public static left: number = 1 << 3;
  public static right: number = 1 << 4;

  public static topLeft: number = this.top | this.left;
  public static topRight: number = this.top | this.right;
  public static bottomLeft: number = this.bottom | this.left;
  public static bottomRight: number = this.bottom | this.right;

  public static isLeft(align: number): boolean {
    return (align & this.left) !== 0;
  }

  public static isRight(align: number): boolean {
    return (align & this.right) !== 0;
  }

  public static isTop(align: number): boolean {
    return (align & this.top) !== 0;
  }

  public static isBottom(align: number): boolean {
    return (align & this.bottom) !== 0;
  }

  public static isCenterVertical(align: number): boolean {
    return (align & this.top) === 0 && (align & this.bottom) === 0;
  }

  public static isCenterHorizontal(align: number): boolean {
    return (align & this.left) === 0 && (align & this.right) === 0;
  }
}

export interface StringMap<T> {
  [key: string]: T;
}

export class IntSet {
  array = new Array<number>();

  add(value: number): boolean {
    let contains = this.contains(value);
    this.array[value | 0] = value | 0;
    return !contains;
  }

  contains(value: number) {
    return this.array[value | 0] !== undefined;
  }

  remove(value: number) {
    this.array[value | 0] = undefined;
  }

  clear() {
    this.array.length = 0;
  }
}

export class StringSet {
  entries: StringMap<boolean> = {};
  size = 0;

  add(value: string): boolean {
    let contains = this.entries[value];
    this.entries[value] = true;
    if (!contains) {
      this.size++;
      return true;
    }
    return false;
  }

  addAll(values: string[]): boolean {
    let oldSize = this.size;
    for (var i = 0, n = values.length; i < n; i++) this.add(values[i]);
    return oldSize !== this.size;
  }

  contains(value: string) {
    return this.entries[value];
  }

  clear() {
    this.entries = {};
    this.size = 0;
  }
}

export interface NumberArrayLike {
  readonly length: number;
  [n: number]: number;
}

export interface Disposable {
  dispose(): void;
}

export interface Restorable {
  restore(): void;
}

export class Color {
  public static WHITE = new Color(1, 1, 1, 1);
  public static RED = new Color(1, 0, 0, 1);
  public static GREEN = new Color(0, 1, 0, 1);
  public static BLUE = new Color(0, 0, 1, 1);
  public static MAGENTA = new Color(1, 0, 1, 1);

  constructor(public r: number = 0, public g: number = 0, public b: number = 0, public a: number = 0) {}

  set(r: number, g: number, b: number, a: number) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
    return this.clamp();
  }

  setFromColor(c: Color) {
    this.r = c.r;
    this.g = c.g;
    this.b = c.b;
    this.a = c.a;
    return this;
  }

  setFromString(hex: string) {
    hex = hex.charAt(0) === '#' ? hex.substring(1) : hex;
    this.r = parseInt(hex.substring(0, 2), 16) / 255;
    this.g = parseInt(hex.substring(2, 4), 16) / 255;
    this.b = parseInt(hex.substring(4, 6), 16) / 255;
    this.a = hex.length !== 8 ? 1 : parseInt(hex.substring(6, 8), 16) / 255;
    return this;
  }

  add(r: number, g: number, b: number, a: number) {
    this.r += r;
    this.g += g;
    this.b += b;
    this.a += a;
    return this.clamp();
  }

  clamp() {
    if (this.r < 0) this.r = 0;
    else if (this.r > 1) this.r = 1;

    if (this.g < 0) this.g = 0;
    else if (this.g > 1) this.g = 1;

    if (this.b < 0) this.b = 0;
    else if (this.b > 1) this.b = 1;

    if (this.a < 0) this.a = 0;
    else if (this.a > 1) this.a = 1;
    return this;
  }

  toIntBits() {
    return ((255 * this.a) << 24) | ((255 * this.b) << 16) | ((255 * this.g) << 8) | (255 * this.r);
  }

  static rgba8888ToColor(color: Color, value: number) {
    color.r = ((value & 0xff000000) >>> 24) / 255;
    color.g = ((value & 0x00ff0000) >>> 16) / 255;
    color.b = ((value & 0x0000ff00) >>> 8) / 255;
    color.a = (value & 0x000000ff) / 255;
  }

  static rgb888ToColor(color: Color, value: number) {
    color.r = ((value & 0x00ff0000) >>> 16) / 255;
    color.g = ((value & 0x0000ff00) >>> 8) / 255;
    color.b = (value & 0x000000ff) / 255;
  }

  static fromString(hex: string): Color {
    return new Color().setFromString(hex);
  }
}

export class MathUtils {
  static PI = 3.1415927;
  static PI2 = MathUtils.PI * 2;
  static radiansToDegrees = 180 / MathUtils.PI;
  static radDeg = MathUtils.radiansToDegrees;
  static degreesToRadians = MathUtils.PI / 180;
  static degRad = MathUtils.degreesToRadians;

  static clamp(value: number, min: number, max: number) {
    if (value < min) return min;
    if (value > max) return max;
    return value;
  }

  static cosDeg(degrees: number) {
    return Math.cos(degrees * MathUtils.degRad);
  }

  static sinDeg(degrees: number) {
    return Math.sin(degrees * MathUtils.degRad);
  }

  static signum(value: number): number {
    return value > 0 ? 1 : value < 0 ? -1 : 0;
  }

  static toInt(x: number) {
    return x > 0 ? Math.floor(x) : Math.ceil(x);
  }

  static cbrt(x: number) {
    let y = Math.pow(Math.abs(x), 1 / 3);
    return x < 0 ? -y : y;
  }

  static randomTriangular(min: number, max: number): number {
    return MathUtils.randomTriangularWith(min, max, (min + max) * 0.5);
  }

  static randomTriangularWith(min: number, max: number, mode: number): number {
    let u = Math.random();
    let d = max - min;
    if (u <= (mode - min) / d) return min + Math.sqrt(u * d * (mode - min));
    return max - Math.sqrt((1 - u) * d * (max - mode));
  }

  static isPowerOfTwo(value: number) {
    return value && (value & (value - 1)) === 0;
  }
}

export abstract class Interpolation {
  protected abstract applyInternal(a: number): number;
  apply(start: number, end: number, a: number): number {
    return start + (end - start) * this.applyInternal(a);
  }
}

export class Pow extends Interpolation {
  protected power = 2;

  constructor(power: number) {
    super();
    this.power = power;
  }

  applyInternal(a: number): number {
    if (a <= 0.5) return Math.pow(a * 2, this.power) / 2;
    return Math.pow((a - 1) * 2, this.power) / (this.power % 2 === 0 ? -2 : 2) + 1;
  }
}

export class PowOut extends Pow {
  // constructor(power: number) {
  //   super(power);
  // }

  applyInternal(a: number): number {
    return Math.pow(a - 1, this.power) * (this.power % 2 === 0 ? -1 : 1) + 1;
  }
}

export class Utils {
  static SUPPORTS_TYPED_ARRAYS = typeof Float32Array !== 'undefined';

  static arrayCopy<T>(
    source: ArrayLike<T>,
    sourceStart: number,
    dest: ArrayLike<T>,
    destStart: number,
    numElements: number
  ) {
    for (let i = sourceStart, j = destStart; i < sourceStart + numElements; i++, j++) {
      dest[j] = source[i];
    }
  }

  static arrayFill<T>(array: ArrayLike<T>, fromIndex: number, toIndex: number, value: T) {
    for (let i = fromIndex; i < toIndex; i++) array[i] = value;
  }

  static setArraySize<T>(array: Array<T>, size: number, value: any = 0): Array<T> {
    let oldSize = array.length;
    if (oldSize === size) return array;
    array.length = size;
    if (oldSize < size) {
      for (let i = oldSize; i < size; i++) array[i] = value;
    }
    return array;
  }

  static ensureArrayCapacity<T>(array: Array<T>, size: number, value: any = 0): Array<T> {
    if (array.length >= size) return array;
    return Utils.setArraySize(array, size, value);
  }

  static newArray<T>(size: number, defaultValue: T): Array<T> {
    let array = new Array<T>(size);
    for (let i = 0; i < size; i++) array[i] = defaultValue;
    return array;
  }

  static newFloatArray(size: number): NumberArrayLike {
    if (Utils.SUPPORTS_TYPED_ARRAYS) return new Float32Array(size);
    else {
      let array = new Array<number>(size);
      for (let i = 0; i < array.length; i++) array[i] = 0;
      return array;
    }
  }

  static newShortArray(size: number): NumberArrayLike {
    if (Utils.SUPPORTS_TYPED_ARRAYS) return new Int16Array(size);
    else {
      let array = new Array<number>(size);
      for (let i = 0; i < array.length; i++) array[i] = 0;
      return array;
    }
  }

  static toFloatArray(array: Array<number>) {
    return Utils.SUPPORTS_TYPED_ARRAYS ? new Float32Array(array) : array;
  }

  static toSinglePrecision(value: number) {
    return Utils.SUPPORTS_TYPED_ARRAYS ? Math.fround(value) : value;
  }

  static contains<T>(array: Array<T>, element: T, identity = true) {
    for (var i = 0; i < array.length; i++) if (array[i] === element) return true;
    return false;
  }

  static enumValue(type: any, name: string) {
    return type[name[0].toUpperCase() + name.slice(1)];
  }
}

export interface Poolable {
  reset(): void;
}

export class Pool<T> {
  private items = new Array<T>();
  private instantiator: () => T;

  constructor(instantiator?: () => T) {
    if (instantiator) {
      this.instantiator = instantiator;
    } else {
      this.instantiator = () => ({} as T);
    }
  }

  obtain() {
    const item = this.items.length > 0 ? this.items.pop() : this.instantiator();
    return item;
  }

  free(item: T) {
    if ((item as any)?.reset) {
      (item as any).reset();
    }
    this.items.push(item);
  }

  freeAll(items: ArrayLike<T>) {
    for (let i = 0; i < items.length; i++) this.free(items[i]);
  }

  clear() {
    this.items.length = 0;
  }
}

export class Pools {
  static pools: Record<string, Pool<any>> = {};

  static free<T>(name: string, object: T) {
    if (this.pools[name]) {
      this.pools[name].free(object);
    }
  }

  static freeAll<T>(name: string, objects: Array<T>) {
    if (this.pools[name]) {
      this.pools[name].freeAll(objects);
    }
  }

  static get<T>(name: string, instantiator: () => T): Pool<T> {
    if (this.pools[name]) {
      return this.pools[name];
    }

    this.pools[name] = new Pool<T>(instantiator);

    return this.pools[name];
  }

  static set<T>(name: string, pool: Pool<T>) {
    this.pools[name] = pool;
  }

  static obtain<T>(name: string, instantiator?: () => T) {
    return this.get(name, instantiator).obtain();
  }
}

export class TimeKeeper {
  maxDelta = 0.064;
  framesPerSecond = 0;
  delta = 0;
  totalTime = 0;

  private lastTime = Date.now() / 1000;
  private frameCount = 0;
  private frameTime = 0;

  update() {
    let now = Date.now() / 1000;
    this.delta = now - this.lastTime;
    this.frameTime += this.delta;
    this.totalTime += this.delta;
    if (this.delta > this.maxDelta) this.delta = this.maxDelta;
    this.lastTime = now;

    this.frameCount++;
    if (this.frameTime > 1) {
      this.framesPerSecond = this.frameCount / this.frameTime;
      this.frameTime = 0;
      this.frameCount = 0;
    }
  }
}

export interface ArrayLike<T> {
  length: number;
  [n: number]: T;
}

export class WindowedMean {
  values: Array<number>;
  addedValues = 0;
  lastValue = 0;
  mean = 0;
  dirty = true;

  constructor(windowSize: number = 32) {
    this.values = new Array<number>(windowSize);
  }

  hasEnoughData() {
    return this.addedValues >= this.values.length;
  }

  addValue(value: number) {
    if (this.addedValues < this.values.length) this.addedValues++;
    this.values[this.lastValue++] = value;
    if (this.lastValue > this.values.length - 1) this.lastValue = 0;
    this.dirty = true;
  }

  getMean() {
    if (this.hasEnoughData()) {
      if (this.dirty) {
        let mean = 0;
        for (let i = 0; i < this.values.length; i++) mean += this.values[i];
        this.mean = mean / this.values.length;
        this.dirty = false;
      }
      return this.mean;
    }
    return 0;
  }
}

export interface GameLoop {
  isRunning(): boolean;
  start(): void;
  stop(): void;
  getFps(): number;
}

export const createGameLoop = (update: (delta: number) => void): GameLoop => {
  let lastUpdate = Date.now();
  let fps = 0;
  let running = true;
  let requestId;

  let frameInLastSecond = 0;
  let elapsed = 0;

  function loop() {
    if (running) {
      const delta = Date.now() - lastUpdate;
      lastUpdate = Date.now();

      frameInLastSecond++;
      elapsed += delta;

      if (elapsed >= 1000) {
        fps = frameInLastSecond;
        frameInLastSecond = 0;
        elapsed -= 1000;
      }

      requestId = requestAnimationFrame(loop);
      update(delta / 1000);
    }
  }

  loop();

  return {
    isRunning: () => running,
    start: () => {
      if (!running) {
        running = true;
        loop();
      }
    },
    stop: () => {
      if (requestId) {
        cancelAnimationFrame(requestId);
      }
      running = false;
    },
    getFps: () => fps
  };
};

export const resizeCanvas = (canvas: HTMLCanvasElement, deviceRatio: number): [number, number] => {
  const devicePixelRatio = deviceRatio || window.devicePixelRatio || 1;

  const displayWidth = canvas.clientWidth * devicePixelRatio;
  const displayHeight = canvas.clientHeight * devicePixelRatio;

  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }
  return [displayWidth, displayHeight];
};

export const pointInRect = (pX: number, pY: number, x: number, y: number, width: number, height: number): boolean => {
  return pX > x && pX < x + width && pY > y && pY < y + height;
};

export interface StageOptions {
  hidden?: boolean;
  info?: boolean;
  wrapperClassName?: string;
}

export interface Stage {
  getCanvas(): HTMLCanvasElement;
  getInfo(): HTMLDivElement;
  show(): void;
  hide(): void;
  cleanup(): void;
}

export const createStage = (options?: StageOptions) => {
  const defaultOptions = {
    hidden: false,
    info: true
  };
  options = { ...defaultOptions, ...options };
  const wrapper = document.createElement('div');
  wrapper.setAttribute('style', `position:fixed;top:0;left:0;right:0;bottom:0;`);
  if (options.wrapperClassName) {
    wrapper.className = options.wrapperClassName;
  }
  if (options.hidden) {
    wrapper.style.display = 'none';
  }
  const canvas = document.createElement('canvas');
  canvas.setAttribute('style', `width:100%;height:100%;`);
  const info = document.createElement('div');
  info.setAttribute('style', `position:absolute;top:1em;left:1em;color:white`);

  if (!options.info) {
    info.style.display = 'none';
  }

  wrapper.appendChild(canvas);
  wrapper.appendChild(info);
  document.body.appendChild(wrapper);

  return {
    getCanvas: () => canvas,
    getInfo: () => info,
    show: () => (wrapper.style.display = 'block'),
    hide: () => (wrapper.style.display = 'none'),
    cleanup: () => document.body.removeChild(wrapper)
  };
};
