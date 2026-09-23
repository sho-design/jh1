/**
 * A procedural 3D-printed planetary gearbox that explodes along its axis.
 * Built from primitives so it needs no model files. Units are roughly cm.
 */
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { LookId } from "./looks";

export interface Gearbox {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  /** p: 0 assembled, 1 fully exploded. t: seconds, for idle drift. */
  update(p: number, t: number): void;
  resize(w: number, h: number, focusX: number, focusY: number): void;
  dispose(): void;
}

/** Order the parts leave the stack, top first. Matches the parts list on the page. */
export const PART_ORDER = ["bolts", "flange", "gears", "ring", "housing"] as const;

const PALETTES = {
  a: {
    light: "#efe9df", accent: "#dd7a34", carrier: "#d3cdc2", steel: "#8d949b",
    plate: "#a8792c", edges: null as string | null, amberGlass: false,
  },
  b: {
    light: "#23272b", accent: "#f2a93b", carrier: "#2b3035", steel: "#6d757c",
    plate: null as string | null, edges: "#72d4ff", amberGlass: true,
  },
};

/** Horizontal stripes used as a bump map: visible print layer lines. */
function layerTexture() {
  const c = document.createElement("canvas");
  c.width = 8; c.height = 256;
  const g = c.getContext("2d")!;
  for (let y = 0; y < 256; y += 4) {
    g.fillStyle = "#fff"; g.fillRect(0, y, 8, 2);
    g.fillStyle = "#6a6a6a"; g.fillRect(0, y + 2, 8, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 6);
  return tex;
}

/** Gear outline. With tipR < rootR the teeth point inward (for a ring gear hole). */
function gearPoints(teeth: number, rootR: number, tipR: number) {
  const pts: THREE.Vector2[] = [];
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const at = (f: number, r: number) => new THREE.Vector2(Math.cos(a + step * f) * r, Math.sin(a + step * f) * r);
    pts.push(at(0, rootR), at(0.18, rootR), at(0.3, tipR), at(0.58, tipR), at(0.7, rootR), at(1, rootR));
  }
  return pts;
}

function circle(r: number) {
  const p = new THREE.Path();
  p.absarc(0, 0, r, 0, Math.PI * 2, true);
  return p;
}

function extrude(shape: THREE.Shape, depth: number) {
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 1, curveSegments: 48 });
  geo.rotateX(-Math.PI / 2); // extrude along +Y
  return geo;
}

function spurGear(teeth: number, rootR: number, tipR: number, holeR: number, depth: number) {
  const s = new THREE.Shape(gearPoints(teeth, rootR, tipR));
  s.holes.push(circle(holeR));
  return extrude(s, depth);
}

function ringGear(outerR: number, teeth: number, rootR: number, tipR: number, depth: number) {
  const s = new THREE.Shape();
  s.absarc(0, 0, outerR, 0, Math.PI * 2, false);
  s.holes.push(new THREE.Path(gearPoints(teeth, rootR, tipR).reverse()));
  return extrude(s, depth);
}

