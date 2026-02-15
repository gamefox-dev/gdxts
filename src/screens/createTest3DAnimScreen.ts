import { YDOWN } from '..';
import {
  Align,
  AnimationController,
  BitmapFont,
  Color,
  ColorAttribute3D,
  DirectionalLight,
  Environment,
  GL20,
  G3dModelLoader,
  Game,
  InputEvent,
  Mesh3D,
  Model,
  ModelBatch,
  ModelInstance,
  PerspectiveCamera,
  PolygonBatch,
  Screen,
  ShapeRenderer,
  ToonStyleOptions,
  ToonShaderProvider,
  Usage,
  Vector2,
  Vector3,
  Viewport,
  ViewportInputHandler
} from '../lib';

const MODEL_SCALE = 2.6;
const MODEL_SPACING_X = 5.4;
const MODEL_Y_OFFSET = 0;
const GROUND_Y = -0.2;
const NORMAL_SMOOTH_BLEND = 0.6;
const NORMAL_WELD_EPSILON = 0.0006;
const NORMAL_WELD_MAX_ANGLE_DEG = 82;
const CHARACTER_MODEL_FILES = [
  'Barbarian-flipv.g3db',
  'Knight-flipv.g3dj',
  'Mage-flipv.g3dj',
  'Rogue-flipv.g3dj',
  'RogueHooded-flipv.g3dj'
];

type ToonPreset = {
  name: string;
  style: Partial<ToonStyleOptions>;
};

type TriangleRange = {
  offset: number;
  size: number;
};

