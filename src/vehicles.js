// GREENLIGHT - vehicles: player physics, rivals, traffic, wrecks (Rapier) and collisions
import * as THREE from 'three';
import { ctx, CFG, clamp, lerp, damp, wrapPi, rand, rsign, pick, approach, input, save, spdK } from './core.js';
import { DS } from './track.js';
import { blobTex } from './fx.js';
import { audio } from './audio.js';

const T = {}, N = { nx: 0, nz: 0 }, G = 11;
const M1 = new THREE.Matrix4(), M2 = new THREE.Matrix4(), M3 = new THREE.Matrix4(), V = new THREE.Vector3();
let RAPIER = null, shGeo = null, shMat = null;
export async function initPhysics() { if (!RAPIER) { const m = await import('../lib/rapier.js'); RAPIER = m.default || m; await RAPIER.init(); } return RAPIER; }

function mkRoot(v, group, scene) {
  if (!shGeo) { shGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2); shMat = new THREE.MeshBasicMaterial({ map: blobTex(), transparent: true, depthWrite: false, opacity: ctx.q.shadows && !ctx.world.theme.night ? 0.45 : 0.8, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }); }
  v.root = new THREE.Group(); v.car = group; v.root.add(group); const sh = new THREE.Mesh(shGeo, shMat); sh.scale.set(v.dims.hw * 2.9, 1, v.dims.hl * 2.5); sh.position.y = 0.04; sh.renderOrder = 1; v.shadow = sh; v.root.add(sh); scene.add(v.root);
  if (ctx.q.shadows) group.traverse(o => { if (o.isMesh && !o.userData.noDeform) o.castShadow = true; });
}

// ---------- damage: dent the body mesh around an impact point (car-local coordinates)
export function crumple(v, cx, cy, cz, rad, depth) {
  const car = v.car; car.updateWorldMatrix(true, true); M1.copy(car.matrixWorld).invert();
  car.traverse(m => { if (!m.isMesh || m.userData.noDeform || !m.geometry.attributes.position) return;
    if (!m.userData.orig) { const src = m.geometry, g = new THREE.BufferGeometry(), p = src.attributes.position, arr = new Float32Array(p.count * 3); for (let i = 0; i < p.count; i++) { arr[i * 3] = p.getX(i); arr[i * 3 + 1] = p.getY(i); arr[i * 3 + 2] = p.getZ(i); } for (const k in src.attributes) g.setAttribute(k, k === 'position' ? new THREE.BufferAttribute(arr, 3) : src.attributes[k]); g.setIndex(src.index); g.groups = src.groups; m.userData.orig = src; m.geometry = g; }
    const a = m.geometry.attributes.position.array, n = a.length / 3; M2.multiplyMatrices(M1, m.matrixWorld); M3.copy(M2).invert(); let any = false;
    for (let i = 0; i < n; i++) { V.set(a[i * 3], a[i * 3 + 1], a[i * 3 + 2]).applyMatrix4(M2); const dx = V.x - cx, dy = V.y - cy, dz = V.z - cz, d2 = dx * dx + dy * dy + dz * dz; if (d2 > rad * rad) continue; const w = 1 - Math.sqrt(d2) / rad, k = w * w * depth, nz = Math.sin(V.x * 12.3 + V.y * 7.1 + V.z * 9.7) * 0.5;
      V.x -= cx / (Math.abs(cx) + 0.5) * k * (0.8 + nz); V.z -= cz / (Math.abs(cz) + 0.5) * k * (0.8 + nz); V.y += (0.5 - cy) * k * 0.3 + nz * k * 0.35; V.applyMatrix4(M3); a[i * 3] = V.x; a[i * 3 + 1] = V.y; a[i * 3 + 2] = V.z; any = true; }
    if (any) m.geometry.attributes.position.needsUpdate = true; });
}
export function restore(v) { v.car.traverse(m => { if (m.isMesh && m.userData.orig) { m.geometry.dispose(); m.geometry = m.userData.orig; m.userData.orig = null; } }); }

// turn a live vehicle into a tumbling wreck
export function wreckVehicle(v, lin, ang, hit) {
  if (v.state !== 'drive') return null; const fx = ctx.fx, spd = Math.hypot(lin.x, lin.z); v.crashS = v.s;
  const w = ctx.wrecks.spawn(v, lin, ang);
  fx.sparks3(v.x, v.y + 0.5, v.z, lin.x * 0.5, 4, lin.z * 0.5, 30, 8 + spd * 0.12, 0.8); fx.debris(v.x, v.y, v.z, lin.x * 0.6, 4, lin.z * 0.6, v.kind === 'traffic' ? 4 : 8, 6 + spd * 0.08, v.y);
  for (let i = 0; i < 3; i++) fx.puff(v.x + rand(-1, 1), v.y + 0.6, v.z + rand(-1, 1), lin.x * 0.2 + rand(-2, 2), rand(1, 3), lin.z * 0.2 + rand(-2, 2), 0.35, 3, 1.6, 0.5);
  if (hit) crumple(v, hit[0], hit[1], hit[2], Math.max(1.3, v.dims.hw * 1.6), 0.45);
  if (v.inst && v.inst.hover) v.inst.hover.crash(v, lin);
  else if (v.inst) for (const p of v.inst.parts) if (Math.random() < 0.7) fx.part(p, lin.x * 0.7 + rand(-4, 4), rand(3, 8), lin.z * 0.7 + rand(-4, 4), v.y);
  return w;
}
function wallLaunch(v, sd, vx, vz) {
  const tr = v.track, F = CFG.crashForce, spd = Math.hypot(vx, vz); tr.at(v.s, 0, T); const vn = (vx * T.rx + vz * T.rz) * sd; vx -= T.rx * sd * vn * 1.6; vz -= T.rz * sd * vn * 1.6;
  const fx = Math.sin(v.yaw), fz = Math.cos(v.yaw), roll = (4 + spd * 0.06) * sd * F;
  return wreckVehicle(v, { x: vx * 0.84, y: 2.5 + spd * 0.045 * F, z: vz * 0.84 }, { x: fx * roll, y: rand(-3, 3), z: fz * roll }, [sd * v.dims.hw, 0.6, v.dims.hl * 0.55]);
}

