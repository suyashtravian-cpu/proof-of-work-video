// GREENLIGHT - hover craft (stand-in models built in code).
// The player always flies TWINBLADE in magenta. Rivals fly OBSIDIAN, RONIN or MANTIS, each in 4 glow colours.
// Physics is untouched: every craft uses the same invisible box as the cars; only the look changes.
import * as THREE from 'three';
import { ctx, rand } from './core.js';

export const HOVER_P1 = 0xff2bd6, HOVER_P2 = 0x2ef2ff;
const DESIGNS = ['obsidian', 'ronin', 'mantis'];
const RIVAL_GLOW = [[0xffa31a, 0xff2a1a, 0xffd23f, 0xfff0d0], [0x22e6ff, 0x2f6bff, 0xd8f4ff, 0xff7a1a], [0x9dff1a, 0x18e070, 0xffe81a, 0x19d9b8]];
export const rivalLook = i => ({ design: DESIGNS[i % 3], glow: RIVAL_GLOW[i % 3][Math.floor(i / 3) % 4] });
const HOVER_H = 0.42, DIMS = { hl: 2.45, hw: 1.02, h: 1.25 };

// ---------- geometry helpers
// cross-sections, listed clockwise (seen from the nose) so faces point outwards
const hexS = (w, yb, yt) => { const ym = yb + (yt - yb) * 0.42; return [[-w * 0.5, yt], [w * 0.5, yt], [w, ym], [w * 0.55, yb], [-w * 0.55, yb], [-w, ym]]; };
const gemS = (w, yb, yt) => { const ym = yb + (yt - yb) * 0.55; return [[-w * 0.32, yt], [w * 0.32, yt], [w, ym], [0, yb], [-w, ym]]; };
// loft a hull from tail to nose: secs = [z, halfWidth, bottomY, topY]
function loft(secs, shape) {
  const rings = secs.map(s => shape(s[1], s[2], s[3]).map(([x, y]) => new THREE.Vector3(x, y, s[0]))), pos = [];
  const tri = (a, b, c) => pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  for (let i = 0; i < rings.length - 1; i++) { const A = rings[i], B = rings[i + 1], n = A.length; for (let k = 0; k < n; k++) { const k2 = (k + 1) % n; tri(A[k], B[k], B[k2]); tri(A[k], B[k2], A[k2]); } }
  const cap = (R, flip) => { const c = R.reduce((s, p) => s.add(p), new THREE.Vector3()).multiplyScalar(1 / R.length); for (let k = 0; k < R.length; k++) { const k2 = (k + 1) % R.length; if (flip) tri(c, R[k2], R[k]); else tri(c, R[k], R[k2]); } };
  cap(rings[0], false); cap(rings[rings.length - 1], true);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
  // the outer light line: runs along the widest point of each section towards the nose
  const pts = []; rings.forEach((R, i) => { if (secs[i][0] < 0.25 || secs[i][1] < 0.05) return; let o = R[0]; for (const p of R) if (p.x > o.x) o = p; pts.push(new THREE.Vector3(o.x + 0.015, o.y, o.z)); });
  return { g, pts };
}
// a flat side fin from (z, y) points, a few cm thick
function fin(pts, t = 0.05) { const sh = new THREE.Shape(pts.map(([z, y]) => new THREE.Vector2(z, y))); const g = new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: false }); g.rotateY(-Math.PI / 2); g.translate(t / 2, 0, 0); return g; }

