// GREENLIGHT - asset loading: cars, traffic, textures, sky/environment
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ctx } from './core.js';

const PK = globalThis.__GLPACK;   // filled only in the single-file offline build
const url = p => PK && PK[p] ? PK[p] : new URL('../assets/' + p, import.meta.url).href;
const imp = p => PK && PK[p] ? Promise.resolve({ default: PK[p] }) : import(url(p));
const b64buf = b => { const s = atob(b), n = s.length, u = new Uint8Array(n); for (let i = 0; i < n; i++) u[i] = s.charCodeAt(i); return u.buffer; };
const gltfLoader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const texLoader = new THREE.TextureLoader();
const V = new THREE.Vector3(), B = new THREE.Box3();

export const PAINTS = [['Signal Green', 0x19c463], ['Racing Red', 0xc41a1a], ['Electric Blue', 0x1557d6], ['Sunburst', 0xf2b705], ['Blaze Orange', 0xe8590c], ['Violet', 0x6b2bd6], ['Hot Pink', 0xe0218a], ['Pearl White', 0xe8e8ea], ['Silver', 0x8d949c], ['Midnight', 0x0c0d10]];
const WS = /WheelStock_(F|R)(L|R)\d*$/;
export const CARS = {
  hatch: { name: 'PIXIE 95', cls: 'Compact', price: 5000, fwd: '+x', len: 3.95, vmax: 66, vboost: 85, acc: 13, hnd: 1.0, mass: 0.85, paint: /Bodymat/, color: 0x19c463, wheels: WS, parts: /_(Hood|Bumper_front|Bumper_rear|Trunkdoor)\d*$/i },
  wagon: { name: 'HAULER SW', cls: 'Heavy wagon', price: 9000, fwd: '+x', len: 4.9, vmax: 68, vboost: 87, acc: 12.5, hnd: 0.92, mass: 1.5, paint: /^Fairheaven/, color: 0x7a1f2b, wheels: WS, parts: /_(Hood|Bumper_front|Bumper_Rear|Trunkdoor)\d*$/i },
  pickup: { name: 'BRUTE 85', cls: 'Bruiser', price: 14000, fwd: '+x', len: 5.0, vmax: 69, vboost: 88, acc: 12.5, hnd: 0.88, mass: 1.8, paint: /Bodymat/, color: 0xe8590c, wheels: WS, parts: /_(Hood|Bumper_Front|Bumper_Rear|Trunkdoor|Bullbar)\d*$/i },
  gourami: { name: 'GOURAMI LX', cls: 'Saloon', price: 24000, fwd: '-z', len: 5.3, vmax: 74, vboost: 95, acc: 14.5, hnd: 1.0, mass: 1.4, paint: /^Paint$/, color: 0x0d1f4a, splitMat: /^(Tire|BrakeDisc|SilverWheel|BlackWheel)$/ },
  wyvern: { name: 'WYVERN X', cls: 'Concept', price: 40000, fwd: '-x', len: 4.9, vmax: 78, vboost: 100, acc: 15, hnd: 0.95, mass: 1.6, paint: /^material$/, color: 0x30363d, splitNode: /^(rims_2|tires_3)$/ },
  muscle: { name: 'HAMMERHEAD', cls: 'Racer', price: 0, fwd: '+z', len: 4.75, vmax: 70, vboost: 90, acc: 17, hnd: 0.95, mass: 1.25, paint: /Body_gameasset_Mat_1$/, color: 0x15171c, wheels: /^Wheel_(F|R)(L|R)_gameasset$/ },
  vintage: { name: 'COMET GP', cls: 'Classic racer', price: 70000, fwd: '-z', len: 3.9, vmax: 84, vboost: 106, acc: 18, hnd: 1.15, mass: 0.85, paint: /^blue$/, hue: true, wheels: /_wheel$/ },
  riptide: { name: 'RIPTIDE GT', cls: 'Sports coupe', price: 3000, fwd: '+z', len: 4.5, vmax: 72, vboost: 92, acc: 16, hnd: 1.05, mass: 1.1, paint: /^PxrSurface1SG$/, hue: true },
  brawler: { name: 'BRAWLER 00', cls: 'Muscle', price: 8000, fwd: '+x', len: 4.75, vmax: 74, vboost: 95, acc: 16.5, hnd: 0.95, mass: 1.4, paint: /Exterminator00_Body$/, color: 0xc41a1a, wheels: WS, parts: /_(Hood|Bumper_Front|Bumper_Rear|Spoiler)\d*$/i },
  cheetah: { name: 'VELOCE 84', cls: 'Supercar', price: 30000, fwd: '+x', len: 4.4, vmax: 80, vboost: 102, acc: 18, hnd: 1.05, mass: 1.05, paint: /Cheetah84_Bodymat$/, color: 0xc41a1a, wheels: WS, parts: /_(Hood|Bumper_Front|Bumper_Rear|Trunk)\d*$/i },
  sabre: { name: 'SABRE V12', cls: 'Supercar', price: 55000, fwd: '+x', len: 4.5, vmax: 86, vboost: 110, acc: 19.5, hnd: 1.08, mass: 1.1, paint: /Saba95_Bodymat$/, color: 0xf2b705, wheels: WS, parts: /_(Hood|Bumper_Front|Bumper_Rear|Trunkdoor|Spoiler)\d*$/i },
  oxide: { name: 'OXIDE', cls: 'Concept', price: 80000, fwd: '-x', len: 4.7, vmax: 88, vboost: 112, acc: 20, hnd: 1.1, mass: 1.05, paint: /^carbody$/, color: 0x15171c, splitMat: /^(tiretread|rimstar)$/ },
  mauler: { name: 'MAULER', cls: 'Rally beast', price: 90000, fwd: '-z', len: 4.6, vmax: 82, vboost: 106, acc: 21, hnd: 1.15, mass: 1.75, paint: /^Mat_Exterior$/, hue: true, splitMat: /^Mat_(B|F)Wheel$/ },
  phantom: { name: 'PHANTOM', cls: 'Hypercar', price: 150000, fwd: '-x', len: 4.8, vmax: 94, vboost: 120, acc: 22, hnd: 1.15, mass: 1.0, paint: /^01_-_Default$/, color: 0x15171c, splitMat: /^(Material_286|13_-_Default|14_-_Default|Material_285)$/ },
  goblin: { name: 'GOBLIN V12', cls: 'Supercar', price: 120000, fwd: '-z', len: 4.6, vmax: 90, vboost: 114, acc: 20, hnd: 1.1, mass: 1.0, paint: /^car_body$/, hue: true, wheels: /^car_wheel_(F|B)(L|R)$/ },
};
export const CAR_IDS = ['muscle', 'riptide', 'hatch', 'brawler', 'wagon', 'pickup', 'gourami', 'cheetah', 'wyvern', 'sabre', 'vintage', 'oxide', 'mauler', 'goblin', 'phantom'];
// rivals only drive the cool cars; each rival has its own signature colour (also used for its marker and underglow)
export const RIVAL_IDS = ['brawler', 'cheetah', 'sabre', 'oxide', 'mauler', 'phantom', 'goblin', 'muscle', 'riptide', 'wyvern'];
export const RIVAL_COLS = [0xff2d55, 0x00d8ff, 0xffc400, 0x8a5cff, 0xff6a00, 0x00e676, 0xff3fd2, 0x2f7bff];
export const CREDITS = [
  ['RIPTIDE GT', 'NFX Car', 'Paulo.liv', 'CC BY 4.0', 'sketchfab.com/3d-models/979875e117814e46ace66d1fc8697b5d'], ['BRAWLER 00', "Exterminator '00 - Low poly model", 'Daniel Zhabotinsky', 'CC BY 4.0', 'sketchfab.com/3d-models/857f048c4bbb40b4be4fb0b765a52116'],
  ['VELOCE 84', "Cheetah '84 - Low poly Model", 'Daniel Zhabotinsky', 'CC BY 4.0', 'sketchfab.com/3d-models/c967ab4abbc54ae4b7933fd81a86c99c'], ['SABRE V12', "Saba V12 '95 - Low poly model", 'Daniel Zhabotinsky', 'CC BY 4.0', 'sketchfab.com/3d-models/3ab977050c334c13b6abb5de078b4957'],
  ['OXIDE', 'Coupeox futuristic vehicle', 'kolani3d', 'CC BY 4.0', 'sketchfab.com/3d-models/f4eeef5af2804647b933207303461e84'], ['MAULER', 'Substance Futuristic Sports Car', 'Samize', 'CC BY 4.0', 'sketchfab.com/3d-models/1eee26c0b72342ddbec8601a6d05620d'],
  ['PHANTOM', 'CFS-6', 'Zandora_Design', 'CC BY 4.0', 'sketchfab.com/3d-models/98a05571096f4abb875fb116ace9cd96'],
  ['PIXIE 95', "Milano '95 - Low poly model", 'Daniel Zhabotinsky', 'CC BY 4.0', 'sketchfab.com/3d-models/122a22d210234596ad23623588d0d166'], ['HAULER SW', "Fairheaven SW '84 - Low poly model", 'Daniel Zhabotinsky', 'CC BY 4.0', 'sketchfab.com/3d-models/aa0becb6e854422596cac6b21bf79787'], ['BRUTE 85', "Lightbody Lifted '85 - Low poly model", 'Daniel Zhabotinsky', 'CC BY 4.0', 'sketchfab.com/3d-models/67beae18c3d24be68f9c8f0ec382d8e3'],
  ['GOURAMI LX', 'Gourami - Luxury Saloon', 'Fishboe (ministephen)', 'CC BY 4.0', 'sketchfab.com/3d-models/bf29aca039c447ab913608e3f6818875'], ['WYVERN X', 'Wyvern concept car - FREE', 'NETRUNNER_pl', 'CC BY 4.0', 'sketchfab.com/3d-models/969f16578168435d8f12391001fbd311'], ['HAMMERHEAD', 'Futuristic Muscle car (Launch Control Ready)', 'Jungle Jim (jungle_jim)', 'CC BY 4.0', 'sketchfab.com/3d-models/47d7ffa796d84d1bbdebe9a007028e0e'],
  ['COMET GP', 'Vintage Racing Car', 'SpatialNeglect (jeandiz)', 'CC BY 4.0', 'sketchfab.com/3d-models/0b4cd62e8620486f9b62c32d87d3ed0e'], ['GOBLIN V12', 'Fictional supercar - V12 Goblin', 'ollitei', 'CC BY 4.0', 'sketchfab.com/3d-models/0a20e49ad5774d778567cb5c3f345786'], ['Traffic cars', 'Generic passenger car pack', 'Comrade1280', 'CC BY 4.0', 'sketchfab.com/3d-models/20f9af9b8a404d5cb022ac6fe87f21f5'],
  ['Sky photos', 'Shanghai Bund, Goegap Road, Spiaggia di Mondello, Snowy Hillside', 'Poly Haven', 'CC0', 'polyhaven.com'], ['Surface textures', 'Asphalt, concrete, rock, sand, snow, grass, metal, facade', 'ambientCG', 'CC0', 'ambientcg.com'],
  ['3D engine', 'three.js', 'three.js authors', 'MIT', 'threejs.org'], ['Physics', 'Rapier', 'Dimforge', 'Apache 2.0', 'rapier.rs'],
];