// ---------- player
export class Player {
  constructor(inst, scene) {
    this.kind = 'player'; this.inst = inst; this.cfg = inst.cfg; this.dims = inst.dims; this.mass = inst.cfg.mass; mkRoot(this, inst.group, scene); inst.wheels.forEach(w => w.steer.traverse(o => { o.userData.noDeform = 1; }));
    this.state = 'drive'; this.x = this.y = this.z = this.yaw = this.vx = this.vz = this.vy = this.pvx = this.pvz = 0; this.s = this.d = this.idx = this.vs = 0;
    this.boost = 0.5; this.boostExt = 0; this.drift = 0; this.driftT = 0; this.air = false; this.airT = 0; this.invuln = 0; this.shoved = 0; this.scrape = 0; this.prog = 0; this.auto = false; this.autoD = 0; this.frozen = true; this.boosting = false;
    this.boostFx = this.steerFx = this.slipFx = this.slopeFx = this.pitch = this.roll = this.speed = this.oncD = this.driftD = this.hitCool = 0;
  }
  get boostMax() { return 1 + this.boostExt; }
  put(tr, s, d, speed) { this.streak = 0; this.streakF = 0; this.track = tr; tr.at(s, d, T); this.x = T.x; this.y = T.y; this.z = T.z; this.yaw = T.th; this.vx = Math.sin(T.th) * speed; this.vz = Math.cos(T.th) * speed; this.vy = 0; this.pvx = this.pvz = 0; this.s = tr.wrap(s); this.d = d; this.idx = tr.i(s); this.air = false; this.drift = 0; this.state = 'drive'; this.root.rotation.set(0, this.yaw, 0, 'YXZ'); this.car.position.y = 0; }
  addBoost(a) { this.boost = Math.min(this.boostMax, this.boost + a * CFG.boostGain * (this.redMul || 1) * (this.boosting ? 0.45 : 1)); }
  update(h) {
    const tr = this.track, c = this.cfg, W = ctx.world; const inp = this.inp || input; let steer = inp.steer, thr = inp.throttle, brk = inp.brake, bo = inp.boost;
    if (this.auto) { const look = clamp(this.speed * 0.5, 14, 48); tr.at(this.s + look, this.autoD, T); steer = clamp(-wrapPi(Math.atan2(T.x - this.x, T.z - this.z) - this.yaw) * 3.2, -1, 1); thr = 1; brk = 0; bo = !!this.autoBoost && this.boost > 0.3; const vcA = Math.sqrt(25 * c.hnd * CFG.grip / Math.max(tr.curveAhead(this.s, clamp(this.speed * 1.25, 30, 150)), 1e-4)) * (ctx.phase === 'over' ? 0.4 : 1); if (this.speed > vcA || (ctx.phase === 'over' && this.speed > 26)) { thr = 0; bo = false; brk = this.speed > vcA + 5 ? 0.7 : 0; } }
    this.streak += this.speed > 25 ? h : 0; const K = spdK(), nv = ctx.mode === 'never' ? 0.008 * Math.max(0, this.streak - 15) : 0, sb = 1 + K[2] * (this.streakF = clamp(this.streak / 15, 0, 1)) + (K[2] < 0.3 ? Math.min(0.4, nv) : nv), vmax = c.vmax * CFG.speed * K[0] * sb, vb = (c.vmax + (c.vboost - c.vmax) * K[1]) * CFG.speed * K[0] * sb; this.vmaxNow = vmax; let fx = Math.sin(this.yaw), fz = Math.cos(this.yaw), vf = this.vx * fx + this.vz * fz, vl = -this.vx * fz + this.vz * fx; const spd = Math.hypot(this.vx, this.vz);
    const boosting = this.boosting = bo && this.boost > 0.015 && vf > 4, top = boosting ? vb : vmax; let acc;
    if (boosting) { acc = vf < top ? (c.acc * 0.6 + 15 * CFG.boostPower) * (1.06 - vf / top) + 3 : -3; this.boost = Math.max(0, this.boost - 0.2 * CFG.boostDrain * h); }
    else if (thr > 0) acc = vf < top ? thr * (1.3 * top / CFG.accelTime) * (0.8 + 0.4 * c.acc / 20) * (1.03 - Math.pow(Math.max(vf, 0) / top, 3)) : -6;
    else acc = -(2 + Math.abs(vf) * 0.04) * Math.sign(vf);
    if (brk > 0) acc = vf > 2 ? -brk * 36 : (thr > 0 ? acc : (vf > -14 ? -brk * 9 : 0));
    if (this.air) acc *= 0.15;
    const aLat = 31 * c.hnd * CFG.grip, wMax = Math.min(2.3, Math.max(aLat / Math.max(spd, 9), 0.95)) * CFG.steer * 1.2, slip = Math.atan2(vl, Math.max(Math.abs(vf), 1));
    if (!this.drift && spd > 30 && brk > 0.3 && Math.abs(steer) > 0.45) { this.drift = Math.sign(steer); this.driftT = 0; }
    let yawRate, grip;
    if (this.drift) { this.driftT += h; yawRate = steer * wMax * 1.75 + this.drift * wMax * 0.25; grip = 2.4; if ((this.driftT > 0.45 && Math.abs(slip) < 0.07 && Math.abs(steer) < 0.35) || spd < 16 || this.driftT > 6) this.drift = 0; }
    else { yawRate = steer * wMax; grip = 9 + 3 * c.hnd; }
    if (this.air) { yawRate *= 0.25; grip = 0; }
    if (!this.drift && !this.air && !this.auto && Math.abs(steer) < 0.12 && spd > 15 && this.track) { const dy = wrapPi(this.track.th[this.idx] - this.yaw); if (Math.abs(dy) < 1.2 && Math.abs(this.track.kap[this.idx]) < 0.0006) this.yaw += dy * (1 - Math.exp(-4 * h)); const pl = this.pvx * -Math.cos(this.yaw) + this.pvz * Math.sin(this.yaw), kd = 1 - Math.exp(-7 * h); this.pvx -= -Math.cos(this.yaw) * pl * kd; this.pvz -= Math.sin(this.yaw) * pl * kd; }
    // arcade lane change: steering slides the car sideways too, so changing lanes is quick at any speed
    if (!this.drift && !this.air && !this.auto && spd > 25 && Math.abs(steer) > 0.12) { const fzz = Math.cos(this.yaw), fxx = Math.sin(this.yaw), lat = this.pvx * -fzz + this.pvz * fxx, sa = steer * Math.min(1, (spd - 25) / 30) * 30 * h; if (Math.abs(lat + sa) < 7.5) { this.pvx += -fzz * sa; this.pvz += fxx * sa; } }
    this.yaw -= yawRate * h; fx = Math.sin(this.yaw); fz = Math.cos(this.yaw); vf = this.vx * fx + this.vz * fz; vl = -this.vx * fz + this.vz * fx;
    vf += acc * h; const cap = (this.drift ? 40 : aLat * 1.35) * h; vl -= clamp(vl * (1 - Math.exp(-grip * h)), -cap, cap);
    // takedown aim assist: steering at a nearby rival pulls you onto it (never against your steering)
    const AS = this.auto ? 0 : (save.opts.assist ?? 1);
    if (AS && !this.air && ctx.rivals && ctx.rivals.length && Math.abs(steer) > 0.5 && spd > 15) { let best = null, bd = 1e9;
      for (const r of ctx.rivals) { if (r.state !== 'drive') continue; const dx = r.x - this.x, dz = r.z - this.z, f = dx * fx + dz * fz, l = -dx * fz + dz * fx; if (f < -1.5 || f > 11 || Math.abs(l) > 4.5 || Math.abs(l) < 0.4) continue; const dd = f * f + l * l; if (dd < bd) { bd = dd; best = l; } }
      if (best !== null && steer * best > 0) { const sg = Math.sign(best); if (vl * sg < (AS > 1 ? 10.5 : 8.5)) vl += sg * (AS > 1 ? 32 : 24) * Math.abs(steer) * h; } }
    this.vx = fx * vf - fz * vl; this.vz = fz * vf + fx * vl;
    this.x += (this.vx + this.pvx) * h; this.z += (this.vz + this.pvz) * h; const pd = Math.exp(-3.2 * h); this.pvx *= pd; this.pvz *= pd;
    // track position + walls
    const ps = this.s; this.idx = tr.project(this.x, this.z, this.idx); let s = tr._s, d = tr._d; this.prog += tr.delta(s, ps);
    const th = tr.th[this.idx], rx = -Math.cos(th), rz = Math.sin(th), lim = tr.limit(this.dims.hw);
    let wallTr = tr, wd = d, wrx = rx, wrz = rz, wth = th, walled = Math.abs(d) > lim;
    if (walled && W.cross && Math.abs(s - W.jS) < W.cross.W + 2.5) { const ct = W.cross; this.cidx = ct.project(this.x, this.z, this.cidx || 0); const cth = ct.th[this.cidx]; wallTr = ct; wd = ct._d; wrx = -Math.cos(cth); wrz = Math.sin(cth); wth = cth; walled = Math.abs(wd) > ct.limit(this.dims.hw) && Math.abs(ct._s - W.jC) > tr.W + 2.5; }
    if (walled) { const wl = wallTr.limit(this.dims.hw), sd = Math.sign(wd), over = Math.abs(wd) - wl; this.x -= wrx * sd * over; this.z -= wrz * sd * over; if (wallTr === tr) d = sd * lim;
      const vn = ((this.vx + this.pvx) * wrx + (this.vz + this.pvz) * wrz) * sd;
      if (this.shoved > 0 && vn > (ctx.players ? 4.5 : 8) && this.invuln <= 0) { this.s = s; this.d = d; wallLaunch(this, sd, this.vx + this.pvx, this.vz + this.pvz); ctx.ev.playerCrash('wall'); return; }
      if (vn > 0) { const sp0 = Math.hypot(this.vx, this.vz), hard = vn > 4, vtf = this.vx * Math.sin(wth) + this.vz * Math.cos(wth); this.vx -= wrx * sd * vn * 1.15; this.vz -= wrz * sd * vn * 1.15; this.pvx = this.pvz = 0;
        const dir = vtf > -sp0 * 0.3 ? wth : wth + Math.PI, tx = Math.sin(dir), tz = Math.cos(dir), keep = sp0 * (hard ? 0.9 : 1 - 0.25 * h), vt = this.vx * tx + this.vz * tz;
        if (vt < keep) { this.vx += tx * (keep - vt); this.vz += tz * (keep - vt); }
        this.yaw += wrapPi(dir - this.yaw) * (vn > 8 ? 0.75 : Math.min(1, 9 * h)); this.scrape = 0.12; this.drift = 0;
        if (hard && this.hitCool <= 0) { this.hitCool = 0.25; audio.play('hit', clamp(vn / 20, 0.3, 1)); camOf().bump(clamp(vn * 0.006, 0.04, 0.2)); ctx.fx.sparks3(this.x + wrx * sd * this.dims.hw, this.y + 0.5, this.z + wrz * sd * this.dims.hw, this.vx * 0.5, 2, this.vz * 0.5, 14, 6, 0.5); }
        if (Math.random() < 0.7) ctx.fx.spark(this.x + wrx * sd * this.dims.hw + fx * rand(-1.5, 1.5), this.y + rand(0.2, 0.8), this.z + wrz * sd * this.dims.hw + fz * rand(-1.5, 1.5), this.vx * 0.6 - wrx * sd * rand(1, 5), rand(0, 4), this.vz * 0.6 - wrz * sd * rand(1, 5), rand(0.15, 0.4)); } }
    this.s = s; this.d = d;
    // height: follow the road, or fly off a crest
    tr.at(s, d, T); const gy = T.y;
    if (!this.air && tr.jumps && spd > 25) for (const js of tr.jumps) { const dj = tr.delta(this.s, js); if (dj >= 0 && dj < spd * h * 1.6 + 0.4 && ctx.time - (this.jumpT || -9) > 1) { this.jumpT = ctx.time; this.air = true; this.airT = 0; this.vy = Math.max(this.vy, spd * 0.085 + 2.5); if (ctx.ev.jump) ctx.ev.jump(spd); break; } }
    if (!this.air) { const vyG = (gy - this.y) / h; if (vyG < this.vy - (G * h + 1.4) && spd > 30) { this.air = true; this.airT = 0; } else { this.vy = clamp(vyG, -40, 40); this.y = gy; } }
    if (this.air) { this.vy -= G * h; this.y += this.vy * h; this.airT += h; if (this.y <= gy) { this.y = gy; this.air = false; if (this.airT > 0.3) ctx.ev.land(this.airT); this.vy = 0;
      if (this.airT > 0.25 && ctx.rivals && !this.auto) for (const r of ctx.rivals) if (r.state === 'drive' && Math.hypot(r.x - this.x, r.z - this.z) < r.dims.hl + 1.2) { r.lastHit = ctx.time; r.crash('landing'); } } }
    this.gy = gy;
  }
  respawn() {
    const tr = this.track, fxm = ctx.fx; ctx.wrecks.removeOf(this); restore(this); fxm.restoreParts(this.inst); if (this.inst.hover) this.inst.hover.reset(); const s = tr.wrap(this.s + 10); let d = tr.lane(0), best = -1;
    for (let k = 0; k < tr.lanes; k++) { const ld = tr.lane(k); let free = 300; for (const o of ctx.traffic.list) { if (o.state === 'gone' || Math.abs(o.d - ld) > 1.6) continue; const ds = tr.delta(o.s, s); if (ds > -12 && ds < free) free = ds; } if (free > best) { best = free; d = ld; } }
    this.prog += tr.delta(s, this.crashS); this.put(tr, s, d, Math.max(30, this.cfg.vmax * 0.55)); this.invuln = 2.2; this.pitch = this.roll = 0; this.shadow.visible = true; this.shoved = 0;
  }
  frame(dt, rdt) {
    const tr = this.track, spd = this.speed = Math.hypot(this.vx, this.vz), fxm = ctx.fx; tr.at(this.s, this.d, T); const vyaw = Math.atan2(this.vx, this.vz), fwd = Math.cos(wrapPi(this.yaw - T.th));
    this.vs = spd * Math.cos(wrapPi(vyaw - T.th)); this.slopeFx = damp(this.slopeFx, T.slope * fwd, 8, rdt);
    this.invuln = Math.max(0, this.invuln - dt); this.shoved = Math.max(0, this.shoved - dt); this.scrape = Math.max(0, this.scrape - dt); this.hitCool = Math.max(0, this.hitCool - dt);
    const slipA = spd > 8 ? wrapPi(this.yaw - vyaw) : 0, live = this.state === 'drive' && !this.frozen;
    if (live && this.d < -0.5 && this.vs > 28 && !this.air && ctx.mode !== 'pile') { this.oncD += this.vs * dt; this.addBoost(0.085 * dt); ctx.ev.earn('onc', this.oncD); } else if (this.oncD > 0) { ctx.ev.earnEnd('onc', this.oncD); this.oncD = 0; }
    if (live && Math.abs(slipA) > 0.2 && spd > 24 && !this.air) { this.driftD += spd * dt; this.addBoost(0.08 * dt); ctx.ev.earn('drift', this.driftD); if (Math.random() < 0.7) fxm.puff(this.x - Math.sin(this.yaw) * this.dims.hl + rand(-0.8, 0.8), this.y + 0.2, this.z - Math.cos(this.yaw) * this.dims.hl + rand(-0.8, 0.8), this.vx * 0.3, 0.6, this.vz * 0.3, 0.8, 1.6, 0.9, 0.28); } else if (this.driftD > 0) { ctx.ev.earnEnd('drift', this.driftD); this.driftD = 0; }
    this.boostFx = damp(this.boostFx, this.boosting ? 1 : 0, 6, rdt); this.steerFx = damp(this.steerFx, this.auto ? 0 : (this.inp || input).steer, 8, rdt); this.slipFx = damp(this.slipFx, clamp(slipA, -0.8, 0.8), 6, rdt);
    if (this.state !== 'drive') return;
    const pt = -Math.atan(T.slope * fwd) + (this.air ? clamp(-this.vy * 0.025, -0.25, 0.3) : 0) - this.boostFx * 0.02 + ((this.inp || input).brake > 0.2 && spd > 5 && !this.auto ? 0.022 : 0);
    this.pitch = damp(this.pitch, pt, 10, rdt); this.roll = damp(this.roll, -this.steerFx * 0.05 * clamp(spd / 40, 0, 1) - this.slipFx * 0.1, 8, rdt);
    this.root.position.set(this.x, this.y, this.z); this.root.rotation.set(this.pitch, this.yaw, 0, 'YXZ'); this.car.rotation.z = this.roll; this.shadow.position.y = 0.04 - (this.y - T.y);
    this.root.visible = this.invuln <= 0 || Math.floor(ctx.time * 14) % 2 === 0;
    const hv = this.inst.hover; if (hv) hv.frame(rdt, -this.steerFx * 0.13 * clamp(spd / 40, 0, 1) - this.slipFx * 0.12, this.boosting);
    const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw), vf = this.vx * fx + this.vz * fz; for (const w of this.inst.wheels) { w.spin.rotation.x += vf / w.r * dt; if (w.front) w.steer.rotation.y = -this.steerFx * 0.36; }
    if (this.boosting) for (const sd of [-1, 1]) { const lx = sd * (hv ? 0.62 : this.dims.hw * 0.45), lz = -this.dims.hl - 0.15; fxm.glow.emit(this.x + lx * fz + lz * fx, this.y + (hv ? 0.82 : 0.38), this.z - lx * fx + lz * fz, this.vx * 0.82 + rand(-1, 1), rand(-0.5, 0.5), this.vz * 0.82 + rand(-1, 1), 0.13, 1.5, 0.3, 1.4, 2.6, 6, 0.9); }
  }
}

