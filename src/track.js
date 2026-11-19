// GREENLIGHT - tracks: path building, road and scenery for each city
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ctx, clamp, lerp, rng, wrapPi } from './core.js';
import { loadSet, setMat, loadEnv } from './assets.js';
import { glowTex } from './fx.js';

export const LANE = 4.8, DS = 4;

// segments: [length m, turn deg (+ = right), rise m]
export const CITIES = {
  neon: { name: 'NEON DISTRICT', tag: 'Night rain, city corners and a bridge jump', lanes: 2, laps: 2,
    segs: [[700], [170, 90], [300, 0, -4], [120, -45], [260], [60, 0, 5, 'j'], [40, 0, -8, 'd'], [200, 0, 3], [140, 45], [260, 0, 4], [170, 90], [250], [120, 0, -7], [170], [120, 0, 7], [240], [150, 90], [330], [200, -60], [240], [190, 60], [180], [165, 90], [300]], tunnels: [[12, 14]],
    theme: { psky: { zen: 0x030214, mid: 0x1c0a3c, hor: 0x6a1d6e, sunC: 0xff4fd8, sunS: 0, cloud: 0.35, stars: 0.35 }, env: 'neon', night: true, fog: [0x1c0b2e, 0.0034], sun: [0.35, 0.8, 0.45], sunC: 0x9db4ff, sunI: 0.8, hemi: [0x4a5078, 0x1a1420, 0.9], envI: 2.4, skyI: 1.0, skyBoost: 0.5, road: 'Asphalt025C', roadTint: '#5c5f69', roadRough: 0.4, roadEnv: 1.0, weather: 'rain', view: 520, traffic: 15, bloom: [0.6, 0.5, 0.95], horizon: [0.0, 0.09] } },
  desert: { name: 'MIRAGE HIGHWAY', tag: 'Dusk straights and three dune jumps', lanes: 3, laps: 2,
    segs: [[720], [400, -60, 4], [260, 0, 2], [70, 0, 7, 'j'], [50, 0, -11, 'd'], [300, 0, 2], [380, -75], [220, 40], [220, -40], [600], [80, 0, 8, 'j'], [50, 0, -12, 'd'], [260, 0, 4], [420, -95, -3], [300, 0, 3], [60, 0, 6, 'j'], [45, 0, -9, 'd'], [380, -90, 2], [500, 0, -3], [300, -40]], tunnels: [],
    theme: { expo: 1.18, psky: { zen: 0x1a0f3f, mid: 0x8a2d6c, hor: 0xff7a40, sunC: 0xff8a4a, sunS: 1.3, cloud: 0.45, stars: 0.35 }, env: 'desert', fog: [0xd9704e, 0.00115], sun: [0.79, 0.07, 0.6], sunC: 0xff8f52, sunI: 2.6, hemi: [0x8678c9, 0x5a3a2e, 0.6], envI: 1.0, skyI: 1.0, skyBoost: 0.4, roadLift: '#46423c', road: 'Asphalt033', roadTint: '#b8b2aa', roadRough: 0.95, roadEnv: 0.5, weather: 'dust', view: 950, traffic: 17, bloom: [0.42, 0.55, 0.95] } },
  coast: { name: 'AZURE COAST', tag: 'Sunset cliffs, a tunnel and two big jumps', lanes: 2, laps: 2,
    segs: [[520], [300, 60, 4], [220, 0, 3], [60, 0, 6, 'j'], [40, 0, -9, 'd'], [160, 0, -2], [260, -55, -3], [240, 70], [380], [200, 50, -3], [300, 0, 2], [70, 0, 6, 'j'], [45, 0, -10, 'd'], [200, 0, 2], [280, 85, 5], [200, -40], [250, 75, -4], [500], [240, 115], [300]], tunnels: [[8, 8]],
    theme: { psky: { zen: 0x2b3d9a, mid: 0xb5639e, hor: 0xffb27a, sunC: 0xffc08a, sunS: 1, cloud: 0.75, stars: 0 }, env: 'coast', fog: [0xe9a184, 0.0011], sun: [0.62, 0.16, 0.77], sunC: 0xffb072, sunI: 3.0, hemi: [0x9fa6e8, 0x5c4640, 0.65], envI: 1.0, skyI: 1.1, skyBoost: 0.8, roadLift: '#484848', road: 'Asphalt033', roadTint: '#b4b4b4', roadRough: 0.62, roadEnv: 0.75, weather: null, view: 900, traffic: 15, bloom: [0.38, 0.55, 0.95] } },
  snow: { name: 'FROSTPEAK PASS', tag: 'Aurora nights, big drops and two jumps', lanes: 2, laps: 2,
    segs: [[450], [200, -70, 8], [240, 0, 10], [60, 0, 5, 'j'], [40, 0, -9, 'd'], [160, 60, -4], [180, -80, 3], [320, 0, -10], [150, -90, -6], [280, 0, -6], [70, 0, 6, 'j'], [45, 0, -10, 'd'], [200, 50, 2], [220, -70], [480, 0, 8], [170, -85], [260, 0, -4], [160, 45], [190, -75], [380], [180, -45]], tunnels: [[9, 9]],
    theme: { psky: { zen: 0x040919, mid: 0x0f1f48, hor: 0x2e4a7c, sunC: 0xcfdcff, sunS: 0.45, cloud: 0.25, stars: 1.0, aur: 0.9 }, expo: 1.3, night: true, env: 'snow', fog: [0x16223a, 0.0024], sun: [0.35, 0.5, -0.79], sunC: 0xa8bfff, sunI: 1.2, hemi: [0x6a7cb0, 0x2a2e3e, 1.0], envI: 1.1, skyI: 0.85, skyBoost: 0.25, roadLift: '#303236', road: 'Asphalt025C', roadTint: '#9aa0a8', roadRough: 0.55, roadEnv: 0.45, weather: 'snow', view: 430, traffic: 13, bloom: [0.5, 0.5, 0.9] } },
};

