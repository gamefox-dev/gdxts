import { TextureRegion } from "./TextureRegion";

export enum PlayMode {
  NORMAL = 0,
  LOOP = 1,
  LOOP_PINGPONG = 2,
  REVERSED = 3,
  LOOP_REVERSED = 4,
}

export class Animation {
  private keyFrames: TextureRegion[];
  private frameDuration: number;
  constructor(keyFrames: TextureRegion[], frameDuration: number) {
    this.keyFrames = keyFrames;
    this.frameDuration = frameDuration;
  }

  getKeyFrame(stateTime: number, mode: PlayMode): TextureRegion {
    const { keyFrames, frameDuration } = this;
    let frameNumber = Math.floor(stateTime / frameDuration);
    switch (mode) {
      case PlayMode.NORMAL:
        frameNumber = Math.min(keyFrames.length - 1, frameNumber);
        break;
      case PlayMode.LOOP:
        frameNumber = frameNumber % keyFrames.length;
        break;
      case PlayMode.LOOP_PINGPONG:
        frameNumber = frameNumber % (keyFrames.length * 2 - 2);
        if (frameNumber >= keyFrames.length) {
          frameNumber = keyFrames.length - 2 - (frameNumber - keyFrames.length);
        }
        break;
      case PlayMode.REVERSED:
        frameNumber = Math.max(keyFrames.length - frameNumber - 1, 0);
        break;
      case PlayMode.LOOP_REVERSED:
        frameNumber = frameNumber % keyFrames.length;
        frameNumber = keyFrames.length - frameNumber - 1;
        break;
      default:
    }
    return keyFrames[frameNumber];
  }
}