// ---------- rivals: driven in track space (s along, d across)
const camOf = () => (ctx.cur && ctx.cur.cam) || ctx.cam;
const RSLOT = [5, 18, -12, 32, 10, 46, -22, 25, 58, -32, 38, 72];
const fight = () => ctx.mode === 'brawl' || ctx.mode === 'getaway', respTime = () => fight() ? 1.6 : 3.4;
// ---------- rival markers: name + position tag above each rival, neon underglow, red pulsing "hit now" when in takedown range
const ORD = n => n + ((n % 100 > 10 && n % 100 < 14) ? 'TH' : (['TH', 'ST', 'ND', 'RD'][n % 10] || 'TH'));
function tagTex(label, col, hot) { const c = document.createElement('canvas'); c.width = 256; c.height = 112; const g = c.getContext('2d'), hex = '#' + new THREE.Color(hot ? 0xff2a2a : col).getHexString();
  g.font = 'italic 900 38px "Arial Black", Arial'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 8; g.strokeStyle = 'rgba(0,0,0,.8)'; g.strokeText(label, 128, 44); g.fillStyle = hot ? '#ffffff' : hex; g.fillText(label, 128, 44);
  g.beginPath(); g.moveTo(100, 60); g.lineTo(156, 60); g.lineTo(128, 102); g.closePath(); g.lineWidth = 6; g.stroke(); g.fillStyle = hex; g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
let glowC = null;
const glowTex2 = () => { if (glowC) return glowC; const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 6, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return glowC = new THREE.CanvasTexture(c); };
function mkMarker(r, scene) {
  const col = r.inst.color ?? 0xff3355; r.col = col; r.mkKey = ''; r.mkT = -9;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ depthTest: false, depthWrite: false, transparent: true, sizeAttenuation: false })); sp.renderOrder = 999; sp.scale.set(0.155, 0.068, 1); scene.add(sp); r.mk = sp;
  if (r.inst.hover) { r.glow = r.inst.hover.under; r.streakC = new THREE.Color(col); return; }
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(r.dims.hw * 2 + 1.6, r.dims.hl * 2 + 1.4), new THREE.MeshBasicMaterial({ map: glowTex2(), color: col, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
  gl.rotation.x = -Math.PI / 2; gl.position.y = 0.07; gl.renderOrder = 2; gl.userData.noDeform = 1; r.inst.group.add(gl); r.glow = gl; }
function markRivals() { const rivals = ctx.rivals, P = ctx.player; if (!rivals || !rivals.length || !P) return; const race = ctx.mode === 'race' || ctx.mode === 'cutoff', all = (ctx.players || [P]).concat(rivals), t = ctx.time;
  const near = rivals.filter(r => r.state === 'drive').map(r => [Math.hypot(r.x - P.x, r.z - P.z), r]).sort((a, b) => a[0] - b[0]).slice(0, 4).map(x => x[1]);
  for (const r of rivals) { const sp = r.mk; if (!sp) continue; const on = r.state === 'drive'; if (r.glow) r.glow.visible = on; const dist = Math.hypot(r.x - P.x, r.z - P.z); if (r.glow) r.glow.material.color.setHex(r.bounty ? 0xffc400 : r.col); sp.visible = on && !ctx.cine && ((dist < 120 && near.includes(r)) || r.revenge || r.bounty); if (!sp.visible) continue;
    const hot = (save.opts.assist ?? 1) > 0 && dist < 10 && P.state === 'drive' && P.speed > 12;
    let label = r.name; if (r.bounty) label = '$3000 ' + r.name; else if (r.revenge) label = 'PAYBACK ' + r.name; else if (race) { let rank = 1; for (const o of all) if (o !== r && (o.prog || 0) > r.prog) rank++; label = ORD(rank) + ' ' + r.name; }
    const key = label + (hot ? '!' : ''); if (key !== r.mkKey && (t - r.mkT > 0.3 || hot !== r.mkKey.endsWith('!'))) { r.mkKey = key; r.mkT = t; if (sp.material.map) sp.material.map.dispose(); sp.material.map = tagTex(label, r.bounty ? 0xffc400 : r.revenge ? 0xff2a2a : r.col, hot); sp.material.needsUpdate = true; }
    const k = hot ? 1.15 + 0.15 * Math.sin(t * 16) : clamp(1.15 - dist / 140, 0.5, 1); sp.scale.set(0.155 * k, 0.068 * k, 1); sp.position.set(r.x, r.y + r.dims.h + 1.1, r.z); sp.material.opacity = 0.85; } }
const RNAMES = ['VIPER', 'NOVA', 'BLAZE', 'RAZOR', 'GHOST', 'TALON', 'ONYX', 'FURY', 'STORM', 'HAVOC', 'REAPER', 'BLITZ'];
export class Rival {
  constructor(inst, scene, i) { this.kind = 'rival'; this.inst = inst; this.cfg = inst.cfg; this.dims = inst.dims; this.mass = inst.cfg.mass; this.i = i; this.name = RNAMES[i % 12]; mkRoot(this, inst.group, scene); inst.wheels.forEach(w => w.steer.traverse(o => { o.userData.noDeform = 1; })); mkMarker(this, scene);
    this.skill = [0.9, 0.7, 0.5, 0.35, 0.2, 0.6, 0.45, 0.8, 0.55, 0.3, 0.75, 0.4][i % 12]; this.pers = ['bully', '', 'block', '', 'bully', '', 'block', ''][i % 8]; this.blockT = 0; this.blockCool = 2 + Math.random() * 3; this.aggro = [1.2, 0.8, 1.0, 0.6, 0.9, 1.1, 0.9, 1.3, 1.0, 1.2, 0.7, 1.1][i % 12]; this.state = 'drive'; this.v = this.vs = this.dv = this.stun = this.ramT = this.blindT = this.ghost = this.pin = this.prog = this.respT = this.pitch = 0; this.lastHit = -99; this.thinkT = Math.random() * 0.12; this.attackT = 3 + Math.random() * 6; this.finished = false; this.revenge = false; this.x = this.y = this.z = this.yaw = this.vx = this.vz = 0; }
  put(tr, s, d) { this.track = tr; this.s = tr.wrap(s); this.d = this.targetD = d; this.pose(); }
  pose() { const tr = this.track; tr.at(this.s, this.d, T); this.x = T.x; this.y = T.y; this.z = T.z; this.yaw = T.th - Math.atan2(this.dv, Math.max(this.v, 12)); this.vx = Math.sin(T.th) * this.v + T.rx * this.dv; this.vz = Math.cos(T.th) * this.v + T.rz * this.dv; this.slope = T.slope; this.idx = tr.i(this.s); this.vs = this.v; }
  update(h) {
    const tr = this.track, P = ctx.player;
    if (this.state !== 'drive') { this.respT -= h; if (this.respT <= 0 && ctx.phase === 'race') this.respawn(); return; }
    const gap = this.prog - P.prog, gE = gap - RSLOT[this.i % 12] * (fight() ? 1 : 0.5) - (this.bounty ? 70 : 0); let f = 1, row = 0;
    if (fight()) f = (gE > 30 ? 0.8 : gE < -30 ? 1.3 : gE > 8 ? 0.94 : 1.03) * (1 + 0.025 * (ctx.heat || 0));
    else if (gE > 50) f = lerp(1, 0.8, clamp((gE - 50) / 260, 0, 1)); else if (gE < -30) f = lerp(1, 1.3, clamp((-gE - 30) / 220, 0, 1));
    for (const o of ctx.rivals) { if (o === this || o.state !== 'drive' || o.track !== tr) continue; const ds = tr.delta(o.s, this.s); if (ds > -0.5 && ds < 11 && (ds > 0.5 || o.i < this.i)) row++; }
    if (row >= 2) f = Math.min(f, 1) * 0.86;
    if (fight() && P.state === 'drive' && gap < -170 && ctx.phase === 'race' && this.ghost <= 0) { const ns = tr.wrap(P.s + 150 + Math.random() * 100); this.prog += tr.delta(ns, this.s); this.s = ns; this.d = this.targetD = tr.lane(Math.floor(Math.random() * tr.lanes)); this.v = Math.max(30, P.speed * 0.82); this.dv = 0; this.ghost = 0.8; this.pose(); return; }
    { const dd = tr.delta(this.s, P.s); if (dd > -22 && dd < 8 && Math.abs(P.d - this.d) < 7) this.nearT = ctx.time; }
    const K = spdK(), base = P.cfg.vmax * CFG.speed * K[0] * (1 + K[2] * 0.7 * (P.streakF || 0)) * (0.955 + this.skill * 0.055) * CFG.rivalSpeed, vc = Math.sqrt(34 / Math.max(tr.curveAhead(this.s, clamp(this.v * 1.3, 30, 150)), 1e-4));
    let vt = Math.min(base * f, vc); this.cboost = false;
    if (gE < -12 && row < 2 && P.state === 'drive' && ctx.phase === 'race') { const cu = clamp((-gE - 12) / 110, 0, 1); vt = Math.max(vt, Math.min(P.speed * (1.04 + 0.22 * cu), vc * 1.05)); this.cboost = cu > 0.15; } if (ctx.phase === 'grid') vt = 0; else if (ctx.phase === 'over') vt = Math.min(vt, 24); this.fast = (f > 1.12 && this.v > base * 0.9) || this.cboost;
    this.v = approach(this.v, vt, (ctx.raceT < 3 ? 21 : this.fast ? 17 : 12.5) * h, 26 * h);
    this.thinkT -= h; if (this.thinkT <= 0) { this.thinkT = 0.12; this.think(); }
    const want = clamp((this.targetD - this.d) * 2.4, -7.5, 7.5) * clamp(this.v / 14, 0, 1); this.dv = damp(this.dv, want, this.stun > 0 ? 0.8 : this.ramT > 0 ? 9 : 5, h);
    const ps = this.s; this.d += this.dv * h; this.s = tr.wrap(this.s + this.v * h); this.prog += tr.delta(this.s, ps);
    const lim = tr.limit(this.dims.hw); if (Math.abs(this.d) > lim) { const sd = Math.sign(this.d), out = this.dv * sd; this.d = sd * lim; if ((out > 5.5 || (this.stun > 0 && out > 3)) && ctx.raceT > 2.5) return this.crash('wall'); this.dv = -this.dv * 0.2; this.v *= 0.99; if (Math.random() < 0.5) ctx.fx.spark(this.x, this.y + 0.4, this.z, this.vx * 0.6, rand(0, 3), this.vz * 0.6, 0.3); }
    this.stun -= h; this.ramT -= h; this.attackT -= h; this.blindT -= h; this.ghost -= h; this.pose();
  }
  think() {
    const tr = this.track, P = ctx.player, blind = this.blindT > 0; let best = this.targetD, bc = 1e9; if (ctx.phase === 'grid') { this.targetD = this.d; return; }
    for (let k = 0; k < tr.lanes; k++) for (const sg of [1, -1]) { const c = sg * tr.lane(k); let cost = Math.abs(c - this.d) * 0.3 + (sg < 0 ? 4.5 : 0);
      if (!blind) for (const o of ctx.obstacles) { if (o === this || o.track !== tr) continue; const ds = tr.delta(o.s, this.s); if (ds < -5 || ds > 280) continue; const rel = this.v - (o.vs || 0); if ((rel <= 0 && ds > 10) || (o.kind === 'rival' && rel < 1.5 && ds > 5)) continue; const tt = ds / Math.max(rel, 1); if (tt > 2.4 && ds > 22) continue; if (Math.abs(o.d - c) < o.dims.hw + this.dims.hw + (o.state === 'wreck' ? 1.6 : 0.55)) cost += 40 / (0.3 + Math.max(tt, 0)); }
      if (!blind) for (const o of ctx.rivals) { if (o === this || o.state !== 'drive' || o.track !== tr) continue; const ds = tr.delta(o.s, this.s); if (ds > -10 && ds < 10 && Math.abs(o.d - c) < 5.5) cost += 14; }
      if (cost < bc) { bc = cost; best = c; } }
    this.targetD = best;
    const dsP = tr.delta(P.s, this.s);
    const bully = this.pers === 'bully' && !this.bounty, reach = bully ? 11 : 6;
    if (P.state === 'drive' && !this.bounty && this.attackT <= 0 && Math.abs(dsP) < reach && Math.abs(P.d - this.d) < (bully ? 7 : 5.5) && P.invuln <= 0 && Math.random() < 0.3 * this.aggro * CFG.aggression * (fight() ? 1.6 : 1) * (bully ? 2.2 : 1)) { this.attackT = (4 + Math.random() * 5) / (fight() ? 2 + 0.25 * (ctx.heat || 0) : 1) / (bully ? 1.8 : 1); this.ramT = bully ? 1.2 : 0.9; }
    this.blockCool -= 0.12; this.blockT -= 0.12; if (this.pers === 'block' && !this.bounty && P.state === 'drive' && this.blockCool <= 0 && dsP < -6 && dsP > -32) { this.blockT = 1.4; this.blockCool = 4.5 + Math.random() * 3; }
    if (this.blockT > 0 && this.ramT <= 0) this.targetD = clamp(P.d, -tr.limit(this.dims.hw), tr.limit(this.dims.hw));
    if (this.bounty && P.state === 'drive' && dsP < 0 && dsP > -30 && Math.abs(P.d - this.d) < 4) { let far = this.targetD, fd = -1; for (let k = 0; k < tr.lanes; k++) for (const sg of [1, -1]) { const c = sg * tr.lane(k), dd = Math.abs(c - P.d); if (dd > fd) { fd = dd; far = c; } } this.targetD = far; }
    if (this.ramT > 0) this.targetD = P.d;
    if (bully && this.feudT2 > 0 && this.feud && this.feud.state === 'drive') { this.targetD = this.feud.d; this.feudT2 -= 0.12; } else if (bully && this.ramT <= 0 && this.attackT <= 0 && Math.abs(dsP) > 40 && Math.random() < 0.08) { for (const o of ctx.rivals) { if (o === this || o.state !== 'drive' || o.track !== tr) continue; const ds = tr.delta(o.s, this.s); if (ds > -3 && ds < 14 && Math.abs(o.d - this.d) < 7) { this.feud = o; this.feudT2 = 1.1; this.attackT = 3 + Math.random() * 4; break; } } }
    if (!blind && Math.random() < 0.0035 * (1.5 - this.skill)) this.blindT = 1.3;
  }
  crash(cause, push) {
    if (this.state !== 'drive') return; let credit = ctx.time - this.lastHit < 2.5; const sd = Math.sign(this.d) || 1;
    if (!credit && cause !== 'cut' && ctx.time - (this.nearT ?? -9) < 1.2 && ctx.player && ctx.player.state === 'drive') { credit = true; cause = 'spooked'; }
    if (cause === 'ram' || cause === 'rampage') wreckVehicle(this, { x: this.vx * 0.9, y: 4, z: this.vz * 0.9 }, { x: rand(-3, 3), y: rsign() * rand(4, 7), z: rand(-3, 3) }, [0, 0.6, -this.dims.hl]);
    else if ((cause === 'slam' || cause === 'crashbreaker') && push) wreckVehicle(this, { x: this.vx * 0.9 + push.x, y: cause === 'crashbreaker' ? 10 : 5, z: this.vz * 0.9 + push.z }, { x: rand(-3, 3), y: rsign() * rand(5, 9), z: rand(-4, 4) }, [0, 0.6, 0]);
    else wallLaunch(this, sd, this.vx, this.vz);
    this.respT = respTime(); if (this.wreck) this.wreck.credit = credit; ctx.ev.rivalCrash(this, cause, credit);
  }
  respawn() {
    const tr = this.track, P = ctx.player; ctx.wrecks.removeOf(this); restore(this); ctx.fx.restoreParts(this.inst); if (this.inst.hover) this.inst.hover.reset(); let s = tr.wrap(this.s + 12);
    if (fight()) { this.spawnAhead = Math.random() < 0.7; s = tr.wrap(P.s + (this.spawnAhead ? 160 + Math.random() * 80 : -50 - Math.random() * 20)); }
    this.prog += tr.delta(s, this.crashS ?? this.s); this.state = 'drive'; this.s = s; this.d = this.targetD = tr.lane(this.i % tr.lanes); this.dv = 0; this.v = fight() ? (this.spawnAhead ? Math.max(30, P.speed * 0.8) : Math.max(40, P.speed * 1.05)) : 34; this.ghost = 1.6; this.stun = 0; this.pin = 0; this.root.rotation.set(0, 0, 0); this.car.position.y = 0; this.shadow.visible = true; this.pose(); if (ctx.ev.respawn) ctx.ev.respawn(this);
  }
  frame(dt) {
    if (this.state !== 'drive') return; this.pitch = damp(this.pitch, -Math.atan(this.slope), 10, dt);
    this.root.position.set(this.x, this.y, this.z); this.root.rotation.set(this.pitch, this.yaw, 0, 'YXZ'); this.car.rotation.z = clamp(-this.dv * 0.012, -0.08, 0.08); this.root.visible = this.ghost <= 0 || Math.floor(ctx.time * 14) % 2 === 0;
    for (const w of this.inst.wheels) { w.spin.rotation.x += this.v / w.r * dt; if (w.front) w.steer.rotation.y = clamp(-this.dv * 0.05, -0.3, 0.3); }
    const hv = this.inst.hover; if (hv) hv.frame(dt, clamp(-this.dv * 0.03, -0.16, 0.16), this.fast);
    if (this.fast) { const fx = Math.sin(this.yaw), fz = Math.cos(this.yaw), lz = -this.dims.hl - 0.15; ctx.fx.glow.emit(this.x + lz * fx, this.y + (hv ? 0.8 : 0.38), this.z + lz * fz, this.vx * 0.82, 0, this.vz * 0.82, 0.12, 1.5, 0.3, 4, 2, 0.6, 0.8); }
  }
}

// ---------- traffic
export class Traffic {
  constructor(protos, scene) { this.protos = protos; this.scene = scene; this.list = []; this.pool = protos.map(() => []); this.cars = []; this.bigs = []; protos.forEach((p, i) => (p.userData.big ? this.bigs : this.cars).push(i)); }
  make(type, track, s, d, v, dir) {
    let o = this.pool[type].pop();
    if (!o) { const p = this.protos[type]; o = { kind: 'traffic', type, dims: p.userData.dims, mass: p.userData.mass, value: p.userData.value, big: !!p.userData.big }; mkRoot(o, p.clone(true), this.scene); } o.d0 = undefined; o.dodge = 0; o.dd = 0;
    o.track = track; o.s = s; o.d = d; o.v = o.vs = v; o.dir = dir || (v < 0 ? -1 : 1); o.state = 'drive'; o.rel = o.rel2 = undefined; o.idx = track.i(s); o.root.visible = true; o.shadow.visible = true; o.car.position.y = 0; o.wreck = null; this.pose(o); this.list.push(o); return o;
  }
  pose(o) { o.track.at(o.s, o.d, T); o.x = T.x; o.y = T.y; o.z = T.z; o.yaw = T.th + (o.dir < 0 ? Math.PI : 0); o.vx = Math.sin(T.th) * o.v; o.vz = Math.cos(T.th) * o.v; o.pitchS = T.slope * o.dir; }
  recycle(o) { const i = this.list.indexOf(o); if (i >= 0) this.list.splice(i, 1); restore(o); o.state = 'gone'; o.root.visible = false; this.pool[o.type].push(o); }
  clear() { for (const o of [...this.list]) { if (o.wreck) ctx.wrecks.remove(o.wreck); this.recycle(o); } }
  type(bigChance) { return Math.random() < bigChance && this.bigs.length ? pick(this.bigs) : pick(this.cars); }
  update(h) {
    const P = ctx.player, tr = ctx.track;
    for (const o of this.list) { if (o.state !== 'drive') continue;
      if (o.v < 0 && o.track === tr && P && P.state === 'drive' && ctx.mode !== 'pile') { const ds = tr.delta(o.s, P.s); if (o.d0 === undefined) o.d0 = o.d; const inPath = ds > 0 && ds < 60 && Math.abs(o.d0 - P.d) < P.dims.hw + o.dims.hw + 0.5; if (inPath && !o.dodge) o.dodge = (o.d0 - P.d) <= 0 ? -1 : 1; const want = o.dodge && ds > -10 ? o.dodge * 1.9 : 0; o.dd = (o.dd || 0) + clamp(want - (o.dd || 0), -4.5 * h, 4.5 * h); o.d = clamp(o.d0 + o.dd, -tr.limit(o.dims.hw), tr.limit(o.dims.hw)); }
      if (o.v) { o.s += o.v * h; const t = o.track; if (t.closed) o.s = t.wrap(o.s); else if (o.s < 0 || o.s > t.L) { o.s += o.s < 0 ? t.L : -t.L; o.rel = o.rel2 = undefined; } } this.pose(o); }
    if (ctx.mode === 'pile') return;
    const view = ctx.world.view, want = Math.round(ctx.world.theme.traffic * CFG.traffic * ctx.q.traffic * (ctx.trafficK ?? 1) * 1.35); let live = 0; const PL = ctx.players, Q = PL ? PL[(this.flip = !this.flip) ? 1 : 0] : P;
    for (let i = this.list.length - 1; i >= 0; i--) { const o = this.list[i]; if (o.state !== 'drive') continue; const ds = tr.delta(o.s, P.s), d2 = PL ? tr.delta(o.s, PL[1].s) : ds; if ((ds < -150 || ds > view * 1.6) && (d2 < -150 || d2 > view * 1.6)) this.recycle(o); else live++; }
    for (let k = 0; k < 2 && live < want; k++) { const onc = Math.random() < 0.5, d = (onc ? -1 : 1) * tr.lane((Math.random() * tr.lanes) | 0), s = tr.wrap(Q.s + view * (onc ? rand(0.95, 1.4) : rand(0.8, 1.25)) * (ctx.phase === 'grid' ? rand(0.35, 1) : 1));
      const gapM = onc ? 60 * Math.max(1, spdK()[0] / 0.687) * 1.25 : 60; if (this.list.some(o => o.state === 'drive' && Math.abs((o.d0 ?? o.d) - d) < 1 && Math.abs(tr.delta(o.s, s)) < gapM)) continue;
      const type = this.type(0.14), big = this.protos[type].userData.big; this.make(type, tr, s, d, (onc ? -1 : 1) * (big ? rand(21, 25) : rand(25, 34))); live++; }
  }
  frame() { for (const o of this.list) if (o.state === 'drive') { o.root.position.set(o.x, o.y, o.z); o.root.rotation.set(-Math.atan(o.pitchS), o.yaw, 0, 'YXZ'); } }
}

// ---------- wrecks: Rapier rigid bodies tumbling over the road
export class Wrecks {
  constructor(world) {
    const R = RAPIER, main = world.main; this.world = new R.World({ x: 0, y: -24, z: 0 }); this.list = [];
    const wall = (tr, skip) => { for (let i = 0; i < tr.n - 1; i += 2) { if (skip && (skip(i) || skip(i + 1) || skip(Math.min(i + 2, tr.n - 1)))) continue; tr.at((i + 1) * DS, 0, T); for (const sd of [-1, 1]) { const d = sd * (tr.W + 1.0); this.world.createCollider(R.ColliderDesc.cuboid(0.5, 6, DS + 0.6).setTranslation(T.x + T.rx * d, T.y + 6, T.z + T.rz * d).setRotation({ x: 0, y: Math.sin(T.th / 2), z: 0, w: Math.cos(T.th / 2) }).setFriction(0.3).setRestitution(0.3)); } } };
    if (world.cross) { const c = world.cross; this.world.createCollider(R.ColliderDesc.cuboid(900, 2, 900).setTranslation(0, -2, 420).setFriction(0.7)); wall(main, i => Math.abs(i * DS - world.jS) < c.W + 2.5); wall(c, i => Math.abs(i * DS - world.jC) < main.W + 2.5); }
    else { const n = main.n, vt = new Float32Array((n + 1) * 6), ix = new Uint32Array(n * 6);
      for (let r = 0; r <= n; r++) { const i = r % n, th = main.th[i], rx = -Math.cos(th), rz = Math.sin(th), w = main.W + 3; vt.set([main.px[i] - rx * w, main.py[i], main.pz[i] - rz * w, main.px[i] + rx * w, main.py[i], main.pz[i] + rz * w], r * 6); if (r < n) ix.set([r * 2, r * 2 + 1, r * 2 + 2, r * 2 + 1, r * 2 + 3, r * 2 + 2], r * 6); }
      this.world.createCollider(R.ColliderDesc.trimesh(vt, ix).setFriction(0.7)); this.world.createCollider(R.ColliderDesc.cuboid(6000, 2, 6000).setTranslation(main.cx, world.baseY - 4, main.cz)); wall(main, null); }
  }
  spawn(v, lin, ang) {
    const R = RAPIER, d = v.dims, hy = Math.max(0.35, d.h * 0.4); v.state = 'wreck';
    const body = this.world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(v.x, v.y + hy + 0.12, v.z).setRotation({ x: 0, y: Math.sin(v.yaw / 2), z: 0, w: Math.cos(v.yaw / 2) }).setLinvel(lin.x, lin.y, lin.z).setAngvel(ang).setCcdEnabled(true).setLinearDamping(0.02).setAngularDamping(0.3));
    this.world.createCollider(R.ColliderDesc.cuboid(d.hw, hy, d.hl).setMass(v.mass * 1000).setFriction(0.45).setRestitution(0.25), body);
    v.car.position.y = -(hy + 0.12); v.car.rotation.z = 0; v.shadow.visible = false; v.root.visible = true;
    const w = { v, body, age: 0, pvx: lin.x, pvy: lin.y, pvz: lin.z, hits: 0, player: v.kind === 'player', smoke: 0, life: ctx.mode === 'pile' ? 1e9 : 11, burn: false, snd: 0 };
    this.list.push(w); v.wreck = w; return w;
  }
  remove(w) { const i = this.list.indexOf(w); if (i < 0) return; this.list.splice(i, 1); this.world.removeRigidBody(w.body); w.v.wreck = null; w.v.car.position.y = 0; }
  removeOf(v) { if (v.wreck) this.remove(v.wreck); }
  clear() { for (const w of [...this.list]) this.remove(w); }
  explode(x, y, z, power = 1) { for (const w of this.list) { const t = w.body.translation(), m = w.v.mass * 1000, dx = t.x - x, dy = t.y - y + 1.5, dz = t.z - z, dist = Math.hypot(dx, dy, dz) || 1; if (dist > 50) continue; const k = (1 - dist / 50) * 26 * power * m / dist; w.body.applyImpulse({ x: dx * k, y: Math.abs(dy) * k + 7 * m * power * (1 - dist / 50), z: dz * k }, true); w.body.applyTorqueImpulse({ x: rand(-1, 1) * 5000 * w.v.mass, y: rand(-1, 1) * 5000 * w.v.mass, z: rand(-1, 1) * 5000 * w.v.mass }, true); w.burn = true; } }
  update(dt, rdt) {
    if (!this.list.length) return; const steps = dt > 1 / 40 ? 2 : 1; this.world.timestep = Math.max(dt / steps, 1e-4); for (let i = 0; i < steps; i++) this.world.step();
    const fx = ctx.fx, P = ctx.player, tr = ctx.track, cam = ctx.camera;
    for (const p of ctx.players || [P]) { const inp = p.inp || input, cm = p.camera || cam; if (p.wreck && Math.abs(inp.steer) > 0.05) { const e = cm.matrixWorld.elements, rl = Math.hypot(e[0], e[2]) || 1, lv = p.wreck.body.linvel(), a = 60 * dt; p.wreck.body.setLinvel({ x: lv.x + e[0] / rl * inp.steer * a, y: lv.y, z: lv.z + e[2] / rl * inp.steer * a }, true); } }
    for (let i = this.list.length - 1; i >= 0; i--) { const w = this.list[i], v = w.v, b = w.body, t = b.translation(), r = b.rotation(), lv = b.linvel();
      w.age += dt; w.snd -= dt; v.root.position.set(t.x, t.y, t.z); v.root.quaternion.set(r.x, r.y, r.z, r.w); v.x = t.x; v.y = t.y; v.z = t.z; v.vx = lv.x; v.vz = lv.z; v.vs = 0;
      const trk = v.track || tr; v.idx = trk.project(t.x, t.z, v.idx || 0); v.s = trk._s; v.d = trk._d;
      const sp = Math.hypot(lv.x, lv.y, lv.z), dv = Math.hypot(lv.x - w.pvx, lv.y - w.pvy, lv.z - w.pvz); w.pvx = lv.x; w.pvy = lv.y; w.pvz = lv.z;
      if (dv > 4.5 && w.age > 0.08) { w.hits++; if (w.snd <= 0) { audio.play('thump', clamp(dv / 22, 0.15, 1) * (w.player ? 1 : 0.6)); w.snd = 0.1; } fx.sparks3(t.x, t.y - 0.3, t.z, lv.x * 0.4, 3, lv.z * 0.4, 8 + dv, 6 + dv * 0.3, 0.6); if (dv > 9) fx.debris(t.x, t.y, t.z, lv.x * 0.5, 3, lv.z * 0.5, 2, 5, t.y - v.dims.h * 0.4);
        if (dv > 11 && w.hits <= 3) crumple(v, rand(-1, 1) * v.dims.hw, rand(0.3, 1), rand(-1, 1) * v.dims.hl, v.dims.hw * 1.5, 0.3); if (w.player) camOf().bump(clamp(dv * 0.012, 0, 0.25)); }
      w.smoke -= dt; if (w.smoke <= 0) { w.smoke = 0.06; if (sp > 7) fx.sparks3(t.x, t.y - v.dims.h * 0.3, t.z, lv.x * 0.5, 1.5, lv.z * 0.5, 2, 4, 0.35); if (sp > 2 || w.burn || w.age < 6) fx.puff(t.x + rand(-0.5, 0.5), t.y + 0.3, t.z + rand(-0.5, 0.5), lv.x * 0.15, 1.6, lv.z * 0.15, w.burn ? 0.07 : 0.28, 2.2, 1.5, sp > 3 ? 0.34 : 0.16); if (w.burn && Math.random() < 0.8) fx.fire(t.x + rand(-0.8, 0.8), t.y + 0.4, t.z + rand(-0.8, 0.8), lv.x * 0.2, rand(1.5, 4), lv.z * 0.2, rand(1.5, 3), rand(0.3, 0.6)); }
      const gone = t.y < ctx.world.baseY - 30 || w.age > w.life || (v.kind === 'traffic' && ctx.mode !== 'pile' && tr.delta(v.s, P.s) < -220);
      if (gone && v.kind === 'traffic') { this.remove(w); ctx.traffic.recycle(v); } }
  }
}

