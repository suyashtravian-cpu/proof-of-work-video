// GREENLIGHT - effects: particles, weather, post-processing (bloom + speed blur) and camera
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ctx, CFG, spdK, clamp, lerp, damp, rand, wrapPi } from './core.js';

let _glow, _smoke, _blob;
const ctex = (size, draw) => { const c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size); return new THREE.CanvasTexture(c); };
const radial = (stops) => ctex(128, (g, s) => { const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); stops.forEach(([p, c]) => r.addColorStop(p, c)); g.fillStyle = r; g.fillRect(0, 0, s, s); });
export const glowTex = () => _glow || (_glow = radial([[0, 'rgba(255,255,255,1)'], [0.22, 'rgba(255,255,255,0.6)'], [0.55, 'rgba(255,255,255,0.14)'], [1, 'rgba(255,255,255,0)']]));
export const blobTex = () => _blob || (_blob = radial([[0, 'rgba(0,0,0,0.75)'], [0.55, 'rgba(0,0,0,0.5)'], [1, 'rgba(0,0,0,0)']]));
export const smokeTex = () => _smoke || (_smoke = ctex(128, (g, s) => { for (let i = 0; i < 14; i++) { const x = s / 2 + rand(-22, 22), y = s / 2 + rand(-22, 22), rr = rand(22, 40), r = g.createRadialGradient(x, y, 0, x, y, rr); r.addColorStop(0, 'rgba(255,255,255,0.22)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, s, s); } }));

const PVS = 'attribute float aSize; attribute vec4 aColor; varying vec4 vColor; uniform float uScale; void main(){ vColor = aColor; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = min(aSize * uScale / max(0.2, -mv.z), 700.0); }';
const PFS = 'uniform sampler2D map; varying vec4 vColor; void main(){ float a = texture2D(map, gl_PointCoord).a * vColor.a; if (a < 0.004) discard; gl_FragColor = vec4(vColor.rgb, a);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}';
class PointSet {
  constructor(n, tex, additive) {
    this.n = n; this.cur = 0; this.pos = new Float32Array(n * 3); this.vel = new Float32Array(n * 3); this.col = new Float32Array(n * 4); this.size = new Float32Array(n);
    this.life = new Float32Array(n); this.max = new Float32Array(n).fill(1); this.s0 = new Float32Array(n); this.s1 = new Float32Array(n); this.a0 = new Float32Array(n); this.drag = new Float32Array(n); this.grav = new Float32Array(n);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('aColor', new THREE.BufferAttribute(this.col, 4)); g.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1));
    this.mat = new THREE.ShaderMaterial({ uniforms: { map: { value: tex }, uScale: { value: 500 } }, vertexShader: PVS, fragmentShader: PFS, transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending });
    this.mesh = new THREE.Points(g, this.mat); this.mesh.frustumCulled = false; this.mesh.renderOrder = additive ? 6 : 5;
  }
  emit(x, y, z, vx, vy, vz, life, s0, s1, r, g, b, a, drag = 0, grav = 0) { const i = this.cur; this.cur = (i + 1) % this.n; this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z; this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz; this.life[i] = this.max[i] = life; this.s0[i] = s0; this.s1[i] = s1; this.col[i * 4] = r; this.col[i * 4 + 1] = g; this.col[i * 4 + 2] = b; this.a0[i] = a; this.drag[i] = drag; this.grav[i] = grav; }
  update(dt) {
    for (let i = 0; i < this.n; i++) { if (this.life[i] <= 0) continue; this.life[i] -= dt; if (this.life[i] <= 0) { this.size[i] = 0; this.col[i * 4 + 3] = 0; continue; }
      const t = 1 - this.life[i] / this.max[i], k = Math.max(0, 1 - this.drag[i] * dt), o = i * 3; this.vel[o] *= k; this.vel[o + 1] = this.vel[o + 1] * k - this.grav[i] * dt; this.vel[o + 2] *= k;
      this.pos[o] += this.vel[o] * dt; this.pos[o + 1] += this.vel[o + 1] * dt; this.pos[o + 2] += this.vel[o + 2] * dt; this.size[i] = lerp(this.s0[i], this.s1[i], t); this.col[i * 4 + 3] = this.a0[i] * (1 - t) * Math.min(1, t * 12); }
    const a = this.mesh.geometry.attributes; a.position.needsUpdate = a.aColor.needsUpdate = a.aSize.needsUpdate = true;
  }
  // direct mode (vehicle lights): rewrite every frame
  begin() { this.k = 0; } put(x, y, z, size, r, g, b, a) { const i = this.k++; if (i >= this.n) return; this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z; this.size[i] = size; this.col[i * 4] = r; this.col[i * 4 + 1] = g; this.col[i * 4 + 2] = b; this.col[i * 4 + 3] = a; }
  end() { for (let i = this.k; i < this.n; i++) this.size[i] = 0, this.col[i * 4 + 3] = 0; const a = this.mesh.geometry.attributes; a.position.needsUpdate = a.aColor.needsUpdate = a.aSize.needsUpdate = true; }
}

export class FX {
  constructor(scene) {
    this.scene = scene; const P = ctx.q.particles; this.dk = ctx.world && ctx.world.theme.night ? 0.4 : 1;
    this.smoke = new PointSet(Math.round(260 * P), smokeTex(), false); this.glow = new PointSet(Math.round(220 * P), glowTex(), true); this.lights = new PointSet(260, glowTex(), true);
    const n = this.sn = Math.round(520 * P); this.sp = new Float32Array(n * 3); this.sv = new Float32Array(n * 3); this.sl = new Float32Array(n); this.sm = new Float32Array(n).fill(1); this.sc = new Float32Array(n * 3); this.scur = 0;
    const sg = new THREE.BufferGeometry(); this.spos = new Float32Array(n * 6); this.scol = new Float32Array(n * 6); sg.setAttribute('position', new THREE.BufferAttribute(this.spos, 3)); sg.setAttribute('color', new THREE.BufferAttribute(this.scol, 3));
    this.sparks = new THREE.LineSegments(sg, new THREE.LineBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })); this.sparks.frustumCulled = false; this.sparks.renderOrder = 6;
    const dn = this.dn = 90; this.deb = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x1c1d21, roughness: 0.45, metalness: 0.8 }), dn); this.deb.frustumCulled = false; this.dd = []; for (let i = 0; i < dn; i++) this.dd.push({ p: new THREE.Vector3(0, -999, 0), v: new THREE.Vector3(), r: new THREE.Euler(), w: new THREE.Vector3(), s: new THREE.Vector3(), life: 0, gy: 0 }); this.dcur = 0;
    this.parts = []; this.weather = null;
    scene.add(this.smoke.mesh, this.glow.mesh, this.lights.mesh, this.sparks, this.deb);
  }
  spark(x, y, z, vx, vy, vz, life, r = 3, g = 1.5, b = 0.5) { const i = this.scur; this.scur = (i + 1) % this.sn; this.sp[i * 3] = x; this.sp[i * 3 + 1] = y; this.sp[i * 3 + 2] = z; this.sv[i * 3] = vx; this.sv[i * 3 + 1] = vy; this.sv[i * 3 + 2] = vz; this.sl[i] = this.sm[i] = life; this.sc[i * 3] = r; this.sc[i * 3 + 1] = g; this.sc[i * 3 + 2] = b; }
  // burst of sparks around a base velocity
  sparks3(x, y, z, bx, by, bz, n, spread, life = 0.5) { n = Math.round(n * ctx.q.particles); for (let i = 0; i < n; i++) this.spark(x + rand(-0.2, 0.2), y + rand(-0.1, 0.2), z + rand(-0.2, 0.2), bx + rand(-spread, spread), by + rand(0, spread), bz + rand(-spread, spread), life * rand(0.4, 1)); }
  puff(x, y, z, vx, vy, vz, dark = 0.25, size = 2.5, life = 1.6, alpha = 0.5) { dark *= this.dk; this.smoke.emit(x, y, z, vx, vy, vz, life, size * 0.5, size * 2.4, dark, dark, dark * 1.05, alpha, 1.5, -0.6); }
  flash(x, y, z, size = 9, r = 4, g = 2.6, b = 1.2, life = 0.22) { this.glow.emit(x, y, z, 0, 0, 0, life, size, size * 1.8, r, g, b, 1); }
  fire(x, y, z, vx, vy, vz, size = 1.6, life = 0.5) { this.glow.emit(x, y, z, vx, vy, vz, life, size, size * 0.3, 3.2, 1.5, 0.35, 0.9, 1, -3); }
  debris(x, y, z, bx, by, bz, n, spread, gy) { for (let k = 0; k < n; k++) { const d = this.dd[this.dcur]; this.dcur = (this.dcur + 1) % this.dn; d.p.set(x + rand(-0.6, 0.6), y + rand(0.2, 0.9), z + rand(-0.6, 0.6)); d.v.set(bx + rand(-spread, spread), by + rand(1, spread), bz + rand(-spread, spread)); d.w.set(rand(-12, 12), rand(-12, 12), rand(-12, 12)); const s = rand(0.06, 0.32); d.s.set(s * rand(0.5, 2.4), s * rand(0.2, 1), s * rand(0.5, 2)); d.life = rand(2, 4); d.gy = gy; } }
  // detach a car part and let it tumble
  part(obj, vx, vy, vz, gy) { if (!obj.parent || obj.userData.home) return; obj.userData.home = { parent: obj.parent, p: obj.position.clone(), q: obj.quaternion.clone(), s: obj.scale.clone() }; this.scene.attach(obj); this.parts.push({ obj, v: new THREE.Vector3(vx, vy, vz), w: new THREE.Vector3(rand(-7, 7), rand(-7, 7), rand(-7, 7)), life: 5, gy }); }
  restoreParts(inst) { for (const o of inst.parts) { const h = o.userData.home; if (!h) continue; const k = this.parts.findIndex(p => p.obj === o); if (k >= 0) this.parts.splice(k, 1); h.parent.add(o); o.position.copy(h.p); o.quaternion.copy(h.q); o.scale.copy(h.s); o.visible = true; o.userData.home = null; } }
  explosion(x, y, z, power = 1) { this.flash(x, y + 1, z, 34 * power, 5, 3, 1.4, 0.35); for (let i = 0; i < 26; i++) { const a = rand(6.28), s = rand(4, 16) * power; this.fire(x, y + rand(0.5, 2), z, Math.cos(a) * s, rand(3, 12) * power, Math.sin(a) * s, rand(3, 7), rand(0.5, 1.1)); } for (let i = 0; i < 18; i++) { const a = rand(6.28), s = rand(2, 9); this.puff(x, y + 1, z, Math.cos(a) * s, rand(2, 7), Math.sin(a) * s, 0.08, rand(5, 9), rand(2, 3.5), 0.7); } this.sparks3(x, y + 1, z, 0, 9, 0, 90, 22, 1.2); this.debris(x, y, z, 0, 9, 0, 26, 14, y); }
  setWeather(kind, tunnels) {
    if (this.weather) { this.scene.remove(this.weather.mesh); this.weather.mesh.geometry.dispose(); this.weather = null; } if (!kind) return;
    const n = Math.round({ rain: 1100, snow: 1300, dust: 260 }[kind] * ctx.q.particles), p = new Float32Array(n * 3); for (let i = 0; i < n * 3; i++) p[i] = rand(-1, 1);
    const w = this.weather = { kind, n, p, tunnels };
    if (kind === 'rain') { w.buf = new Float32Array(n * 6); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(w.buf, 3)); w.mesh = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: new THREE.Color(0.55, 0.66, 0.9), transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false })); }
    else { const g = new THREE.BufferGeometry(); w.buf = new Float32Array(n * 3); g.setAttribute('position', new THREE.BufferAttribute(w.buf, 3)); w.mesh = new THREE.Points(g, new THREE.PointsMaterial({ map: glowTex(), size: kind === 'snow' ? 0.16 : 0.5, color: kind === 'snow' ? 0xffffff : 0xcfa878, transparent: true, opacity: kind === 'snow' ? 0.85 : 0.14, depthWrite: false, sizeAttenuation: true })); }
    w.mesh.frustumCulled = false; w.mesh.renderOrder = 7; this.scene.add(w.mesh);
  }
  update(dt, cam, vel, inTunnel) {
    this.smoke.update(dt); this.glow.update(dt);
    const sc = ctx.renderer.domElement.height * (ctx.viewK || 1) * 0.5 / Math.tan(cam.fov * Math.PI / 360); this.smoke.mat.uniforms.uScale.value = this.glow.mat.uniforms.uScale.value = this.lights.mat.uniforms.uScale.value = sc;
    // sparks
    const sp = this.sp, sv = this.sv, o = this.spos, c = this.scol;
    for (let i = 0; i < this.sn; i++) { const a = i * 3, b = i * 6; if (this.sl[i] <= 0) { if (o[b + 1] > -900) { o[b + 1] = o[b + 4] = -999; } continue; } this.sl[i] -= dt; sv[a + 1] -= 20 * dt; sp[a] += sv[a] * dt; sp[a + 1] += sv[a + 1] * dt; sp[a + 2] += sv[a + 2] * dt; const f = Math.max(0, this.sl[i] / this.sm[i]);
      o[b] = sp[a]; o[b + 1] = sp[a + 1]; o[b + 2] = sp[a + 2]; o[b + 3] = sp[a] - sv[a] * 0.035; o[b + 4] = sp[a + 1] - sv[a + 1] * 0.035; o[b + 5] = sp[a + 2] - sv[a + 2] * 0.035; c[b] = this.sc[a] * f; c[b + 1] = this.sc[a + 1] * f; c[b + 2] = this.sc[a + 2] * f; c[b + 3] = c[b] * 0.2; c[b + 4] = c[b + 1] * 0.2; c[b + 5] = c[b + 2] * 0.2; }
    this.sparks.geometry.attributes.position.needsUpdate = this.sparks.geometry.attributes.color.needsUpdate = true;
    // debris
    for (let i = 0; i < this.dn; i++) { const d = this.dd[i]; if (d.life > 0) { d.life -= dt; d.v.y -= 22 * dt; d.p.addScaledVector(d.v, dt); d.r.x += d.w.x * dt; d.r.y += d.w.y * dt; d.r.z += d.w.z * dt; if (d.p.y < d.gy + 0.08 && d.v.y < 0) { d.p.y = d.gy + 0.08; d.v.y *= -0.35; d.v.x *= 0.6; d.v.z *= 0.6; d.w.multiplyScalar(0.5); } if (d.life <= 0) d.p.y = -999; }
      M.compose(d.p, Q.setFromEuler(d.r), d.life > 0 ? d.s : Z0); this.deb.setMatrixAt(i, M); } this.deb.instanceMatrix.needsUpdate = true;
    for (let i = this.parts.length - 1; i >= 0; i--) { const p = this.parts[i], ob = p.obj; p.life -= dt; p.v.y -= 22 * dt; ob.position.addScaledVector(p.v, dt); ob.rotateX(p.w.x * dt); ob.rotateY(p.w.y * dt); if (ob.position.y < p.gy + 0.25 && p.v.y < 0) { ob.position.y = p.gy + 0.25; p.v.y *= -0.3; p.v.x *= 0.65; p.v.z *= 0.65; p.w.multiplyScalar(0.55); } if (p.life <= 0) { ob.visible = false; this.parts.splice(i, 1); } }
    // weather: particles live in a box around the camera and stream past with the car's speed
    const w = this.weather; if (w) { w.mesh.visible = !inTunnel; const R = w.kind === 'rain' ? 26 : 30, fall = w.kind === 'rain' ? -24 : w.kind === 'snow' ? -2.6 : -0.2, vx = -vel.x * 0.9 + 1.5, vz = -vel.z * 0.9, p = w.p, cp = cam.position, k = 1 / R;
      for (let i = 0; i < w.n; i++) { const a = i * 3; p[a] += vx * dt * k; p[a + 1] += fall * dt * k / 0.6; p[a + 2] += vz * dt * k; for (let j = 0; j < 3; j++) { if (p[a + j] > 1) p[a + j] -= 2; else if (p[a + j] < -1) p[a + j] += 2; }
        const x = cp.x + p[a] * R, y = cp.y + p[a + 1] * R * 0.6, z = cp.z + p[a + 2] * R;
        if (w.kind === 'rain') { const b = i * 6, t = 0.028; w.buf[b] = x; w.buf[b + 1] = y; w.buf[b + 2] = z; w.buf[b + 3] = x - vx * t; w.buf[b + 4] = y - fall * t; w.buf[b + 5] = z - vz * t; } else { w.buf[a] = x; w.buf[a + 1] = y; w.buf[a + 2] = z; } }
      w.mesh.geometry.attributes.position.needsUpdate = true; }
  }
}
const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Z0 = new THREE.Vector3(0, 0, 0);

