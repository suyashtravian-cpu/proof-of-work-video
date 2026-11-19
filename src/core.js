// GREENLIGHT: Never Stop - shared core: math, config, save data, input
export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const damp = (a, b, k, dt) => b + (a - b) * Math.exp(-k * dt);
export const wrapPi = a => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
export const rand = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
export const rsign = () => Math.random() < 0.5 ? -1 : 1;
export const pick = a => a[(Math.random() * a.length) | 0];
export const approach = (v, t, up, down = up) => v < t ? Math.min(t, v + up) : Math.max(t, v - down);
export function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export const $ = id => document.getElementById(id);
export const isTouch = typeof matchMedia !== 'undefined' && (matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window);

// shared runtime context (renderer, scene, track, player...) filled in by game.js
export const ctx = { time: 0, timeScale: 1, q: null };

export const QUALITY = {
  low: { name: 'low', maxPR: 1, minPR: 0.45, bloom: false, shadows: false, physical: false, props: 0.45, traffic: 0.75, aniso: 2, particles: 0.5, msaa: 0 },
  med: { name: 'med', maxPR: 1.25, minPR: 0.55, bloom: true, shadows: false, physical: true, props: 0.75, traffic: 1, aniso: 4, particles: 1, msaa: 0 },
  high: { name: 'high', maxPR: 1.75, minPR: 0.7, bloom: true, shadows: true, physical: true, props: 1, traffic: 1.15, aniso: 8, particles: 1, msaa: 4 },
};

// ---- tuning (editable in the hidden tuning panel, saved on this device)
// game speed presets: [speed scale, share of the car's extra boost speed, clean-run bonus]
// Normal = Burnout 3 (about 225 km/h cruising, 255 boosting), Fast = 260/330, Insane = the original tuning
export const SPEEDS = { normal: [0.687, 0.45, 0.15], fast: [0.79, 1, 0.15], insane: [1, 1, 0.3] };
// the Game Speed meter (0 = Normal, 0.5 = Fast, 1 = Insane) blends smoothly between the presets
export const speedT = () => { let t = save.opts.speed; if (typeof t === 'string') t = { normal: 0, fast: 0.5, insane: 1 }[t] ?? 0; return Math.max(0, Math.min(1, +t || 0)); };
export function spdK() { const t = speedT(), lo = t <= 0.5, a = lo ? SPEEDS.normal : SPEEDS.fast, b = lo ? SPEEDS.fast : SPEEDS.insane, f = lo ? t * 2 : (t - 0.5) * 2; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; }
export function rumble(strong, weak, ms) { try { for (const gp of (navigator.getGamepads ? navigator.getGamepads() : [])) if (gp && gp.vibrationActuator) gp.vibrationActuator.playEffect('dual-rumble', { duration: ms, strongMagnitude: strong, weakMagnitude: weak }).catch(() => { }); } catch (e) { } }
export const CFG_DEF = { speed: 1.3, accel: 1.2, accelTime: 8, grip: 1.12, steer: 1, boostPower: 1, boostGain: 1, boostDrain: 1, crashForce: 1, slowmo: 0.2, fov: 54, fovSpeed: 8, blur: 1, shake: 1, camDist: 6.6, camHeight: 2.35, traffic: 1, rivalSpeed: 1, aggression: 1 };
export const CFG = { ...CFG_DEF };
export const TUNE = [['speed', 'Top speed', 0.6, 2], ['accelTime', 'Seconds to top speed', 2, 14], ['grip', 'Grip', 0.5, 2], ['steer', 'Steering speed', 0.5, 2], ['boostPower', 'Boost power', 0.3, 2.5], ['boostGain', 'Boost earn rate', 0.3, 3], ['boostDrain', 'Boost drain', 0.3, 3], ['crashForce', 'Crash force', 0.3, 3], ['slowmo', 'Crash slow motion', 0.08, 0.6], ['fov', 'Camera FOV', 50, 85], ['fovSpeed', 'Extra FOV at speed', 0, 50], ['blur', 'Speed blur', 0, 2.5], ['shake', 'Camera shake', 0, 3], ['camDist', 'Camera distance', 3.5, 9], ['camHeight', 'Camera height', 0.9, 3], ['traffic', 'Traffic density', 0.2, 2.5], ['rivalSpeed', 'Rival speed', 0.7, 1.3], ['aggression', 'Rival aggression', 0, 3]];

const ls = { get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } } };
export function loadTune() { const t = ls.get('greenlight.tune3'); if (t) for (const k in CFG_DEF) if (typeof t[k] === 'number') CFG[k] = t[k]; }
export function storeTune() { ls.set('greenlight.tune3', CFG); }

// ---- save data
export const save = { cash: 0, owned: ['muscle'], car: 'muscle', paint: {}, medals: {}, best: {}, opts: { quality: 'auto', unit: 'kmh', music: 0.5, sfx: 0.9, auto: isTouch, cam: 0, split: 'h', assist: 1, speed: 0, headon: 'deadly', style: 'std' } };
export function loadSave() { const s = ls.get('greenlight.save.v1'); if (!s) return; for (const k of ['cash', 'owned', 'car', 'paint', 'medals', 'best']) if (s[k] !== undefined) save[k] = s[k]; Object.assign(save.opts, s.opts || {}); }
export function storeSave() { ls.set('greenlight.save.v1', save); }

