import { PlayMode } from '../Animation';

export type VfxLayerPass = 'behind' | 'front';

export type VfxEasing = 'linear' | 'easeOutCubic' | 'easeInOutSine';

export type VfxPointRef = 'position' | 'source' | 'target' | 'motion';

export interface VfxPoint {
  x: number;
  y: number;
}

export interface VfxMotionSpec {
  from?: VfxPoint | VfxPointRef;
  to?: VfxPoint | VfxPointRef;
  duration?: number;
  easing?: VfxEasing;
}

interface VfxBaseLayer {
  pass?: VfxLayerPass;
  startTime?: number;
  duration?: number;
  loop?: boolean;
  point?: VfxPoint | VfxPointRef;
  offsetX?: number;
  offsetY?: number;
  width?: number;
  height?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  scaleFrom?: number;
  scaleTo?: number;
  alpha?: number;
  alphaFrom?: number;
  alphaTo?: number;
}

export interface VfxSpriteLayer extends VfxBaseLayer {
  kind: 'sprite';
  atlasKey: string;
  regionName: string;
  frameDuration?: number;
  mode?: PlayMode;
}

export interface VfxParticleLayer extends VfxBaseLayer {
  kind: 'particle';
  templateKey: string;
  followMotion?: boolean;
  motionScale?: number;
}

export interface VfxShaderLayer extends VfxBaseLayer {
  kind: 'shader';
  shaderKey: string;
  data?: Record<string, unknown>;
}

export type VfxLayer = VfxSpriteLayer | VfxParticleLayer | VfxShaderLayer;

export interface VfxDefinition {
  id: string;
  duration: number;
  loop?: boolean;
  motion?: VfxMotionSpec;
  layers: VfxLayer[];
}

export interface VfxSpawnOptions {
  position?: VfxPoint;
  source?: VfxPoint;
  target?: VfxPoint;
  duration?: number;
  loop?: boolean;
  motion?: VfxMotionSpec;
  timeScale?: number;
}

export interface VfxParticleTemplateConfig {
  effectFile: string;
  flipY?: boolean;
  poolMin?: number;
  poolMax?: number;
}

export interface VfxShaderDrawContext {
  instanceHandle: number;
  layer: VfxShaderLayer;
  localTime: number;
  normalizedTime: number;
  position: VfxPoint;
  source: VfxPoint;
  target: VfxPoint;
  motion: VfxPoint;
  width: number;
  height: number;
  rotation: number;
  alpha: number;
  scaleX: number;
  scaleY: number;
}

export interface VfxShaderRenderer {
  draw(ctx: VfxShaderDrawContext): void;
  dispose?(): void;
}