// ---------- path building (no rendering; also used by tests)
export function buildPath(segsIn, closed) {
  const segs = segsIn.map(s => [s[0], s[1] || 0, s[2] || 0, s[3] || '']), R = Math.PI / 180;
  const integ = () => { let x = 0, z = 0, th = 0; const st = []; for (let k = 0; k < segs.length; k++) { const [len, turn] = segs[k]; if (!turn) { if (!segs[k][3]) st.push([k, Math.sin(th), Math.cos(th), len]); x += Math.sin(th) * len; z += Math.cos(th) * len; } else { const n = Math.ceil(len), dth = -turn * R / n, dl = len / n; for (let i = 0; i < n; i++) { th += dth / 2; x += Math.sin(th) * dl; z += Math.cos(th) * dl; th += dth / 2; } } } return { x, z, st }; };
  if (closed) { const e = integ(); let best = null;   // close the loop by resizing the pair of straights that needs the least change
    for (const a of e.st) for (const b of e.st) { if (a[0] >= b[0]) continue; const det = a[1] * b[2] - a[2] * b[1]; if (Math.abs(det) < 0.25) continue; const da = (-e.x * b[2] + e.z * b[1]) / det, db = (-a[1] * e.z + a[2] * e.x) / det; if (a[3] + da < 140 || b[3] + db < 140) continue; const sc = Math.abs(da) + Math.abs(db); if (!best || sc < best.sc) best = { sc, a, b, da, db }; }
    if (best) { segs[best.a[0]][0] += best.da; segs[best.b[0]][0] += best.db; } }
  const kap = [], slp = [], segS = [0]; for (const [len, turn, rise] of segs) { const n = Math.max(1, Math.round(len / 2)); for (let i = 0; i < n; i++) { kap.push(-turn * R / (n * 2)); slp.push(rise / (n * 2)); } segS.push(kap.length * 2); }
  if (kap.length % 2) { kap.push(0); slp.push(0); }
  const smooth = (a, w, pass) => { const n = a.length; for (let p = 0; p < pass; p++) { const o = a.slice(); for (let i = 0; i < n; i++) { let s = 0; for (let k = -w; k <= w; k++) { let j = i + k; j = closed ? (j % n + n) % n : clamp(j, 0, n - 1); s += o[j]; } a[i] = s / (2 * w + 1); } } };
  if (closed) { smooth(kap, 14, 2); smooth(slp, 5, 2); }
  const n2 = kap.length, X = [0], Y = [0], Z = [0]; let th = 0, x = 0, y = 0, z = 0;
  for (let i = 0; i < n2; i++) { th += kap[i]; x += Math.sin(th) * 2; z += Math.cos(th) * 2; th += kap[i]; y += slp[i] * 2; X.push(x); Y.push(y); Z.push(z); }
  const gap = Math.hypot(X[n2], Z[n2]);
  if (closed) { const ex = X[n2], ey = Y[n2], ez = Z[n2]; for (let i = 0; i <= n2; i++) { const f = i / n2; X[i] -= ex * f; Y[i] -= ey * f; Z[i] -= ez * f; } }
  const n = closed ? n2 / 2 : n2 / 2 + 1, px = new Float32Array(n), py = new Float32Array(n), pz = new Float32Array(n);
  for (let i = 0; i < n; i++) { px[i] = X[i * 2]; py[i] = Y[i * 2]; pz[i] = Z[i * 2]; }
  return { n, L: (closed ? n : n - 1) * DS, closed, px, py, pz, segS, gap };
}

export class Track {
  constructor(path, lanes) {
    Object.assign(this, path); this.lanes = lanes; this.W = lanes * LANE + 0.5; const n = this.n;
    this.th = new Float32Array(n); this.kap = new Float32Array(n); this.slope = new Float32Array(n); this.clr = new Float32Array(n).fill(1e4);
    const I = i => this.closed ? (i % n + n) % n : clamp(i, 0, n - 1);
    for (let i = 0; i < n; i++) { const a = I(i - 1), b = I(i + 1), dx = this.px[b] - this.px[a], dz = this.pz[b] - this.pz[a]; this.th[i] = Math.atan2(dx, dz); this.slope[i] = (this.py[b] - this.py[a]) / (Math.hypot(dx, dz) || 1); }
    for (let i = 0; i < n; i++) this.kap[i] = this.closed || (i > 0 && i < n - 1) ? wrapPi(this.th[I(i + 1)] - this.th[I(i - 1)]) / (2 * DS) : 0;
    this.minY = 1e9; this.cx = 0; this.cz = 0; for (let i = 0; i < n; i++) { this.minY = Math.min(this.minY, this.py[i]); this.cx += this.px[i] / n; this.cz += this.pz[i] / n; }
    if (this.closed) { const gapN = Math.round(160 / DS); for (let i = 0; i < n; i++) { let m = 1e12; for (let j = 0; j < n; j += 2) { let k = Math.abs(i - j); k = Math.min(k, n - k); if (k < gapN) continue; const dx = this.px[i] - this.px[j], dz = this.pz[i] - this.pz[j], q = dx * dx + dz * dz; if (q < m) m = q; } this.clr[i] = Math.sqrt(m); } }
    this._s = 0; this._d = 0;
  }
  wrap(s) { const L = this.L; return this.closed ? ((s % L) + L) % L : clamp(s, 0, L); }
  delta(a, b) { let d = a - b; if (this.closed) { const L = this.L; d = ((d + L / 2) % L + L) % L - L / 2; } return d; }
  i(s) { const n = this.n; let i = Math.round(s / DS); return this.closed ? (i % n + n) % n : clamp(i, 0, n - 1); }
  lane(k) { return (k + 0.5) * LANE; }
  limit(hw) { return this.W + 0.45 - hw; }
  at(s, d, o) {
    const n = this.n, u = s / DS; let i = Math.floor(u), j; const f = u - i;
    if (this.closed) { i = (i % n + n) % n; j = (i + 1) % n; } else { i = clamp(i, 0, n - 2); j = i + 1; }
    const th = this.th[i] + wrapPi(this.th[j] - this.th[i]) * clamp(f, 0, 1), rx = -Math.cos(th), rz = Math.sin(th);
    o.x = lerp(this.px[i], this.px[j], f) + rx * d; o.z = lerp(this.pz[i], this.pz[j], f) + rz * d; o.y = lerp(this.py[i], this.py[j], f);
    o.th = th; o.rx = rx; o.rz = rz; o.slope = lerp(this.slope[i], this.slope[j], f); o.kap = lerp(this.kap[i], this.kap[j], f); return o;
  }
  // nearest point on the centre line: sets _s, _d and returns the sample index
  project(x, z, hint) {
    const n = this.n; let bi = hint, bd = 1e18;
    for (let k = -6; k <= 14; k++) { let i = hint + k; if (this.closed) i = (i % n + n) % n; else if (i < 0 || i >= n) continue; const dx = x - this.px[i], dz = z - this.pz[i], q = dx * dx + dz * dz; if (q < bd) { bd = q; bi = i; } }
    if (bd > 1600) for (let i = 0; i < n; i++) { const dx = x - this.px[i], dz = z - this.pz[i], q = dx * dx + dz * dz; if (q < bd) { bd = q; bi = i; } }
    const th = this.th[bi], tx = Math.sin(th), tz = Math.cos(th), dx = x - this.px[bi], dz = z - this.pz[bi];
    this._s = this.wrap(bi * DS + dx * tx + dz * tz); this._d = -dx * tz + dz * tx; return bi;
  }
  curveAhead(s, dist) { let m = 0; for (let a = 0; a <= dist; a += 8) m = Math.max(m, Math.abs(this.kap[this.i(s + a)])); return m; }
}