// ---------- textures
const texCache = {};
export async function loadTex(id, map = 'c') {
  const k = id + '_' + map; if (!texCache[k]) texCache[k] = texLoader.loadAsync(url('tex/' + k + '.jpg')).then(t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; if (map === 'c' || map === 'e') t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(ctx.q ? ctx.q.aniso : 4, ctx.renderer.capabilities.getMaxAnisotropy()); return t; });
  return texCache[k];
}
export async function loadSet(id, maps = 'cnr') { const o = {}; await Promise.all([...maps].map(async m => { o[m] = await loadTex(id, m); })); return o; }
// material from a texture set, with its own tiling
export function setMat(set, rx = 1, ry = 1, opts = {}) {
  const c = (t) => { if (!t) return null; const n = t.clone(); n.repeat.set(rx, ry); n.needsUpdate = true; return n; };
  return new THREE.MeshStandardMaterial(Object.assign({ map: c(set.c), normalMap: c(set.n), roughnessMap: c(set.r), roughness: 1, metalness: 0 }, opts));
}

// ---------- sky + environment lighting
const envCache = {};
export async function loadEnv(key) {
  if (envCache[key]) return envCache[key];
  const [mod, sky] = await Promise.all([imp('env/' + key + '.js'), texLoader.loadAsync(url('env/' + key + '.jpg'))]);
  const d = new RGBELoader().setDataType(THREE.HalfFloatType).parse(b64buf(mod.default));
  const t = new THREE.DataTexture(d.data, d.width, d.height, THREE.RGBAFormat, d.type); t.colorSpace = THREE.LinearSRGBColorSpace; t.minFilter = t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; t.flipY = true; t.mapping = THREE.EquirectangularReflectionMapping; t.needsUpdate = true;
  const pm = new THREE.PMREMGenerator(ctx.renderer); const env = pm.fromEquirectangular(t).texture; t.dispose(); pm.dispose();
  sky.colorSpace = THREE.SRGBColorSpace; sky.minFilter = sky.magFilter = THREE.LinearFilter; sky.generateMipmaps = false; sky.wrapS = THREE.RepeatWrapping;
  return envCache[key] = { env, sky };
}

