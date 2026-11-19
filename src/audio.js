// GREENLIGHT - all sound is synthesized with WebAudio: engine, wind, crashes and music
import { clamp, damp, save, rand } from './core.js';

const midi = n => 440 * Math.pow(2, (n - 69) / 12);
const P = s => [...s].map(c => c === 'x');
const STYLES = {
  menu: { bpm: 92, root: 57, prog: [[0, 3], [-4, 4], [-7, 4], [-2, 4]], arp: [0, 7, 12, 15, 12, 7, 3, 7], kick: P(''), snare: P(''), hat: P(''), bass: [] },
  neon: { bpm: 150, root: 57, prog: [[0, 3], [0, 3], [-4, 4], [-2, 4]], arp: [12, 15, 19, 24, 19, 15, 12, 7], kick: P('x...x...x...x...'), snare: P('....x.......x...'), hat: P('..x...x...x...xx'), bass: [0, null, 0, 0, null, 0, 0, 12, 0, null, 0, 0, null, 0, 7, 10] },
  desert: { bpm: 166, root: 52, prog: [[0, 3], [3, 4], [-2, 4], [-4, 4]], arp: [12, 19, 15, 19, 24, 19, 15, 19], kick: P('x..x..x...x.x...'), snare: P('....x.......x..x'), hat: P('x.x.x.x.x.x.x.x.'), bass: [0, 0, null, 0, 0, null, 0, 0, 0, 0, null, 0, 0, null, 12, 12] },
  coast: { bpm: 142, root: 53, prog: [[0, 4], [7, 4], [-3, 3], [5, 4]], arp: [12, 16, 19, 24, 19, 16, 12, 16], kick: P('x...x...x...x...'), snare: P('....x.......x...'), hat: P('..x...x...x...x.'), bass: [0, null, null, 0, null, null, 0, null, 0, null, null, 0, null, 7, null, 0] },
  snow: { bpm: 172, root: 48, prog: [[0, 3], [-4, 4], [3, 4], [-2, 4]], arp: [12, 15, 19, 22, 24, 22, 19, 15], kick: P('x.........x.....'), snare: P('....x.......x...'), hat: P('x.xxx.xxx.xxx.xx'), bass: [0, null, null, null, null, null, 0, null, null, null, 0, null, null, null, 7, null] },
};