// ---------- post-processing: bloom, radial speed blur, tone mapping
const DUMMY_D = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1); DUMMY_D.needsUpdate = true;
const FinalShader = { uniforms: { tDiffuse: { value: null }, tDepth: { value: DUMMY_D }, uBlur: { value: 0 }, uVig: { value: 0.35 }, uFlash: { value: 0 }, uDesat: { value: 0 }, uAb: { value: 0 }, uTime: { value: 0 }, uExpo: { value: 1 }, uLines: { value: 0 }, uCenter: { value: new THREE.Vector2(0.5, 0.5) }, uTint: { value: new THREE.Vector3(1, 1, 1) },
    uStyle: { value: 0 }, uColor: { value: 0 }, uRed: { value: 0 }, uPulse: { value: 0 }, uTexel: { value: new THREE.Vector2(1 / 1280, 1 / 720) }, uNear: { value: 0.1 }, uFar: { value: 2000 }, uHasD: { value: 0 }, uAsp: { value: 1.78 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform sampler2D tDepth; uniform float uBlur, uVig, uFlash, uDesat, uAb, uTime, uExpo, uLines, uStyle, uColor, uRed, uPulse, uNear, uFar, uHasD, uAsp; uniform vec2 uCenter, uTexel; uniform vec3 uTint; varying vec2 vUv;
vec3 aces(vec3 x){ x *= 0.6; return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float luma(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
float lt(vec2 uv){ return log2(1.0 + 4.0 * luma(texture2D(tDiffuse, uv).rgb)); }
float dz(vec2 uv){ return texture2D(tDepth, uv).x; }
vec3 thermal(float h){ h = clamp(h, 0.0, 1.0); vec3 c = mix(vec3(0.0, 0.0, 0.05), vec3(0.18, 0.03, 0.45), smoothstep(0.0, 0.25, h)); c = mix(c, vec3(0.8, 0.06, 0.32), smoothstep(0.2, 0.48, h)); c = mix(c, vec3(1.0, 0.5, 0.0), smoothstep(0.45, 0.68, h)); c = mix(c, vec3(1.0, 0.9, 0.3), smoothstep(0.64, 0.86, h)); return mix(c, vec3(1.0), smoothstep(0.84, 1.0, h)); }
void main(){ vec2 dir = vUv - uCenter; float dist = length(dir); vec3 col; float amt = uBlur * smoothstep(0.06, 0.7, dist);
  if (amt > 0.0006) { float tw = 0.0; col = vec3(0.0); float j = hash(vUv + uTime) * 0.11; for (int i = 0; i < 9; i++) { float t = (float(i) + j * 9.0) / 9.0; float w = 1.0 - t * 0.55; col += texture2D(tDiffuse, vUv - dir * amt * t).rgb * w; tw += w; } col /= tw; } else col = texture2D(tDiffuse, vUv).rgb;
  float ab = uAb + 0.02 * uRed; if (ab > 0.001) { col.r = mix(col.r, texture2D(tDiffuse, vUv - dir * ab * dist).r, 0.7); col.b = mix(col.b, texture2D(tDiffuse, vUv + dir * ab * dist).b, 0.7); }
  if (uLines > 0.01) { float a = atan(dir.y, dir.x) * 57.0, fa = fract(a); float ln = smoothstep(0.9, 1.0, hash(vec2(floor(a), floor(uTime * 26.0)))) * smoothstep(0.0, 0.3, fa) * smoothstep(1.0, 0.7, fa) * smoothstep(0.26, 0.8, dist) * uLines; col += vec3(0.7, 0.82, 1.0) * ln * 0.6; }
  float st = floor(uStyle + 0.5), grain = 0.012, vig = uVig, z = 45.0, sky = 0.0, eD = 0.0, eC = 0.0, d0 = 0.5;
  if (st > 0.5 && abs(st - 3.0) > 0.5) { vec2 o = uTexel * 1.5;
    if (uHasD > 0.5) { d0 = dz(vUv); float dl = dz(vUv - vec2(o.x, 0.0)), dr = dz(vUv + vec2(o.x, 0.0)), du = dz(vUv + vec2(0.0, o.y)), dd = dz(vUv - vec2(0.0, o.y));
      sky = step(0.999999, d0); z = sky > 0.5 ? uFar : uNear * uFar / (uFar - d0 * (uFar - uNear));
      float lap = abs(dl + dr - 2.0 * d0) + abs(du + dd - 2.0 * d0); eD = smoothstep(0.1, 0.45, lap / max(1.0 - d0, 2e-6)); }
    float gx = lt(vUv + vec2(o.x, 0.0)) - lt(vUv - vec2(o.x, 0.0)), gy = lt(vUv + vec2(0.0, o.y)) - lt(vUv - vec2(0.0, o.y)); eC = smoothstep(0.55, 1.1, length(vec2(gx, gy))) * (1.0 - smoothstep(12.0, 45.0, z)); }
  vec3 src = col; float smx = max(src.r, max(src.g, src.b)); vec3 hue = src / max(smx, 1e-3); float ssat = 1.0 - min(hue.r, min(hue.g, hue.b)), hot = smoothstep(2.4, 5.0, smx);
  if (abs(st - 2.0) < 0.5 || abs(st - 4.0) < 0.5) { float e = max(eD, eC * 0.6), fog = 1.0 - exp(-z / 170.0); vec3 nc, base;
    if (st < 3.0) { nc = mix(vec3(0.1, 0.85, 1.0), hue * vec3(1.0, 0.85, 1.0), smoothstep(0.3, 0.65, ssat)); base = src * (0.05 + 0.6 * hot) * vec3(0.55, 0.4, 1.0); if (sky > 0.5) base = mix(vec3(0.16, 0.03, 0.32), vec3(0.02, 0.0, 0.08), smoothstep(0.45, 0.95, vUv.y)); }
    else { nc = mix(mix(vec3(1.0, 0.16, 0.7), vec3(0.3, 0.8, 1.0), smoothstep(25.0, 150.0, z)), hue, smoothstep(0.45, 0.75, ssat) * 0.7); base = src * (0.08 + 0.5 * hot) * vec3(0.75, 0.3, 0.95);
      if (sky > 0.5) { float y = vUv.y; vec3 sk = mix(vec3(1.0, 0.32, 0.3), vec3(0.5, 0.05, 0.5), smoothstep(0.5, 0.72, y)); sk = mix(sk, vec3(0.05, 0.0, 0.16), smoothstep(0.68, 1.0, y));
        vec2 sp = vec2((vUv.x - 0.5) * uAsp, y - 0.6); float r = length(sp), sb = clamp(-sp.y / 0.17, 0.0, 1.0); float cut = sp.y < 0.0 ? step(fract(-sp.y * 24.0), sb * 0.6) : 0.0;
        float sun = (1.0 - smoothstep(0.168, 0.172, r)) * (1.0 - cut); vec3 sc = mix(vec3(1.0, 0.9, 0.3), vec3(1.0, 0.2, 0.55), smoothstep(0.17, -0.17, sp.y)); base = sk * 0.8 + sc * sun * 1.6 + vec3(1.0, 0.3, 0.5) * exp(-r * 6.0) * 0.35; }
      grain = 0.01; }
    col = base * (1.0 - fog * 0.55) + nc * e * (1.45 + 0.25 * uPulse) * (1.0 - fog * 0.7) + (1.0 - sky) * fog * (st < 3.0 ? vec3(0.03, 0.0, 0.08) : vec3(0.16, 0.03, 0.15)); }
  if (abs(st - 5.0) < 0.5) { float grn = smoothstep(0.05, 0.25, (src.g - max(src.r, src.b)) / max(smx, 1e-3)); float h = 0.075 * log2(1.0 + luma(src) * 2.0) + 0.25 * smoothstep(0.65, 0.95, ssat) * smoothstep(0.05, 0.4, smx) * (1.0 - grn) + 0.9 * smoothstep(1.7, 3.4, smx); h *= 1.0 - 0.7 * (1.0 - exp(-z / 130.0)); if (sky > 0.5) h = 0.03 + 0.06 * (1.0 - vUv.y);
    col = thermal(h + max(eD, eC) * 0.1) * 1.35; grain = 0.016; }
  col = aces(col * uExpo * uTint); float l = luma(col);
  if (abs(st - 1.0) < 0.5) { float mx = max(col.r, max(col.g, col.b)), mn = min(col.r, min(col.g, col.b)), sat = (mx - mn) / max(mx, 1e-3); float red = smoothstep(0.06, 0.24, col.r - max(col.g, col.b) * 1.1) * smoothstep(0.6, 0.8, sat) * smoothstep(0.03, 0.12, mx), fog = 1.0 - exp(-z / 115.0);
    float g = pow(smoothstep(0.03, 0.68, l), 1.4) * (1.0 - fog * 0.94);
    if (sky > 0.5) { vec2 mp = vec2((vUv.x - 0.73) * uAsp, vUv.y - 0.8); float mr = length(mp); g = 0.02 + 0.045 * (1.0 - vUv.y) + 0.85 * (1.0 - smoothstep(0.042, 0.047, mr)) + 0.16 * exp(-mr * 9.0); red = 0.0; }
    g *= 1.0 - eD * 0.85 * (1.0 - sky); vec3 bw = vec3(g) * vec3(1.0, 0.985, 0.95), rd = vec3(max(col.r, l * 1.4) * 1.1, col.g * 0.25, col.b * 0.25) * (1.0 - fog * 0.6);
    col = mix(bw, mix(rd, col * (1.0 - fog * 0.5), uColor), clamp(red + uColor, 0.0, 1.0)); l = luma(col); grain = 0.022 * (1.0 - uColor) + 0.01; vig += 0.28; }
  if (uRed > 0.001) { col = clamp(mix(vec3(l), col, 1.0 + 0.7 * uRed), 0.0, 1.0); col = mix(col, col * col * (3.0 - 2.0 * col), 0.45 * uRed); col *= mix(vec3(1.0), vec3(1.1, 0.95, 0.9), uRed); col = mix(col, vec3(1.0, 0.06, 0.04), uRed * 0.32 * smoothstep(0.5, 0.98, dist * 1.2)); l = luma(col); }
  if (abs(st - 4.0) < 0.5) col *= 0.94 + 0.06 * sin(vUv.y / uTexel.y * 1.5708);
  col = mix(col, vec3(l), uDesat);
  col *= 1.0 - vig * smoothstep(0.3, 0.95, dist * 1.2); col = mix(col, vec3(1.0), uFlash); col = pow(col, vec3(1.0 / 2.2)); col += (hash(vUv * 1.7 + uTime) - 0.5) * grain; gl_FragColor = vec4(col, 1.0); }` };
export class Post {
  constructor(renderer, scene, camera) {
    const hf = renderer.capabilities.isWebGL2 && (renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float')), s = renderer.getDrawingBufferSize(new THREE.Vector2());
    const rt = new THREE.WebGLRenderTarget(s.x, s.y, { type: hf ? THREE.HalfFloatType : THREE.UnsignedByteType, samples: ctx.q.msaa }); if (renderer.capabilities.isWebGL2) { rt.depthTexture = new THREE.DepthTexture(s.x, s.y); rt.depthTexture.type = THREE.FloatType; this.hasD = true; }
    this.composer = new EffectComposer(renderer, rt);
    this.rp = new RenderPass(scene, camera); this.composer.addPass(this.rp);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.5, 0.85); this.bloom.enabled = ctx.q.bloom; this.composer.addPass(this.bloom);
    this.final = new ShaderPass(FinalShader); this.composer.addPass(this.final); this.u = this.final.uniforms;
  }
  setScene(scene, camera) { this.rp.scene = scene; this.rp.camera = camera; }
  setSize(w, h, pr) { this.composer.setPixelRatio(pr); this.composer.setSize(w, h); this.u.uTexel.value.set(1 / Math.max(1, w * pr), 1 / Math.max(1, h * pr)); this.u.uAsp.value = w / Math.max(1, h); }
  setBloom(b) { this.bloom.strength = b[0]; this.bloom.radius = b[1]; this.bloom.threshold = b[2]; }
  render(dt) { const u = this.u, c = this.rp.camera, rb = this.composer.readBuffer; u.uTime.value = (u.uTime.value + dt) % 100; u.uHasD.value = this.hasD && rb.depthTexture ? 1 : 0; if (rb.depthTexture) u.tDepth.value = rb.depthTexture; if (c) { u.uNear.value = c.near; u.uFar.value = c.far; } this.composer.render(dt); }
}

// ---------- camera
const V1 = new THREE.Vector3(), V2 = new THREE.Vector3(), V3 = new THREE.Vector3(), IO = {};
export const INTRO_T = 5.6;
export class Cam {
  constructor(camera) { this.c = camera; this.mode = 'chase'; this.shot = 0; this.yaw = 0; this.pos = new THREE.Vector3(); this.look = new THREE.Vector3(); this.kick = 0; this.fov = 64; this.roll = 0; this.t = 0; this.orb = 0; this.view = 0; this.T = 0; }
  bump(a) { this.kick = Math.max(this.kick, a); }
  punch(k) { this.fov += k; this.kick = Math.max(this.kick, k * 0.02); }
  set(mode, tgt) { this.mode = mode; this.t = 0; if (mode === 'intro') this.iSide = 0; this.tgt = tgt || null; if (mode === 'crash' && tgt) this.orb = Math.atan2(this.pos.z - tgt.z, this.pos.x - tgt.x); }
  snap(p) { this.yaw = p.yaw; this.fov = CFG.fov; this.pos.set(p.x - Math.sin(p.yaw) * CFG.camDist, p.y + CFG.camHeight, p.z - Math.cos(p.yaw) * CFG.camDist); this.look.set(p.x, p.y + 1, p.z); }
  // race opening: crane down onto the grid, low dolly past the rivals, hero orbit of your car, then swoop into the chase camera
  intro(p) {
    const c = this.c, tr = p.track, t = this.t, sm = k => { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); }, A = 1.8, B = 3.5, C = 4.75, D = INTRO_T;
    if (!this.iSide) this.iSide = Math.random() < 0.5 ? 1 : -1; const sd = this.iSide;
    let fr = 12, nr = 0; for (const r of ctx.rivals || []) if (r.track === tr) { nr++; fr = Math.max(fr, tr.delta(r.s, p.s)); } if (!nr) fr = 4;
    const at = (s, d, h, out) => { tr.at(tr.wrap(s), d, IO); return out.set(IO.x, IO.y + h, IO.z); };
    const orb = (ang, r, h, out) => out.set(p.x + Math.sin(p.yaw + ang) * r, p.y + h, p.z + Math.cos(p.yaw + ang) * r);
    if (t < A) { const e = sm(t / A); at(p.s + fr + (nr ? 40 : 24) - (nr ? 26 : 14) * e, 2 + 1.5 * sd, 11 - 6.5 * e, this.pos); at(p.s + fr * 0.45, 4.8, 0.5, this.look); this.fov = 46 - 6 * e; }
    else if (t < B) { const e = (t - A) / (B - A), s = p.s + fr + 5 - (fr + 1) * e; at(s, -0.4, 0.75, this.pos); at(s - 9, 5.4, 0.7, this.look); this.fov = 42; }
    else if (t < C) { const e = sm((t - B) / (C - B)); orb(sd * lerp(0.4, 1.3, e), 5.6, 0.85, this.pos); this.look.set(p.x, p.y + 0.75, p.z); this.fov = 36; }
    else { const e = sm((t - C) / (D - C)); orb(sd * lerp(1.3, Math.PI, e), lerp(5.6, CFG.camDist, e), lerp(0.85, CFG.camHeight, e), this.pos); const fx = Math.sin(p.yaw), fz = Math.cos(p.yaw); V2.set(p.x, p.y + 0.75, p.z); V3.set(p.x + fx * 14, p.y + 1.2, p.z + fz * 14); this.look.lerpVectors(V2, V3, e); this.fov = lerp(36, CFG.fov, e); }
    c.position.copy(this.pos); c.lookAt(this.look);
  }
  update(rdt, p) {
    const c = this.c; this.t += rdt; this.T += rdt; let tf = CFG.fov, roll = 0;
    if (this.mode === 'intro') { this.intro(p); tf = this.fov; }
    else if (this.mode === 'chase') {
      const spd = Math.hypot(p.vx, p.vz), sf = clamp(spd / (100 * spdK()[0]), 0, 1.25), vyaw = spd > 6 ? Math.atan2(p.vx, p.vz) : p.yaw, tyaw = vyaw + wrapPi(p.yaw - vyaw) * 0.35;
      this.yaw += wrapPi(tyaw - this.yaw) * (1 - Math.exp(-7.5 * rdt)); const bo = p.boostFx || 0, sl = p.slopeFx || 0;
      let dist = CFG.camDist + bo * 1.3 + sf * 0.5, hgt = CFG.camHeight, yaw = this.yaw;
      const fx = Math.sin(yaw), fz = Math.cos(yaw);
      if (this.view === 1 && this.mode === 'chase') { const hx = Math.sin(p.yaw), hz = Math.cos(p.yaw); this.pos.set(p.x + hx * 0.35, p.y + p.dims.h * 0.82, p.z + hz * 0.35); this.look.set(p.x + hx * 30, p.y + p.dims.h * 0.7 + sl * 30, p.z + hz * 30); }
      else { this.pos.x = p.x - fx * dist; this.pos.z = p.z - fz * dist; this.pos.y = damp(this.pos.y, p.y + hgt - sl * dist * 0.6, 14, rdt); this.look.set(p.x + fx * 14, damp(this.look.y, p.y + 1.2 + sl * 14, 14, rdt), p.z + fz * 14); }
      tf = CFG.fov + CFG.fovSpeed * Math.pow(sf, 1.15) + bo * 7; roll = -(p.steerFx || 0) * 0.035 * sf - (p.slipFx || 0) * 0.12;
      const amp = CFG.shake * (0.022 * sf * sf + 0.05 * bo) + this.kick; V1.set(Math.sin(this.T * 47.1) + Math.sin(this.T * 71.7 + 1.3), Math.sin(this.T * 53.9 + 2.1) + Math.sin(this.T * 83.3), 0).multiplyScalar(amp * 0.5);
      c.position.copy(this.pos); c.position.x += V1.x * fz; c.position.z -= V1.x * fx; c.position.y += V1.y; c.lookAt(this.look);
    } else if (this.mode === 'crash' || this.mode === 'finish' || this.mode === 'pile') {
      const g = this.tgt || p, r = this.mode === 'pile' ? 17 : this.mode === 'finish' ? 7 : 8, hh = this.mode === 'pile' ? 7.5 : 2.3; this.orb += (this.mode === 'finish' ? 0.45 : 0.3) * rdt;
      V1.set(g.x + Math.cos(this.orb) * r, Math.max(g.y, (g.gy ?? g.y)) + hh, g.z + Math.sin(this.orb) * r); this.pos.x = damp(this.pos.x, V1.x, 3.2, rdt); this.pos.y = damp(this.pos.y, V1.y, 3.2, rdt); this.pos.z = damp(this.pos.z, V1.z, 3.2, rdt);
      this.look.x = damp(this.look.x, g.x, 12, rdt); this.look.y = damp(this.look.y, g.y + 0.6, 12, rdt); this.look.z = damp(this.look.z, g.z, 12, rdt); tf = this.mode === 'pile' ? 62 : 56;
      const k = this.kick; c.position.copy(this.pos); c.position.x += Math.sin(this.T * 61) * k; c.position.y += Math.sin(this.T * 77 + 1) * k; c.lookAt(this.look);
    } else if (this.mode === 'takedown') {
      const g = this.tgt; if (this.t < rdt * 1.5) { const yy = Math.atan2(g.vx, g.vz), fx = Math.sin(yy), fz = Math.cos(yy), tr = ctx.track; let lx = Math.cos(yy), lz = -Math.sin(yy), sg = Math.random() < 0.5 ? 1 : -1; if (tr && g.s != null) { tr.at(g.s, 0, IO); lx = IO.rx; lz = IO.rz; sg = -(Math.sign(g.d) || 1); } const k = this.shot = (this.shot + 1 + (Math.random() < 0.5 ? 1 : 0)) % 3 || 0;
        this.off = k === 0 ? [-fx * 8 + lx * 3.6 * sg, 2.0, -fz * 8 + lz * 3.6 * sg] : k === 1 ? [fx * 9 + lx * 1.8 * sg, 0.55, fz * 9 + lz * 1.8 * sg] : [lx * 6.5 * sg - fx * 1.5, 0.5, lz * 6.5 * sg - fz * 1.5]; this.pos.set(g.x + this.off[0], g.y + this.off[1], g.z + this.off[2]); this.look.set(g.x, g.y + 0.5, g.z); }
      this.pos.x = damp(this.pos.x, g.x + this.off[0] * 0.8, 1.2, rdt); this.pos.z = damp(this.pos.z, g.z + this.off[2] * 0.8, 1.2, rdt); this.look.x = damp(this.look.x, g.x, 14, rdt); this.look.y = damp(this.look.y, g.y + 0.5, 14, rdt); this.look.z = damp(this.look.z, g.z, 14, rdt); tf = 50; c.position.copy(this.pos); c.lookAt(this.look);
    } else if (this.mode === 'garage') { this.orb += 0.22 * rdt; c.position.set(Math.cos(this.orb) * 7.4, 1.85, Math.sin(this.orb) * 7.4); c.lookAt(0, 0.72, 0); tf = 38; }
    this.kick *= Math.exp(-7 * rdt); this.fov = damp(this.fov, tf, this.mode === 'chase' ? 5 : 9, rdt); this.roll = damp(this.roll, roll, 5, rdt);
    if (Math.abs(c.fov - this.fov) > 0.02) { c.fov = this.fov; c.updateProjectionMatrix(); } if (this.roll) c.rotateZ(this.roll);
  }
}

// ---------- Neon Overdrive: glowing light trail behind the player; while boosting it wrecks rivals that touch it
const TT = {};
export class LightTrail {
  constructor(scene) { const N = this.N = 120; this.pts = []; const g = new THREE.BufferGeometry(); this.pos = new Float32Array(N * 6); this.col = new Float32Array(N * 6); g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    const idx = []; for (let i = 0; i < N - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } g.setIndex(idx); g.setDrawRange(0, 0); this.geo = g;
    this.mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false, toneMapped: false })); this.mesh.frustumCulled = false; this.mesh.renderOrder = 5; scene.add(this.mesh); this.hot = false; this.setColors([0.15, 0.9, 1.0], [0.9, 0.25, 1.0]); }
  setColors(a, b) { this.cA = a; this.cB = b; }
  update(p, t, on) { const P = this.pts; if (!on || p.state !== 'drive' || !p.track) { P.length = 0; this.mesh.visible = false; this.hot = false; return; }
    this.hot = p.boosting; const life = this.hot ? 1.5 : 0.4, tr = p.track; while (P.length && t - P[0].t > life) P.shift();
    const s0 = tr.wrap(p.s - p.dims.hl - 0.3); tr.at(s0, p.d, TT); const L = P[P.length - 1]; if (!L || Math.hypot(TT.x - L.x, TT.z - L.z) > 1.2) { P.push({ x: TT.x, y: TT.y, z: TT.z, rx: TT.rx, rz: TT.rz, s: s0, d: p.d, t, hot: this.hot }); if (P.length > this.N) P.shift(); }
    const n = P.length; this.mesh.visible = n > 1; const po = this.pos, co = this.col;
    const A = this.cA, B = this.cB; for (let i = 0; i < n; i++) { const q = P[i], f = Math.pow((i + 1) / n, 1.4), k = (q.hot ? 2.6 : 0.9) * f, j = i * 6, w = (q.hot ? 0.75 : 0.45) * p.dims.hw; po[j] = q.x - q.rx * w; po[j + 1] = q.y + 0.08; po[j + 2] = q.z - q.rz * w; po[j + 3] = q.x + q.rx * w; po[j + 4] = q.y + 0.08; po[j + 5] = q.z + q.rz * w;
      co[j] = A[0] * k; co[j + 1] = A[1] * k; co[j + 2] = A[2] * k; co[j + 3] = B[0] * k; co[j + 4] = B[1] * k; co[j + 5] = B[2] * k; }
    this.geo.attributes.position.needsUpdate = true; this.geo.attributes.color.needsUpdate = true; this.geo.setDrawRange(0, Math.max(0, n - 1) * 6); }
  hits(r, t) { const tr = r.track; for (const q of this.pts) { if (!q.hot || t - q.t < 0.18) continue; if (Math.abs(tr.delta(q.s, r.s)) < r.dims.hl + 0.6 && Math.abs(q.d - r.d) < r.dims.hw + 0.3) return true; } return false; }
  dispose() { this.mesh.removeFromParent(); this.geo.dispose(); this.mesh.material.dispose(); }
}

// ---------- tail-light streaks: short red long-exposure trails behind every rival and you
export class CarStreaks {
  constructor(scene) { const M = this.M = 14, C = this.C = 26; this.hist = new Map(); const g = new THREE.BufferGeometry(); this.pos = new Float32Array(C * 2 * M * 2 * 3); this.col = new Float32Array(this.pos.length); g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    const idx = []; for (let s = 0; s < C * 2; s++) for (let i = 0; i < M - 1; i++) { const a = (s * M + i) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } g.setIndex(idx); this.geo = g;
    this.mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })); this.mesh.frustumCulled = false; this.mesh.renderOrder = 4; scene.add(this.mesh); }
  update(cars, t) { const M = this.M, po = this.pos, co = this.col; po.fill(0); co.fill(0); let slot = 0;
    for (const c of cars) { if (slot >= this.C) break; let h = this.hist.get(c); if (!h) this.hist.set(c, h = []); if (c.state !== 'drive' || (c.speed ?? c.v ?? 0) < 18) { h.length = 0; slot++; continue; }
      const fx = Math.sin(c.yaw), fz = Math.cos(c.yaw), rx = Math.cos(c.yaw), rz = -Math.sin(c.yaw), hl = c.dims.hl * 0.96, hw = c.dims.hw * 0.68, y = c.y + Math.min(0.85, c.dims.h * 0.55);
      const L = h[h.length - 1], bx = c.x - fx * hl, bz = c.z - fz * hl; if (!L || Math.hypot(bx - L.x, bz - L.z) > 0.9) { h.push({ x: bx, y, z: bz, rx, rz, t }); if (h.length > M) h.shift(); }
      while (h.length && t - h[0].t > 0.3) h.shift();
      for (let sd = 0; sd < 2; sd++) { const sg = sd ? 1 : -1, base = (slot * 2 + sd) * M * 2; for (let i = 0; i < M; i++) { const q = h[Math.max(0, h.length - M + i)] || h[h.length - 1]; if (!q || h.length < 2) continue; const k = i < M - h.length ? 0 : Math.pow((i - (M - h.length) + 1) / h.length, 1.6) * 2.6, ox = q.x + q.rx * hw * sg, oz = q.z + q.rz * hw * sg, j = (base + i * 2) * 3;
        po[j] = ox - q.rx * 0.1; po[j + 1] = q.y; po[j + 2] = oz - q.rz * 0.1; po[j + 3] = ox + q.rx * 0.1; po[j + 4] = q.y + 0.05; po[j + 5] = oz + q.rz * 0.1; const sc = c.streakC; co[j] = co[j + 3] = (sc ? sc.r : 1.0) * k; co[j + 1] = co[j + 4] = (sc ? sc.g : 0.06) * k; co[j + 2] = co[j + 5] = (sc ? sc.b : 0.08) * k; } }
      slot++; }
    this.geo.attributes.position.needsUpdate = true; this.geo.attributes.color.needsUpdate = true; }
  dispose() { this.mesh.removeFromParent(); this.geo.dispose(); this.mesh.material.dispose(); }
}
