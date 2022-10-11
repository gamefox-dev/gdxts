import { GLTFEntity } from '../GLTFEntity';

export class GLTFNode extends GLTFEntity {
  public children: number[];
  public matrix: number[];
  public translation: number[];
  public rotation: number[];
  public scale: number[];

  public mesh: number;
  public camera: number;
  public skin: number;

  public weights: number[];
}