const SPEC = {
  twinblade: { shape: hexS, cx: 0.62, secs: [[-2.45, 0.28, 0.22, 0.55], [-2.15, 0.37, 0.12, 0.67], [-1.0, 0.4, 0.08, 0.72], [0.3, 0.4, 0.08, 0.7], [1.25, 0.33, 0.12, 0.58], [1.95, 0.2, 0.18, 0.45], [2.5, 0.02, 0.27, 0.31]],
    fin: [[-2.35, 0.6], [-1.35, 0.66], [-2.45, 1.12]], body: [0xe9e7ee, 0.15, 0.2, 1], finCol: 0xe9e7ee },
  obsidian: { shape: gemS, cx: 0.62, secs: [[-2.4, 0.26, 0.24, 0.6], [-2.0, 0.4, 0.07, 0.8], [-0.5, 0.42, 0.05, 0.76], [0.7, 0.38, 0.1, 0.68], [1.65, 0.26, 0.17, 0.5], [2.45, 0.02, 0.3, 0.33]],
    fin: [[-2.3, 0.7], [-1.5, 0.74], [-2.45, 1.22]], body: [0x0b0b10, 0.65, 0.1, 1], edges: 0xd9a441 },
  ronin: { shape: hexS, cx: 0.62, secs: [[-2.45, 0.28, 0.22, 0.56], [-2.1, 0.38, 0.1, 0.7], [-1.35, 0.4, 0.08, 0.73], [-1.33, 0.35, 0.12, 0.66], [-0.4, 0.4, 0.08, 0.72], [-0.38, 0.35, 0.12, 0.65], [0.55, 0.39, 0.09, 0.69], [0.57, 0.34, 0.13, 0.62], [1.4, 0.32, 0.15, 0.6], [2.0, 0.2, 0.26, 0.52], [2.5, 0.02, 0.44, 0.5]],
    fin: [[-2.3, 0.66], [-1.5, 0.7], [-1.85, 0.95], [-2.55, 1.38], [-2.4, 0.98]], body: [0x9e0f16, 0.3, 0.22, 1], edges: 0xe0b04a },
  mantis: { shape: gemS, cx: 0.6, secs: [[-2.45, 0.24, 0.24, 0.56], [-2.1, 0.34, 0.12, 0.66], [-1.5, 0.36, 0.1, 0.68], [-1.48, 0.31, 0.14, 0.62], [-0.8, 0.35, 0.1, 0.66], [-0.78, 0.3, 0.14, 0.6], [-0.1, 0.33, 0.12, 0.63], [-0.08, 0.28, 0.16, 0.58], [0.7, 0.3, 0.14, 0.58], [1.5, 0.22, 0.2, 0.5], [2.2, 0.12, 0.26, 0.42], [2.8, 0.01, 0.32, 0.35]],
    wings: true, body: [0x07080a, 0.75, 0.18, 1], iri: true },
};
const geoCache = {};
function geos(id) {
  if (geoCache[id]) return geoCache[id]; const S = SPEC[id], { g, pts } = loft(S.secs, S.shape), o = { hull: g, edges: S.edges ? new THREE.EdgesGeometry(g, 28) : null };
  o.slit = pts.length > 1 ? new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.024, 5) : null;
  if (S.fin) { o.fin = fin(S.fin); if (S.edges) o.finEdges = new THREE.EdgesGeometry(o.fin, 28); }
  if (S.wings) { const sh = new THREE.Shape([[-0.5, 0.66], [-1.2, 1.12], [-2.1, 1.3], [-2.75, 1.05], [-2.2, 0.82]].map(([z, y]) => new THREE.Vector2(z, y))); o.wing = new THREE.ShapeGeometry(sh); o.wing.rotateY(-Math.PI / 2);
    const vp = [], r = [-0.5, 0.66]; for (const [z, y] of [[-1.2, 1.12], [-1.7, 1.24], [-2.1, 1.3], [-2.5, 1.18], [-2.75, 1.05], [-2.2, 0.82]]) vp.push(0, r[1], r[0], 0, y, z); o.veins = new THREE.BufferGeometry(); o.veins.setAttribute('position', new THREE.Float32BufferAttribute(vp, 3)); }
  o.engine = new THREE.CircleGeometry(0.15, 14); o.engine.rotateY(Math.PI);
  o.core = new THREE.CylinderGeometry(0.1, 0.1, 3.6, 10); o.core.rotateX(Math.PI / 2); o.sheath = new THREE.CylinderGeometry(0.17, 0.17, 3.7, 12, 1, true); o.sheath.rotateX(Math.PI / 2);
  o.tube = new THREE.CylinderGeometry(0.045, 0.045, 3.2, 8); o.tube.rotateX(Math.PI / 2); o.bridge = new THREE.BoxGeometry(0.5, 0.028, 0.05);
  o.pod = id === 'obsidian' ? new THREE.IcosahedronGeometry(0.34, 0).scale(1, 0.72, 1.9) : id === 'mantis' ? new THREE.IcosahedronGeometry(0.31, 2).scale(1, 0.78, 1.55)
    : id === 'ronin' ? new THREE.SphereGeometry(0.33, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2).scale(0.92, 0.95, 1.9) : new THREE.SphereGeometry(0.3, 22, 14);
  return geoCache[id] = o;
}
let gTex = null;
const glowTex = () => { if (gTex) return gTex; const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return gTex = new THREE.CanvasTexture(c); };