// ---------- geometry helpers
export function plain(g) {
  const o = new THREE.BufferGeometry();
  for (const k of ['position', 'normal', 'uv']) { const a = g.attributes[k]; if (!a) continue; const n = a.itemSize, arr = new Float32Array(a.count * n); for (let i = 0; i < a.count; i++) { arr[i * n] = a.getX(i); arr[i * n + 1] = a.getY(i); if (n > 2) arr[i * n + 2] = a.getZ(i); } o.setAttribute(k, new THREE.BufferAttribute(arr, n)); }
  if (g.index) o.setIndex(new THREE.BufferAttribute(g.index.array.slice(), 1));
  if (!o.attributes.normal) o.computeVertexNormals(); if (!o.attributes.uv) o.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(o.attributes.position.count * 2), 2));
  return o;
}
const isUnder = (o, p) => { for (let n = o.parent; n; n = n.parent) if (n === p) return true; return false; };

function fixMaterial(m, cfg) {
  if (m.userData.fixed) return m; m.userData.fixed = true;
  if (m.transmission) m.transmission = 0;
  const glass = /glass|windshield/i.test(m.name);
  if (glass && !m.map) { m.color.set(0x06080b); m.metalness = 0.9; m.roughness = 0.04; m.transparent = true; m.opacity = 0.84; m.envMapIntensity = 1.6; m.depthWrite = false; }
  else if (m.transparent) { m.depthWrite = false; m.roughness = Math.min(m.roughness, 0.15); }
  else if (m.metalness > 0.9 && m.roughness > 0.85 && !m.roughnessMap && !m.metalnessMap) m.roughness = 0.4;
  if (m.emissive && (m.emissive.r + m.emissive.g + m.emissive.b) > 0.01) m.emissiveIntensity = Math.max(m.emissiveIntensity, 2.2);
  return m;
}
function paintMat(src, cfg) {
  let m;
  if (cfg.hue) { m = src.clone(); if (m.isMeshPhysicalMaterial) { m.clearcoat = 1; m.clearcoatRoughness = 0.05; } if (m.transparent) { m.transparent = false; m.opacity = 1; m.alphaTest = 0.3; m.depthWrite = true; } m.transmission = 0; }
  else { const P = ctx.q && ctx.q.physical; m = P ? new THREE.MeshPhysicalMaterial({ clearcoat: 1, clearcoatRoughness: 0.035 }) : new THREE.MeshStandardMaterial(); m.color.set(cfg.color); m.metalness = 0.62; m.roughness = P ? 0.36 : 0.18; m.side = src.side; }
  m.name = src.name; m.envMapIntensity = 1.15; m.userData.paint = cfg.hue ? 'hue' : 'color'; m.userData.fixed = true; return m;
}