// ---------- collisions between live vehicles
function obb(a, b, o) {
  const dx = a.x - b.x, dz = a.z - b.z, ra = a.dims.hl + a.dims.hw, rb = b.dims.hl + b.dims.hw; if (dx * dx + dz * dz > (ra + rb) * (ra + rb)) return 0;
  const afx = Math.sin(a.yaw), afz = Math.cos(a.yaw), bfx = Math.sin(b.yaw), bfz = Math.cos(b.yaw); let mo = 1e9, nx = 0, nz = 0;
  for (let k = 0; k < 4; k++) { const x = k === 0 ? afx : k === 1 ? -afz : k === 2 ? bfx : -bfz, z = k === 0 ? afz : k === 1 ? afx : k === 2 ? bfz : bfx;
    const pa = a.dims.hl * Math.abs(afx * x + afz * z) + a.dims.hw * Math.abs(-afz * x + afx * z), pb = b.dims.hl * Math.abs(bfx * x + bfz * z) + b.dims.hw * Math.abs(-bfz * x + bfx * z), dist = dx * x + dz * z, ov = pa + pb - Math.abs(dist);
    if (ov <= 0) return 0; if (ov < mo) { mo = ov; const sg = dist < 0 ? -1 : 1; nx = x * sg; nz = z * sg; } }
  o.nx = nx; o.nz = nz; return mo;
}
// a (player or rival) hits a traffic vehicle: both become wrecks
function crashPair(a, o, rel) {
  const F = CFG.crashForce, m1 = a.mass, m2 = o.mass, cx = (m1 * a.vx + m2 * o.vx) / (m1 + m2), cz = (m1 * a.vz + m2 * o.vz) / (m1 + m2), headOn = a.vx * o.vx + a.vz * o.vz < 0, keep = headOn ? 0.5 : 0.78;
  const up = clamp(2 + rel * 0.03 * F, 2.5, 6.5), fx = Math.sin(a.yaw), fz = Math.cos(a.yaw), k = clamp(rel * 0.05 * F, 2, 7), ovx = o.vx, ovz = o.vz;
  wreckVehicle(a, { x: lerp(cx, a.vx, keep), y: up, z: lerp(cz, a.vz, keep) }, { x: fz * k + rand(-2, 2), y: rand(-3, 3), z: -fx * k + rand(-2, 2) }, [rand(-0.5, 0.5), 0.6, a.dims.hl]);
  wreckVehicle(o, { x: lerp(cx, ovx, 0.3) + rand(-2, 2), y: up * (o.big ? 0.35 : 0.8), z: lerp(cz, ovz, 0.3) + rand(-2, 2) }, { x: rand(-3, 3), y: rand(-5, 5) / o.mass, z: rand(-3, 3) }, [rand(-0.5, 0.5), 0.6, headOn ? o.dims.hl : -o.dims.hl]);
  ctx.ev.trafficWreck(o, a);
  if (a.kind === 'player') ctx.ev.playerCrash('traffic', o); else { let cr = ctx.time - a.lastHit < 2.5, cz = 'traffic'; if (!cr && ctx.time - (a.nearT ?? -9) < 1.2 && ctx.player && ctx.player.state === 'drive') { cr = true; cz = 'spooked'; } a.respT = respTime(); if (a.wreck) a.wreck.credit = cr; ctx.ev.rivalCrash(a, cz, cr); }
}
// the player ploughs through a vehicle: it is thrown aside as a wreck and the player keeps going
function punt(P, o) {
  const fx = Math.sin(P.yaw), fz = Math.cos(P.yaw), sd = (o.x - P.x) * -fz + (o.z - P.z) * fx >= 0 ? 1 : -1, k = o.big ? 0.45 : 0.8, side = rand(7, 12) * (o.big ? 0.5 : 1);
  const w = wreckVehicle(o, { x: P.vx * k - fz * sd * side, y: o.big ? 2.5 : rand(4, 7), z: P.vz * k + fx * sd * side }, { x: rand(-4, 4), y: sd * rand(2, 6), z: rand(-4, 4) }, [-sd * o.dims.hw * 0.6, 0.6, -o.dims.hl * 0.7]); if (w) { w.pc = 0.8; w.punt = w.credit = true; }
  const slow = o.big ? 0.84 : 0.94; P.vx *= slow; P.vz *= slow; P.pvx += fz * sd * 1.2; P.pvz -= fx * sd * 1.2; P.addBoost(0.06);
  ctx.ev.trafficWreck(o, P); audio.play('crash', o.big ? 0.8 : 0.5); camOf().bump(o.big ? 0.2 : 0.11);
}
function wreckBy(o, w) {
  const wv = w.v, lv = w.body.linvel(), rel = Math.hypot(o.vx - lv.x, o.vz - lv.z); if (rel < 3.5 || (o.kind === 'rival' && ctx.raceT < 2.5)) return;
  const m1 = o.mass, m2 = wv.mass, cx = (m1 * o.vx + m2 * lv.x) / (m1 + m2), cz = (m1 * o.vz + m2 * lv.z) / (m1 + m2), up = clamp(2 + rel * 0.05 * CFG.crashForce, 2.5, 10);
  w.body.applyImpulse({ x: (cx - lv.x) * m2 * 600, y: rel * 14 * m2, z: (cz - lv.z) * m2 * 600 }, true);
  wreckVehicle(o, { x: lerp(cx, o.vx, 0.55), y: up * (o.big ? 0.4 : 1), z: lerp(cz, o.vz, 0.55) }, { x: rand(-5, 5), y: rand(-4, 4), z: rand(-5, 5) }, [rand(-1, 1) * o.dims.hw, 0.6, o.dims.hl]);
  if (o.kind === 'rival') { const cr = w.player || !!w.punt || ctx.time - o.lastHit < 2.5; o.respT = respTime(); if (o.wreck) o.wreck.credit = cr; ctx.ev.rivalCrash(o, w.player ? 'aftertouch' : w.punt ? 'traffic' : 'wreck', cr); } else if (o.kind === 'player') ctx.ev.playerCrash('wreck', wv); else ctx.ev.trafficWreck(o, wv);
}
function hitRival(P, r, pen, h) {
  const tr = ctx.track, now = ctx.time; tr.at(r.s, 0, T); const tx = Math.sin(T.th), tz = Math.cos(T.th), nR = N.nx * T.rx + N.nz * T.rz, nT = N.nx * tx + N.nz * tz, side = Math.abs(nR) > Math.abs(nT);
  const AS = save.opts.assist ?? 1, pk = AS ? 0.15 : 0.55; P.x += N.nx * pen * pk; P.z += N.nz * pen * pk; r.d -= nR * pen * (1 - pk);
  const pl = -((P.vx + P.pvx) * N.nx + (P.vz + P.pvz) * N.nz), rl = r.vx * N.nx + r.vz * N.nz, closing = pl + rl, lim = tr.limit(r.dims.hw);
  // who is the aggressor: side by side it is whoever steers into the other, nose to tail it is the car behind
  const pa = side ? pl : nT < 0 ? closing : 0, ra = side ? rl : nT < 0 ? 0 : closing;
  if (side && Math.abs(r.d) > lim - 0.25 && Math.sign(r.d) === Math.sign(-nR) && pa > -0.5) { r.pin += h; r.lastHit = now; if (r.pin > [0.28, 0.13, 0.07][AS] && ctx.raceT > 2.5) return r.crash('wall'); }
  if (closing <= 0.3) return;
  if (ctx.rampage && closing > 1 && ctx.raceT > 2.5) { r.lastHit = now; ctx.fx.sparks3((P.x + r.x) / 2, P.y + 0.6, (P.z + r.z) / 2, (P.vx + r.vx) * 0.45, 3, (P.vz + r.vz) * 0.45, 24, 9, 0.6); return r.crash('rampage'); }
  const m1 = P.mass * [1, 3, 4.5][AS] * (AS && P.boosting ? 1.6 : 1), m2 = r.mass, j = 1.3 * closing / (1 / m1 + 1 / m2);
  P.pvx += N.nx * j / m1; P.pvz += N.nz * j / m1; r.dv -= nR * j / m2 * (AS ? 1.6 : 1.15); r.v = Math.max(8, r.v - nT * j / m2);
  if (pa > 1) { r.lastHit = now; if (pa > 2.5) { r.stun = Math.max(r.stun, (0.45 + pa * 0.07) * (AS ? 1.6 : 1)); P.addBoost(0.05); } if (!side && pa > 7) r.dv += rsign() * pa * 0.22; if (!side && pa > [17, 11, 8][AS] && ctx.raceT > 2.5) return r.crash('ram');
    if (AS && side && pa > [0, 6, 4.5][AS] * (P.boosting ? 0.8 : 1) && P.speed > 22 && ctx.raceT > 2.5) return r.crash('slam', { x: -N.nx * (10 + pa), z: -N.nz * (10 + pa) }); }
  if (ra > 2.5 && ra > pa) { P.shoved = 1.0; P.shovedBy = r; }
  ctx.fx.sparks3((P.x + r.x) / 2, P.y + 0.6, (P.z + r.z) / 2, (P.vx + r.vx) * 0.45, 2, (P.vz + r.vz) * 0.45, 5 + closing * 2, 5 + closing * 0.5, 0.45);
  if (closing > 1.5 && P.hitCool <= 0) { P.hitCool = 0.15; audio.play('hit', clamp(closing / 9, 0.25, 1)); camOf().bump(clamp(closing * 0.012, 0.02, 0.14)); ctx.ev.rub(r, closing, pa > ra); }
}
// two human players trading paint: whoever steers into the other (or the car behind) is the one shoving
function hitPlayers(A, B) {
  if (A.state !== 'drive' || B.state !== 'drive' || A.frozen || B.frozen || A.invuln > 0 || B.invuln > 0) return; const pen = obb(A, B, N); if (pen <= 0) return;
  A.x += N.nx * pen * 0.5; A.z += N.nz * pen * 0.5; B.x -= N.nx * pen * 0.5; B.z -= N.nz * pen * 0.5;
  const al = -((A.vx + A.pvx) * N.nx + (A.vz + A.pvz) * N.nz), bl = (B.vx + B.pvx) * N.nx + (B.vz + B.pvz) * N.nz, closing = al + bl; if (closing <= 0.3) return;
  const nT = N.nx * Math.sin(B.yaw) + N.nz * Math.cos(B.yaw), side = Math.abs(nT) < 0.7, aa = side ? al : nT < 0 ? closing : 0, ba = side ? bl : nT < 0 ? 0 : closing;
  const m1 = A.mass, m2 = B.mass, j = 1.3 * closing / (1 / m1 + 1 / m2); A.pvx += N.nx * j / m1; A.pvz += N.nz * j / m1; B.pvx -= N.nx * j / m2; B.pvz -= N.nz * j / m2;
  if (aa > 2.5 && aa > ba) { B.shoved = 1.2; B.shovedBy = A; A.addBoost(0.05); } else if (ba > 2.5) { A.shoved = 1.2; A.shovedBy = B; B.addBoost(0.05); }
  ctx.fx.sparks3((A.x + B.x) / 2, A.y + 0.6, (A.z + B.z) / 2, (A.vx + B.vx) * 0.45, 2, (A.vz + B.vz) * 0.45, 5 + closing * 2, 5 + closing * 0.5, 0.45);
  if (closing > 1.5 && A.hitCool <= 0) { A.hitCool = 0.15; audio.play('hit', clamp(closing / 9, 0.25, 1)); const k = clamp(closing * 0.012, 0.02, 0.14); if (A.cam) A.cam.bump(k); if (B.cam) B.cam.bump(k); }
}
// rivals touch each other: side swipes and rear shunts, so the pack fights itself instead of driving through each other
function rivalBump(R, tr) { for (let i = 0; i < R.length; i++) { const a = R[i]; if (a.state !== 'drive' || a.track !== tr || a.ghost > 0) continue;
  for (let j = i + 1; j < R.length; j++) { const b = R[j]; if (b.state !== 'drive' || b.track !== tr || b.ghost > 0) continue; const ds = tr.delta(b.s, a.s), L = (a.dims.hl + b.dims.hl) * 0.92; if (Math.abs(ds) > L) continue; const dd = a.d - b.d, Wd = (a.dims.hw + b.dims.hw) * 0.95; if (Math.abs(dd) > Wd) continue;
    const lat = Wd - Math.abs(dd), lon = L - Math.abs(ds), near = ctx.player && Math.hypot(a.x - ctx.player.x, a.z - ctx.player.z) < 45;
    if (lat < lon) { const sg = Math.sign(dd) || 1, ma = a.mass, mb = b.mass; a.d += sg * lat * mb / (ma + mb); b.d -= sg * lat * ma / (ma + mb); const rv = (a.dv - b.dv) * sg;
      if (rv < 0) { const J = 1.5 * rv / (1 / ma + 1 / mb); a.dv -= sg * J / ma; b.dv += sg * J / mb; const hit = -rv; if (hit > 2.2) { const atk = Math.abs(a.dv) > Math.abs(b.dv) || a.feud === b ? a : b, vic = atk === a ? b : a; vic.stun = Math.max(vic.stun, 0.35 + hit * 0.06); vic.feudBy = atk; vic.feudT = ctx.time; if (near) { ctx.fx.spark((a.x + b.x) / 2, a.y + 0.5, (a.z + b.z) / 2, a.vx * 0.5, 2, a.vz * 0.5, 0.4); if (hit > 4) audio.play('hit', 0.35); } } } }
    else { const back = ds > 0 ? a : b, front = back === a ? b : a, dv = back.v - front.v; back.s = tr.wrap(back.s - lon * 0.5); back.prog -= lon * 0.5; if (dv > 0) { front.v += dv * 0.5; back.v -= dv * 0.6; if (dv > 5) { front.stun = Math.max(front.stun, 0.4); front.dv += rsign() * dv * 0.25; front.feudBy = back; front.feudT = ctx.time; if (near) audio.play('hit', 0.3); } } } } } }