export function createGearbox(canvas: HTMLCanvasElement, look: LookId): Gearbox {
  const pal = PALETTES[look];
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = look === "a" ? 1.05 : 1.2;

  const scene = new THREE.Scene();
  // Soft studio reflections so metal and dark plastics catch light.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = look === "a" ? 0.55 : 0.45;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);

  // Light: soft daylight for A, rim-lit studio for B.
  scene.add(new THREE.HemisphereLight(look === "a" ? "#ffffff" : "#9fb4c4", look === "a" ? "#b9a07a" : "#0a0d10", look === "a" ? 1.0 : 0.5));
  const key = new THREE.DirectionalLight("#ffffff", look === "a" ? 2.2 : 1.4);
  key.position.set(-8, 14, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -8, right: 8, top: 14, bottom: -4, near: 1, far: 40 });
  key.shadow.radius = 6;
  scene.add(key);
  if (look === "b") {
    const rim = new THREE.DirectionalLight("#bfe9ff", 3);
    rim.position.set(6, 6, -10);
    scene.add(rim);
  }

  const bump = layerTexture();
  const printed = (color: string, rough = 0.78) =>
    new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0, bumpMap: bump, bumpScale: 0.6 });
  const amber = pal.amberGlass
    ? new THREE.MeshPhysicalMaterial({ color: pal.accent, roughness: 0.25, transmission: 0.55, thickness: 0.6, ior: 1.5, bumpMap: bump, bumpScale: 0.3 })
    : printed(pal.accent);
  const steel = new THREE.MeshStandardMaterial({ color: pal.steel, roughness: 0.35, metalness: 0.85 });

  const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true; m.receiveShadow = true;
    if (pal.edges) {
      const lines = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 30), new THREE.LineBasicMaterial({ color: pal.edges, transparent: true, opacity: 0.28 }));
      m.add(lines);
    }
    return m;
  };

  // Housing: a cup turned on a lathe, with four bolt bosses.
  const housing = new THREE.Group();
  const cup = new THREE.LatheGeometry(
    [[0, 0], [3.2, 0], [3.3, 0.08], [3.3, 1.4], [2.95, 1.4], [2.95, 0.25], [0.5, 0.25], [0.5, 0.6], [0, 0.6]].map(([x, y]) => new THREE.Vector2(x, y)),
    96,
  );
  housing.add(mesh(cup, printed(pal.light)));
  // Parts, bottom to top, with their assembled height.
  const ring = mesh(ringGear(3.25, 42, 2.72, 2.52, 0.9), printed(look === "a" ? pal.accent : pal.light));
  ring.position.y = 1.42;

  const gears = new THREE.Group();
  gears.position.y = 1.5;
  const planetR = 1.62;
  const planets: THREE.Object3D[] = [];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const g = mesh(spurGear(14, 0.82, 0.95, 0.18, 0.75), look === "a" ? printed(pal.light) : amber);
    g.position.set(Math.cos(a) * planetR, 0, Math.sin(a) * planetR);
    g.userData.dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    planets.push(g);
    gears.add(g);
  }
  const carrier = mesh(new THREE.CylinderGeometry(2.25, 2.25, 0.16, 72), printed(pal.carrier));
  carrier.position.y = 0.8;
  gears.add(carrier);

  const sun = mesh(spurGear(12, 0.56, 0.7, 0.16, 0.95), amber);
  sun.position.y = 1.45;

  const flange = new THREE.Group();
  flange.position.y = 2.55;
  flange.add(mesh(new THREE.CylinderGeometry(3.3, 3.3, 0.32, 96), printed(pal.light)));
  const hub = mesh(new THREE.CylinderGeometry(0.95, 1.05, 0.7, 64), printed(look === "a" ? pal.accent : pal.light));
  hub.position.y = 0.5;
  flange.add(hub);

  const bolts = new THREE.Group();
  bolts.position.y = 2.9;
  const boltR = 2.75;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const b = new THREE.Group();
    const head = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.22, 6), steel);
    const shaft = mesh(new THREE.CylinderGeometry(0.13, 0.13, 1.7, 16), steel);
    shaft.position.y = -0.95;
    b.add(head, shaft);
    b.position.set(Math.cos(a) * boltR, 0.11, Math.sin(a) * boltR);
    bolts.add(b);
  }

  const model = new THREE.Group();
  model.add(housing, ring, gears, sun, flange, bolts);
  scene.add(model);

  // Ground: the bronze build plate for A, a faint blueprint grid for B.
  if (pal.plate) {
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(9, 0.3, 7),
      new THREE.MeshStandardMaterial({ color: pal.plate, roughness: 0.9, metalness: 0.35, bumpMap: bump, bumpScale: 0.15 }),
    );
    plate.position.y = -0.16;
    plate.receiveShadow = true;
    scene.add(plate);
  } else {
    const grid = new THREE.GridHelper(40, 40, "#72d4ff", "#72d4ff");
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.09;
    scene.add(grid);
    const catcher = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.5 }));
    catcher.rotation.x = -Math.PI / 2;
    catcher.receiveShadow = true;
    scene.add(catcher);
  }

  // How far each part rises when fully exploded, in the order they leave.
  const lift: Record<(typeof PART_ORDER)[number], { obj: THREE.Object3D; base: number; rise: number }> = {
    bolts: { obj: bolts, base: bolts.position.y, rise: 9.2 },
    flange: { obj: flange, base: flange.position.y, rise: 6.6 },
    gears: { obj: gears, base: gears.position.y, rise: 3.3 },
    ring: { obj: ring, base: ring.position.y, rise: 1.2 },
    housing: { obj: housing, base: 0, rise: 0 },
  };
  const sunBase = sun.position.y;
  const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

  const target = new THREE.Vector3(0, 2.4, 0);
  let fit = 1; // pulls the camera back on narrow screens so the part fits
  function update(p: number, t: number) {
    // Each part moves in its own window of the scroll, top part first.
    PART_ORDER.forEach((id, i) => {
      const k = ease((p - i * 0.14) / 0.42);
      const { obj, base, rise } = lift[id];
      obj.position.y = base + rise * k;
      if (id === "bolts") obj.children.forEach((b) => (b.rotation.y = k * Math.PI * 3)); // unscrew
    });
    const g = ease((p - 0.28) / 0.42);
    sun.position.y = sunBase + 5.0 * g;
    sun.rotation.y = g * 1.2;
    planets.forEach((pl) => {
      const d = pl.userData.dir as THREE.Vector3;
      pl.position.x = d.x * (planetR + 0.9 * g);
      pl.position.z = d.z * (planetR + 0.9 * g);
      pl.rotation.y = -g * 2.4;
    });
    // Frame grows with the stack; the camera pulls back and rises a little.
    model.rotation.y = -0.5 + p * 0.9 + Math.sin(t * 0.25) * 0.04;
    target.y = 1.4 + p * 5;
    const dist = (26 + p * 16) * fit;
    const elev = 0.42 - p * 0.1;
    camera.position.set(Math.sin(0.6) * dist * Math.cos(elev), target.y + Math.sin(elev) * dist, Math.cos(0.6) * dist * Math.cos(elev));
    camera.lookAt(target);
    renderer.render(scene, camera);
  }

  function resize(w: number, h: number, focusX: number, focusY: number) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    fit = Math.max(1, 0.8 / camera.aspect);
    // Shift the picture so the model sits at (focusX, focusY) of the canvas.
    camera.setViewOffset(w, h, (0.5 - focusX) * w, (0.5 - focusY) * h, w, h);
    camera.updateProjectionMatrix();
  }

  function dispose() {
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mat = m.material;
      (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => x.dispose());
    });
    bump.dispose();
    envTex.dispose();
    pmrem.dispose();
    renderer.dispose();
  }

  return { scene, camera, renderer, update, resize, dispose };
}