// ---------- hero cars
const carProto = {};
function prepCar(scene, cfg) {
  const car = new THREE.Group(), fit = new THREE.Group(); car.add(fit); fit.add(scene);
  const kill = []; scene.traverse(o => { if (o.isLight || o.isCamera) kill.push(o); }); kill.forEach(o => o.removeFromParent());
  fit.rotation.y = { '+z': 0, '-z': Math.PI, '+x': -Math.PI / 2, '-x': Math.PI / 2 }[cfg.fwd];
  car.updateMatrixWorld(true); B.setFromObject(fit);
  fit.scale.setScalar(cfg.len / (B.max.z - B.min.z)); car.updateMatrixWorld(true); B.setFromObject(fit);
  fit.position.set(-(B.min.x + B.max.x) / 2, -B.min.y, -(B.min.z + B.max.z) / 2); car.updateMatrixWorld(true); B.setFromObject(fit);
  car.userData.dims = { hl: (B.max.z - B.min.z) / 2, hw: (B.max.x - B.min.x) / 2, h: B.max.y };
  // materials
  const pm = new Map();
  scene.traverse(o => { if (!o.isMesh) return; const s = o.material; if (cfg.paint.test(s.name)) { if (!pm.has(s)) pm.set(s, paintMat(s, cfg)); o.material = pm.get(s); } else fixMaterial(s, cfg); o.frustumCulled = false; });
  // wheels: pivot groups so they can spin and steer
  const mkWheel = (objs, c, r) => { const steer = new THREE.Group(), spin = new THREE.Group(); steer.position.copy(c); steer.add(spin); car.add(steer); car.updateMatrixWorld(true); objs.forEach(o => spin.attach(o)); steer.userData.wheel = { r, front: c.z > 0, side: Math.sign(c.x) || 1 }; };
  if (cfg.wheels) { const list = []; scene.traverse(o => { if (cfg.wheels.test(o.name)) list.push(o); }); list.filter(o => !list.some(p => isUnder(o, p))).forEach(o => { B.setFromObject(o); mkWheel([o], B.getCenter(new THREE.Vector3()), (B.max.y - B.min.y) / 2); }); }
  if (cfg.splitMat || cfg.splitNode) {
    const src = []; scene.traverse(o => { if (!o.isMesh) return; if (cfg.splitMat ? cfg.splitMat.test(o.material.name) : (o.parent && (cfg.splitNode.test(o.parent.name) || (o.parent.parent && cfg.splitNode.test(o.parent.parent.name))))) src.push(o); });
    const quad = [0, 1, 2, 3].map(() => ({ objs: [], box: new THREE.Box3() }));
    for (const mesh of src) { const g = mesh.geometry, pos = g.attributes.position, idx = g.index; if (!idx) continue; const bk = [[], [], [], []];
      for (let i = 0; i < idx.count; i += 3) { const a = idx.getX(i); V.fromBufferAttribute(pos, a).applyMatrix4(mesh.matrixWorld); const q = (V.x > 0 ? 1 : 0) + (V.z > 0 ? 2 : 0); bk[q].push(a, idx.getX(i + 1), idx.getX(i + 2)); quad[q].box.expandByPoint(V); V.fromBufferAttribute(pos, idx.getX(i + 1)).applyMatrix4(mesh.matrixWorld); quad[q].box.expandByPoint(V); }
      bk.forEach((b, q) => { if (!b.length) return; const ng = new THREE.BufferGeometry(); for (const k in g.attributes) ng.setAttribute(k, g.attributes[k]); ng.setIndex(b); const nm = new THREE.Mesh(ng, mesh.material); nm.frustumCulled = false; mesh.parent.add(nm); nm.position.copy(mesh.position); nm.quaternion.copy(mesh.quaternion); nm.scale.copy(mesh.scale); nm.updateMatrixWorld(true); quad[q].objs.push(nm); });
      mesh.removeFromParent(); }
    quad.forEach(q => { if (q.objs.length) mkWheel(q.objs, q.box.getCenter(new THREE.Vector3()), (q.box.max.y - q.box.min.y) / 2); });
  }
  if (cfg.parts) scene.traverse(o => { if (cfg.parts.test(o.name)) o.userData.part = 1; });
  return car;
}
export async function loadCar(id) {
  if (!carProto[id]) carProto[id] = (async () => { const mod = await imp('cars/' + id + '.js'); const g = await gltfLoader.parseAsync(b64buf(mod.default), ''); return prepCar(g.scene, CARS[id]); })();
  return carProto[id];
}
// instance of a loaded car: { group, dims, wheels, parts, setPaint }
export async function makeCar(id, color) {
  const proto = await loadCar(id), cfg = CARS[id], group = proto.clone(true), wheels = [], parts = [], mats = new Map();
  group.traverse(o => { if (o.userData.wheel) wheels.push({ steer: o, spin: o.children[0], ...o.userData.wheel }); if (o.userData.part) parts.push(o);
    if (o.isMesh && o.material.userData.paint) { if (!mats.has(o.material)) mats.set(o.material, o.material.clone()); o.material = mats.get(o.material); } });
  const inst = { id, cfg, group, dims: proto.userData.dims, wheels, parts, paintMats: [...mats.values()], color: null,
    setPaint(hex) { if (hex == null || hex === this.color) return; this.color = hex; for (const m of this.paintMats) { if (m.userData.paint === 'hue') { if (!m.userData.src) m.userData.src = m.map; m.map = recolor(m.userData.src, hex, id); } else m.color.set(hex); } } };
  if (color != null) inst.setPaint(color);
  return inst;
}
// recolor a painted texture: rotate the dominant body hue to the target colour
const recCache = {};
function recolor(tex, hex, id) {
  const key = id + hex; if (recCache[key]) return recCache[key];
  const img = tex.image, c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height), a = d.data, hist = new Float32Array(36);
  const hsv = (r, gg, b) => { const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), dl = mx - mn; let h = 0; if (dl) { h = mx === r ? ((gg - b) / dl) % 6 : mx === gg ? (b - r) / dl + 2 : (r - gg) / dl + 4; h /= 6; if (h < 0) h += 1; } return [h, mx ? dl / mx : 0, mx / 255]; };
  for (let i = 0; i < a.length; i += 28) { const [h, s, v] = hsv(a[i], a[i + 1], a[i + 2]); if (s > 0.3 && v > 0.15) hist[Math.min(35, (h * 36) | 0)] += s * v; }
  let hb = 0; for (let i = 1; i < 36; i++) if (hist[i] > hist[hb]) hb = i; const h0 = (hb + 0.5) / 36;
  const tc = new THREE.Color(hex), hsl = {}; tc.getHSL(hsl, THREE.SRGBColorSpace); const achro = hsl.s < 0.18;
  for (let i = 0; i < a.length; i += 4) { let [h, s, v] = hsv(a[i], a[i + 1], a[i + 2]); let dh = h - h0; if (dh > 0.5) dh -= 1; if (dh < -0.5) dh += 1; if (s < 0.2 || Math.abs(dh) > 0.1) continue;
    if (achro) { s *= 0.06; v = Math.min(1, v * (hsl.l > 0.6 ? 1.5 : hsl.l < 0.15 ? 0.22 : 0.85)); } else { h = (hsl.h + dh + 1) % 1; s = Math.min(1, s * (0.75 + hsl.s * 0.4)); v = Math.min(1, v * (0.6 + hsl.l * 0.9)); }
    const f = (n) => { const k = (n + h * 6) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); }; a[i] = f(5) * 255; a[i + 1] = f(3) * 255; a[i + 2] = f(1) * 255; }
  g.putImageData(d, 0, 0);
  const t = new THREE.CanvasTexture(c); t.flipY = tex.flipY; t.colorSpace = tex.colorSpace; t.wrapS = tex.wrapS; t.wrapT = tex.wrapT; t.anisotropy = tex.anisotropy; return recCache[key] = t;
}

