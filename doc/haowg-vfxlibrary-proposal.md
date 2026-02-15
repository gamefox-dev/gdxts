# HaowgVfxLibrary Proposal

## Objective

Create `HaowgVfxLibrary` in `gdxts` as a new VFX library that ports the full effect set from `haowg/GODOT-VFX-LIBRARY` into our runtime stack.

This means using `gdxts` systems (particle templates, shader renderers, optional sprite flipbooks), not Godot runtime code.

## Constraints

1. Full source coverage: all source effects must exist in `HaowgVfxLibrary`.
2. Keep runtime reusable and data-driven.
3. Do not tie implementation to random existing atlases in this repo.
4. Copy only required resources; include attribution.
5. New showcase screen is required.
6. Visual validation with Chrome DevTools MCP is required.

## Deliverables

1. `src/lib/vfx/HaowgVfxLibrary.ts`
2. Export from `src/lib/vfx/index.ts`
3. `src/screens/createTestHaowgVfxScreen.ts`
4. Screen registered in `src/index.ts`
5. Resource folder under `public/vfx/haowg/`
6. Attribution file for imported/derived resources

## Definition of Done

1. Full effect coverage is implemented in the new library.
2. Showcase screen can demonstrate every ported effect one at a time.
3. Build passes (`npm run -s build:lib`).
4. MCP screenshots prove each effect in the showcase works.
