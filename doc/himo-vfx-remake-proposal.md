# Himo VFX Remake Proposal

## 1) Goal

Rebuild Himo's gameplay VFX as a reusable, data-driven system based on:

- `gdxts` sprite-atlas animation
- `gdxts` libGDX-style particle effects (`ParticleEffect`, `.p` files, pools)
- custom shaders (for beams, warps, additive overlays, distortion)

Hard requirement from this plan:

- remove `proton-engine` entirely from Himo
- replace all Proton emitters/renderers with `gdxts` particles and/or shaders
- build the first VFX manager in `gdxts` first, then move it to `gdxts-vfx` when stable
- include a showcase/example screen that covers core match-3 combat categories (trail, impact, melee jump, area, ground, buff, sky-strike)

---

## 2) Current State Audit (from `himo-rebirth`)

### Gameplay VFX scale

- `SkillInfo` entries: **72**
- Unique non-empty skill `effectKeys`: **81**
- `EffectId` enum entries: **86**
- `EffectFxkey` mapped entries: **86** total, **77 filled**, **9 empty placeholders**

### Runtime structure today

- Main gameplay VFX orchestration is in:
  - `src/client/game-board/systems/listeners/EffectSpawnSystem.ts` (**~2347 lines**)
- Sprite animation path:
  - `AnimatedEffectRenderSystem.ts`
  - `AttackRenderSystem.ts`
  - `AttackSkillEffectRenderSystem.ts`
  - `animationFxUtil.ts` (`effects_atlas` + fallback `new_misc_atlas`)
- Buff/status lifecycle:
  - `CellBuffProcessSystem.ts`
  - `PlayerBuffProcessSystem.ts`
  - `EnvBuffProcessSystem.ts`
  - `SequenceAnimatedEffectProcessSystem.ts`
- Current particles (to replace):
  - `src/client/util-gameboard/particles/*` (Proton wrappers)
  - `ParticleProcessSystem.ts` and `ParticleRenderSystem.ts`
  - `game-board.ts` creates a global `new Proton()`
- Assets:
  - effect atlases are runtime-packed in `init-game.ts` from `effects.atlas`, `effects_2.atlas`, `effects_3_2.atlas`

### Key problems

- VFX behavior is spread across many systems with ad hoc effect construction.
- Proton particles are a separate subsystem and not reusable with your newer `gdxts` particle authoring/runtime.
- `EffectSpawnSystem` is a large switch-based monolith with high maintenance cost.
- Reuse across future games is limited because composition is code-heavy instead of data-driven.

---

## 3) Target Architecture

### Core direction

Move to a **unified FX runtime** with three render primitives:

1. `atlas_anim` (frame animation from atlas regions)
2. `particle_effect` (`.p` + atlas via `ParticleEffect` + `ParticleEffectPool`)
3. `shader_pass` (mesh + shader params; beam/distortion/aura/etc.)

### Data model (proposed)

Define a shared `FxDefinition` library (JSON/TS data) keyed by `EffectId` or reusable template id.

Each definition can contain one or more layers, for example:

- layer 1: projectile sprite animation
- layer 2: particle trail
- layer 3: impact burst shader ring

Per-instance fields:

- anchor mode (`cell`, `hero`, `summoner`, `world`)
- offsets, scale, rotation
- duration/ping-pong/loop
- color and easing transitions
- spawn timing (`delay`, `spawnRate`, `moments`)

### Runtime responsibilities

- `FxSpawnSystem`: converts gameplay events into `FxInstance` requests.
- `FxUpdateSystem`: updates instance timers and attached anchors.
- `FxRenderAtlasSystem`: draws atlas animation layers.
- `FxRenderParticleSystem`: updates/draws pooled `ParticleEffect` layers.
- `FxRenderShaderSystem`: draws shader layers.

All old systems should progressively route into this runtime until legacy paths are removed.

---

## 4) Effect Category Mapping