const smoothMeshNormals = (mesh: Mesh3D, triangleRanges: TriangleRange[], blend: number) => {
  const posAttr = mesh.getVertexAttribute(Usage.Position);
  const norAttr = mesh.getVertexAttribute(Usage.Normal);
  if (!posAttr || !norAttr || posAttr.numComponents < 3 || norAttr.numComponents < 3) return;

  const stride = mesh.getVertexSize() / 4;
  const numVertices = mesh.getNumVertices();
  if (numVertices <= 0) return;

  const posOffset = posAttr.offset / 4;
  const norOffset = norAttr.offset / 4;
  const vertices = new Array<number>(numVertices * stride);
  mesh.getVertices(vertices, 0, vertices.length);

  const smoothX = new Float32Array(numVertices);
  const smoothY = new Float32Array(numVertices);
  const smoothZ = new Float32Array(numVertices);

  const accumulate = (i0: number, i1: number, i2: number) => {
    if (i0 < 0 || i1 < 0 || i2 < 0 || i0 >= numVertices || i1 >= numVertices || i2 >= numVertices) return;
    const b0 = i0 * stride + posOffset;
    const b1 = i1 * stride + posOffset;
    const b2 = i2 * stride + posOffset;

    const p0x = vertices[b0];
    const p0y = vertices[b0 + 1];
    const p0z = vertices[b0 + 2];
    const ux = vertices[b1] - p0x;
    const uy = vertices[b1 + 1] - p0y;
    const uz = vertices[b1 + 2] - p0z;
    const vx = vertices[b2] - p0x;
    const vy = vertices[b2 + 1] - p0y;
    const vz = vertices[b2 + 2] - p0z;

    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    const nLen2 = nx * nx + ny * ny + nz * nz;
    if (nLen2 < 1e-12) return;

    smoothX[i0] += nx;
    smoothY[i0] += ny;
    smoothZ[i0] += nz;
    smoothX[i1] += nx;
    smoothY[i1] += ny;
    smoothZ[i1] += nz;
    smoothX[i2] += nx;
    smoothY[i2] += ny;
    smoothZ[i2] += nz;
  };

  const numIndices = mesh.getNumIndices();
  if (numIndices > 0) {
    const indices = mesh.getIndicesBuffer();
    for (const range of triangleRanges) {
      const start = Math.max(0, range.offset);
      const end = Math.min(numIndices, range.offset + range.size);
      for (let i = start; i + 2 < end; i += 3) {
        accumulate(indices[i] & 0xffff, indices[i + 1] & 0xffff, indices[i + 2] & 0xffff);
      }
    }
  } else {
    // Non-indexed fallback: assume triangle-list layout.
    for (let i = 0; i + 2 < numVertices; i += 3) {
      accumulate(i, i + 1, i + 2);
    }
  }

  for (let i = 0; i < numVertices; i++) {
    const nx = smoothX[i];
    const ny = smoothY[i];
    const nz = smoothZ[i];
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (len > 1e-6) {
      smoothX[i] = nx / len;
      smoothY[i] = ny / len;
      smoothZ[i] = nz / len;
    }
  }

  // Average duplicated vertices by position key to smooth across UV/material seams.
  const groupedIndices = new Map<string, number[]>();
  for (let i = 0; i < numVertices; i++) {
    const base = i * stride + posOffset;
    const key =
      Math.round(vertices[base] / NORMAL_WELD_EPSILON) +
      '|' +
      Math.round(vertices[base + 1] / NORMAL_WELD_EPSILON) +
      '|' +
      Math.round(vertices[base + 2] / NORMAL_WELD_EPSILON);
    const group = groupedIndices.get(key);
    if (!!group) group.push(i);
    else groupedIndices.set(key, [i]);
  }

  const cosThreshold = Math.cos((NORMAL_WELD_MAX_ANGLE_DEG * Math.PI) / 180);
  for (const group of groupedIndices.values()) {
    if (group.length < 2) continue;
    let ax = 0;
    let ay = 0;
    let az = 0;
    for (const idx of group) {
      ax += smoothX[idx];
      ay += smoothY[idx];
      az += smoothZ[idx];
    }
    const alen = Math.sqrt(ax * ax + ay * ay + az * az);
    if (alen < 1e-6) continue;
    ax /= alen;
    ay /= alen;
    az /= alen;

    for (const idx of group) {
      const dot = smoothX[idx] * ax + smoothY[idx] * ay + smoothZ[idx] * az;
      if (dot < cosThreshold) continue;
      let mx = smoothX[idx] * 0.25 + ax * 0.75;
      let my = smoothY[idx] * 0.25 + ay * 0.75;
      let mz = smoothZ[idx] * 0.25 + az * 0.75;
      const mlen = Math.sqrt(mx * mx + my * my + mz * mz);
      if (mlen > 1e-6) {
        mx /= mlen;
        my /= mlen;
        mz /= mlen;
        smoothX[idx] = mx;
        smoothY[idx] = my;
        smoothZ[idx] = mz;
      }
    }
  }

  for (let i = 0; i < numVertices; i++) {
    const base = i * stride + norOffset;
    const ox = vertices[base];
    const oy = vertices[base + 1];
    const oz = vertices[base + 2];
    let nx = ox * (1 - blend) + smoothX[i] * blend;
    let ny = oy * (1 - blend) + smoothY[i] * blend;
    let nz = oz * (1 - blend) + smoothZ[i] * blend;
    const nlen = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (nlen > 1e-6) {
      nx /= nlen;
      ny /= nlen;
      nz /= nlen;
      vertices[base] = nx;
      vertices[base + 1] = ny;
      vertices[base + 2] = nz;
    }
  }

  mesh.updateVertices(0, vertices, 0, vertices.length);
};

const smoothModelNormals = (model: Model, blend: number) => {
  const rangesByMesh = new Map<Mesh3D, TriangleRange[]>();
  for (const part of model.meshParts) {
    if (part.primitiveType !== GL20.GL_TRIANGLES) continue;
    const ranges = rangesByMesh.get(part.mesh);
    if (!!ranges) ranges.push({ offset: part.offset, size: part.size });
    else rangesByMesh.set(part.mesh, [{ offset: part.offset, size: part.size }]);
  }
  for (const [mesh, ranges] of rangesByMesh.entries()) {
    smoothMeshNormals(mesh, ranges, blend);
  }
};