// ---------- mesh helpers
const O = {}, M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P3 = new THREE.Vector3(), S3 = new THREE.Vector3(), C3 = new THREE.Color();
const hash = (x, z) => { let h = Math.imul(x, 374761393) + Math.imul(z, 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const noise2 = (x, z) => { const xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz); return lerp(lerp(hash(xi, zi), hash(xi + 1, zi), u), lerp(hash(xi, zi + 1), hash(xi + 1, zi + 1), u), v) * 2 - 1; };
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// ribbon along the track: colFn(i, c) fills K columns of [d, y, u, r, g, b]
function strip(tr, K, colFn, vScale, skip, color) {
  const n = tr.n, rows = tr.closed ? n + 1 : n, pos = new Float32Array(rows * K * 3), uv = new Float32Array(rows * K * 2), col = color ? new Float32Array(rows * K * 3) : null, idx = [], c = [];
  for (let r = 0; r < rows; r++) { const i = r % n, th = tr.th[i], rx = -Math.cos(th), rz = Math.sin(th); colFn(i, c);
    for (let k = 0; k < K; k++) { const o = r * K + k; pos[o * 3] = tr.px[i] + rx * c[k * 6]; pos[o * 3 + 1] = tr.py[i] + c[k * 6 + 1]; pos[o * 3 + 2] = tr.pz[i] + rz * c[k * 6]; uv[o * 2] = c[k * 6 + 2]; uv[o * 2 + 1] = r * DS / vScale; if (col) { col[o * 3] = c[k * 6 + 3]; col[o * 3 + 1] = c[k * 6 + 4]; col[o * 3 + 2] = c[k * 6 + 5]; } }
    if (r < rows - 1 && !(skip && (skip(i) || skip((i + 1) % n)))) for (let k = 0; k < K - 1; k++) { const a = r * K + k, b = a + 1, cc = a + K, d = cc + 1; idx.push(a, b, cc, b, d, cc); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); if (col) g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
class MB {
  constructor() { this.p = []; this.u = []; this.c = []; this.i = []; }
  quad(a, b, c, d, u0 = 0, v0 = 0, u1 = 1, v1 = 1, col) { const n = this.p.length / 3; this.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], d[0], d[1], d[2]); this.u.push(u0, v0, u1, v0, u1, v1, u0, v1); if (col) for (let k = 0; k < 4; k++) this.c.push(col[0], col[1], col[2]); this.i.push(n, n + 1, n + 2, n, n + 2, n + 3); }
  box(x, y, z, sx, sy, sz, ry, tu, tv, col, top = true, uo = 0) { const cs = Math.cos(ry), sn = Math.sin(ry), hx = sx / 2, hz = sz / 2, P = (lx, ly, lz) => [x + lx * cs + lz * sn, y + ly, z - lx * sn + lz * cs];
    this.quad(P(-hx, 0, hz), P(hx, 0, hz), P(hx, sy, hz), P(-hx, sy, hz), uo, 0, uo + sx / tu, sy / tv, col); this.quad(P(hx, 0, -hz), P(-hx, 0, -hz), P(-hx, sy, -hz), P(hx, sy, -hz), uo, 0, uo + sx / tu, sy / tv, col);
    this.quad(P(hx, 0, hz), P(hx, 0, -hz), P(hx, sy, -hz), P(hx, sy, hz), uo, 0, uo + sz / tu, sy / tv, col); this.quad(P(-hx, 0, -hz), P(-hx, 0, hz), P(-hx, sy, hz), P(-hx, sy, -hz), uo, 0, uo + sz / tu, sy / tv, col);
    if (top) this.quad(P(-hx, sy, hz), P(hx, sy, hz), P(hx, sy, -hz), P(-hx, sy, -hz), 0, 0, 0.01, 0.01, col); }
  build() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2)); if (this.c.length) g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.setIndex(this.i); g.computeVertexNormals(); return g; }
  get empty() { return !this.i.length; }
}
const PSKY_FS = `uniform vec3 uZen, uMid, uHor, uFog, uSunC, uSunD; uniform float uSunS, uStars, uAur, uCloud, uT; varying vec3 vD;
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float h31(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * vn(p); p *= 2.03; a *= 0.5; } return s; }
void main(){ vec3 d = normalize(vD); float h = d.y; vec3 c = mix(uHor, uMid, smoothstep(0.0, 0.2, h)); c = mix(c, uZen, smoothstep(0.16, 0.75, h)); float sd = max(dot(d, uSunD), 0.0);
  c += uSunC * (pow(sd, 1600.0) * 30.0 * uSunS + pow(sd, 18.0) * 0.6 * (0.3 + 0.7 * uSunS) + pow(sd, 4.0) * 0.22);
  vec2 cp = d.xz / max(h + 0.12, 0.06) * 0.9 + vec2(uT * 0.006, uT * 0.002); float n = fbm(cp * 1.4), cl = smoothstep(0.52, 0.8, n) * smoothstep(-0.02, 0.22, h) * uCloud; vec3 cc = mix(uMid * 0.9 + uHor * 0.4, uSunC * 1.4, pow(sd, 3.0)); c = mix(c, cc, cl * 0.8);
  if (uStars > 0.0) { vec3 q = floor(d * 420.0); float st = step(0.9968, h31(q)) * (0.6 + 0.4 * sin(uT * 1.5 + h31(q + 7.0) * 30.0)); c += vec3(st) * uStars * smoothstep(0.06, 0.45, h) * (1.0 - cl); }
  if (uAur > 0.0) { float a = sin(d.x * 4.0 + d.z * 2.5 + uT * 0.12 + sin(d.z * 5.0 - uT * 0.09) * 1.6) * 0.5 + 0.5, band = pow(a, 14.0) * (0.55 + 0.45 * sin(d.x * 90.0 + d.z * 40.0 + uT * 0.8)) * smoothstep(0.12, 0.28, h) * smoothstep(0.62, 0.32, h); c += (vec3(0.1, 1.0, 0.6) * band + vec3(0.6, 0.15, 1.0) * band * band * 0.6) * uAur; }
  c = mix(uFog, c, smoothstep(-0.05, 0.07, h)); gl_FragColor = vec4(c, 1.0);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
function pskyMat(PS, T) { return new THREE.ShaderMaterial({ uniforms: { uZen: { value: new THREE.Color(PS.zen) }, uMid: { value: new THREE.Color(PS.mid) }, uHor: { value: new THREE.Color(PS.hor) }, uFog: { value: new THREE.Color(T.fog[0]) }, uSunC: { value: new THREE.Color(PS.sunC) }, uSunD: { value: new THREE.Vector3(...T.sun).normalize() }, uSunS: { value: PS.sunS ?? 1 }, uStars: { value: PS.stars || 0 }, uAur: { value: PS.aur || 0 }, uCloud: { value: PS.cloud ?? 0.6 }, uT: { value: 0 } }, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position.z = gl_Position.w * 0.99995; }', fragmentShader: PSKY_FS }); }
const brk = (world, m, list, r, heavy) => { if (m.isInstancedMesh) (world.breakables = world.breakables || []).push({ m, list, r, heavy, broken: new Map() }); return m; };
function inst(geo, mat, list) {
  if (!list.length) return new THREE.Group(); const m = new THREE.InstancedMesh(geo, mat, list.length);
  list.forEach((o, i) => { E.set(o.rx || 0, o.ry || 0, o.rz || 0, 'YXZ'); Q.setFromEuler(E); P3.set(o.x, o.y, o.z); S3.set(o.sx ?? o.s ?? 1, o.sy ?? o.s ?? 1, o.sz ?? o.s ?? 1); m.setMatrixAt(i, M4.compose(P3, Q, S3)); if (o.c !== undefined) m.setColorAt(i, C3.set(o.c).multiplyScalar(o.ci || 1)); });
  m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; m.frustumCulled = false; return m;
}
function canvasTex(w, h, draw, srgb = true) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
function roadTexture(img, W, lanes, tint, lift) {
  return canvasTex(1024, 512, (g) => { const ppm = 1024 / (2 * W);
    for (let x = 0; x < 1024; x += 256) for (let y = 0; y < 512; y += 256) g.drawImage(img, x, y, 256, 256);
    g.globalCompositeOperation = 'multiply'; g.fillStyle = tint; g.fillRect(0, 0, 1024, 512); if (lift) { g.globalCompositeOperation = 'screen'; g.fillStyle = lift; g.fillRect(0, 0, 1024, 512); } g.globalCompositeOperation = 'source-over'; g.globalAlpha = 0.85;
    const line = (d, w, col, dash) => { g.fillStyle = col; g.fillRect((d + W) * ppm - w * ppm / 2, 0, w * ppm, dash ? 512 * 0.27 : 512); };
    line(-(W - 0.3), 0.16, '#e6e6de'); line(W - 0.3, 0.16, '#e6e6de'); line(-0.15, 0.13, '#dcae3c'); line(0.15, 0.13, '#dcae3c');
    for (let k = 1; k < lanes; k++) { line(k * LANE, 0.13, '#e6e6de', true); line(-k * LANE, 0.13, '#e6e6de', true); } });
}
export function logoTexture(night) {
  return canvasTex(1024, 256, (g, w, h) => { g.fillStyle = '#05070a'; g.fillRect(0, 0, w, h); g.fillStyle = '#19f07a'; g.beginPath(); g.arc(120, 128, 70, 0, 7); g.fill(); g.fillStyle = '#0a2a18'; g.beginPath(); g.arc(120, 128, 40, 0, 7); g.fill(); g.fillStyle = '#19f07a'; g.beginPath(); g.arc(120, 128, 26, 0, 7); g.fill();
    g.fillStyle = '#ffffff'; g.font = 'italic 900 118px Arial Black, Arial, sans-serif'; g.textBaseline = 'middle'; g.fillText('GREENLIGHT', 220, 108); g.fillStyle = '#19f07a'; g.font = 'italic 700 44px Arial, sans-serif'; g.fillText('NEVER STOP', 226, 200); });
}

// ---------- world: road + scenery for one event
export async function buildWorld(cityKey, mode) {
  const city = CITIES[cityKey], T = city.theme, q = ctx.q, R = rng(cityKey.charCodeAt(0) * 7919 + (mode === 'pile' ? 13 : 1)), pile = mode === 'pile';
  const group = new THREE.Group(), world = { key: cityKey, city, theme: T, group, mode, startMats: [], anim: [], view: T.view };
  let main, cross = null;
  if (pile) { main = new Track(buildPath([[840]], false), city.lanes); const n = 151, px = new Float32Array(n), py = new Float32Array(n), pz = new Float32Array(n); for (let i = 0; i < n; i++) { px[i] = -300 + i * DS; pz[i] = 520; } cross = new Track({ n, L: (n - 1) * DS, closed: false, px, py, pz, segS: [0] }, city.lanes); world.jS = 520; world.jC = 300; }
  else main = new Track(buildPath(city.segs, true), city.lanes);
  main.jumps = pile ? [] : city.segs.map((sg, k) => sg[3] === 'j' ? main.segS[k + 1] : null).filter(v => v != null);
  world.main = main; world.cross = cross; const tracks = cross ? [main, cross] : [main];
  const tun = pile ? [] : (city.tunnels || []).map(([a, b]) => [main.segS[a] - 10, main.segS[b + 1] + 10]); world.tunnels = tun;
  const inTun = (s, pad = 0) => tun.some(([a, b]) => s > a - pad && s < b + pad);
  const blocked = (x, z, m) => pile && ((Math.abs(z - 520) < cross.W + m && Math.abs(x) < 320) || (Math.abs(x) < main.W + m && z > -40 && z < 880));
  const skipFor = tr => !pile ? null : (tr === main ? i => Math.abs(i * DS - 520) < cross.W + 2.5 : i => Math.abs(i * DS - 300) < main.W + 2.5);
  const add = (geo, mat, o = {}) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; if (o.rs && q.shadows) m.receiveShadow = true; if (o.cs && q.shadows) m.castShadow = true; if (o.ro) m.renderOrder = o.ro; group.add(m); return m; };

  const need = { neon: ['Concrete034', 'Facade018A'], desert: ['Ground054', 'Rock064', 'Metal063'], coast: ['Grass004', 'Rock064', 'Metal063', 'Concrete034', 'Ground054'], snow: ['Snow015', 'Rock064', 'Metal063', 'Concrete034'] }[cityKey];
  const [env, roadSet, ...sets] = await Promise.all([loadEnv(T.env), loadSet(T.road), ...need.map(id => loadSet(id, id === 'Facade018A' ? 'cnre' : 'cnr'))]);
  const S = {}; need.forEach((id, i) => S[id] = sets[i]); world.env = env;

  // lights + sky
  group.add(new THREE.HemisphereLight(T.hemi[0], T.hemi[1], T.hemi[2]));
  const sun = new THREE.DirectionalLight(T.sunC, T.sunI); world.sun = sun; world.sunDir = new THREE.Vector3(...T.sun).normalize(); sun.position.copy(world.sunDir).multiplyScalar(150); group.add(sun, sun.target);
  if (q.shadows && !T.night) { sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); const c = sun.shadow.camera; c.left = c.bottom = -42; c.right = c.top = 42; c.near = 20; c.far = 320; sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.05; }
  const PS = T.psky, skyMat = PS ? pskyMat(PS, T) : new THREE.ShaderMaterial({ uniforms: { map: { value: env.sky }, uI: { value: T.skyI }, uFog: { value: new THREE.Color(T.fog[0]) }, uH: { value: new THREE.Vector2(...(T.horizon || [-0.03, 0.05])) }, uB: { value: T.skyBoost ?? 3 } }, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position.z = gl_Position.w * 0.99995; }',
    fragmentShader: 'uniform sampler2D map; uniform float uI, uB; uniform vec3 uFog; uniform vec2 uH; varying vec3 vD; void main(){ vec3 d = normalize(vD); vec2 uv = vec2(atan(d.z, d.x) * 0.15915494 + 0.5, asin(clamp(d.y, -1.0, 1.0)) * 0.31830989 + 0.5); vec3 c = texture2D(map, uv).rgb * uI; c += pow(max(c - 0.8, 0.0) * 3.0, vec3(2.0)) * uB; c = mix(uFog, c, smoothstep(uH.x, uH.y + 0.1, d.y)); gl_FragColor = vec4(c, 1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}' });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(600, 40, 20), skyMat);
  if (PS) { world.anim.push(t => { skyMat.uniforms.uT.value = t; }); if (ctx.renderer) { try { const sc = new THREE.Scene(), pm = new THREE.PMREMGenerator(ctx.renderer); sc.add(new THREE.Mesh(new THREE.SphereGeometry(100, 48, 24), pskyMat(PS, T))); world.env = { ...world.env, env: pm.fromScene(sc, 0, 0.1, 500).texture }; pm.dispose(); } catch (e) { } } }
  sky.renderOrder = -100; sky.frustumCulled = false; group.add(sky); world.sky = sky;

  // ---- per-theme terrain shape: height + colour at fraction f of the terrain width
  const baseY = pile ? -0.5 : main.minY - (cityKey === 'coast' ? 14 : 0.6); world.baseY = baseY;
  const colsF = [0, 0.05, 0.14, 0.32, 0.62, 1];
  const extMax = pile ? 34 : { neon: 9, desert: 230, coast: 150, snow: 170 }[cityKey];
  const extOf = (tr, side, i) => { let e = Math.min(extMax, tr.clr[i] * 0.46 - tr.W - 3); const k = tr.kap[i] * side; if (k < -1e-4) e = Math.min(e, 0.8 / -k - tr.W - 3); if (cityKey === 'coast' && side < 0 && !pile) e = Math.min(e, 70); return Math.max(4, e); };
  const hf = (tr, side, i, f, ext, out) => {
    const x = tr.px[i], z = tr.pz[i], drop = baseY - tr.py[i] - 0.4, nz = noise2(x * 0.011 + side * 7, z * 0.011), n2 = noise2(x * 0.045, z * 0.045 + side * 3), sc = ext / extMax; let h = 0, r = 1, g = 1, b = 1;
    if (cityKey === 'neon') { h = f >= 1 ? drop : 0.03; r = g = b = 0.3; }
    else if (cityKey === 'desert') { h = lerp(0, drop, sstep(0.3, 1, f)) + (nz * 9 + n2 * 2.5) * Math.sin(Math.PI * f) * sc; const t = 0.86 + n2 * 0.1; r = t; g = t * 0.9; b = t * 0.78; }
    else if (cityKey === 'coast') { if (side < 0 && !pile) { h = lerp(0, drop - 1.5, sstep(0.06, 0.85, f)) + n2 * 1.2 * Math.sin(Math.PI * f); const t = sstep(0.05, 0.3, f); r = lerp(0.62, 0.72, t); g = lerp(0.8, 0.66, t); b = lerp(0.5, 0.56, t); }
      else { h = 2.7 + (pile ? 5 : 62) * Math.pow(f, 1.25) * sc + (nz * 9 + n2 * 3) * f * sc; const t = sstep(0.1, 0.8, f); r = lerp(0.6, 0.5, t); g = lerp(0.74, 0.55, t); b = lerp(0.45, 0.4, t); } }
    else { const bank = f > 0 ? 0.85 : 0; if (side < 0) h = bank + lerp(0, drop, sstep(0.25, 1, f)) + (nz * 5 + n2 * 1.5) * Math.sin(Math.PI * f) * sc; else h = bank + (pile ? 6 : 88) * Math.pow(f, 1.35) * sc + (nz * 13 + n2 * 4) * f * sc; const t = side > 0 ? sstep(0.35, 0.8, f + n2 * 0.15) : 0; r = lerp(1, 0.5, t); g = lerp(1, 0.5, t); b = lerp(1.05, 0.55, t); }
    out[0] = h; out[1] = r; out[2] = g; out[3] = b;
  };
  const H4 = [0, 0, 0, 0];
  world.terrH = (tr, side, i, off) => { const ext = extOf(tr, side, i), f = clamp((off - tr.W - 3) / ext, 0, 1); let k = 0; while (k < colsF.length - 2 && colsF[k + 1] < f) k++; hf(tr, side, i, colsF[k], ext, H4); const a = H4[0]; hf(tr, side, i, colsF[k + 1], ext, H4); return lerp(a, H4[0], (f - colsF[k]) / (colsF[k + 1] - colsF[k])); };

  const groundSet = { neon: S.Concrete034, desert: S.Ground054, coast: S.Grass004, snow: S.Snow015 }[cityKey];
  const terrMat = setMat(groundSet, 1, 1, { vertexColors: true, side: THREE.DoubleSide, roughness: cityKey === 'neon' ? 0.85 : 1, envMapIntensity: cityKey === 'neon' ? 0.3 : 0.5 }); if (cityKey === 'neon') terrMat.normalScale.set(0.45, 0.45);
  const railMat = S.Metal063 ? setMat(S.Metal063, 1, 0.25, { side: THREE.DoubleSide, metalness: 0.85, roughness: 0.6, envMapIntensity: 1 }) : null;
  const concMat = S.Concrete034 ? setMat(S.Concrete034, 1, 1, { side: THREE.DoubleSide, envMapIntensity: 0.5, color: T.night ? 0x8b9099 : 0xcfcfcf }) : null;
  const wallMat = S.Rock064 ? setMat(S.Rock064, 1, 1, { side: THREE.DoubleSide, envMapIntensity: 0.4 }) : null;
  const posts = [], reflect = [];

  for (const tr of tracks) {
    const W = tr.W, skip = skipFor(tr), n = tr.n; const skipB = i => (skip ? skip(i) : false) || (tr === main && inTun(i * DS, 3));
    // road surface
    const roadMat = new THREE.MeshStandardMaterial({ map: roadTexture(roadSet.c.image, W, tr.lanes, T.roadTint, T.roadLift), normalMap: roadSet.n.clone(), roughnessMap: roadSet.r.clone(), roughness: T.roadRough, metalness: 0, envMapIntensity: T.roadEnv }); roadMat.normalMap.needsUpdate = roadMat.roughnessMap.needsUpdate = true;
    roadMat.map.wrapT = THREE.RepeatWrapping; roadMat.map.anisotropy = Math.min(8, ctx.renderer.capabilities.getMaxAnisotropy()); roadMat.normalMap.repeat.set(2 * W / 4, 3); roadMat.roughnessMap.repeat.set(2 * W / 4, 3); roadMat.normalScale.set(0.6, 0.6);
    if (tr === cross) { roadMat.polygonOffset = true; roadMat.polygonOffsetFactor = -1; roadMat.polygonOffsetUnits = -1; }
    add(strip(tr, 2, (i, c) => { c[0] = -W; c[1] = 0; c[2] = 0; c[6] = W; c[7] = 0; c[8] = 1; }, 12), roadMat, { rs: 1 });
    // verge + terrain on each side
    for (const side of [-1, 1]) {
      const K = colsF.length + 1;
      const g = strip(tr, K, (i, c) => { const ext = extOf(tr, side, i); for (let k = 0; k < K; k++) { const kk = side > 0 ? k : K - 1 - k, f = kk === 0 ? -1 : colsF[kk - 1], off = kk === 0 ? W : W + 3 + f * ext; if (kk === 0) { H4[0] = 0; hf(tr, side, i, 0, ext, H4); H4[0] = 0; } else hf(tr, side, i, f, ext, H4); const o = k * 6; c[o] = side * off; c[o + 1] = H4[0] - (kk === 0 ? 0.02 : 0) - (tr === cross ? 0.025 : 0); c[o + 2] = off / 9; c[o + 3] = H4[1]; c[o + 4] = H4[2]; c[o + 5] = H4[3]; if (kk > 0 && off < W + 3.5 && tr === main && inTun(i * DS, 2)) c[o + 1] = Math.min(c[o + 1], -0.3); } }, 9, skip, true);
      add(g, terrMat, { rs: 1 });
      // barrier: jersey wall in the city, guardrail elsewhere (stone wall on the coast hill side)
      const jersey = cityKey === 'neon' || (cityKey === 'snow' && pile);
      if (jersey) add(strip(tr, 6, (i, c) => { const prof = [[0.45, 0], [0.5, 0.26], [0.6, 0.52], [0.64, 1.0], [0.9, 1.0], [0.9, 0]]; for (let k = 0; k < 6; k++) { const p = prof[side > 0 ? k : 5 - k], o = k * 6; c[o] = side * (W + p[0]); c[o + 1] = p[1]; c[o + 2] = k / 5 * 0.6; } }, 3, skipB), concMat, { cs: 1, rs: 1 });
      else if (cityKey === 'coast' && side > 0) add(strip(tr, 3, (i, c) => { const pr = [[0.55, 0], [0.7, 2.6], [3, 2.75]]; for (let k = 0; k < 3; k++) { const o = k * 6; c[o] = W + pr[k][0]; c[o + 1] = pr[k][1]; c[o + 2] = k * 0.5; } }, 5, skipB), wallMat, { rs: 1 });
      else { add(strip(tr, 2, (i, c) => { c[0] = c[6] = side * (W + 0.56); c[1] = 0.42; c[7] = 0.8; c[2] = 0; c[8] = 1; }, 4, skipB), railMat, { cs: 1 });
        const stepP = q.name === 'low' ? 2 : 1; for (let i = 0; i < n; i += stepP) { if (skipB(i)) continue; const th = tr.th[i]; posts.push({ x: tr.px[i] - Math.cos(th) * side * (W + 0.66), y: tr.py[i], z: tr.pz[i] + Math.sin(th) * side * (W + 0.66), ry: th }); } }
      // reflector posts: strong speed cue at the road edge
      if (!T.night) for (let i = 2; i < n; i += 6) { if (skip && skip(i)) continue; const th = tr.th[i]; reflect.push({ x: tr.px[i] - Math.cos(th) * side * (W + 1.4), y: tr.py[i] + (cityKey === 'snow' ? 0.8 : 0), z: tr.pz[i] + Math.sin(th) * side * (W + 1.4), ry: th, c: side > 0 ? 0xffffff : 0xffd24a }); }
    }
  }
  if (posts.length) group.add(inst(new THREE.BoxGeometry(0.1, 0.84, 0.14).translate(0, 0.42, 0), railMat, posts));
  if (reflect.length) group.add(brk(world, inst(new THREE.BoxGeometry(0.12, cityKey === 'snow' ? 2.2 : 1.05, 0.05).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ roughness: 0.5, color: 0xffffff }), reflect), reflect, 0.35, false));

  // base plane (city ground, sand, sea or snow)
  const bp = new THREE.PlaneGeometry(9000, 9000).rotateX(-Math.PI / 2);
  let baseMat;
  if (cityKey === 'coast' && !pile) { baseMat = new THREE.MeshStandardMaterial({ color: 0x0b4a63, roughness: 0.08, metalness: 0.1, normalMap: S.Ground054.n.clone(), envMapIntensity: 1.5 }); baseMat.normalMap.repeat.set(260, 260); baseMat.normalScale.set(0.9, 0.9); world.anim.push(t => { baseMat.normalMap.offset.set(t * 0.012, t * 0.02); }); }
  else { baseMat = setMat(groundSet, 900, 900, { roughness: cityKey === 'neon' ? 0.5 : 1, envMapIntensity: cityKey === 'neon' ? 0.9 : 0.5, color: cityKey === 'neon' ? 0x3a3d44 : cityKey === 'desert' ? 0xdbc7ae : 0xffffff }); }
  const base = add(bp, baseMat, { rs: 1 }); base.position.set(main.cx, baseY, main.cz);

  // tunnels
  if (tun.length) { const tb = new MB(), lb = new MB(), W = main.W + 0.95, A = {}, Bq = {}, Hh = 5.6;
    for (const [s0, s1] of tun) for (let s = s0; s < s1; s += DS) { main.at(s, 0, A); main.at(Math.min(s + DS, s1), 0, Bq); const p = (o, d, y) => [o.x + o.rx * d, o.y + y, o.z + o.rz * d], v0 = s / 4, v1 = (s + DS) / 4;
      tb.quad(p(A, -W, 0), p(Bq, -W, 0), p(Bq, -W, Hh), p(A, -W, Hh), v0, 0, v1, 1.4); tb.quad(p(Bq, W, 0), p(A, W, 0), p(A, W, Hh), p(Bq, W, Hh), v0, 0, v1, 1.4); tb.quad(p(A, -W, Hh), p(Bq, -W, Hh), p(Bq, W, Hh), p(A, W, Hh), v0, 0, v1, 4); tb.quad(p(A, -W - 0.4, Hh + 0.5), p(Bq, -W - 0.4, Hh + 0.5), p(Bq, W + 0.4, Hh + 0.5), p(A, W + 0.4, Hh + 0.5), v0, 0, v1, 4);
      for (const sg of [-1, 1]) tb.quad(p(A, sg * (main.W - 0.05), 0.05), p(Bq, sg * (main.W - 0.05), 0.05), p(Bq, sg * W, 0.05), p(A, sg * W, 0.05), v0, 0, v1, 0.3);
      for (const d of [-W + 0.5, W - 0.5]) lb.quad(p(A, d - 0.12, Hh - 0.06), p(Bq, d - 0.12, Hh - 0.06), p(Bq, d + 0.12, Hh - 0.06), p(A, d + 0.12, Hh - 0.06));
      if (Math.round(s / DS) % 3 === 0) for (const d of [-W * 0.45, W * 0.45]) lb.quad(p(A, d - 0.5, Hh - 0.08), p(Bq, d - 0.5, Hh - 0.08), p(Bq, d + 0.5, Hh - 0.08), p(A, d + 0.5, Hh - 0.08)); }
    add(tb.build(), setMat(S.Concrete034, 1, 1, { side: THREE.DoubleSide, envMapIntensity: 0.15, color: 0x9a9a98 }));
    add(lb.build(), new THREE.MeshBasicMaterial({ color: new THREE.Color(T.night ? 0xffc27a : 0xffe2b0).multiplyScalar(T.night ? 3.2 : 2.2), side: THREE.DoubleSide })); }

  // start gantry + line (loop events)
  if (!pile) { const W = main.W, S0 = 60; world.startS = S0; (world.gantryS = world.gantryS || []).push(S0); main.at(S0, 0, O); const gg = new THREE.Group(); gg.position.set(O.x, O.y, O.z); gg.rotation.y = O.th; group.add(gg);
    const dk = new THREE.MeshStandardMaterial({ color: 0x1a1d22, roughness: 0.5, metalness: 0.6 }), mb = new MB(); mb.box(W + 1.7, 0, 0, 0.5, 7.2, 0.5, 0, 1, 1); mb.box(-W - 1.7, 0, 0, 0.5, 7.2, 0.5, 0, 1, 1); mb.box(0, 6.3, 0, 2 * W + 4, 1.1, 0.6, 0, 1, 1);
    gg.add(new THREE.Mesh(mb.build(), dk));
    const banM = new THREE.MeshBasicMaterial({ map: logoTexture(), side: THREE.FrontSide, color: new THREE.Color(0xffffff).multiplyScalar(T.night ? 1.7 : 1) }); for (const ry of [Math.PI, 0]) { const ban = new THREE.Mesh(new THREE.PlaneGeometry(9, 2.25), banM); ban.position.set(0, 8.3, ry ? -0.01 : 0.01); ban.rotation.y = ry; gg.add(ban); }
    for (let k = 0; k < 5; k++) { const m = new THREE.MeshBasicMaterial({ color: 0x220000 }); const l = new THREE.Mesh(new THREE.CircleGeometry(0.34, 20), m); l.position.set((k - 2) * 1.5, 5.75, -0.35); l.rotation.y = Math.PI; gg.add(l); world.startMats.push(m); }
    const chk = new THREE.Mesh(new THREE.PlaneGeometry(2 * W, 2.4).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: canvasTex(512, 64, (g, w, h) => { for (let x = 0; x < 32; x++) for (let y = 0; y < 4; y++) { g.fillStyle = (x + y) % 2 ? '#e8e8e8' : '#141414'; g.fillRect(x * 16, y * 16, 16, 16); } }), roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); chk.position.y = 0.02; gg.add(chk); }

  // ---- scenery
  const L = main.L, P = q.props, lampList = [], headList = [], poolList = [], decor = [];
  const billboard = (tr, s, side, w = 11, h = 4.6) => { const off = tr.W + 5 + w / 2; tr.at(s, side * off, O); if (blocked(O.x, O.z, 4)) return; const y = O.y + world.terrH(tr, side, tr.i(s), off); const mb = new MB(), ry = O.th; mb.box(O.x - Math.sin(ry + Math.PI / 2) * w * 0.3, y - 2, O.z - Math.cos(ry + Math.PI / 2) * w * 0.3, 0.35, 9, 0.35, ry, 1, 1); mb.box(O.x + Math.sin(ry + Math.PI / 2) * w * 0.3, y - 2, O.z + Math.cos(ry + Math.PI / 2) * w * 0.3, 0.35, 9, 0.35, ry, 1, 1); add(mb.build(), new THREE.MeshStandardMaterial({ color: 0x2a2d33, roughness: 0.6, metalness: 0.5 }), { cs: 1 });
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: world.logoTex || (world.logoTex = logoTexture()), side: THREE.DoubleSide, color: new THREE.Color(0xffffff).multiplyScalar(T.night ? 1.8 : 0.95) })); pl.position.set(O.x, y + 7 + h / 2 - 2, O.z); pl.rotation.y = ry + Math.PI; group.add(pl); };

  if (cityKey === 'neon') {
    const bA = new MB(), bB = new MB(), signs = [[], [], [], []], NC = [0xff2e88, 0x19f0ff, 0x19f07a, 0xff9a1f, 0xb26bff, 0xff4040, 0xffffff];
    for (const tr of tracks) { const W = tr.W, LL = tr.L;
      for (let s = 16, k = 0; s < LL; s += 32, k++) { if (tr === main && inTun(s, 6)) continue; const side = k % 2 ? 1 : -1; tr.at(s, side * (W + 1.5), O); if (blocked(O.x, O.z, 2.2)) continue; const ry = O.th + (side > 0 ? Math.PI : 0), cool = (Math.floor(s / 500) % 2) === 0;
        lampList.push({ x: O.x, y: O.y, z: O.z, ry }); headList.push({ x: O.x, y: O.y, z: O.z, ry, c: cool ? 0xcfe4ff : 0xffb561, ci: 3 }); poolList.push({ x: O.x - O.rx * side * 3.4, y: O.y + 0.06, z: O.z - O.rz * side * 3.4, rx: -Math.atan(O.slope), ry: O.th, s: 15, c: cool ? 0x8fb4ff : 0xff9a3c, ci: 0.2 }); }
      for (const side of [-1, 1]) { let s = R() * 20; while (s < LL - 20) { const w = 16 + R() * 22, dp = 14 + R() * 12, tall = R() < 0.4, h = tall ? 45 + R() * 120 : 13 + R() * 26, off = W + 9.5 + dp / 2 + R() * 3, i = tr.i(s + w / 2);
        tr.at(s + w / 2, side * off, O);
        const ok = tr.clr[i] * 0.5 > off + dp / 2 + 8 && !(tr.kap[i] * side < -1e-4 && 0.75 / Math.abs(tr.kap[i]) < off + dp / 2 + w * 0.6) && !blocked(O.x, O.z, dp / 2 + 6) && !(tr === main && inTun(s + w / 2, 30) && R() < 0.5);
        if (ok && R() < 0.4 + 0.6 * P) { const sh = 0.5 + R() * 0.5, by = baseY - 1; (tall ? bB : bA).box(O.x, by, O.z, w, O.y - by + h, dp, O.th, tall ? 24 : 12, tall ? 25.6 : 12, [sh, sh, sh * (0.9 + R() * 0.2)], true, (R() * 8) | 0);
          const fx = O.x - O.rx * side * (dp / 2 + 0.9), fz = O.z - O.rz * side * (dp / 2 + 0.9);
          if (R() < 0.7) signs[(R() * 3) | 0].push({ x: fx - Math.sin(O.th) * (w / 2 - 1) * (R() < 0.5 ? 1 : -1), y: O.y + 5 + R() * Math.min(18, h - 10), z: fz - Math.cos(O.th) * (w / 2 - 1) * (R() < 0.5 ? 1 : -1), ry: O.th + Math.PI, sx: 1.7, sy: 6 + R() * 5, c: NC[(R() * NC.length) | 0], ci: 2.6 });
          if (R() < 0.35) signs[3].push({ x: O.x - O.rx * side * (dp / 2 + 0.2), y: O.y + 4 + R() * 8, z: O.z - O.rz * side * (dp / 2 + 0.2), ry: O.th + side * Math.PI / 2, sx: Math.min(w * 0.7, 12), sy: 2.6, c: NC[(R() * NC.length) | 0], ci: 2.4 }); }
        s += w + 2 + R() * 10; } } }
    const fac = setMat(S.Facade018A, 1, 1, { vertexColors: true, emissive: 0xffffff, emissiveIntensity: 2.0, envMapIntensity: 0.6 }); fac.emissiveMap = S.Facade018A.e.clone(); fac.emissiveMap.needsUpdate = true;
    const win = canvasTex(512, 512, (g) => { g.fillStyle = '#0a0c11'; g.fillRect(0, 0, 512, 512); for (let x = 0; x < 16; x++) for (let y = 0; y < 8; y++) { const lit = R() < 0.3; g.fillStyle = lit ? (R() < 0.6 ? `hsl(${36 + R() * 12},80%,${50 + R() * 25}%)` : `hsl(${200 + R() * 20},70%,${55 + R() * 25}%)`) : '#121925'; g.fillRect(x * 32 + 4, y * 64 + 9, 24, 40); if (lit && R() < 0.5) { g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x * 32 + 4, y * 64 + 9 + 24 + R() * 10, 24, 20); } g.fillStyle = '#0a0c11'; g.fillRect(x * 32 + 15, y * 64 + 9, 2, 40); } }); win.wrapS = win.wrapT = THREE.RepeatWrapping; win.anisotropy = q.aniso;
    const tower = new THREE.MeshStandardMaterial({ map: win, emissiveMap: win, emissive: 0xffffff, emissiveIntensity: 1.5, roughness: 0.25, metalness: 0.6, vertexColors: true, envMapIntensity: 1.2 });
    if (!bA.empty) add(bA.build(), fac); if (!bB.empty) add(bB.build(), tower);
    const signTex = k => canvasTex(k < 3 ? 128 : 512, k < 3 ? 512 : 128, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = g.fillStyle = '#fff'; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12); const nx = k < 3 ? 1 : 5, ny = k < 3 ? 5 : 1, cw = (w - 24) / nx, ch = (h - 24) / ny; for (let a = 0; a < nx; a++) for (let b = 0; b < ny; b++) { const x0 = 12 + a * cw, y0 = 12 + b * ch; g.lineWidth = 7; for (let t = 0; t < 4; t++) { g.beginPath(); const hz = R() < 0.5; if (hz) { const yy = y0 + ch * (0.2 + 0.2 * t); g.moveTo(x0 + cw * 0.18, yy); g.lineTo(x0 + cw * 0.82, yy); } else { const xx = x0 + cw * (0.25 + 0.17 * t); g.moveTo(xx, y0 + ch * 0.18); g.lineTo(xx, y0 + ch * 0.82); } g.stroke(); } } });
    signs.forEach((l, k) => group.add(inst(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: signTex(k), transparent: true, side: THREE.DoubleSide, depthWrite: false }), l)));
    if (!pile) for (let s = 420; s < L - 100; s += 560) { if (inTun(s, 20)) continue; (world.gantryS = world.gantryS || []).push(s); main.at(s, 0, O); const gg = new THREE.Group(); gg.position.set(O.x, O.y, O.z); gg.rotation.y = O.th; group.add(gg); const mb = new MB(), W = main.W; mb.box(W + 1.2, 0, 0, 0.3, 6.6, 0.3, 0, 1, 1); mb.box(-W - 1.2, 0, 0, 0.3, 6.6, 0.3, 0, 1, 1); mb.box(0, 6.1, 0, 2 * W + 2.8, 0.35, 0.3, 0, 1, 1); gg.add(new THREE.Mesh(mb.build(), new THREE.MeshStandardMaterial({ color: 0x20242a, roughness: 0.5, metalness: 0.6 })));
      for (const d of [-1.5, -0.5, 0.5, 1.5]) { const l = new THREE.Mesh(new THREE.CircleGeometry(0.3, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x19f07a).multiplyScalar(4) })); l.position.set(d * LANE, 5.6, -0.2); l.rotation.y = Math.PI; gg.add(l); } }
    if (!pile) { billboard(main, 300, 1); billboard(main, main.segS[8] + 80, -1); } else billboard(main, 470, 1, 9, 3.8);
  } else {
    // natural scenery: rocks, trees, poles
    const rockG = new THREE.IcosahedronGeometry(1, 1), rp = rockG.attributes.position; for (let i = 0; i < rp.count; i++) { P3.fromBufferAttribute(rp, i); const k = 0.72 + 0.5 * hash(Math.round(P3.x * 97), Math.round(P3.y * 89 + P3.z * 71)); rp.setXYZ(i, P3.x * k, P3.y * k * 0.8, P3.z * k); } rockG.computeVertexNormals();
    const rocks = [], trees = [], poles = [], tint = { desert: [0xb0704a, 0x9a5c3c, 0xc08055], coast: [0x9c978c, 0x86806f, 0xb0aa9c], snow: [0x8d9199, 0xb7bcc6, 0x6f737b] }[cityKey];
    for (const tr of tracks) { const W = tr.W, LL = tr.L;
      for (const side of [-1, 1]) for (let s = R() * 30; s < LL; s += (cityKey === 'snow' ? 9 : 22) / (0.35 + 0.65 * P)) { const i = tr.i(s), ext = extOf(tr, side, i); if (ext < 10 || (tr === main && inTun(s, 12))) continue;
        if (cityKey === 'snow') { const cnt = 1 + (R() * 3 | 0); for (let c = 0; c < cnt; c++) { const off = W + 6 + R() * Math.min(ext * 0.75, 70); tr.at(s + R() * 8, side * off, O); if (blocked(O.x, O.z, 3)) continue; trees.push({ x: O.x, y: O.y + world.terrH(tr, side, i, off) - 0.3, z: O.z, ry: R() * 6.3, s: 0.7 + R() * 1.1 }); } }
        if (R() < (cityKey === 'snow' ? 0.12 : 0.55)) { const big = R() < 0.14 && ext > 120, off = W + (big ? 70 + R() * (ext - 90) : 5 + R() * Math.min(ext * 0.5, 40)); if (cityKey === 'coast' && side > 0 && off < W + 6) continue; tr.at(s, side * off, O); if (blocked(O.x, O.z, 4)) continue; const sc = big ? 14 + R() * 26 : 0.8 + R() * 2.6;
          rocks.push({ x: O.x, y: O.y + world.terrH(tr, side, i, off) - sc * 0.2, z: O.z, ry: R() * 6.3, sx: sc * (0.8 + R() * 0.6), sy: sc * (big ? 0.9 + R() * 0.8 : 0.6 + R() * 0.5), sz: sc * (0.8 + R() * 0.6), c: tint[(R() * 3) | 0] }); } }
      if (cityKey === 'desert') for (let s = 30; s < LL; s += 56) { tr.at(s, -(W + 7), O); if (blocked(O.x, O.z, 3)) continue; poles.push({ x: O.x, y: O.y + world.terrH(tr, -1, tr.i(s), W + 7) - 0.4, z: O.z, ry: O.th }); } }
    group.add(inst(rockG, setMat(S.Rock064, 2, 2, { envMapIntensity: 0.4 }), rocks)); const rm = group.children[group.children.length - 1]; if (q.shadows) rm.castShadow = true;
    if (trees.length) { const tg = mergeGeometries([new THREE.CylinderGeometry(0.22, 0.3, 2.4, 6).translate(0, 1.2, 0), new THREE.ConeGeometry(2.3, 4, 8).translate(0, 3.6, 0), new THREE.ConeGeometry(1.8, 3.6, 8).translate(0, 5.6, 0), new THREE.ConeGeometry(1.2, 3.2, 8).translate(0, 7.6, 0)]); const pc = tg.attributes.position, col = new Float32Array(pc.count * 3); for (let i = 0; i < pc.count; i++) { const y = pc.getY(i), t = y < 1.55 ? [0.25, 0.17, 0.1] : [lerp(0.1, 0.75, sstep(2.4, 9.4, y) * 0.9), lerp(0.2, 0.8, sstep(2.4, 9.4, y) * 0.9), lerp(0.13, 0.82, sstep(2.4, 9.4, y) * 0.9)]; col.set(t, i * 3); } tg.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const tm = inst(tg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, envMapIntensity: 0.4 }), trees); if (q.shadows) tm.castShadow = true; group.add(tm); }
    if (poles.length) group.add(inst(mergeGeometries([new THREE.CylinderGeometry(0.12, 0.16, 9.5, 6).translate(0, 4.75, 0), new THREE.BoxGeometry(2.6, 0.14, 0.14).translate(0, 8.6, 0)]), new THREE.MeshStandardMaterial({ color: 0x4a3a2c, roughness: 0.9 }), poles));
    if (!pile) { billboard(main, 500, 1); billboard(main, L * 0.5, -1); if (cityKey === 'desert') billboard(main, L * 0.78, 1); } else billboard(main, 460, 1, 9, 3.8);
  }
  // speed rhythm, like Burnout: posts every 12 m and lamp posts every 44 m right next to the road edge
  { const posts = [], lamps2 = [];
    for (const tr of tracks) { const W = tr.W, LL = tr.L;
      for (let s = 6; s < LL; s += 12) for (const side of [-1, 1]) { if (tr === main && inTun(s, 4)) continue; tr.at(s, side * (W + 1.05), O); if (blocked(O.x, O.z, 1)) continue; posts.push({ x: O.x, y: O.y, z: O.z, ry: O.th }); }
      if (cityKey !== 'neon') for (let s = 20, k = 0; s < LL; s += 44, k++) { const side = k % 2 ? 1 : -1; if (tr === main && inTun(s, 6)) continue; tr.at(s, side * (W + 1.7), O); if (blocked(O.x, O.z, 1.5)) continue; lamps2.push({ x: O.x, y: O.y, z: O.z, ry: O.th + (side > 0 ? 0 : Math.PI) }); } }
    if (posts.length) group.add(brk(world, inst(new THREE.BoxGeometry(0.13, 1.05, 0.13).translate(0, 0.52, 0), new THREE.MeshStandardMaterial({ color: 0xe6e6e2, roughness: 0.55 }), posts), posts, 0.35, false));
    if (lamps2.length) group.add(brk(world, inst(mergeGeometries([new THREE.CylinderGeometry(0.1, 0.15, 8.4, 6).translate(0, 4.2, 0), new THREE.BoxGeometry(2.4, 0.13, 0.13).translate(1.1, 8.3, 0), new THREE.BoxGeometry(0.95, 0.16, 0.42).translate(2.2, 8.22, 0)]), new THREE.MeshStandardMaterial({ color: 0x6a7078, roughness: 0.45, metalness: 0.6 }), lamps2), lamps2, 0.45, true)); }
  if (lampList.length) { const lg = mergeGeometries([new THREE.CylinderGeometry(0.08, 0.11, 8, 6).translate(0, 4, 0), new THREE.BoxGeometry(3.2, 0.1, 0.1).translate(-1.6, 7.95, 0)]);
    const side = (l) => l; group.add(inst(lg, new THREE.MeshStandardMaterial({ color: 0x23262b, roughness: 0.5, metalness: 0.7 }), lampList.map(side)));
    group.add(inst(new THREE.BoxGeometry(0.9, 0.1, 0.34).translate(-3.0, 7.86, 0), new THREE.MeshBasicMaterial({ color: 0xffffff }), headList));
    const pm = inst(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: glowTex(), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }), poolList); pm.renderOrder = 2; group.add(pm); }

  world.update = (t, cam) => { sky.position.copy(cam.position); for (const f of world.anim) f(t); };
  world.dispose = () => { group.traverse(o => { if (o.geometry) o.geometry.dispose(); const m = o.material; if (m) (Array.isArray(m) ? m : [m]).forEach(x => x.dispose()); }); };
  return world;
}