| Category | Current examples | Target implementation |
|---|---|---|
| Impact/Hit | `swordAxe_impact_fx`, `magic_impact_fx`, `stun_02` | atlas impact + optional particle burst + optional shader flash ring |
| Sword slashes | `SlashProjectile_Alistra`, `slash` | slash atlas arc + directional trail particle + additive shader accent |
| Projectile trails | vampire and arrow trails in attack effects | pooled `.p` templates per projectile family (ice/fire/dark/light) |
| Area effects | `blast_*`, `black_hole`, `cataclysm` | multi-layer composition: ground decal + burst particles + distortion shader |
| Ground effects | `flame_below`, `EXP_restoration_1`, burning/regen env buffs | looping ground layers with deterministic seed offsets, optional heat-wave shader |
| Buff/Status | poison, stun, silenced, frozen, shields | sequence-based in/out/during definitions shared by player/cell units |

---

## 5) Proton Removal Plan (mandatory)

### Phase A: Introduce `gdxts` particle runtime in Himo

- Add a particle template registry:
  - key -> `{ pFile, atlasName, flipY, poolSize }`
- Preload particle atlases and `.p` assets in `init-game.ts`.
- Add `ParticleEffectPool` ownership and lifetime management to the new FX runtime.

### Phase B: Replace Proton references

- Remove/replace:
  - `src/client/util-gameboard/particles/customEmitter.js`
  - `src/client/util-gameboard/particles/rendererUtils.ts`
  - `src/client/util-gameboard/particles/particleEmitter.ts`
  - Proton use in `game-board.ts`, `ParticleProcessSystem.ts`, `ParticleRenderSystem.ts`, `AttackEffectManagerProcessSystem.ts`
- Simplify `AttackEffect` type:
  - remove `particleEmitter`, `particleRenderer`, Proton-only fields
  - replace with `particleTemplateKey` or embedded `particle_effect` layer refs

### Phase C: Remove dependency

- Delete `proton-engine` from `package.json`.
- Remove residual Proton types/imports.

---

## 6) Skill/Effect Migration Strategy

### Priority order

1. Basic attack pipeline and common impacts
2. Buff/status loops (poison, stun, silence, frozen, shield)
3. High-frequency skill effects (ice/fire/lightning/projectile families)
4. Large AoE/ground events (meteor, black hole, blast strike, restoration land)
5. Signature/premium polish effects

### Why this order

- It stabilizes the most visible combat feedback first.
- It minimizes temporary dual-system complexity.
- It gives reusable templates early for the remaining skills.

---

## 7) Porting External Libraries

### Particle Park (libGDX)

- Preferred source for direct import.
- Convert each selected effect pack into:
  - `.p` emitter file
  - packed atlas pages
  - Himo `particleTemplate` metadata

### Godot VFX libraries (`effectblocks`, `GODOT-VFX-LIBRARY`)

- Use as style/composition references, not raw runtime formats.
- Conversion path:
  1. isolate layers (core shape, glow, debris, smoke)
  2. export sprite sequences and curves
  3. rebuild as `atlas_anim` + `particle_effect` + `shader_pass`
- For smooth/cartoon target style:
  - replace pixel textures
  - keep timing/composition logic
  - apply anti-aliased ramps and softer bloom/glow

---

## 8) Proposed Refactor Boundaries

### In Himo (`himo-rebirth`)

- New folder: `src/client/vfx/`
  - `definitions/` (effect templates)
  - `runtime/` (spawn/update/render systems)
  - `adapters/` (`EffectId` -> definition)
- Shrink `EffectSpawnSystem.ts` to event routing only.
- Migrate old add* helper methods into reusable template data.

### In `gdxts` (if needed)

- Keep using existing `ParticleEffect`, `ParticleEmitter`, `ParticleEffectPool`.
- Add small ergonomic helpers only if migration needs them:
  - emitter-level param override hooks
  - lightweight particle instance API for dynamic scale/color/time warp

---

## 9) QA and Performance Gates

- Deterministic replay snapshot for before/after skill casts.
- Visual parity checklist per major `EffectId`.
- Stress test:
  - full board multi-hit turn
  - many concurrent loop effects
  - repeated projectile trails
- Performance target:
  - maintain current frame budget while reducing CPU overhead from ad hoc systems.

---

## 10) Immediate Next Actions

1. Create `vfx-definitions` scaffold and runtime skeleton in Himo.
2. Port one vertical slice end-to-end:
   - `NORMAL` attack + slash impact + one buff status loop.
3. Replace Proton in that slice first, validate parity/perf, then scale to remaining skills.
4. Finish full Proton removal and dependency cleanup.
