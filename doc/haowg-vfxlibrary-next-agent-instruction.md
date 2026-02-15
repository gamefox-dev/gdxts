# Next Agent Instruction: Research + Full Port of GODOT-VFX-LIBRARY

## Mission

Port the full effect set from `haowg/GODOT-VFX-LIBRARY` into `gdxts` as `HaowgVfxLibrary`.

Important:

- Do not skip research.
- Do not only mimic style.
- You must inspect each source effect/shader, understand what it uses, then port it.

---

## Step 1: Clone Source Repo to `/tmp`

```bash
cd /tmp
gh repo clone haowg/GODOT-VFX-LIBRARY
```

Use the source only from `/tmp/GODOT-VFX-LIBRARY`.

---

## Step 2: Research Before Coding

Create research notes in this repo before implementing:

- `doc/haowg-research-effects.md`
- `doc/haowg-research-shaders.md`
- `doc/haowg-port-mapping.md`

### 2.1 Effects research (`.tscn`)

For each effect scene in `addons/vfx_library/effects/` capture:

1. effect name
2. node types used (`CPUParticles2D`, `GPUParticles2D`, containers, etc.)
3. key particle parameters (amount, lifetime, emission shape, velocity, gravity, damping, scale, color ramp, one-shot/loop)
4. textures/sprites used
5. blend/look characteristics
6. how it is triggered/lifecycle behavior

### 2.2 Shader research (`.gdshader`)

For each shader in `addons/vfx_library/shaders/` capture:

1. shader name
2. uniforms and their meaning
3. major visual logic (noise/distortion/ring/glow/etc.)
4. expected usage context (character, full-screen, portal, water, etc.)

### 2.3 Port mapping file

In `doc/haowg-port-mapping.md` make one row per source item:

- source path
- target ID (`haowg.effect.*` or `haowg.shader.*`)
- target implementation type (`particle`, `shader`, `sprite`, or composition)
- assets required
- status (`pending`, `ported`, `validated`)

No source item should be missing.

---

## Step 3: Copy Required Assets

Copy only required resources into:

- `public/vfx/haowg/sprites/`
- `public/vfx/haowg/particles/`
- `public/vfx/haowg/ATTRIBUTION.md`

If an effect needs conversion/derivation, document it in `doc/haowg-port-mapping.md`.

---

## Step 4: Implement New Library

Create:

- `src/lib/vfx/HaowgVfxLibrary.ts`

Export it from:

- `src/lib/vfx/index.ts`

Requirements:

1. one source effect/shader corresponds to one target ID
2. support tunable parameters where applicable
3. use `gdxts` primitives only

---

## Step 5: Implement New Test Screen

Create:

- `src/screens/createTestHaowgVfxScreen.ts`

Wire into:

- `src/index.ts`

Screen requirements:

1. one showcase item at a time
2. left/right item switch
3. label with index + current ID
4. parameter controls only when relevant
5. manual touch trigger for positional effects

---

## Step 6: Validate with Chrome DevTools MCP (Mandatory)

1. Start dev server:

```bash
bun run dev -- --host 127.0.0.1 --port 4173
```

2. Open app in Chrome MCP and navigate to `Haowg` test screen.
3. Take screenshots to `/tmp` for every ported item:

- `/tmp/haowg-vfx-<id>.png`

4. For configurable effects, capture at least two parameter states.
5. Update `doc/haowg-port-mapping.md` status to `validated` with screenshot path.

---

## Step 7: Final Report Requirements

Include:

1. files changed
2. final count of source items vs ported items vs validated items
3. unresolved blockers (if any)
4. build result (`npm run -s build:lib`)
5. MCP screenshot list

If any source effect/shader is unported, report is not complete.