export const audio = {
  ac: null, ready: false, rpm: 0.2, m: { timer: null, step: 0, next: 0, style: null, mode: 'menu', intensity: 0 },
  init() {
    if (this.ac) { if (this.ac.state === 'suspended') this.ac.resume(); return; }
    try { const AC = window.AudioContext || window.webkitAudioContext, ac = this.ac = new AC();
      this.master = ac.createGain(); const comp = ac.createDynamicsCompressor(); comp.threshold.value = -15; comp.ratio.value = 6; this.master.connect(comp); comp.connect(ac.destination); this.comp = comp;
      this.lp = ac.createBiquadFilter(); this.lp.type = 'lowpass'; this.lp.frequency.value = 20000; this.lp.connect(this.master);
      this.sfx = ac.createGain(); this.sfx.connect(this.lp); this.mus = ac.createGain(); this.mus.connect(this.lp);
      const nb = this.nb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      this.dly = ac.createDelay(1); this.dly.delayTime.value = 0.3; const fb = ac.createGain(); fb.gain.value = 0.34; this.dly.connect(fb); fb.connect(this.dly); this.dly.connect(this.mus);
      const E = this.E = {}; E.out = ac.createGain(); E.out.gain.value = 0; E.f = ac.createBiquadFilter(); E.f.type = 'lowpass'; E.f.frequency.value = 600; E.f.Q.value = 1.4;
      const ws = ac.createWaveShaper(), cv = new Float32Array(256); for (let i = 0; i < 256; i++) cv[i] = Math.tanh((i / 128 - 1) * 2.4); ws.curve = cv;
      E.o = [['sawtooth', 1, 0.5], ['square', 0.5, 0.34], ['sawtooth', 2.01, 0.16], ['triangle', 0.25, 0.5]].map(([type, mul, g]) => { const o = ac.createOscillator(); o.type = type; const gg = ac.createGain(); gg.gain.value = g; o.connect(gg); gg.connect(ws); o.start(); return { o, mul }; });
      ws.connect(E.f); E.f.connect(E.out); E.out.connect(this.sfx);
      const loop = (type, freq, q) => { const s = ac.createBufferSource(); s.buffer = nb; s.loop = true; const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; const g = ac.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(this.sfx); s.start(); return { f, g }; };
      E.wind = loop('bandpass', 600, 0.5); E.boost = loop('bandpass', 1500, 0.8); E.skid = loop('bandpass', 1300, 5); E.scrape = loop('highpass', 2600, 0.7); E.rain = loop('highpass', 5200, 0.3);
      this.setVol(); this.ready = true; } catch (e) { this.ac = null; }
  },
  setVol() { if (!this.ac) return; this.sfx.gain.value = save.opts.sfx; this.mus.gain.value = save.opts.music * 0.6; },
  update(dt, s) {
    if (!this.ready) return; const t = this.ac.currentTime, E = this.E, on = s.on ? 1 : 0, f = clamp(s.speed / s.vmax, 0, 1.1), G = [0, 0.16, 0.3, 0.46, 0.64, 0.84, 1.12];
    let gi = 0; while (gi < 5 && f > G[gi + 1]) gi++; this.rpm = damp(this.rpm, 0.22 + 0.78 * (f - G[gi]) / (G[gi + 1] - G[gi]), 9, dt);
    const base = 46 + this.rpm * 150 + gi * 7; E.o.forEach(x => x.o.frequency.setTargetAtTime(base * x.mul, t, 0.03));
    E.f.frequency.setTargetAtTime(340 + this.rpm * 1900 + s.throttle * 900, t, 0.05); E.out.gain.setTargetAtTime(on * (0.06 + 0.07 * s.throttle + 0.05 * this.rpm) * (s.slow ? 0.45 : 1), t, 0.06);
    E.wind.g.gain.setTargetAtTime(on * f * f * 0.3, t, 0.1); E.wind.f.frequency.setTargetAtTime(400 + f * 900, t, 0.1);
    E.boost.g.gain.setTargetAtTime(on * (s.boosting ? 0.32 : 0), t, 0.07); E.skid.g.gain.setTargetAtTime(on * clamp(s.skid, 0, 1) * 0.15, t, 0.05); E.scrape.g.gain.setTargetAtTime(on * clamp(s.scrape, 0, 1) * 0.22, t, 0.03); E.rain.g.gain.setTargetAtTime(s.rain ? 0.03 : 0, t, 0.3);
    this.lp.frequency.setTargetAtTime(s.slow ? 620 : 20000, t, 0.08);
  },
  _out(node, vol, pan, bus) { const ac = this.ac, g = ac.createGain(); node.connect(g); let last = g; if (pan && ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); g.connect(p); last = p; } last.connect(bus || this.sfx); return g; },
  noise(dur, type, f0, f1, q, vol, pan = 0, when = 0, bus) { if (!this.ready) return; const ac = this.ac, t = ac.currentTime + when, s = ac.createBufferSource(); s.buffer = this.nb; const f = ac.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur); s.connect(f); const g = this._out(f, vol, pan, bus); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.start(t, Math.random() * 1.2); s.stop(t + dur + 0.05); },
  tone(type, f0, f1, dur, vol, pan = 0, when = 0, bus) { if (!this.ready) return; const ac = this.ac, t = ac.currentTime + when, o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur); const g = this._out(o, vol, pan, bus); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.start(t); o.stop(t + dur + 0.05); },
  play(name, v = 1, pan = 0) {
    if (!this.ready) return; v = clamp(v, 0, 1.3);
    switch (name) {
      case 'crash': this.noise(0.9, 'lowpass', 2600, 150, 0.7, 0.9 * v); this.tone('sine', 95, 32, 0.55, 0.9 * v); for (let k = 0; k < 5; k++) this.tone('square', rand(700, 2600), rand(200, 900), rand(0.05, 0.14), 0.1 * v, rand(-0.6, 0.6), rand(0, 0.25)); this.noise(0.5, 'highpass', 5000, 7500, 0.5, 0.28 * v, 0, 0.05); break;
      case 'hit': this.noise(0.22, 'bandpass', 1800, 500, 1, 0.5 * v, pan); this.tone('sine', 140, 60, 0.14, 0.5 * v, pan); this.tone('square', rand(900, 1700), 400, 0.06, 0.09 * v, pan); break;
      case 'thump': this.noise(0.3, 'lowpass', 900, 120, 0.7, 0.6 * v, pan); this.tone('sine', 80, 38, 0.25, 0.6 * v, pan); break;
      case 'whoosh': this.noise(0.3, 'bandpass', 950, 240, 1.2, 0.4 * v, pan); break;
      case 'near': this.noise(0.3, 'bandpass', 950, 240, 1.2, 0.45 * v, pan); this.tone('sine', 1250, 1900, 0.08, 0.06 * v, pan); break;
      case 'takedown': this.tone('sawtooth', 110, 440, 0.35, 0.2 * v); this.noise(0.8, 'highpass', 3000, 9000, 0.5, 0.24 * v, 0, 0.3); this.tone('sine', 70, 35, 0.6, 0.8 * v, 0, 0.28); break;
      case 'boost': this.noise(0.5, 'bandpass', 500, 3200, 1.5, 0.36 * v); this.tone('sawtooth', 80, 240, 0.35, 0.1 * v); break;
      case 'beep': this.tone('square', 440, 440, 0.2, 0.16 * v); break;
      case 'go': this.tone('square', 880, 880, 0.55, 0.2 * v); this.tone('sawtooth', 220, 880, 0.3, 0.1 * v); break;
      case 'ui': this.tone('triangle', 660, 880, 0.06, 0.14 * v); break;
      case 'ok': this.tone('triangle', 520, 1040, 0.12, 0.16 * v); break;
      case 'cash': [880, 1108, 1320, 1760].forEach((f, i) => this.tone('triangle', f, f, 0.12, 0.13 * v, 0, i * 0.07)); break;
      case 'explosion': this.noise(1.6, 'lowpass', 1800, 60, 0.6, 1.0 * v); this.tone('sine', 70, 22, 1.1, 1.0 * v); this.noise(0.4, 'highpass', 2000, 6000, 0.5, 0.35 * v); break;
      case 'land': this.noise(0.2, 'lowpass', 700, 100, 0.7, 0.45 * v); this.tone('sine', 70, 40, 0.18, 0.5 * v); break;
      case 'fail': this.tone('sawtooth', 300, 90, 0.5, 0.16 * v); break;
    }
  },
  // ---- music sequencer
  music(key, mode = 'race') { const m = this.m; m.mode = mode; if (!this.ready) { m.want = key; return; } if (m.key === key && m.timer) return; this.stopMusic(); m.key = key; m.style = STYLES[key] || STYLES.menu; m.step = 0; m.next = this.ac.currentTime + 0.12; this.dly.delayTime.value = 60 / m.style.bpm / 4 * 3; m.timer = setInterval(() => this.tick(), 40); },
  stopMusic() { const m = this.m; if (m.timer) clearInterval(m.timer); m.timer = null; m.key = null; },
  tick() { const m = this.m, ac = this.ac; if (!m.style || ac.state !== 'running') return; const d = 60 / m.style.bpm / 4; if (m.next < ac.currentTime - 0.5) m.next = ac.currentTime + 0.05; while (m.next < ac.currentTime + 0.16) { this.seq(m.step, m.next - ac.currentTime, m.style, d); m.step++; m.next += d; } },
  seq(step, w, st, d) {
    const s = step % 16, ch = st.prog[(step >> 4) % st.prog.length], root = st.root + ch[0], m = this.m, B = this.mus, I = m.intensity;
    if (m.mode === 'race') {
      if (st.kick[s]) { this.tone('sine', 150, 42, 0.2, 0.75, 0, w, B); }
      if (st.snare[s]) { this.noise(0.14, 'bandpass', 1900, 1500, 0.8, 0.34, 0, w, B); this.tone('triangle', 190, 120, 0.08, 0.25, 0, w, B); }
      if (st.hat[s]) this.noise(s % 4 === 2 ? 0.08 : 0.035, 'highpass', 7500, 9000, 0.5, 0.11, 0, w, B);
      const b = st.bass[s]; if (b !== null && b !== undefined) { const f = midi(root - 12 + b); this.tone('sawtooth', f, f, d * 0.95, 0.2, 0, w, B); this.tone('square', f / 2, f / 2, d * 0.95, 0.14, 0, w, B); }
    }
    if (m.mode === 'menu' ? s % 2 === 0 : (I > 0.35 || s % 4 === 0)) { const f = midi(root + st.arp[(m.mode === 'menu' ? step >> 1 : step) % st.arp.length]); this.tone('square', f, f, d * 0.8, m.mode === 'menu' ? 0.045 : 0.03 + 0.04 * I, (s % 4 - 1.5) * 0.25, w, this.dly); }
    if (s === 0) for (const k of [0, ch[1], 7]) { const f = midi(root + k); this.tone('sawtooth', f, f * 1.003, d * 16, m.mode === 'menu' ? 0.035 : 0.022, 0, w, B); }
  },
};