const TOON_PRESETS: ToonPreset[] = [
  {
    name: 'Soft Toon',
    style: {
      wrap: 0.4,
      shadowFloor: 0.34,
      baseLight: 0.18,
      saturation: 1.1,
      valueBoost: 1.12,
      hemiStrength: 0.22,
      rimStrength: 0.1,
      specularSize: 0.88,
      specularSoftness: 0.06
    }
  },
  {
    name: 'Plastic Toon',
    style: {
      shadowTint: [0.84, 0.87, 0.9],
      lightTint: [1.0, 0.98, 0.96],
      specularTint: [1.0, 1.0, 1.0],
      wrap: 0.55,
      shadowFloor: 0.42,
      baseLight: 0.26,
      saturation: 1.04,
      valueBoost: 1.2,
      hemiStrength: 0.24,
      rimStrength: 0.06,
      specularSize: 0.75,
      specularSoftness: 0.12
    }
  },
  {
    name: 'Hard Cel',
    style: {
      shadowTint: [0.72, 0.78, 0.92],
      lightTint: [1.0, 0.94, 0.86],
      specularTint: [1.0, 0.88, 0.78],
      wrap: 0.28,
      shadowFloor: 0.28,
      baseLight: 0.12,
      saturation: 1.16,
      valueBoost: 1.08,
      hemiStrength: 0.18,
      rimStrength: 0.16,
      specularSize: 0.92,
      specularSoftness: 0.03,
      outlineEnabled: true,
      outlineThickness: 0.0045,
      outlineColor: [0.17, 0.15, 0.14]
    }
  }
];
export const createTest3DAnimScreen = async (viewport: Viewport): Promise<Screen> => {
  const gl = viewport.getContext();
  const canvas = viewport.getCanvas();

  // --- 3D setup ---
  const cam = new PerspectiveCamera(57, canvas.width, canvas.height);
  cam.position.set(0, 6.5, 21.5);
  cam.lookAt(0, 1.8, 0);
  cam.near = 0.1;
  cam.far = 300;
  cam.update();

  let currentPresetIndex = 0;
  const toonProvider = new ToonShaderProvider(gl, null, TOON_PRESETS[currentPresetIndex].style);
  const modelBatch = new ModelBatch(gl, null, null, toonProvider);
  const environment = new Environment();
  environment.set(new ColorAttribute3D(ColorAttribute3D.AmbientLight, new Color(0.38, 0.38, 0.38, 1)));
  const keyLight = new DirectionalLight().set(1.0, 0.96, 0.9, -0.45, -0.72, -0.52);
  const fillLight = new DirectionalLight().set(0.48, 0.56, 0.7, 0.7, -0.28, 0.3);
  const rimLight = new DirectionalLight().set(0.32, 0.35, 0.42, 0.15, -0.15, 0.98);
  environment.addLight(keyLight);
  environment.addLight(fillLight);
  environment.addLight(rimLight);

  // Load all character models
  const g3dLoader = new G3dModelLoader();
  const models = await Promise.all(CHARACTER_MODEL_FILES.map(file => g3dLoader.load(gl, `3d-assets/${file}`)));
  for (const model of models) {
    smoothModelNormals(model, NORMAL_SMOOTH_BLEND);
  }
  const instances: ModelInstance[] = [];
  const groundAnchors: Vector3[] = [];
  const animControllers: AnimationController[] = [];
  const animationSets = new Array<Set<string>>();
  for (let i = 0; i < models.length; i++) {
    const instance = new ModelInstance(models[i]);
    const centerOffset = (i - (models.length - 1) / 2) * MODEL_SPACING_X;
    instance.transform
      .setTranslation(centerOffset, MODEL_Y_OFFSET, 0)
      .scale(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE);
    instances.push(instance);
    groundAnchors.push(new Vector3(centerOffset, GROUND_Y, 0));
    animControllers.push(new AnimationController(instance));
    animationSets.push(new Set(instance.animations.map(a => a.id)));
  }

  // Shared animation setup
  const primaryAnimationNames = instances[0].animations.map(a => a.id);
  const animationNames = primaryAnimationNames.filter(id => animationSets.every(set => set.has(id)));
  let currentAnimIndex = 0;
  if (animationNames.length === 0) {
    throw new Error('No shared animations across loaded character models.');
  }
  const applyCurrentAnimation = () => {
    const animationId = animationNames[currentAnimIndex];
    for (const controller of animControllers) {
      controller.setAnimation(animationId, -1);
    }
  };
  applyCurrentAnimation();

  // --- 2D overlay setup ---
  const camera2d = viewport.getCamera();
  camera2d.setYDown(YDOWN);

  const batch = new PolygonBatch(gl);
  batch.setYDown(YDOWN);

  const shapeRenderer = new ShapeRenderer(gl);
  const font = await BitmapFont.load(gl, './number.fnt', YDOWN);

  const setAnimation = (index: number) => {
    currentAnimIndex = index;
    if (currentAnimIndex < 0) currentAnimIndex = animationNames.length - 1;
    if (currentAnimIndex >= animationNames.length) currentAnimIndex = 0;
    applyCurrentAnimation();
  };

  const setPreset = (index: number) => {
    currentPresetIndex = index;
    if (currentPresetIndex < 0) currentPresetIndex = TOON_PRESETS.length - 1;
    if (currentPresetIndex >= TOON_PRESETS.length) currentPresetIndex = 0;
    toonProvider.setStyle(TOON_PRESETS[currentPresetIndex].style);
  };

  // --- Camera orbit input ---
  const touchStartPos = new Vector2();
  let touched = false;
  const inputHandler = new ViewportInputHandler(viewport);
  const tmpV1 = new Vector3();
  const camTarget = new Vector3(0, 2, 0);
  const shadowProjected = new Vector3();
  const shadowClip = new Vector3();
  const bgTop = new Color(0.03, 0.05, 0.14, 1);
  const bgBottom = new Color(0.01, 0.03, 0.08, 1);
  const shadowCore = new Color(0.0, 0.0, 0.0, 0.2);
  const shadowFeather = new Color(0.0, 0.0, 0.0, 0.08);

  inputHandler.addEventListener(InputEvent.TouchStart, async (x, y) => {
    touchStartPos.set(x, y);
    touched = true;
  });

  inputHandler.addEventListener(InputEvent.TouchMove, async (x, y) => {
    if (touched) {
      const deltaX = (x - touchStartPos.x) / canvas.width;
      const deltaY = (touchStartPos.y - y) / canvas.height;
      touchStartPos.set(x, y);

      tmpV1.set(cam.direction.x, cam.direction.y, cam.direction.z).cross(cam.up).y = 0;
      cam.rotateAround(camTarget, tmpV1.normalize(), deltaY * 360);
      cam.rotateAround(camTarget, Vector3.Y, deltaX * -360);
    }
  });

  inputHandler.addEventListener(InputEvent.TouchEnd, async (x, y) => {
    touched = false;

    // Check button clicks
    const coord = inputHandler.getTouchedWorldCoord(camera2d);
    // Left arrow: roughly x=30, y=880-920, w=50, h=50
    if (coord.x >= 20 && coord.x <= 80 && coord.y >= 860 && coord.y <= 940) {
      setAnimation(currentAnimIndex - 1);
    }
    // Right arrow: roughly x=420, y=880-920, w=50, h=50
    if (coord.x >= 420 && coord.x <= 480 && coord.y >= 860 && coord.y <= 940) {
      setAnimation(currentAnimIndex + 1);
    }
    // Preset left arrow.
    if (coord.x >= 55 && coord.x <= 95 && coord.y >= 810 && coord.y <= 860) {
      setPreset(currentPresetIndex - 1);
    }
    // Preset right arrow.
    if (coord.x >= 405 && coord.x <= 445 && coord.y >= 810 && coord.y <= 860) {
      setPreset(currentPresetIndex + 1);
    }
  });

  const projectToOverlay = (worldX: number, worldY: number, worldZ: number, out: Vector3): number => {
    shadowClip.set(worldX, worldY, worldZ).project(cam.combined);
    const screenX = ((shadowClip.x + 1) * 0.5) * camera2d.screenWidth;
    const screenY = (1 - (shadowClip.y + 1) * 0.5) * camera2d.screenHeight;
    out.set(screenX, screenY, 0);
    camera2d.screenToWorld(out, camera2d.screenWidth, camera2d.screenHeight);
    return shadowClip.z;
  };

  gl.clearColor(0.01, 0.03, 0.08, 1);

  return {
    update(delta: number, game: Game) {
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // Presentation background + contact shadows.
      shapeRenderer.setProjection(camera2d.combined);
      shapeRenderer.begin();
      const bgLeft = camera2d.position.x - camera2d.viewportWidth * 0.5;
      const bgRight = camera2d.position.x + camera2d.viewportWidth * 0.5;
      const bgTopY = camera2d.position.y - camera2d.viewportHeight * 0.5;
      const bgBottomY = camera2d.position.y + camera2d.viewportHeight * 0.5;
      shapeRenderer.quad(
        true,
        bgLeft,
        bgTopY,
        bgRight,
        bgTopY,
        bgRight,
        bgBottomY,
        bgLeft,
        bgBottomY,
        bgTop,
        bgTop,
        bgBottom,
        bgBottom
      );
      for (let i = 0; i < groundAnchors.length; i++) {
        const anchor = groundAnchors[i];
        const clipZ = projectToOverlay(anchor.x, anchor.y, anchor.z, shadowProjected);
        const depthScale = Math.max(0.82, Math.min(1.25, 1.25 - clipZ * 0.35));
        const coreRadius = 14 * depthScale;
        const featherRadius = 24 * depthScale;
        shapeRenderer.circle(true, shadowProjected.x - coreRadius * 0.85, shadowProjected.y, coreRadius, shadowCore, 16);
        shapeRenderer.circle(true, shadowProjected.x, shadowProjected.y, coreRadius * 1.06, shadowCore, 16);
        shapeRenderer.circle(true, shadowProjected.x + coreRadius * 0.85, shadowProjected.y, coreRadius, shadowCore, 16);
        shapeRenderer.circle(true, shadowProjected.x, shadowProjected.y, featherRadius, shadowFeather, 20);
      }
      shapeRenderer.end();

      // Update & render 3D
      for (const controller of animControllers) controller.update(delta);
      modelBatch.begin(cam);
      for (const instance of instances) modelBatch.render(instance, environment);
      modelBatch.end();

      // Render 2D overlay
      const animLabel = `${currentAnimIndex + 1}/${animationNames.length}  ${animationNames[currentAnimIndex]}`;
      const presetLabel = `Preset: ${TOON_PRESETS[currentPresetIndex].name}`;

      // Draw buttons and text
      shapeRenderer.setProjection(camera2d.combined);
      shapeRenderer.begin();
      // Left arrow button
      shapeRenderer.triangle(true, 30, 900, 70, 870, 70, 930);
      // Right arrow button
      shapeRenderer.triangle(true, 470, 900, 430, 870, 430, 930);
      // Preset left button
      shapeRenderer.triangle(true, 55, 835, 90, 812, 90, 858);
      // Preset right button
      shapeRenderer.triangle(true, 445, 835, 410, 812, 410, 858);
      shapeRenderer.end();

      batch.setProjection(camera2d.combined);
      batch.begin();
      font.draw(batch, animLabel, 80, 890, 340, Align.center);
      font.draw(batch, presetLabel, 0, 842, 500, Align.center);
      batch.end();
    },
    dispose() {
      modelBatch.dispose();
      batch.dispose();
    }
  };
};