// traffic looks like everyday traffic: colours pulled towards grey so the rivals' bright paint pops
const dulled = new WeakSet();
function dull(list) { for (const g of list) g.traverse(o => { if (!o.isMesh) return; for (const m of [].concat(o.material)) { if (!m || dulled.has(m) || !m.isMeshStandardMaterial) continue; dulled.add(m); m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n diffuseColor.rgb = mix(diffuseColor.rgb, vec3(dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114))), 0.62) * 0.92;'); }; m.customProgramCacheKey = () => 'dull'; m.needsUpdate = true; } }); return list; }
// ---------- traffic: split the car pack into single normalized cars + procedural truck and bus
let trafficProto = null;
function prepPack(scene) {
  scene.updateMatrixWorld(true); const bodies = [], wheels = [], out = [];
  scene.traverse(o => { if (/body$/i.test(o.name) && o.children.some(c => c.isMesh)) bodies.push(o); else if (/^Wheel_[A-Z]\d*(_\d+)?$/.test(o.name)) wheels.push(o); });
  const wc = wheels.map(w => B.setFromObject(w).getCenter(new THREE.Vector3()));
  for (const body of bodies) {
    const pts = []; body.traverse(o => { if (!o.isMesh) return; const p = o.geometry.attributes.position; for (let i = 0; i < p.count; i += 3) pts.push(new THREE.Vector3().fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld)); });
    let best = null; for (let a = 0; a < 180; a += 2) { const cs = Math.cos(a * Math.PI / 180), sn = Math.sin(a * Math.PI / 180); let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9; for (const p of pts) { const u = p.x * sn + p.z * cs, v = p.x * cs - p.z * sn; if (u < u0) u0 = u; if (u > u1) u1 = u; if (v < v0) v0 = v; if (v > v1) v1 = v; } const ar = (u1 - u0) * (v1 - v0); if (!best || ar < best.ar) best = { ar, a, len: u1 - u0, wid: v1 - v0, cu: (u0 + u1) / 2, cv: (v0 + v1) / 2, sn, cs }; }
    let phi = best.a * Math.PI / 180, len = best.len, wid = best.wid; if (best.wid > best.len) { phi += Math.PI / 2; len = best.wid; wid = best.len; }
    const cx = best.cu * best.sn + best.cv * best.cs, cz = best.cu * best.cs - best.cv * best.sn;
    if (Math.sin(phi) * -cx + Math.cos(phi) * -cz < 0) phi += Math.PI;   // cars face the centre of the showroom ring
    const M = new THREE.Matrix4().makeRotationY(-phi).multiply(new THREE.Matrix4().makeTranslation(-cx, 0, -cz));
    const mine = wheels.filter((w, i) => { V.copy(wc[i]).applyMatrix4(M); return Math.abs(V.x) < wid / 2 + 0.3 && Math.abs(V.z) < len / 2 + 0.25; });
    const byMat = new Map(); const add = o => o.traverse(m => { if (!m.isMesh) return; const g = plain(m.geometry); g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(M, m.matrixWorld)); if (!byMat.has(m.material)) byMat.set(m.material, []); byMat.get(m.material).push(g); });
    add(body); mine.forEach(add);
    const car = new THREE.Group(); for (const [mat, gs] of byMat) { const g = gs.length > 1 ? mergeGeometries(gs) : gs[0]; if (!g) continue; fixMaterial(mat, {}); const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; car.add(mesh); }
    B.setFromObject(car); car.children.forEach(m => m.position.y = -B.min.y);
    car.userData.dims = { hl: len / 2, hw: wid / 2, h: B.max.y - B.min.y }; car.userData.mass = len > 4.4 ? 1.3 : 1; car.userData.value = len > 4.4 ? 14000 : 9000;
    out.push(car);
  }
  return out;
}
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
function bigRigs(steel, paintSet) {
  const out = [], dark = new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 0.8 }), glass = new THREE.MeshStandardMaterial({ color: 0x05070a, roughness: 0.05, metalness: 0.9 });
  const box = (w, h, l, x, y, z, mat, g) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, l), mat); m.position.set(x, y, z); m.frustumCulled = false; g.add(m); return m; };
  const wheel = (x, z, r, g) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.34, 14), dark); m.rotation.z = Math.PI / 2; m.position.set(x, r, z); m.frustumCulled = false; g.add(m); };
  for (const [cab, trl] of [[0xb5271d, 0xd9dde2], [0x1d4fb5, 0xc9b98a], [0xe8e8e8, 0x3b6ea5]]) {       // articulated trucks
    const g = new THREE.Group(); const tm = setMat(steel, 3, 1, { color: trl, metalness: 0.5 }); tm.roughnessMap = null; tm.roughness = 0.55;
    const cm = new THREE.MeshStandardMaterial({ color: cab, roughness: 0.35, metalness: 0.4, normalMap: paintSet.n });
    box(2.5, 2.75, 10.6, 0, 2.5, -1.6, tm, g); box(2.4, 2.5, 2.3, 0, 1.85, 5.1, cm, g); box(2.2, 0.95, 0.06, 0, 2.45, 6.26, glass, g); box(2.1, 0.4, 12.6, 0, 0.8, -0.4, dark, g); box(2.3, 0.5, 0.2, 0, 0.75, 6.3, dark, g);
    for (const z of [5.2, 2.6, -4.6, -5.8]) { wheel(1.08, z, 0.52, g); wheel(-1.08, z, 0.52, g); }
    g.userData.dims = { hl: 6.6, hw: 1.28, h: 3.9 }; g.userData.mass = 9; g.userData.value = 45000; g.userData.big = 1; out.push(g);
  }
  for (const col of ['#d8a41c', '#2f8f5b']) {                                                         // city buses
    const side = canvasTex(1024, 256, (c, w, h) => { c.fillStyle = col; c.fillRect(0, 0, w, h); c.fillStyle = '#0b0e12'; for (let i = 0; i < 9; i++) c.fillRect(30 + i * 110, 40, 96, 96); c.fillStyle = 'rgba(255,255,255,.85)'; c.fillRect(0, 168, w, 10); c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, 226, w, 30); });
    const front = canvasTex(256, 256, (c, w, h) => { c.fillStyle = col; c.fillRect(0, 0, w, h); c.fillStyle = '#0b0e12'; c.fillRect(16, 28, 224, 120); c.fillStyle = '#ffd98a'; c.fillRect(20, 190, 44, 22); c.fillRect(192, 190, 44, 22); c.fillStyle = '#111'; c.fillRect(0, 226, w, 30); });
    const mk = t => new THREE.MeshStandardMaterial({ map: t, roughness: 0.35, metalness: 0.3 }), top = new THREE.MeshStandardMaterial({ color: col, roughness: 0.5 });
    const g = new THREE.Group(); box(2.55, 2.85, 11.4, 0, 1.9, 0, [mk(side), mk(side), top, dark, mk(front), mk(front)], g);
    for (const z of [3.8, -3.6]) { wheel(1.1, z, 0.5, g); wheel(-1.1, z, 0.5, g); }
    g.userData.dims = { hl: 5.7, hw: 1.3, h: 3.35 }; g.userData.mass = 6; g.userData.value = 60000; g.userData.big = 1; out.push(g);
  }
  return out;
}
export async function loadTraffic() {
  if (!trafficProto) trafficProto = (async () => { const [mod, steel, paint] = await Promise.all([imp('cars/traffic.js'), loadSet('CorrugatedSteel009', 'cn'), loadSet('PaintedMetal004', 'n')]); const g = await gltfLoader.parseAsync(b64buf(mod.default), ''); return dull(prepPack(g.scene).concat(bigRigs(steel, paint))); })();
  return trafficProto;
}
