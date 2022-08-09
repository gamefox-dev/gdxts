const int8 = new Int8Array(4);
const int32 = new Int32Array(int8.buffer, 0, 1);
const float32 = new Float32Array(int8.buffer, 0, 1);

export class NumberUtil {
  static intBitsToFloat(i: number): number {
    int32[0] = i;
    return float32[0];
  }
  static floatToIntBits(f: number): number {
    float32[0] = f;
    return int32[0];
  }
  static intToFloatColor(value: number): number {
    return NumberUtil.intBitsToFloat(value & 0xfeffffff);
  }
  static colorToFloat(r: number, g: number, b: number, a: number): number {
    const bits = (r << 24) | (g << 16) | (b << 8) | a;
    return NumberUtil.intToFloatColor(bits);
  }
  static isPowerOfTwo(n: number): boolean {
    return (n & (n - 1)) === 0;
  }
  static nextPowerOfTwo(n: number): number {
    n--;
    n |= n >> 1;
    n |= n >> 2;
    n |= n >> 4;
    n |= n >> 8;
    n |= n >> 16;
    return n + 1;
  }
}