export function simulate(h) {
  const PL = ctx.players || [ctx.player], tr = ctx.track, list = ctx.traffic.list, rivals = ctx.rivals, ob = ctx.obstacles; ob.length = 0;
  for (const o of list) if (o.state !== 'gone') ob.push(o); for (const r of rivals) ob.push(r); for (const p of PL) if (p.state !== 'gone') ob.push(p);
  for (const p of PL) { ctx.player = ctx.cur = p; if (p.state === 'drive' && !p.frozen) p.update(h); }
  ctx.player = ctx.cur = PL[0];
  for (const r of rivals) r.update(h);
  rivalBump(rivals, tr);
  ctx.traffic.update(h);
  // each player vs traffic (+ near misses)
  for (const P of PL) { ctx.player = ctx.cur = P; const rk = P.pi ? 'rel2' : 'rel'; if (P.state === 'drive' && !P.frozen) for (const o of list) { if (o.state !== 'drive') continue; let ds = 0; const same = o.track === P.track;
    if (same) { ds = tr.delta(o.s, P.s); if (Math.abs(ds) > 16) { o[rk] = ds; continue; } } else if (Math.abs(o.x - P.x) + Math.abs(o.z - P.z) > 18) continue;
    const pen = P.invuln > 0 ? 0 : obb(P, o, N);
    if (pen > 0) { const rvx = P.vx - o.vx, rvz = P.vz - o.vz, closing = -(rvx * N.nx + rvz * N.nz), rel = Math.hypot(rvx, rvz), pfx = Math.sin(P.yaw), pfz = Math.cos(P.yaw);
      const headOn = P.vx * o.vx + P.vz * o.vz < 0 && -(N.nx * pfx + N.nz * pfz) > 0.7 && Math.abs((o.x - P.x) * pfz - (o.z - P.z) * pfx) < (P.dims.hw + o.dims.hw) * 0.34 && closing > 30 && save.opts.headon !== 'bulldoze' && !(save.opts.style === 'heat' && P.boosting);
      if (ctx.mode === 'pile' ? (closing > 6 || rel > 28) : headOn) { crashPair(P, o, rel); break; }
      if (closing > 4 || rel > 12) { if (P.vx * o.vx + P.vz * o.vz < 0) { const melt = save.opts.style === 'heat' && P.boosting && closing > 30, k = melt ? 0.95 : save.opts.headon === 'bulldoze' && closing > 30 ? 0.8 : 0.88; P.vx *= k; P.vz *= k; if (melt && ctx.ev.melt) ctx.ev.melt(); else if (ctx.ev.sideswipe) ctx.ev.sideswipe(); } punt(P, o); continue; }
      P.x += N.nx * pen; P.z += N.nz * pen; P.pvx += N.nx * 1.5; P.pvz += N.nz * 1.5; if (P.hitCool <= 0) { P.hitCool = 0.2; audio.play('hit', 0.3); } }
    else if (same && o[rk] > 0 && ds <= 0 && Math.abs(o.d - P.d) < P.dims.hw + o.dims.hw + 1.35 && Math.abs(P.vs - o.v) > 16 && P.invuln <= 0) ctx.ev.nearMiss(o, Math.sign(o.d - P.d));
    else if (same && o[rk] > 0 && ds <= 0 && Math.abs(o.d - P.d) < 9 && Math.abs(P.vs - o.v) > 16) ctx.ev.pass(o, Math.sign(o.d - P.d));
    o[rk] = ds; } }
  ctx.player = ctx.cur = PL[0]; const P = PL[0]; if (PL.length > 1) hitPlayers(PL[0], PL[1]);
  for (const r of rivals) { if (r.state !== 'drive') continue;
    if (r.ghost <= 0 && ctx.raceT > 1.5) for (const o of list) { if (o.state !== 'drive' || o.track !== r.track) continue; const ds = tr.delta(o.s, r.s); const ov = o.dims.hw + r.dims.hw - 0.1 - Math.abs(o.d - r.d); if (Math.abs(ds) < o.dims.hl + r.dims.hl && ov > 0) { if (r.blindT > 0 || r.stun > 0 || ctx.time - r.lastHit < 3) { crashPair(r, o, Math.abs(r.v - o.v)); break; } const sg = r.d >= o.d ? 1 : -1; r.d += sg * (ov + 0.05); r.dv = sg * 2.5; if (Math.random() < 0.3) ctx.fx.spark(r.x, r.y + 0.5, r.z, r.vx * 0.5, rand(0, 3), r.vz * 0.5, 0.3); } }
    if (r.state !== 'drive') continue;
    if (P.state === 'drive' && !P.frozen && P.invuln <= 0 && r.ghost <= 0) { const pen = obb(P, r, N); if (pen > 0) hitRival(P, r, pen, h); else r.pin = Math.max(0, r.pin - h * 2); }
    for (const q of rivals) { if (q === r || q.state !== 'drive' || r.state !== 'drive') continue; const ds = tr.delta(q.s, r.s), dd = q.d - r.d, ol = q.dims.hw + r.dims.hw + 0.15 - Math.abs(dd); if (Math.abs(ds) < q.dims.hl + r.dims.hl + 0.3 && ol > 0) { const sg = dd >= 0 ? 1 : -1; r.d -= sg * ol * 0.5; r.dv -= sg * 1.2; } } }
  // wrecks vs live vehicles: pile-ups, aftertouch takedowns
  for (const w of ctx.wrecks.list) { const wv = w.v; if (w.pc > 0) w.pc -= h; if (w.age < 0.05) continue; const wr = (wv.dims.hl + wv.dims.hw) * 0.42, wy = wv.y - wv.dims.h * 0.4;
    const tk = ctx.mode === 'pile' ? 1.7 : 1.15, hit = (o, k = 1) => { if (Math.abs(o.y - wy) > 2.6) return false; const dx = wv.x - o.x, dz = wv.z - o.z, fx = Math.sin(o.yaw), fz = Math.cos(o.yaw), ex = Math.max(0, Math.abs(dx * fz - dz * fx) - o.dims.hw), ez = Math.max(0, Math.abs(dx * fx + dz * fz) - o.dims.hl); return ex * ex + ez * ez < wr * wr * k * k; };
    for (const o of list) if (o.state === 'drive' && hit(o, tk)) wreckBy(o, w);
    for (const r of rivals) if (r.state === 'drive' && r.ghost <= 0 && (w.player || (w.credit && w.age < 2.5) || (!w.punt && w.age > 0.4)) && hit(r)) wreckBy(r, w);
    for (const P of PL) if (P.state === 'drive' && !P.frozen && wv !== P && !(w.pc > 0) && hit(P)) { ctx.player = ctx.cur = P; if (ctx.mode === 'pile') { if (P.invuln <= 0) wreckBy(P, w); } else { const lv = w.body.linvel(), fx = Math.sin(P.yaw), fz = Math.cos(P.yaw), sd = (wv.x - P.x) * -fz + (wv.z - P.z) * fx >= 0 ? 1 : -1; w.body.setLinvel({ x: P.vx * 0.7 - fz * sd * 9, y: Math.max(lv.y, 4), z: P.vz * 0.7 + fx * sd * 9 }, true); w.pc = 0.8; P.vx *= 0.95; P.vz *= 0.95; audio.play('thump', 0.6); camOf().bump(0.1); ctx.fx.sparks3(wv.x, wv.y, wv.z, P.vx * 0.4, 3, P.vz * 0.4, 16, 8, 0.5); } } }
  ctx.player = ctx.cur = PL[0];
}
// head and tail lights for every live vehicle (one draw call)
export function drawLights(night) { markRivals();
  const L = ctx.fx.lights; L.begin(); const P = ctx.player;
  const put = (v, braking) => { if (v.state !== 'drive' || !v.root.visible) return; const fx = Math.sin(v.yaw), fz = Math.cos(v.yaw), d = v.dims, hy = v.y + Math.min(d.h * 0.45, 1.1);
    for (const sd of [-1, 1]) { const lx = sd * d.hw * 0.66; let lz = d.hl + 0.06; L.put(v.x + lx * fz + lz * fx, hy, v.z - lx * fx + lz * fz, night ? 1.1 : 0.7, 1.8, 1.7, 1.45, night ? 0.8 : 0.3); lz = -d.hl - 0.06; L.put(v.x + lx * fz + lz * fx, hy + 0.08, v.z - lx * fx + lz * fz, braking ? 1.0 : night ? 0.6 : 0.5, 2.2, 0.1, 0.05, braking ? 1 : night ? 0.7 : 0.35); } };
  for (const p of ctx.players || [P]) put(p, (p.inp || input).brake > 0.2 && !p.auto); for (const r of ctx.rivals) put(r, false); for (const o of ctx.traffic.list) put(o, o.v === 0);
  L.end();
}

export function wreckPlayer() { const P = ctx.player; if (P && P.state === 'drive') wallLaunch(P, Math.sign(P.d) || 1, P.vx, P.vz); }