// ---- gamepads: ignore phantom devices (a second HID device some dongles create, with axes stuck at -1)
// a pad only counts once something on it actually moves, and any axis or button that rests far from zero is ignored
const PADREST = {};
export function livePads() { const out = []; try { for (const g of (navigator.getGamepads ? navigator.getGamepads() : [])) { if (!g || !g.connected) continue; let r = PADREST[g.index]; if (!r || r.id !== g.id) r = PADREST[g.index] = { id: g.id, ax: [...g.axes], bt: g.buttons.map(b => b.value), live: false };
  g.axes.forEach((v, i) => { if (Math.abs(r.ax[i] || 0) > 0.5 && Math.abs(v) < 0.2) r.ax[i] = 0; }); g.buttons.forEach((b, i) => { if ((r.bt[i] || 0) > 0.5 && b.value < 0.1) r.bt[i] = 0; });
  if (!r.live && (g.axes.some((v, i) => Math.abs(v - (r.ax[i] || 0)) > 0.4) || g.buttons.some((b, i) => Math.abs(b.value - (r.bt[i] || 0)) > 0.5))) r.live = true; if (r.live) out.push(g); } } catch (e) { } return out; }
export function padX(g, i = 0) { const r = PADREST[g.index]; if (r && Math.abs(r.ax[i] || 0) > 0.5) return 0; const v = g.axes[i] || 0; return Math.abs(v) > 0.15 ? Math.sign(v) * Math.min(1, (Math.abs(v) - 0.15) / 0.85) : 0; }
export function padB(g, i) { const r = PADREST[g.index]; if (r && (r.bt[i] || 0) > 0.5) return 0; return g.buttons[i] ? g.buttons[i].value : 0; }
// ---- input: keyboard + gamepad + touch merged into one state
export const input = { steer: 0, throttle: 0, brake: 0, boost: false, pressed: new Set(), keys: new Set(), touch: { steer: 0, boost: false, brake: false, active: false }, analog: false,
  hit(code) { if (this.pressed.has(code)) { this.pressed.delete(code); return true; } return false; },
  update(dt) {
    const k = this.keys; let st = 0, th = 0, br = 0, bo = false, analog = false;
    if (k.has('ArrowLeft') || k.has('KeyA')) st -= 1; if (k.has('ArrowRight') || k.has('KeyD')) st += 1;
    if (k.has('ArrowUp') || k.has('KeyW')) th = 1; if (k.has('ArrowDown') || k.has('KeyS')) br = 1;
    if (k.has('Space') || k.has('ShiftLeft') || k.has('ShiftRight') || k.has('KeyX')) bo = true;
    try { for (const g of livePads()) { const ax = padX(g, 0); if (ax) { st = ax; analog = true; }
      const b = i => padB(g, i); th = Math.max(th, b(7)); br = Math.max(br, b(6)); if (b(0) > 0.5 || b(2) > 0.5 || b(5) > 0.5) bo = true;
      const ed = (i, code) => { const d = b(i) > 0.5; if (d && !this['_g' + i]) this.pressed.add(code); this['_g' + i] = d; }; ed(9, 'Escape'); ed(8, 'KeyV'); ed(3, 'KeyC'); ed(1, 'KeyR'); ed(0, 'Enter'); } } catch (e) { }
    const t = this.touch; if (t.active) { if (Math.abs(t.steer) > 0.02) { st = t.steer; analog = true; } if (t.boost) bo = true; if (t.brake) br = 1; }
    if (save.opts.auto && br < 0.1) th = 1;
    if (analog) this.steer = st; else { const rate = st === 0 ? 7 : (Math.sign(st) !== Math.sign(this.steer) ? 9 : 4.2); this.steer = approach(this.steer, st, rate * dt); }
    this.throttle = th; this.brake = br; this.boost = bo; this.analog = analog;
  } };
if (typeof window !== 'undefined') {
  addEventListener('keydown', e => { if (e.repeat) return; input.keys.add(e.code); input.pressed.add(e.code); if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault(); });
  addEventListener('keyup', e => input.keys.delete(e.code));
  addEventListener('blur', () => input.keys.clear());
}
export function bindTouch() {
  const t = input.touch, zone = $('tSteer'), knob = $('tKnob'); if (!zone) return; let id = null, x0 = 0;
  zone.addEventListener('pointerdown', e => { t.active = true; id = e.pointerId; x0 = e.clientX; knob.style.display = 'block'; knob.style.left = e.clientX + 'px'; knob.style.top = e.clientY + 'px'; zone.setPointerCapture(id); });
  zone.addEventListener('pointermove', e => { if (e.pointerId !== id) return; t.steer = clamp((e.clientX - x0) / 64, -1, 1); knob.style.transform = `translate(${t.steer * 64 - 34}px,-34px)`; });
  const end = e => { if (e.pointerId !== id) return; id = null; t.steer = 0; knob.style.display = 'none'; knob.style.transform = 'translate(-34px,-34px)'; };
  zone.addEventListener('pointerup', end); zone.addEventListener('pointercancel', end);
  const btn = (el, key) => { if (!el) return; el.addEventListener('pointerdown', e => { t.active = true; t[key] = true; el.classList.add('on'); e.preventDefault(); }); const up = () => { t[key] = false; el.classList.remove('on'); }; el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('pointerleave', up); };
  btn($('tBoost'), 'boost'); btn($('tBrake'), 'brake');
}
