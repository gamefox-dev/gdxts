import { TextureRegion } from './TextureRegion';

export enum PlayMode {
  NORMAL = 0,
  LOOP = 1,
  LOOP_PINGPONG = 2,
  REVERSED = 3,
  LOOP_REVERSED = 4
}

export class Animation {
  private keyFrames: TextureRegion[];
  private frameDurations: number[];
  private totalDuration: number = 0;

  constructor(keyFrames: TextureRegion[], frameDurations: number | number[]) {
    this.keyFrames = keyFrames;
    if (!Array.isArray(frameDurations)) {
      frameDurations = [frameDurations];
    }
    const lastDuration = frameDurations[frameDurations.length - 1] || 0;
    while (frameDurations.length < keyFrames.length) {
      frameDurations.push(lastDuration);
    }
    for (let fD of frameDurations) {
      this.totalDuration += fD;
    }
    this.frameDurations = frameDurations;
  }

  getFrameNumber(stateTimeRemainder: number, reverse = false) {
    const { frameDurations } = this;
    let fN = reverse ? frameDurations.length - 1 : 0;
    while (true) {
      stateTimeRemainder -= frameDurations[fN];
      if (stateTimeRemainder < 0) {
        break;
      }
      reverse ? fN-- : fN++;
    }
    return fN;
  }

  getKeyFrame(stateTime: number, mode: PlayMode): TextureRegion {
    const { keyFrames, frameDurations, totalDuration } = this;

    const runIndex = Math.floor(stateTime / totalDuration);
    const stateTimeRemainder = stateTime % totalDuration;

    let frameNumber = 0;
    switch (mode) {
      case PlayMode.NORMAL:
        frameNumber = runIndex === 0 ? this.getFrameNumber(stateTimeRemainder) : frameDurations.length - 1;
        break;
      case PlayMode.LOOP:
        frameNumber = this.getFrameNumber(stateTimeRemainder);
        break;
      case PlayMode.LOOP_PINGPONG:
        frameNumber = this.getFrameNumber(stateTimeRemainder, runIndex % 2 === 1);
        break;
      case PlayMode.REVERSED:
        frameNumber = runIndex === 0 ? this.getFrameNumber(stateTimeRemainder, true) : 0;
        break;
      case PlayMode.LOOP_REVERSED:
        frameNumber = this.getFrameNumber(stateTimeRemainder, true);
        break;
      default:
    }
    return keyFrames[frameNumber];
  }
}

export const createAnimation = (frameDuration: number, keyFrames: TextureRegion[]): Animation => {
  return new Animation(keyFrames, frameDuration);
};