function bodyMat(S) {
  const [col, metal, rough, cc] = S.body, P = ctx.q && ctx.q.physical; let m;
  if (P) { m = new THREE.MeshPhysicalMaterial({ color: col, metalness: metal, roughness: rough, clearcoat: cc, clearcoatRoughness: 0.06 }); if (S.iri) { m.iridescence = 1; m.iridescenceIOR = 1.7; m.iridescenceThicknessRange = [250, 900]; } }
  else m = new THREE.MeshStandardMaterial({ color: S.iri ? 0x0b1a16 : col, metalness: metal, roughness: rough });
  m.envMapIntensity = 1.4; m.flatShading = true; return m;
}
const add = (parent, geo, mat, x = 0, y = 0, z = 0, noDef) => { const m = geo.isBufferGeometry && mat.isLineBasicMaterial ? new THREE.LineSegments(geo, mat) : new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.frustumCulled = false; if (noDef) m.userData.noDeform = 1; parent.add(m); return m; };

// build a craft instance that plugs into Player / Rival exactly like a car instance
export function makeCraft(id, glow, cfg, locked) {
  const S = SPEC[id], G = geos(id), group = new THREE.Group(), float = new THREE.Group(); group.add(float); float.position.y = HOVER_H;
  const body = bodyMat(S), finMat = S.finCol ? bodyMat({ body: [S.finCol, 0.15, 0.2, 1] }) : body, dark = new THREE.MeshStandardMaterial({ color: 0x050507, metalness: 0.4, roughness: 0.05 }); dark.envMapIntensity = 1.6;
  const gc = new THREE.Color(glow), core = new THREE.MeshBasicMaterial({ color: gc.clone().multiplyScalar(1.7) }), light = new THREE.MeshBasicMaterial({ color: gc.clone().multiplyScalar(1.6) });
  const sheath = new THREE.MeshBasicMaterial({ color: gc, transparent: true, opacity: 0.28, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const under = new THREE.MeshBasicMaterial({ map: glowTex(), color: gc, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false });
  const edge = S.edges ? new THREE.LineBasicMaterial({ color: S.edges }) : null;
  const wingM = S.wings ? new THREE.MeshBasicMaterial({ color: gc.clone().multiplyScalar(0.55), transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }) : null, veinM = S.wings ? new THREE.LineBasicMaterial({ color: gc.clone().multiplyScalar(1.6), transparent: true, opacity: 0.9 }) : null;
  // one hull (outer side faces +x); the left hull is a mirror copy
  const hullUnit = () => { const u = new THREE.Group(); add(u, G.hull, body); if (G.edges) add(u, G.edges, edge, 0, 0, 0, 1);
    if (G.fin) { add(u, G.fin, finMat); if (G.finEdges) add(u, G.finEdges, edge, 0, 0, 0, 1); }
    if (G.wing) { const w = new THREE.Group(); w.position.set(0, 0.66, -0.5); w.rotation.z = -0.5; const wm = add(w, G.wing, wingM, 0, -0.66, 0.5, 1); wm.renderOrder = 3; add(w, G.veins, veinM, 0, -0.66, 0.5, 1); u.add(w); }
    if (G.slit) add(u, G.slit, light, 0, 0, 0, 1); add(u, G.engine, light, 0, 0.38, S.secs[0][0] - 0.02, 1); return u; };
  const hR = hullUnit(), hL = hullUnit(); hR.position.x = S.cx; hL.position.x = -S.cx; hL.scale.x = -1; float.add(hL, hR);
  // the channel: energy core, glass sheath, side tubes, light bridges, pilot pod
  add(float, G.core, core, 0, 0.36, -0.1, 1); const sh = add(float, G.sheath, sheath, 0, 0.36, -0.1, 1); sh.renderOrder = 3;
  add(float, G.tube, core, 0.11, 0.26, -0.1, 1); add(float, G.tube, core, -0.11, 0.26, -0.1, 1);
  const bridges = [1.35, 0.7, -0.95, -1.6].map(z => add(float, G.bridge, light, 0, 0.56, z, 1));
  const pod = add(float, G.pod, dark, 0, id === 'ronin' ? 0.5 : 0.62, -0.2);
  if (id === 'ronin') add(float, new THREE.BoxGeometry(0.34, 0.035, 0.04), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffc54a).multiplyScalar(2) }), 0, 0.66, 0.38, 1);
  const ug = add(group, new THREE.PlaneGeometry(DIMS.hw * 2 + 1.8, DIMS.hl * 2 + 1.6), under, 0, 0.06, 0, 1); ug.rotation.x = -Math.PI / 2; ug.renderOrder = 2;
  const glowMats = [core, light, sheath, under];
  const hv = { float, under: ug, hulls: [hL, hR], bridges, sheathMesh: sh, gc, dead: false, t: Math.random() * 10, ph: Math.random() * 6.28, lean: 0,
    setGlow(hex) { gc.set(hex); core.color.copy(gc).multiplyScalar(1.7); light.color.copy(gc).multiplyScalar(1.6); sheath.color.copy(gc); under.color.copy(gc); if (wingM) { wingM.color.copy(gc).multiplyScalar(0.55); veinM.color.copy(gc).multiplyScalar(1.6); } },
    // every frame while driving: hover bob, lean, pulsing core
    frame(dt, lean, hot) { if (this.dead) return; this.t += dt; float.position.y = HOVER_H + Math.sin(this.t * 2.4 + this.ph) * 0.045; this.lean += (lean - this.lean) * Math.min(1, dt * 8); float.rotation.z = this.lean;
      const k = 1.6 + 0.35 * Math.sin(this.t * 7 + this.ph) + (hot ? 0.9 : 0); core.color.copy(gc).multiplyScalar(k); light.color.copy(gc).multiplyScalar(1.5 + 0.35 * Math.sin(this.t * 13 + this.ph) + (hot ? 0.6 : 0)); sheath.opacity = 0.24 + (hot ? 0.18 : 0) + 0.06 * Math.sin(this.t * 9); },
    // takedown: bridges snap, core bursts, glow dies, craft drops and splits into left hull, right hull and pod
    crash(v, lin) { if (this.dead) return; this.dead = true; const fx = ctx.fx, c = gc;
      float.position.y = 0.06; float.rotation.z = 0; for (const b of bridges) b.visible = false; sh.visible = false; ug.visible = false; core.color.copy(c).multiplyScalar(0.12); light.color.copy(c).multiplyScalar(0.18);
            const n = Math.round(12 * ctx.q.particles); for (let i = 0; i < n; i++) { const a = rand(0, 6.283), sp = rand(7, 15); fx.glow.emit(v.x, v.y + 0.7, v.z, lin.x * 0.5 + Math.cos(a) * sp, rand(1, 6), lin.z * 0.5 + Math.sin(a) * sp, rand(0.18, 0.32), rand(0.22, 0.4), 0.05, c.r * 1.1, c.g * 1.1, c.b * 1.1, 1, 1.5, 0); }
      const rx = Math.cos(v.yaw), rz = -Math.sin(v.yaw); this.hulls.forEach((h, k) => { const sd = k ? 1 : -1, sp = rand(6, 10); fx.part(h, lin.x * 0.75 + rx * sd * sp, rand(3.5, 6.5), lin.z * 0.75 + rz * sd * sp, v.y); }); },
    reset() { this.dead = false; for (const b of bridges) b.visible = true; sh.visible = true; ug.visible = true; for (const h of this.hulls) h.visible = true; float.position.y = HOVER_H; this.setGlow(gc.getHex()); } };
  const inst = { id: 'craft-' + id, cfg, group, dims: { ...DIMS }, wheels: [], parts: [hL, hR], paintMats: [body], color: glow, hover: hv, glowMats,
    setPaint(hex) { if (locked || hex == null || hex === this.color) return; this.color = hex; hv.setGlow(hex); } };
  if (ctx.q && ctx.q.shadows) group.traverse(o => { if (o.isMesh && !o.userData.noDeform) o.castShadow = true; });
  return inst;
}
