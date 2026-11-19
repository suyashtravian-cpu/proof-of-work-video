// GREENLIGHT: Never Stop - game flow, modes, HUD and menus
import * as THREE from 'three';
import { ctx, CFG, CFG_DEF, TUNE, QUALITY, save, loadSave, storeSave, loadTune, storeTune, input, bindTouch, isTouch, clamp, damp, rand, pick, $, wrapPi, spdK, speedT, rumble, livePads, padX, padB } from './core.js';
import { CARS, CAR_IDS, RIVAL_IDS, RIVAL_COLS, PAINTS, CREDITS, makeCar, loadTraffic, loadEnv } from './assets.js';
import { CITIES, buildWorld } from './track.js';
import { FX, Post, Cam, LightTrail, CarStreaks, INTRO_T } from './fx.js';
import { Player, Rival, Traffic, Wrecks, simulate, drawLights, initPhysics, wreckVehicle, wreckPlayer } from './vehicles.js';
import { audio } from './audio.js';
import { makeCraft, rivalLook, HOVER_P1, HOVER_P2 } from './craft.js';

// HOVER (default): the player flies Twinblade, rivals fly Obsidian / Ronin / Mantis. Same physics as the cars.
const hoverOn = () => (save.opts.veh || 'hover') === 'hover';

const EVENTS = [], ORDER = ['coast', 'desert', 'neon', 'snow'], UNLOCK = { coast: 0, desert: 2, neon: 4, snow: 7 }, MEDAL = ['none', 'bronze', 'silver', 'gold'], COL = { neon: '#ff2e88', desert: '#ff9a1f', coast: '#19c8ff', snow: '#cfe4ff' };
for (const c of ORDER) EVENTS.push({ id: c + '-race', city: c, mode: 'race', name: 'RACE', desc: '2 laps against 7 rivals' }, { id: c + '-brawl', city: c, mode: 'brawl', name: 'BRAWL', desc: 'Rivals keep coming. Wreck them first', targets: [6, 14, 24], traffic: true }, { id: c + '-openbrawl', city: c, mode: 'brawl', name: 'OPEN BRAWL', desc: 'No traffic. Just you and the pack', targets: [8, 18, 30], traffic: false }, { id: c + '-pile', city: c, mode: 'pile', name: 'PILE-UP', desc: 'Cause the most expensive crash', targets: c === 'desert' ? [600000, 1300000, 2600000] : [400000, 900000, 1800000] });
const TIPS = ['Drive in the oncoming lanes to fill your boost faster.', 'Brake and steer together to drift through tight corners.', 'Slam rivals into walls or traffic to RED LIGHT them. It refills and extends your boost.', 'Stay clean. Your top speed keeps building until you wreck.', 'After a crash, steer your wreck into rivals for a Wreck Steer Red Light.', 'Near misses with traffic earn boost. The closer, the better.', 'In Pile-Up, hit the busy cross traffic, then trigger the Detonator.', 'Crash with a full boost bar, then tap BOOST to set off a Crashbreaker and wreck everyone nearby.', 'Burn a FULL boost bar in one go without crashing for a BURNOUT: free boost and cash. Chain them.', 'Hunt the gold BOUNTY rival in Brawl for $3,000 and a Rampage.', 'Find all 8 Signature Takedowns: gantries, tunnels, landings, double takedowns and more.'];
const canvas = $('c'), G = { state: 'boot', paused: false, ev: null, earn: { onc: 0, drift: 0 }, pr: 1, hudT: 0, bannerT: 0 }, H = {};
['pos', 'posOf', 'hPos', 'hLap', 'hTime', 'hTake', 'takeLbl', 'take', 'spd', 'unit', 'bFill', 'bSeg', 'bMul', 'hBoost', 'pop', 'big', 'bigT', 'bigSub', 'earn', 'map', 'wrong', 'hint', 'dmg'].forEach(id => H[id] = $(id));
let renderer, camera, post, cam, camera2, cam2, menu = null, race = null;
const cash = n => '$' + Math.round(n).toLocaleString('en-US'), fmtTime = t => Math.floor(t / 60) + ':' + (t % 60 < 10 ? '0' : '') + (t % 60).toFixed(1);
const setText = (el, t) => { if (el._t !== t) { el._t = t; el.textContent = t; } };
const medals = () => Object.values(save.medals).filter(m => m && m !== 'none').length;

// ---------- ads (CrazyGames SDK is only loaded when the game runs on their site)
const ads = { sdk: null,
  async init() { if (!/crazygames/i.test(location.hostname + ' ' + document.referrer) && !/[?&]cg=1/.test(location.search)) return; try { await new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'https://sdk.crazygames.com/crazygames-sdk-v3.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); await window.CrazyGames.SDK.init(); this.sdk = window.CrazyGames.SDK; } catch (e) { this.sdk = null; } },
  start() { try { this.sdk && this.sdk.game.gameplayStart(); } catch (e) { } }, stop() { try { this.sdk && this.sdk.game.gameplayStop(); } catch (e) { } }, happy() { try { this.sdk && this.sdk.game.happytime(); } catch (e) { } },
  show(type, done, fail) { if (!this.sdk) return (fail || done)(); const v = save.opts.music, fin = ok => () => { save.opts.music = v; audio.setVol(); audio.ac && audio.ac.resume(); (ok ? done : (fail || done))(); }; try { audio.ac && audio.ac.suspend(); this.sdk.ad.requestAd(type, { adFinished: fin(true), adError: fin(false), adStarted: () => { } }); } catch (e) { fin(false)(); } } };

// ---------- renderer + quality
function pickTier() {
  const t = save.opts.quality; if (t !== 'auto') return t; let gpu = ''; try { const gl = renderer.getContext(), e = gl.getExtension('WEBGL_debug_renderer_info'); gpu = e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : ''; } catch (e) { } G.gpu = gpu;
  if (/swiftshader|llvmpipe|software|basic render/i.test(gpu)) return 'low';
  if (isTouch) return /apple|adreno \(tm\) (7|8)|mali-g7[1-9]|mali-g[6-9]1[05]/i.test(gpu) ? 'med' : 'low';
  if (/nvidia|geforce|radeon rx|rtx|gtx|apple m|arc\(tm\)/i.test(gpu)) return 'high';
  if (/intel/i.test(gpu) && !/iris.*xe|arc/i.test(gpu)) return 'low';
  return 'med';
}
function applyTier(name) { const q = ctx.q = QUALITY[name]; G.pr = Math.min(q.maxPR, window.devicePixelRatio || 1); renderer.shadowMap.enabled = q.shadows; renderer.shadowMap.type = THREE.PCFSoftShadowMap; if (post) post.composer.dispose(); post = new Post(renderer, (race || menu || { scene: new THREE.Scene() }).scene, camera); ctx.post = post; resize(); }
function resize() { const w = innerWidth, h = innerHeight; renderer.setPixelRatio(G.pr); renderer.setSize(w, h, false); const sv = G.vs && save.opts.split === 'v', vw = sv ? Math.floor(w / 2) : w, vh = G.vs && !sv ? Math.floor(h / 2) : h; camera.aspect = vw / vh; camera.updateProjectionMatrix(); if (camera2) { camera2.aspect = vw / vh; camera2.updateProjectionMatrix(); } post.setSize(vw, vh, G.pr); }
function applySplit() { document.body.classList.toggle('splitV', save.opts.split === 'v'); if (renderer) resize(); }

// ---------- menu scene: the selected car on a turntable
async function buildMenu() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x05070a); scene.fog = new THREE.Fog(0x05070a, 16, 44); scene.environment = (await loadEnv('neon')).env;
  scene.add(new THREE.Mesh(new THREE.CircleGeometry(40, 64).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x0b0e13, roughness: 0.5, metalness: 0.5, envMapIntensity: 0.3 })));
  for (const [a, b, k] of [[3.7, 3.82, 3.2], [5.6, 5.66, 1.4], [8.4, 8.44, 0.7]]) { const r = new THREE.Mesh(new THREE.RingGeometry(a, b, 128).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x19f07a).multiplyScalar(k) })); r.position.y = 0.012; scene.add(r); }
  const key = new THREE.DirectionalLight(0xffffff, 3); key.position.set(4, 8, 5); const rim = new THREE.DirectionalLight(0x19f07a, 1.6); rim.position.set(-6, 3, -5); const fill = new THREE.DirectionalLight(0x6fa8ff, 1.1); fill.position.set(-4, 4, 6); scene.add(key, rim, fill, new THREE.HemisphereLight(0x8fa3c8, 0x101016, 0.8));
  menu = { scene, car: null, id: null, holder: new THREE.Group() }; scene.add(menu.holder);
}
async function setMenuCar(id) { const col = save.paint[id] ?? CARS[id].color ?? null, hv = hoverOn(), key = (hv ? 'h:' : '') + id; if (menu.id === key && menu.car) return menu.car.setPaint(col); menu.id = key; const inst = hv ? makeCraft('twinblade', HOVER_P1, CARS[id], true) : await makeCar(id, col); if (menu.id !== key) return; menu.holder.clear(); menu.holder.add(inst.group); menu.car = inst; }

// ---------- screens
const SCREENS = ['sControls', 'sTitle', 'sTour', 'sGarage', 'sSettings', 'sCredits', 'sTune', 'sLoad', 'sPause', 'sResult', 'sFun', 'sVs'];
function show(id) { for (const s of SCREENS) $(s).classList.toggle('on', s === id); G.screen = id; G.padLock = true; if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); }
// keyboard / gamepad menus: move the highlight to the nearest button in a direction
function menuNav(dx, dy) {
  const sc = $(G.screen); if (!sc) return; const els = [...sc.querySelectorAll('button')].filter(b => !b.disabled && b.offsetParent); if (!els.length) return; const cur = els.includes(document.activeElement) ? document.activeElement : null;
  if (!cur) return (sc.querySelector('.ev, button.pri:not([disabled])') || els[0]).focus();
  const r = cur.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2; let best = null, bd = 1e9;
  for (const b of els) { if (b === cur) continue; const q = b.getBoundingClientRect(), ex = q.left + q.width / 2 - cx, ey = q.top + q.height / 2 - cy, along = ex * dx + ey * dy, d = along + (Math.abs(ex * dy) + Math.abs(ey * dx)) * 2.5; if (along > 4 && d < bd) { bd = d; best = b; } }
  if (best) { best.focus(); audio.play('ui'); }
}
let padT = 0;
function padMenu(rdt) {
  padT -= rdt; const gp = livePads()[0]; if (!gp || !G.screen) return;
  const b = i => padB(gp, i) > 0.5, ax = padX(gp, 0), ay = padX(gp, 1), x = (b(15) ? 1 : 0) - (b(14) ? 1 : 0) || (Math.abs(ax) > 0.55 ? Math.sign(ax) : 0), y = (b(13) ? 1 : 0) - (b(12) ? 1 : 0) || (Math.abs(ay) > 0.55 ? Math.sign(ay) : 0);
  if (!x && !y && !b(0) && !b(1)) { padT = 0; G.padLock = false; return; } if (G.padLock || padT > 0) return; padT = 0.22; const sc = $(G.screen);
  if (b(0)) { const a = sc.contains(document.activeElement) ? document.activeElement : sc.querySelector('button.pri:not([disabled])'); padT = 0.4; if (a) a.click(); }
  else if (b(1)) { const k = sc.querySelector('#cBack, [data-go="title"], #pResume'); padT = 0.4; if (k) k.click(); }
  else if (G.screen === 'sGarage' && x) $(x < 0 ? 'gPrev' : 'gNext').click(); else menuNav(x, x ? 0 : y);
}
function refreshCash() { for (const id of ['tCash', 'wCash', 'gCash', 'fCash']) $(id).textContent = cash(save.cash); }
function go(name) {
  if (name === 'title' && G.state === 'play' && G.paused) return show('sPause');   // settings / controls opened from the pause menu go back to it
  if (name === 'controls') { G.ctlFrom = G.screen; return show('sControls'); }
  refreshCash(); if (audio.ready && G.state !== 'play') audio.music('menu', 'menu');
  if (name === 'title') { G.state = 'title'; show('sTitle'); if (menu) setMenuCar(save.car); }
  else if (name === 'tour') { renderTour(); show('sTour'); }
  else if (name === 'garage') { G.gi = Math.max(0, CAR_IDS.indexOf(save.car)); renderGarage(); show('sGarage'); }
  else if (name === 'settings') { renderSettings(); show('sSettings'); }
  else if (name === 'credits') { $('cred').innerHTML = '<p><b>GREENLIGHT: Never Stop</b> by Pilot Access.</p><p style="margin:6px 0">3D models are used under Creative Commons licences. They were resized, recoloured and optimized for this game.</p>' + CREDITS.map(c => `<p><b>${c[0]}</b>: "${c[1]}" by ${c[2]} (${c[3]}), ${c[4]}</p>`).join('') + '<p style="margin-top:6px">CC BY 4.0 licence: creativecommons.org/licenses/by/4.0</p>'; show('sCredits'); }
  else if (name === 'tune') { renderTune(); show('sTune'); }
  else if (name === 'fun') { renderFun(); show('sFun'); }
  else if (name === 'vs') { renderVs(); show('sVs'); }
}
function renderTour() {
  const el = $('cities'); el.innerHTML = ''; const mc = medals();
  for (const key of ORDER) { const c = CITIES[key], locked = mc < UNLOCK[key], d = document.createElement('div'); d.className = 'city' + (locked ? ' lock' : '');
    d.innerHTML = `<div class="bar" style="background:${COL[key]}"></div><h3>${c.name}</h3><p>${locked ? 'LOCKED. WIN ' + UNLOCK[key] + ' MEDALS (' + mc + '/' + UNLOCK[key] + ')' : c.tag}</p>`;
    if (!locked) for (const ev of EVENTS.filter(e => e.city === key)) { const b = document.createElement('button'); b.className = 'ev'; b.innerHTML = `<span>${ev.name}<small>${ev.desc}</small></span><i class="medal ${save.medals[ev.id] || ''}"></i>`; b.onclick = () => { audio.init(); audio.play('ok'); startEvent(ev); }; d.appendChild(b); }
    el.appendChild(d); }
}
function renderGarage() {
  const id = CAR_IDS[G.gi], c = CARS[id], own = save.owned.includes(id); $('gName').textContent = c.name; $('gCls').textContent = c.cls.toUpperCase() + (own ? '' : '  /  ' + cash(c.price)); refreshCash();
  $('gStats').innerHTML = [['TOP SPEED', c.vboost / 114], ['ACCELERATION', c.acc / 20], ['HANDLING', c.hnd / 1.15], ['STRENGTH', c.mass / 1.8]].map(([n, v]) => `<div class="stat"><span>${n}</span><div><i style="width:${Math.round(clamp(v, 0, 1) * 100)}%"></i></div></div>`).join('');
  const pe = $('gPaint'); pe.innerHTML = ''; PAINTS.forEach(([n, hex]) => { const b = document.createElement('button'); b.style.background = '#' + hex.toString(16).padStart(6, '0'); b.title = n; if (save.paint[id] === hex) b.className = 'on'; b.onclick = () => { save.paint[id] = hex; storeSave(); audio.play('ui'); renderGarage(); }; pe.appendChild(b); });
  const buy = $('gBuy'), sp = buy.firstElementChild; buy.disabled = false; if (own) { sp.textContent = save.car === id ? 'SELECTED' : 'SELECT'; buy.disabled = save.car === id; } else { sp.textContent = (save.cash >= c.price ? 'BUY ' : 'NEED ') + cash(c.price); buy.disabled = save.cash < c.price; }
  setMenuCar(id);
}
function seg(el, opts, cur, cb, re = renderSettings) { el.innerHTML = ''; opts.forEach(([v, label]) => { const b = document.createElement('button'); b.textContent = label; if (v === cur) b.className = 'on'; b.onclick = () => { audio.play('ui'); cb(v); storeSave(); re(); }; el.appendChild(b); }); }
function renderSettings() {
  seg($('oQual'), [['auto', 'AUTO'], ['low', 'LOW'], ['med', 'MEDIUM'], ['high', 'HIGH']], save.opts.quality, v => { save.opts.quality = v; applyTier(pickTier()); if (G.state !== 'play') { post.setScene(menu.scene, camera); post.setBloom([0.7, 0.5, 0.85]); } });
  seg($('oSplit'), [['h', 'TOP / BOTTOM'], ['v', 'SIDE BY SIDE']], save.opts.split || 'h', v => { save.opts.split = v; applySplit(); });
  const sp = $('oSpeed'), spL = () => { const t = sp.value / 100, K = spdK(), c = CARS[save.car], k = CFG.speed * K[0] * (save.opts.unit === 'mph' ? 2.237 : 3.6); $('oSpeedL').textContent = (t < 0.2 ? 'NORMAL' : t < 0.4 ? 'QUICK' : t < 0.6 ? 'FAST' : t < 0.85 ? 'WILD' : 'INSANE') + '  ·  ' + Math.round(c.vmax * k) + ' / ' + Math.round((c.vmax + (c.vboost - c.vmax) * K[1]) * k) + (save.opts.unit === 'mph' ? ' MPH' : ' KM/H') + ' WITH BOOST'; };
  sp.value = Math.round(speedT() * 100); sp.oninput = () => { save.opts.speed = sp.value / 100; spL(); }; sp.onchange = () => storeSave(); spL();
  $('oReset').style.display = G.state === 'play' ? 'none' : '';
  const sD = () => { $('oStyleD').textContent = STY_DESC[save.opts.style || 'std']; }; seg($('oStyle'), [['std', 'STANDARD'], ['noir', 'NOIR'], ['neon', 'NEON'], ['synth', 'SYNTHWAVE'], ['heat', 'HEAT'], ['redline', 'REDLINE']], save.opts.style || 'std', v => { save.opts.style = v; sD(); applyStyle(); }); sD();
  seg($('oVeh'), [['hover', 'HOVER'], ['classic', 'CLASSIC']], save.opts.veh || 'hover', v => { save.opts.veh = v; if (menu && G.state !== 'play') setMenuCar(save.car); });
  seg($('oClip'), [[false, 'OFF'], [true, 'ON']], !!save.opts.clip, v => { save.opts.clip = v; });
  seg($('oHead'), [['deadly', 'DEADLY'], ['bulldoze', 'BULLDOZE']], save.opts.headon || 'deadly', v => { save.opts.headon = v; });
  seg($('oAssist'), [[0, 'OFF'], [1, 'NORMAL'], [2, 'STRONG']], save.opts.assist ?? 1, v => { save.opts.assist = v; });
  seg($('oUnit'), [['kmh', 'KM/H'], ['mph', 'MPH']], save.opts.unit, v => { save.opts.unit = v; }); seg($('oAuto'), [[true, 'ON'], [false, 'OFF']], save.opts.auto, v => { save.opts.auto = v; });
  $('oMusic').value = save.opts.music; $('oSfx').value = save.opts.sfx;
}
function renderTune() { const el = $('tList'); el.innerHTML = ''; for (const [k, label, a, b] of TUNE) { const row = document.createElement('div'); row.className = 'tune'; row.innerHTML = `<span>${label}</span><input type="range" min="${a}" max="${b}" step="${(b - a) / 100}" value="${CFG[k]}"><b>${(+CFG[k]).toFixed(2)}</b>`; row.querySelector('input').oninput = e => { CFG[k] = +e.target.value; row.lastChild.textContent = CFG[k].toFixed(2); storeTune(); }; el.appendChild(row); } }
function bindUI() {
  document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => { audio.init(); audio.play('ui'); go(b.dataset.go); }));
  $('bQuick').onclick = () => { audio.init(); audio.play('ok'); const mc = medals(), open = EVENTS.filter(e => mc >= UNLOCK[e.city]); startEvent(open.find(e => e.mode === 'race' && !save.medals[e.id]) || open.find(e => !save.medals[e.id]) || pick(open)); };
  addEventListener('keydown', e => { if (!G.screen || G.loading) return; const sc = $(G.screen), k = e.code, ae = document.activeElement, d = { ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1], ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0] }[k];
    if (d) { if (ae && /INPUT|TEXTAREA/.test(ae.tagName) && d[0]) return; e.preventDefault(); audio.init(); if (G.screen === 'sGarage' && d[0]) return $(d[0] < 0 ? 'gPrev' : 'gNext').click(); return menuNav(d[0], d[1]); }
    if (k === 'Enter' && !e.repeat && !(ae && sc.contains(ae))) { const b = sc.querySelector('button.pri:not([disabled])'); if (b) { e.preventDefault(); audio.init(); b.click(); } }
    else if ((k === 'Escape' || k === 'Backspace') && G.state !== 'play') { const b = sc.querySelector('#cBack, [data-go="title"]'); if (b) b.click(); } });
  $('gPrev').onclick = () => { G.gi = (G.gi + CAR_IDS.length - 1) % CAR_IDS.length; audio.play('ui'); renderGarage(); }; $('gNext').onclick = () => { G.gi = (G.gi + 1) % CAR_IDS.length; audio.play('ui'); renderGarage(); };
  $('gBuy').onclick = () => { const id = CAR_IDS[G.gi], c = CARS[id]; if (!save.owned.includes(id)) { if (save.cash < c.price) return; save.cash -= c.price; save.owned.push(id); audio.play('cash'); } else audio.play('ok'); save.car = id; storeSave(); renderGarage(); };
  $('oMusic').oninput = e => { save.opts.music = +e.target.value; audio.setVol(); storeSave(); }; $('oSfx').oninput = e => { save.opts.sfx = +e.target.value; audio.setVol(); storeSave(); };
  $('oFull').onclick = () => { try { const p = document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen(); if (p && p.catch) p.catch(() => { }); } catch (e) { } };
  let rs = 0; $('oReset').onclick = () => { const sp = $('oReset').firstElementChild; if (performance.now() - rs < 3000) { Object.assign(save, { cash: 0, owned: ['muscle'], car: 'muscle', paint: {}, medals: {}, best: {} }); storeSave(); sp.textContent = 'RESET PROGRESS'; go('title'); } else { rs = performance.now(); sp.textContent = 'TAP AGAIN TO ERASE'; setTimeout(() => { sp.textContent = 'RESET PROGRESS'; }, 3000); } };
  $('tReset').onclick = () => { Object.assign(CFG, CFG_DEF); storeTune(); renderTune(); };
  $('tCopy').onclick = () => { const txt = JSON.stringify(CFG), o = $('tOut'); o.value = txt; o.classList.remove('hide'); o.select(); try { navigator.clipboard.writeText(txt).catch(() => { }); } catch (e) { } };
  $('tClose').onclick = () => { if (G.state === 'play' && G.paused) { show('sPause'); return; } if (G.state === 'play') { show(null); G.paused = false; audio.ac && audio.ac.resume(); } else go('settings'); };
  $('pauseBtn').onclick = () => togglePause(); $('pResume').onclick = () => togglePause(); $('pSet').onclick = () => { audio.play('ui'); go('settings'); }; $('pCtl').onclick = () => { audio.play('ui'); go('controls'); }; $('cBack').onclick = () => { audio.play('ui'); if (G.state === 'play' && G.paused) show('sPause'); else go(G.ctlFrom === 'sSettings' ? 'settings' : 'title'); }; $('pRestart').onclick = () => { unpause(); G.ev.vs ? startVersus() : startEvent(G.ev); }; $('pQuit').onclick = () => { unpause(); toMenu(G.ev.vs ? 'vs' : G.ev.fun ? 'fun' : 'tour'); };
  $('rRetry').onclick = () => G.ev.vs ? startVersus() : startEvent(G.ev); $('vStart').onclick = () => { audio.init(); audio.play('ok'); startVersus(); }; $('rNext').onclick = () => { G.adN = (G.adN || 0) + 1; const next = () => toMenu(G.ev.vs ? 'vs' : G.ev.fun ? 'fun' : 'tour'); G.adN % 2 === 0 ? ads.show('midgame', next) : next(); };
  $('rDouble').onclick = () => ads.show('rewarded', () => { save.cash += G.earned; storeSave(); $('rCash').textContent = '+' + cash(G.earned * 2); $('rDouble').classList.add('hide'); audio.play('cash'); }, () => { });
  document.addEventListener('visibilitychange', () => { if (document.hidden && G.state === 'play' && !G.paused && G.sub !== 'result') togglePause(); });
  addEventListener('pointerdown', () => audio.init(), { once: false, passive: true });
}
function unpause() { G.paused = false; audio.ac && audio.ac.resume(); }
function togglePause() { if (G.state !== 'play' || G.sub === 'result') return; G.paused = !G.paused; show(G.paused ? 'sPause' : null); if (audio.ac) G.paused ? audio.ac.suspend() : audio.ac.resume(); G.paused ? ads.stop() : ads.start(); }
function toMenu(where) { endRace(); G.state = 'title'; post.setScene(menu.scene, camera); post.setBloom([0.7, 0.5, 0.85]); post.u.uBlur.value = post.u.uAb.value = post.u.uDesat.value = post.u.uFlash.value = post.u.uLines.value = 0; post.u.uVig.value = 0.35; post.u.uExpo.value = 1; cam.set('garage'); go('title'); if (where !== 'title') go(where); }
const SIGS = ['GANTRY GRIND', 'TUNNEL VISION', 'AIR STRIKE', 'DOUBLE TROUBLE', 'BOUNTY HUNTER', 'CRASHBREAKER KO', 'TRAFFIC CHECK', 'PAYBACK'], TAUNTS = ['TOO SLOW', 'STAY DOWN', 'SEE YOU NEVER', 'NICE PAINT. WAS.', 'GET OFF MY ROAD', 'TRY HARDER', 'OUT OF MY WAY'];
function sigCheck(r, cause) { const W = ctx.world, tr = ctx.track; let k = null;
  if (cause === 'crashbreaker') k = 'CRASHBREAKER KO'; else if (r.bounty) k = 'BOUNTY HUNTER'; else if (r.revenge) k = 'PAYBACK'; else if (cause === 'landing') k = 'AIR STRIKE'; else if (cause === 'traffic') k = 'TRAFFIC CHECK';
  else if ((W.tunnels || []).some(([a, b]) => r.s > a && r.s < b)) k = 'TUNNEL VISION'; else if ((W.gantryS || []).some(s => Math.abs(tr.delta(r.s, s)) < 10)) k = 'GANTRY GRIND';
  if (!k && ctx.time - G.lastTD < 1.4) k = 'DOUBLE TROUBLE'; G.lastTD = ctx.time; if (!k) return;
  save.sig = save.sig || {}; if (!save.sig[k]) { save.sig[k] = 1; storeSave(); G.bonus += 2000; G.stats.sigs++; setTimeout(() => pop('NEW SIGNATURE: ' + k + '  ' + Object.keys(save.sig).length + '/' + SIGS.length, 'y'), 650); } else setTimeout(() => pop(k, 'y'), 650); }
function raceBreaker() { const P = ctx.player; G.cbReady = false; hint(''); ctx.wrecks.explode(P.x, P.y, P.z, 1.2); ctx.fx.explosion(P.x, P.y, P.z, 1.5); audio.play('explosion'); cam.bump(0.6); post.u.uFlash.value = 0.7; rumble(1, 1, 500); P.boost = 0; let n = 0;
  for (const r of ctx.rivals) { if (r.state !== 'drive' || r.ghost > 0) continue; const dx = r.x - P.x, dz = r.z - P.z, d = Math.hypot(dx, dz) || 1; if (d < 18) { r.lastHit = ctx.time; r.crash('crashbreaker', { x: dx / d * 18, z: dz / d * 18 }); n++; } }
  for (const o of [...ctx.traffic.list]) { if (o.state !== 'drive') continue; const dx = o.x - P.x, dz = o.z - P.z, d = Math.hypot(dx, dz) || 1; if (d < 22 && wreckVehicle(o, { x: dx / d * 14 + o.vx * 0.4, y: 9 * (1 - d / 30), z: dz / d * 14 + o.vz * 0.4 }, { x: rand(-5, 5), y: rand(-4, 4), z: rand(-5, 5) }, null)) ctx.ev.trafficWreck(o); }
  banner('CRASHBREAKER!', n ? n + ' RIVAL' + (n > 1 ? 'S' : '') + ' WRECKED' : 'BOOM', 'y', 1.5); }
// ---------- crash spectacle: hit-stop, camera punch, glass, sparks, debris
function spectacle(r, big) { const fx = ctx.fx; G.hitStop = big ? 0.09 : 0.065; cam.punch(big ? 7 : 4.5); post.u.uAb.value = Math.max(post.u.uAb.value, 0.035); fx.sparks3(r.x, r.y + 0.7, r.z, r.vx * 0.3, 3, r.vz * 0.3, 36, 8, 0.7);
  for (let i = 0; i < 26; i++) fx.spark(r.x + rand(-0.8, 0.8), r.y + rand(0.6, 1.3), r.z + rand(-0.8, 0.8), r.vx * 0.35 + rand(-5, 5), rand(1, 6), r.vz * 0.35 + rand(-5, 5), rand(0.5, 1.1), 2.2, 2.6, 3.2);
  fx.debris(r.x, r.y, r.z, r.vx * 0.5, 4, r.vz * 0.5, 10, 7, r.y); fx.flash(r.x, r.y + 1.4, r.z, 3.5, 3, 2.2, 1.5, 0.12); }
// ---------- smashable roadside: posts, reflectors and lamp posts break off and fly when anything hits them
const PZ = new THREE.Matrix4().makeScale(0, 0, 0), PE = new THREE.Euler(), PQ = new THREE.Quaternion(), PV = new THREE.Vector3(), PS = new THREE.Vector3(), PM = new THREE.Matrix4();
function propsInit() { G.flyers = []; G.propGrid = new Map(); for (const b of ctx.world.breakables || []) b.list.forEach((o, i) => { const k = Math.floor(o.x / 12) + ',' + Math.floor(o.z / 12); let a = G.propGrid.get(k); if (!a) G.propGrid.set(k, a = []); a.push([b, i]); }); }
function propMatrix(o) { PE.set(o.rx || 0, o.ry || 0, o.rz || 0, 'YXZ'); PQ.setFromEuler(PE); PV.set(o.x, o.y, o.z); PS.set(o.sx ?? o.s ?? 1, o.sy ?? o.s ?? 1, o.sz ?? o.s ?? 1); return PM.compose(PV, PQ, PS); }
function propHit(x, z, rad, vx, vz, who) { const g = G.propGrid; if (!g || !g.size) return; const cx = Math.floor(x / 12), cz = Math.floor(z / 12);
  for (let a = -1; a <= 1; a++) for (let c = -1; c <= 1; c++) { const L = g.get((cx + a) + ',' + (cz + c)); if (!L) continue; for (const [b, i] of L) { if (b.broken.has(i)) continue; const o = b.list[i]; if (Math.hypot(o.x - x, o.z - z) > rad + b.r) continue; propBreak(b, i, vx, vz, who); } } }
function propBreak(b, i, vx, vz, who) { const o = b.list[i], sp = Math.hypot(vx, vz); b.broken.set(i, ctx.time); b.m.setMatrixAt(i, PZ); b.m.instanceMatrix.needsUpdate = true;
  if (G.flyers.length > 36) G.flyers.shift().mesh.removeFromParent();
  const mesh = new THREE.Mesh(b.m.geometry, b.m.material); propMatrix(o).decompose(mesh.position, mesh.quaternion, mesh.scale); ctx.scene.add(mesh); const k = b.heavy ? 0.35 : 0.75;
  G.flyers.push({ mesh, v: new THREE.Vector3(vx * k + rand(-2, 2), (b.heavy ? 2 : 4) + sp * 0.06 * k + rand(0, 3), vz * k + rand(-2, 2)), w: new THREE.Vector3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).multiplyScalar((b.heavy ? 3 : 10) + sp * 0.05), gy: o.y, t: 0 });
  ctx.fx.sparks3(o.x, o.y + 0.6, o.z, vx * 0.3, 2, vz * 0.3, b.heavy ? 18 : 6, 4, 0.5);
  if (who === ctx.player) { audio.play('hit', clamp(sp / 60, 0.2, b.heavy ? 0.9 : 0.45)); cam.bump(b.heavy ? 0.12 : 0.03); ctx.player.addBoost(b.heavy ? 0.04 : 0.012); G.stats.smashed = (G.stats.smashed || 0) + 1; if (b.heavy) pop('LAMP POST!', 'y'); } }
function propsFrame(dt) { if (!G.flyers) return; const P = ctx.player;
  for (let k = G.flyers.length - 1; k >= 0; k--) { const f = G.flyers[k]; f.t += dt; f.v.y -= 22 * dt; f.mesh.position.addScaledVector(f.v, dt); f.mesh.rotation.x += f.w.x * dt; f.mesh.rotation.y += f.w.y * dt; f.mesh.rotation.z += f.w.z * dt;
    if (f.mesh.position.y < f.gy + 0.1) { f.mesh.position.y = f.gy + 0.1; f.v.y = Math.abs(f.v.y) * 0.25; f.v.x *= 0.6; f.v.z *= 0.6; f.w.multiplyScalar(0.55); }
    if (f.t > 6) { f.mesh.removeFromParent(); G.flyers.splice(k, 1); } }
  if (!P) return; const edge = v => v.state !== 'drive' || Math.abs(v.d) > v.track.limit(v.dims.hw) - 0.4;
  if (P.state === 'drive' || P.state === 'wreck') propHit(P.x, P.z, P.dims.hw + (edge(P) ? 0.9 : 0.2), P.vx, P.vz, P);
  for (const r of ctx.rivals) if (r.state === 'drive' && Math.abs(r.x - P.x) + Math.abs(r.z - P.z) < 120) propHit(r.x, r.z, r.dims.hw + (edge(r) ? 0.9 : 0.2), r.vx, r.vz, r);
  for (const w of ctx.wrecks.list) { const t = w.body.translation(), lv = w.body.linvel(); if (Math.abs(t.x - P.x) + Math.abs(t.z - P.z) < 120) propHit(t.x, t.z, 1.4, lv.x, lv.z, w.v); }
  if ((G.propT = (G.propT || 0) + dt) > 2) { G.propT = 0; for (const b of ctx.world.breakables || []) for (const [i, t] of b.broken) { const o = b.list[i]; if (ctx.time - t > 25 && Math.hypot(o.x - P.x, o.z - P.z) > 150) { b.m.setMatrixAt(i, propMatrix(o)); b.m.instanceMatrix.needsUpdate = true; b.broken.delete(i); } } } }
// ---------- CLIP: always keeps the last few seconds, V (or View on the pad) saves them as a vertical 9:16 video for Reels
const CLIP = { cv: null, g: null, recs: [], mime: '', stream: null };
function clipSetup() { if (CLIP.cv) return !!CLIP.stream; if (!window.MediaRecorder) return false; const cv = CLIP.cv = document.createElement('canvas'); cv.width = 540; cv.height = 960; CLIP.g = cv.getContext('2d');
  CLIP.mime = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1.640028,opus', 'video/mp4;codecs=avc1,mp4a', 'video/mp4;codecs=avc1', 'video/mp4;codecs=h264', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(m => MediaRecorder.isTypeSupported(m)) || '';
  try { const st = cv.captureStream(30); try { if (audio.ac && audio.comp) { const d = audio.ac.createMediaStreamDestination(); audio.comp.connect(d); d.stream.getAudioTracks().forEach(t => st.addTrack(t)); } } catch (e) { } CLIP.stream = st; } catch (e) { return false; }
  for (let k = 0; k < 2; k++) CLIP.recs.push({ mr: null, chunks: [], t0: 0 }); return true; }
function clipStart(r) { const chunks = r.chunks = []; try { r.mr = new MediaRecorder(CLIP.stream, CLIP.mime ? { mimeType: CLIP.mime, videoBitsPerSecond: 6e6 } : { videoBitsPerSecond: 6e6 }); } catch (e) { r.mr = null; return; } r.mr._chunks = chunks; r.mr.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); }; r.mr.start(500); r.t0 = performance.now(); }
function clipStop() { for (const r of CLIP.recs) { if (r.mr && r.mr.state !== 'inactive') { r.mr.onstop = null; try { r.mr.stop(); } catch (e) { } } r.mr = null; r.chunks = []; } }
function clipFrame() { if (!save.opts.clip || G.state !== 'play' || G.vs) { if (CLIP.recs.some(r => r.mr)) clipStop(); return; } if (!clipSetup()) return;
  const c = canvas, H = c.height, w = Math.min(c.width, H * 9 / 16), sx = (c.width - w) / 2, g = CLIP.g; try { g.drawImage(c, sx, 0, w, H, 0, 0, 540, 960); } catch (e) { return; }
  const b = G.lastBan; if (b && performance.now() < b.until) { g.textAlign = 'center'; g.shadowColor = 'rgba(0,0,0,.7)'; g.shadowBlur = 18; g.fillStyle = b.cls === 'r' ? '#ff3355' : b.cls === 'y' ? '#ffc933' : '#19f07a'; g.font = 'italic 900 64px "Arial Black", Arial'; g.fillText(b.text, 270, 300, 520); g.fillStyle = '#fff'; g.font = 'italic 700 24px Arial'; g.fillText(b.sub, 270, 340, 520); g.shadowBlur = 0; }
  g.textAlign = 'center'; g.fillStyle = 'rgba(255,255,255,.92)'; g.font = 'italic 900 30px "Arial Black", Arial'; g.fillText('GREENLIGHT', 270, 920); g.textAlign = 'left';
  const now = performance.now(), R = CLIP.recs; if (!R[0].mr) clipStart(R[0]); if (!R[1].mr && now - R[0].t0 > 5500) clipStart(R[1]);
  for (const r of R) if (r.mr && now - r.t0 > 11500) { const old = r.mr; old.onstop = null; try { old.stop(); } catch (e) { } clipStart(r); } }
function clipSave() { if (!save.opts.clip) { pop('TURN ON CLIP RECORDER IN SETTINGS', 'r'); return; } const R = CLIP.recs.filter(r => r.mr && r.mr.state === 'recording'); if (!R.length) return; const r = R.sort((a, b) => a.t0 - b.t0)[0], mr = r.mr, mime = CLIP.mime || 'video/webm';
  mr.onstop = () => { const blob = new Blob(mr._chunks, { type: mime }), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'greenlight-clip-' + Date.now() + (mime.includes('mp4') ? '.mp4' : '.webm'); document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000); clipStart(r); };
  try { mr.requestData(); mr.stop(); } catch (e) { } pop('CLIP SAVED', 'g'); audio.play('cash', 0.6); }
function padA() { const g = livePads()[0]; return !!(g && padB(g, 0) > 0.5); }
function startRampage(add = 6) { const P = ctx.player; G.rampT = Math.min(10, Math.max(G.rampT, 0) + add); ctx.rampage = true; P.boost = P.boostMax; banner('RAMPAGE!', 'EVERY HIT WRECKS', 'y', 1.3); audio.play('boost', 1); cam.bump(0.25); rumble(0.8, 1, 400); }
function pickBounty() { const P = ctx.player, tr = ctx.track; const c = ctx.rivals.filter(r => r.state === 'drive' && !r.boss && !r.revenge && r.ghost <= 0 && tr.delta(r.s, P.s) > 8 && tr.delta(r.s, P.s) < 170); if (!c.length) { G.bountyT = 3; return; } const r = c[(Math.random() * c.length) | 0]; r.bounty = true; G.bounty = r; G.bountyLeft = 22; banner('BOUNTY!', 'TAKE DOWN ' + r.name + ' FOR $3,000', 'y', 1.6); audio.play('beep'); }
function endBounty(r, msg) { if (r) r.bounty = false; G.bounty = null; G.bountyT = 22; if (msg) pop(msg, 'r'); }
function endRace() { ctx.cine = false; ctx.rampage = false; document.body.classList.remove('cine'); if (!race) return; ads.stop(); if (post) { post.u.uStyle.value = 0; post.u.uRed.value = 0; post.u.uColor.value = 0; } if (G.trail) { G.trail.dispose(); G.trail = null; } if (G.streaks) { G.streaks.dispose(); G.streaks = null; } try { ctx.wrecks.clear(); ctx.wrecks.world.free(); } catch (e) { } try { race.world.dispose(); } catch (e) { } race = null; ctx.player = null; ctx.rivals = []; if (G.vs) { G.vs = null; ctx.players = null; ctx.cur = null; ctx.ev = EV1; ctx.viewK = 1; $('hud2').classList.add('hide'); resize(); } $('hud').classList.add('hide'); $('touch').classList.add('hide'); }

// ---------- HUD helpers
function pop(text, cls = '') { const p = H.pop, k = text.split(' ')[0], L = p.lastChild, now = performance.now();
  if (L && L.dataset.k === k && now - (+L.dataset.t || 0) < 1300) { L.textContent = text; L.className = 'p ' + cls; L.style.animation = 'none'; void L.offsetWidth; L.style.animation = ''; L.dataset.t = now; clearTimeout(L._t); L._t = setTimeout(() => L.remove(), 1300); return; }
  while (p.children.length > 2) p.firstChild.remove(); const d = document.createElement('div'); d.className = 'p ' + cls; d.textContent = text; d.dataset.k = k; d.dataset.t = now; p.appendChild(d); d._t = setTimeout(() => d.remove(), 1300); }
function banner(text, sub = '', cls = '', dur = 1.6) { G.lastBan = { text, sub, cls, until: performance.now() + dur * 1000 }; H.bigT.textContent = text; H.bigSub.textContent = sub; H.big.className = 'show ' + cls; G.bannerT = dur; }
function hint(t) { if (G.hintTxt === t) return; G.hintTxt = t; H.hint.textContent = t; H.hint.classList.toggle('hide', !t); }
function buildMap() {
  const tr = ctx.track, c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (let i = 0; i < tr.n; i++) { x0 = Math.min(x0, tr.px[i]); x1 = Math.max(x1, tr.px[i]); z0 = Math.min(z0, tr.pz[i]); z1 = Math.max(z1, tr.pz[i]); }
  const k = 216 / Math.max(x1 - x0, z1 - z0, 1), mx = (x0 + x1) / 2, mz = (z0 + z1) / 2; G.map = { img: c, X: x => 128 - (x - mx) * k, Y: z => 128 - (z - mz) * k };
  g.lineJoin = 'round'; for (const [w, col] of [[11, 'rgba(0,0,0,.55)'], [5, 'rgba(255,255,255,.85)']]) { g.lineWidth = w; g.strokeStyle = col; g.beginPath(); for (let i = 0; i <= tr.n; i += 2) { const j = i % tr.n; g[i ? 'lineTo' : 'moveTo'](G.map.X(tr.px[j]), G.map.Y(tr.pz[j])); } g.stroke(); }
}
function drawMap() { const m = G.map, g = H.map.getContext('2d'), P = ctx.player; g.clearRect(0, 0, 256, 256); g.drawImage(m.img, 0, 0); for (const r of ctx.rivals) { g.fillStyle = r.state === 'drive' ? '#ff3355' : '#777'; g.beginPath(); g.arc(m.X(r.x), m.Y(r.z), 7, 0, 7); g.fill(); } g.fillStyle = '#19f07a'; g.strokeStyle = '#000'; g.lineWidth = 3; g.beginPath(); g.arc(m.X(P.x), m.Y(P.z), 10, 0, 7); g.fill(); g.stroke(); }
function hud(rdt) {
  const P = ctx.player, ev = G.ev, tr = ctx.track; H.bFill.style.transform = `scaleX(${clamp(P.boost / P.boostMax, 0, 1).toFixed(3)})`; H.hBoost.classList.toggle('on', P.boosting);
  if (G.bannerT > 0) { G.bannerT -= rdt; if (G.bannerT <= 0) H.big.className = ''; }
  G.hudT -= rdt; if (G.hudT > 0) return; G.hudT = 0.09;
  setText(H.spd, String(Math.round(P.speed * (save.opts.unit === 'mph' ? 2.237 : 3.6)))); setText(H.unit, save.opts.unit === 'mph' ? 'MPH' : 'KM/H');
  if (G.segN !== P.boostMax) { G.segN = P.boostMax; H.bSeg.innerHTML = '<i></i>'.repeat(P.boostMax); setText(H.bMul, P.boostMax > 1 ? 'x' + P.boostMax : ''); }
  const m = ev.mode, pips = () => { const n = Math.ceil(G.hp / 10); if (G.dmgN !== n) { G.dmgN = n; H.dmg.innerHTML = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => `<i class="${i < n ? (n <= 3 ? 'on' : 'ok') : ''}"></i>`).join(''); } };
  if (m === 'race' || m === 'cutoff') { let rank = 1, n = 1; for (const r of ctx.rivals) { if (r.out) continue; n++; if (r.finished || r.prog > P.prog) rank++; } setText(H.pos, String(G.place || rank)); setText(H.hTime, fmtTime(G.time));
    if (m === 'race') { const laps = ctx.world.city.laps; setText(H.hLap, 'LAP ' + clamp(Math.floor(P.prog / tr.L) + 1, 1, laps) + '/' + laps); } else { setText(H.posOf, '/' + n); setText(H.hLap, rank === n ? 'YOU ARE LAST' : ''); setText(H.take, Math.ceil(G.cutT) + ' S'); } }
  else if (m === 'brawl') { setText(H.hTime, 'HEAT ' + (ctx.heat + 1)); const t = G.stats.takedowns, nx = ev.targets && ev.targets.find(x => x > t); setText(H.take, t + (nx ? ' / ' + nx : '')); pips(); }
  else if (m === 'getaway') { setText(H.hTime, fmtTime(G.time)); setText(H.take, (Math.max(0, G.goal - P.prog) / 1000).toFixed(2) + ' KM'); pips(); }
  else if (m === 'never') { setText(H.hTime, fmtTime(Math.max(0, G.timeLeft))); setText(H.take, (Math.max(0, P.prog - G.prog0) / 1000).toFixed(2) + ' KM'); }
  else if (m === 'smash') { setText(H.hTime, fmtTime(Math.max(0, G.timeLeft))); setText(H.take, cash(G.smash)); }
  else { setText(H.hTime, cash(G.pile.damage * G.pile.mult)); setText(H.take, G.pile.count + (G.pile.mult > 1 ? '   x' + G.pile.mult : '')); }
  const e = G.earn; setText(H.earn, (G.rampT > 0 ? 'RAMPAGE ' + G.rampT.toFixed(1) + '\n' : '') + (G.bounty ? 'BOUNTY ' + G.bounty.name + ' ' + Math.ceil(G.bountyLeft) + 'S\n' : '') + ((P.redMul || 1) > 1 ? 'REDLINE x' + P.redMul + '\n' : '') + (P.streakF > 0.12 ? 'SPEED +' + Math.round(P.streakF * 30) + '%\n' : '') + (e.onc > 20 ? 'ONCOMING ' + Math.round(e.onc) + ' M\n' : '') + (e.drift > 12 ? 'DRIFT ' + Math.round(e.drift) + ' M' : ''));
  const wr = P.state === 'drive' && !P.frozen && P.speed > 8 && Math.cos(wrapPi(P.yaw - tr.th[P.idx])) < -0.4 && ev.mode !== 'pile'; G.wrongT = wr ? G.wrongT + 0.09 : 0; H.wrong.classList.toggle('hide', G.wrongT < 0.9);
  if (ev.mode !== 'pile') drawMap();
}

// ---------- event setup
async function startEvent(ev) {
  if (G.loading) return; G.loading = true; G.state = 'loading'; G.ev = ev; show('sLoad'); $('hud').classList.add('hide'); $('touch').classList.add('hide'); const load = f => { $('lFill').style.width = Math.round(f * 100) + '%'; }; load(0.06); $('lTip').textContent = pick(TIPS); audio.stopMusic();
  try {
    endRace(); await new Promise(r => setTimeout(r, 30)); ctx.mode = ev.mode; ctx.phase = 'grid'; ctx.time = 0; ctx.raceT = 0; ctx.timeScale = 1; ctx.trafficK = ev.mode === 'smash' ? 1.7 : ev.traffic === false ? 0 : 1; ctx.heat = ev.mode === 'getaway' ? 2 : 0;
    const tier = pickTier(); if (tier !== ctx.q.name) applyTier(tier);
    const world = await buildWorld(ev.city, ev.mode); load(0.5);
    const [protos] = await Promise.all([loadTraffic(), initPhysics()]); load(0.62);
    const scene = new THREE.Scene(); scene.add(world.group); scene.environment = world.env.env; scene.fog = new THREE.FogExp2(world.theme.fog[0], world.theme.fog[1]);
    ctx.world = world; ctx.track = world.main; ctx.scene = scene; ctx.fx = new FX(scene); ctx.fx.setWeather(world.theme.weather); ctx.wrecks = new Wrecks(world); ctx.traffic = new Traffic(protos, scene); ctx.obstacles = []; ctx.rivals = [];
    ctx.player = new Player(hoverOn() ? makeCraft('twinblade', HOVER_P1, CARS[save.car], true) : await makeCar(save.car, save.paint[save.car] ?? CARS[save.car].color ?? null), scene); load(0.76); const lowQ = ctx.q.name === 'low', NR = Math.round(({ race: 7, cutoff: 7, getaway: 8, brawl: ev.traffic === false ? 12 : 11, never: 5, smash: 5 }[ev.mode] || 0) * (lowQ ? 0.65 : 1));
    if (NR) { const pp = CARS[save.car].price, pool = RIVAL_IDS.filter(id => id !== save.car).sort((a, b) => Math.abs(CARS[a].price - pp) - Math.abs(CARS[b].price - pp) || Math.random() - 0.5);
      for (let i = 0; i < NR; i++) { const id = pool[i % pool.length]; const lk = rivalLook(i); ctx.rivals.push(new Rival(hoverOn() ? makeCraft(lk.design, ev.mode === 'getaway' ? 0xff2a1a : lk.glow, CARS[id]) : await makeCar(id, ev.mode === 'getaway' ? 0x14161a : RIVAL_COLS[i % RIVAL_COLS.length]), scene, i)); load(0.78 + i * 0.2 / NR); } }
    if (G.trail) G.trail.dispose(); G.trail = new LightTrail(scene); applyStyle(); propsInit(); if (G.streaks) G.streaks.dispose(); G.streaks = new CarStreaks(scene);
    race = { scene, world, ev }; setupRace(ev); post.setScene(scene, camera); post.setBloom(world.theme.bloom); post.u.uExpo.value = world.theme.expo || 1; load(1); await new Promise(r => setTimeout(r, 120));
    show(null); $('hud').classList.remove('hide'); $('touch').classList.toggle('hide', !isTouch); G.state = 'play'; G.paused = false; audio.music(ev.city, 'race'); ads.start();
  } catch (e) { console.error(e); $('lTip').textContent = 'Something went wrong while loading: ' + (e && e.message || e); await new Promise(r => setTimeout(r, 2600)); toMenu('title'); }
  G.loading = false;
}
function setupRace(ev) {
  const W = ctx.world, tr = W.main, P = ctx.player, R = ctx.rivals;
  Object.assign(G, { time: 0, phaseT: 0, sub: 'intro', crashT: 0, tdT: 0, bannerT: 0, finishers: 0, place: 0, wrongT: 0, damage: 0, dmgN: -1, segN: -1, timeLeft: { never: 30, smash: 45 }[ev.mode] || 0, hp: 100, cutT: 20, smash: 0, chain: 0, chainT: 0, bestChain: 0, bossN: 0, topSpeed: 0, prog0: 0, count: 0, goal: (ev.mode === 'getaway' ? 1 : W.city.laps) * tr.L, doneT: 0, result: null, pile: null, hintTxt: null, earned: 0, bonus: 0, earn: { onc: 0, drift: 0 }, stats: { takedowns: 0, near: 0, onc: 0, drift: 0, air: 0, crashes: 0, wrecked: 0, bounties: 0 }, bounty: null, bountyT: 20, bountyLeft: 0, rampT: 0, burnOn: false, burnN: 0, cbReady: false, cbArm: false, lastTD: -9 }); G.stats.burnouts = 0; G.stats.sigs = 0; ctx.rampage = false;
  if (ev.mode === 'pile') setupPile();
  else { const S0 = W.startS, lead = ev.mode === 'getaway', per = Math.min(3, tr.lanes), slot = k => [S0 - 7 - Math.floor(k / per) * 10, tr.lane(k % per)]; R.forEach((r, i) => { const [s, d] = slot(i + (lead ? 2 : 0)); r.put(tr, s, d); r.prog = s - S0; }); const [s, d] = slot(lead ? 0 : R.length); P.put(tr, s, d, 0); P.prog = G.prog0 = s - S0; P.boost = 0.5; P.boostExt = 0; }
  P.frozen = true; cam.view = save.opts.cam || 0; cam.set('intro'); cam.snap(P); H.big.className = ''; H.pop.innerHTML = ''; hint('');
  ctx.cine = true; document.body.classList.add('cine'); setText($('iC1'), CITIES[ev.city].name); setText($('iC2'), ev.name + (ev.desc ? '  /  ' + ev.desc : '')); setText($('iC3'), isTouch ? 'TAP BOOST TO SKIP' : 'SPACE OR A TO SKIP');
  if (W.theme.night) { const sp = new THREE.SpotLight(0xfff1dc, 700, 180, 0.5, 0.8, 1.35); if (P.inst.hover) { sp.position.set(0, 0.95, P.dims.hl + 0.4); sp.intensity = 420; } else sp.position.set(0, 0.95, P.dims.hl * 0.8); sp.target.position.set(0, -1.4, 40); P.root.add(sp, sp.target); G.spot = sp; } else G.spot = null;
  const m = ev.mode, pos = m === 'race' || m === 'cutoff'; H.hPos.classList.toggle('hide', !pos); H.hLap.classList.toggle('hide', !pos); H.hTake.classList.toggle('hide', m === 'race'); H.dmg.classList.toggle('hide', m !== 'brawl' && m !== 'getaway'); H.map.classList.toggle('hide', m === 'pile'); H.takeLbl.textContent = { pile: 'WRECKED', never: 'DISTANCE', smash: 'SMASHED', cutoff: 'NEXT CUT', getaway: 'TO GO' }[m] || 'RED LIGHTS'; setText(H.posOf, '/' + (R.length + 1));
  if (m !== 'pile') buildMap();
}
function setupPile() {
  const W = ctx.world, m = W.main, c = W.cross, T = ctx.traffic, P = ctx.player; P.put(m, 28, m.lane(0), 0); P.prog = 0; P.boostExt = 1; P.boost = 2;
  for (const sg of [1, -1]) for (let k = 0; k < c.lanes; k++) { const v = sg * (k === 0 ? 23 : 20); let s = rand(6, 40); while (s < c.L - 8) { const type = T.type(0.3), big = T.protos[type].userData.big; if (big) s += 9; T.make(type, c, s, sg * c.lane(k), v); s += rand(16, 34) + (big ? 12 : 0); } }
  const queue = (dir, s0, d) => { let s = s0; const n = 2 + (Math.random() * 2 | 0); for (let i = 0; i < n; i++) { const type = T.type(0.18), hl = T.protos[type].userData.dims.hl; s -= dir * (hl + 0.8); T.make(type, m, s, d, 0, dir); s -= dir * (hl + 1.2); } };
  for (let k = 1; k < m.lanes; k++) queue(1, W.jS - c.W - 3.5, m.lane(k)); for (let k = 0; k < m.lanes; k++) queue(-1, W.jS + c.W + 3.5, -m.lane(k));
  const pl = G.pile = { hit: false, t: 0, quiet: 0, count: 0, damage: 0, mult: 1, boom: false, picks: [] };
  for (const [x, z, mu] of [[3, W.jS + 3, 2], [-17, W.jS - 3, 4]]) { const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d'); g.fillStyle = mu === 2 ? '#19f07a' : '#ffc933'; g.beginPath(); g.arc(64, 64, 58, 0, 7); g.fill(); g.fillStyle = '#04110a'; g.font = 'italic 900 64px Arial Black, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('x' + mu, 62, 68);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); s.scale.set(3.4, 3.4, 1); s.position.set(x, 1.9, z); ctx.scene.add(s); pl.picks.push({ x, z, m: mu, s, got: false }); }
}

// ---------- fun modes
const FUN = [['brawl', 'BRAWL', 'Rivals keep coming. Wreck them before they wreck you.'], ['never', 'NEVER STOP', 'Endless run. Your speed keeps climbing. One head-on ends it.'], ['smash', 'SMASH RUN', 'Plough through traffic. Every hit adds time and cash.'], ['cutoff', 'CUT-OFF', 'Last place is cut every 20 seconds. Be the last car left.'], ['getaway', 'GETAWAY', 'Reach the finish while 6 hunters try to wreck you.']];
const funId = (mode, city) => 'fun-' + mode + '-' + city + (mode === 'brawl' && !save.fun.traffic ? '-nt' : '');
function funEvent(mode, city) { const f = FUN.find(x => x[0] === mode); return { id: funId(mode, city), city, mode, name: f[1], desc: f[2], fun: true, traffic: mode !== 'brawl' || save.fun.traffic, targets: null }; }
function fmtBest(mode, v) { return mode === 'brawl' ? v + ' RED LIGHTS' : mode === 'never' ? (v / 1000).toFixed(2) + ' KM' : mode === 'smash' ? cash(v) : mode === 'cutoff' ? ['1ST', '2ND', '3RD', '4TH', '5TH', '6TH'][v - 1] : fmtTime(v); }
function renderFun() {
  const mc = medals(), open = ORDER.filter(c => mc >= UNLOCK[c]); if (!open.includes(save.fun.city)) save.fun.city = open[0]; refreshCash();
  seg($('fCity'), open.map(c => [c, CITIES[c].name]), save.fun.city, v => { save.fun.city = v; }, renderFun); seg($('fTraffic'), [[true, 'ON'], [false, 'OFF']], save.fun.traffic, v => { save.fun.traffic = v; }, renderFun);
  const el = $('fModes'); el.innerHTML = '';
  for (const [mode, name, desc] of FUN) { const best = save.best[funId(mode, save.fun.city)], b = document.createElement('button'); b.className = 'ev fun'; b.innerHTML = `<span>${name}<small>${desc}</small></span><b>${best != null ? 'BEST ' + fmtBest(mode, best) : 'NOT PLAYED YET'}</b>`; b.onclick = () => { audio.init(); audio.play('ok'); startEvent(funEvent(mode, save.fun.city)); }; el.appendChild(b); }
}
function addTime(mode, n) { if (G.ev.mode === mode && G.sub === 'race') G.timeLeft = Math.min(mode === 'never' ? 45 : 60, G.timeLeft + n); }
// car health in Brawl and Getaway
function hurt(n) {
  const m = G.ev.mode, P = ctx.player; if ((m !== 'brawl' && m !== 'getaway') || G.sub !== 'race') return; G.hp = Math.max(0, G.hp - n); post.u.uFlash.value = Math.max(post.u.uFlash.value, 0.1);
  if (G.hp <= 0) { if (P.state === 'drive') { wreckPlayer(); cam.set('crash', P); ctx.fx.explosion(P.x, P.y, P.z, 1); audio.play('explosion'); } finish({ totaled: true }); }
}
// Cut-Off: the car in last place is removed
function cutLast() {
  const P = ctx.player, live = ctx.rivals.filter(r => !r.out); let last = null, lp = P.prog; for (const r of live) if (r.prog < lp) { lp = r.prog; last = r; }
  if (!last) return finish({ cut: true, place: live.length + 1 });
  last.out = true; if (last.state === 'drive') last.crash('cut'); last.respT = 1e9; ctx.fx.explosion(last.x, last.y, last.z, 1); audio.play('explosion', 0.7); pop(last.name + ' CUT', 'r');
  if (live.length === 1) finish({ place: 1 });
}
// ---------- gameplay events
// ---------- visual styles (Settings > Visual Style): std / noir / neon / redline
const STY = { std: 0, noir: 1, neon: 2, redline: 3, synth: 4, heat: 5 }, NOIR_RED = 0xe8101c, TRC = { 2: [[0.15, 0.9, 1.0], [0.9, 0.25, 1.0]], 4: [[1.0, 0.2, 0.75], [1.0, 0.6, 0.15]] };
const STY_DESC = { std: 'The normal look.', noir: 'Night, rain and ink. The world is black and white, rivals are red. Takedowns bring the colour back, crashes drain it.', neon: 'A dark world drawn in glowing lines. While you boost, your light trail wrecks any rival that touches it.', synth: '80s sunset: pink grid lines and a striped sun. While you boost, your light trail wrecks any rival that touches it.', heat: 'Thermal camera: cars glow hot, the road is cold. While you boost you are white hot and smash through oncoming traffic.', redline: 'Stay at top speed to build a boost multiplier, up to x4. Drop off and it resets.' };
function applyStyle() { const stn = save.opts.style || 'std', noir = stn === 'noir'; const bc = document.body.classList; for (const k in STY) bc.remove('st-' + k); bc.add('st-' + stn);
  if (ctx.fx && ctx.world && race) { const tw = ctx.world.theme.weather || null, want = noir && tw !== 'snow' ? 'rain' : tw; if (((ctx.fx.weather && ctx.fx.weather.kind) || null) !== want) ctx.fx.setWeather(want); } for (const r of ctx.rivals || []) { if (r.col0 == null) r.col0 = r.col; const c = noir ? NOIR_RED : r.col0; if (c != null && r.inst.color !== c) r.inst.setPaint(c); r.col = c; if (r.streakC) r.streakC.set(c); heatPaint(r.inst, stn === 'heat' ? 2.0 : 0); if (r.glow) r.glow.material.color.set(c); r.mkKey = ''; } }
function heatPaint(inst, k, c) { c = c || [1, 0.9, 0.8]; for (const m of (inst && inst.paintMats) || []) { if (!m.emissive) continue; if (!m.userData.em0) m.userData.em0 = m.emissive.clone(); if (k) m.emissive.setRGB(k * c[0], k * c[1], k * c[2]); else m.emissive.copy(m.userData.em0); } }
function styleFrame(u, p, rdt, pl) { const st = STY[save.opts.style] || 0; u.uStyle.value = st; if (G.styleK !== save.opts.style) { G.styleK = save.opts.style; applyStyle(); }
  p.noirC = Math.max(0, (p.noirC || 0) - 0.02 * rdt); p.noirV = damp(p.noirV || 0, st === 1 ? p.noirC : 0, 3, rdt); u.uColor.value = p.noirV;
  const bpm = (audio.m.style && audio.m.style.bpm) || 140, tt = (audio.ac && audio.ac.currentTime) || ctx.time; u.uPulse.value = 0.5 + 0.5 * Math.cos(tt * bpm / 60 * 6.2832);
  const red = p.redOn = st === 3 && p.state === 'drive' && !p.frozen && p.speed > (p.redOn ? 0.88 : 0.93) * (p.vmaxNow || 1e9);
  const ramp = !pl && G.rampT > 0, hotCar = ramp ? 1.6 + 0.6 * Math.sin(ctx.time * 14) : st === 5 ? (p.boosting && p.state === 'drive' ? 3.2 : 0.7) : 0; if (Math.abs(hotCar - (p.hotCar || 0)) > 0.05) { p.hotCar = hotCar; heatPaint(p.inst, hotCar, ramp ? [1, 0.42, 0.08] : null); }
  if (st === 3) { if (red) { p.redT = (p.redT || 0) + rdt; p.redLow = 0; const m = Math.min(4, 1 + Math.floor(p.redT / 3)); if (m > (p.redMul || 1)) { if (pl) vmsg(p.pi, 'REDLINE x' + m, 'r', 0.9); else pop('REDLINE x' + m, 'r'); rumble(0, 0.4, 120); } p.redMul = m; } else if ((p.redLow = (p.redLow || 0) + rdt) > 0.8) { p.redT = 0; p.redMul = 1; } } else { p.redT = 0; p.redMul = 1; }
  p.redV = damp(p.redV || 0, red ? 0.45 + 0.55 * (p.redMul - 1) / 3 : 0, 5, rdt); u.uRed.value = p.redV;
  if (!pl && G.trail) { if (TRC[st]) G.trail.setColors(TRC[st][0], TRC[st][1]); G.trail.update(p, ctx.time, !!TRC[st] && G.sub === 'race'); if (G.trail.hot) for (const r of ctx.rivals) if (r.state === 'drive' && r.ghost <= 0 && G.trail.hits(r, ctx.time)) { r.lastHit = ctx.time; r.crash('trail'); } } }
const TD = { crashbreaker: 'CRASHBREAKER', rampage: 'RAMPAGE RED LIGHT', trail: 'LIGHT TRAP', aftertouch: 'WRECK STEER RED LIGHT', traffic: 'TRAFFIC CHECK', ram: 'RAM RED LIGHT', wreck: 'PILE-UP RED LIGHT', wall: 'WALL RED LIGHT', slam: 'SIDE SLAM', spooked: 'SPOOKED', landing: 'LANDING' };
// special takedowns get their own big name and a bigger bonus
const TDBIG = { trail: ['LIGHT TRAP!', 900], crashbreaker: ['CRASHBREAKER!', 1200], traffic: ['TRAFFIC CHECK!', 900], spooked: ['SPOOKED!', 900], landing: ['LANDING!', 1500], slam: ['SIDE SLAM!', 700] };
ctx.ev = {
  playerCrash(cause) {
    const P = ctx.player; G.hitStop = 0.1; cam.punch(8); G.cbReady = G.ev.mode !== 'pile' && P.boost >= 0.95; G.cbArm = false; G.burnOn = false; G.burnN = 0; G.stats.crashes++; P.noirC = 0; P.redT = 0; P.redMul = 1; rumble(1, 1, 450); audio.play('crash', 1); cam.bump(0.35); post.u.uFlash.value = 0.12; P.boostExt = Math.max(0, P.boostExt - 1); P.boost = Math.min(P.boost, P.boostMax) * 0.6; P.auto = false; G.tdT = 0;
    if (G.pile) { if (!G.pile.hit) { G.pile.hit = true; G.pile.t = 0; G.crashT = 1e9; cam.set('pile', P); banner('CRASH!', 'STEER YOUR WRECK INTO TRAFFIC', 'r', 1.7); } return; }
    G.crashT = 2.1; cam.set('crash', P); hurt(30); if (G.ev.mode === 'never') finish({ never: true });
    if (P.shoved > 0 && P.shovedBy && cause === 'wall') { P.shovedBy.revenge = true; banner('RED LIGHTED', P.shovedBy.name + ':  "' + pick(TAUNTS) + '"', 'r', 1.9); } else banner('CRASH!', isTouch ? 'DRAG TO STEER YOUR WRECK' : 'STEER YOUR WRECK INTO RIVALS', 'r', 1.9);
  },
  rivalCrash(r, cause, credit) {
    if (cause === 'cut') return; if (!credit) { if (r.bounty) endBounty(r, 'BOUNTY LOST'); const fb = r.feudBy && ctx.time - (r.feudT || -9) < 2.5 && r.feudBy.state === 'drive' ? r.feudBy : null; return pop(fb ? fb.name + ' TOOK OUT ' + r.name : r.name + ' WRECKED', fb ? 'r' : ''); } const P = ctx.player, fm = G.ev.mode === 'brawl' || G.ev.mode === 'getaway'; G.stats.takedowns++; sigCheck(r, cause); spectacle(r, cause === 'crashbreaker' || cause === 'landing' || !!r.boss); addTime('never', 4); if (G.ev.mode === 'smash' && G.sub === 'race') { G.smash += 5000; addTime('smash', 3); } if (fm && G.sub === 'race') { G.hp = Math.min(100, G.hp + (r.boss ? 30 : 12)); G.chain = G.chainT > 0 ? G.chain + 1 : 1; G.chainT = 6; G.bestChain = Math.max(G.bestChain, G.chain); if (G.rampT > 0) G.rampT = Math.min(10, G.rampT + 1.5); if (G.chain > 1) pop('CHAIN x' + G.chain, 'y'); if (r.boss) G.bonus += 2000; } P.boostExt = Math.min(3, P.boostExt + 1); P.boost = P.boostMax; P.noirC = Math.min(1, (P.noirC || 0) + 0.34); audio.play('takedown'); cam.bump(0.2);
    if (r.bounty) { endBounty(r); G.stats.bounties++; G.bonus += 3000; G.hp = 100; banner('BOUNTY CLAIMED!', '+$3,000  /  ' + r.name, 'y', 1.7); startRampage(); return; }
    if (fm && G.chain === 3 && G.rampT <= 0) { startRampage(); return; }
    const rev = r.revenge; r.revenge = false; const big = TDBIG[cause]; banner(rev ? 'PAYBACK!' : big ? big[0] : 'RED LIGHT!', (rev ? 'PAYBACK / ' + (TD[cause] || 'RED LIGHT') : TD[cause] || 'RED LIGHT') + '  /  ' + r.name, rev || big ? 'y' : 'g', fm ? 1.1 : 1.7); G.bonus += (rev ? 900 : 0) + (big ? big[1] : 600); rumble(0.6, 0.9, 260);
    if (P.state === 'drive' && G.sub === 'race' && (!fm || (G.rampT <= 0 && ctx.time - (G.lastCam || -9) > 2.6 && cause !== 'crashbreaker'))) { const tr = ctx.track; G.lastCam = ctx.time; G.tdT = fm ? 0.75 : 0.95; cam.set('takedown', r); P.auto = true; P.autoD = clamp(P.d, -tr.limit(P.dims.hw) + 0.5, tr.limit(P.dims.hw) - 0.5); P.invuln = Math.max(P.invuln, 2); }
  },
  melt() { if (G.sub === 'race') { pop('WHITE HOT!', 'y'); cam.bump(0.18); rumble(0.6, 0.8, 180); audio.play('hit', 0.8); G.stats.near++; } },
  sideswipe() { if (G.sub === 'race') { pop('SIDESWIPE', 'y'); cam.bump(0.12); rumble(0.4, 0.6, 160); audio.play('hit', 0.6); } },
  nearMiss(o, side) { G.stats.near++; rumble(0, 0.35, 90); ctx.player.addBoost(0.11); ctx.player.noirC = Math.min(1, (ctx.player.noirC || 0) + 0.03); addTime('never', 1.5); pop('NEAR MISS', 'y'); audio.play('near', 0.9, side * 0.7); cam.bump(0.035); },
  pass(o, side) { audio.play('whoosh', o.big ? 0.75 : 0.42, side * 0.6); },
  earn(k, d) { G.earn[k] = d; },
  earnEnd(k, d) { G.earn[k] = 0; if (k === 'onc') addTime('never', d / 100); if (d > 60) { pop((k === 'onc' ? 'ONCOMING ' : 'DRIFT ') + Math.round(d) + ' M', 'g'); G.stats[k] += d; } },
  jump(spd) { cam.bump(0.08); rumble(0.3, 0.5, 120); },
  land(t) { ctx.player.addBoost(0.28 * t); addTime('never', 1); if (t > 1.1) { const c = Math.round(t * 600 / 100) * 100; G.bonus += c; banner('BIG AIR!', t.toFixed(1) + ' S  /  +$' + c.toLocaleString(), 'y', 1.1); cam.punch(5); rumble(0.7, 0.9, 260); } else pop('AIR ' + t.toFixed(1) + ' S', 'g'); audio.play('land', clamp(t, 0.3, 1)); cam.bump(0.12); G.stats.air += t; },
  rub(r, closing, mine) { if (mine && closing > 5) pop(closing > 9 ? 'SLAM!' : 'SHUNT'); else if (!mine && closing > 2) hurt(clamp(closing * 1.4, 2, 16) * (r.boss ? 1.7 : 1) * (1 + 0.06 * ctx.heat)); },
  respawn(r) { if (r.bounty) endBounty(r); if (G.ev.mode !== 'brawl') return; if (r.boss) { r.boss = false; r.name = r.name0; r.mass = r.cfg.mass; r.root.scale.setScalar(1); } else if (Math.floor(G.stats.takedowns / 10) > G.bossN) { G.bossN++; r.boss = true; r.name0 = r.name; r.name = 'BOSS'; r.mass = r.cfg.mass * 2.6; r.root.scale.setScalar(1.2); banner('BOSS INCOMING', '', 'r', 1.4); } },
  trafficWreck(o) { G.stats.wrecked++; addTime('never', 0.3); if (G.ev.mode === 'smash' && G.sub === 'race') { G.smash += o.value; addTime('smash', o.big ? 2 : 1.2); pop('+' + cash(o.value), 'y'); } if (G.pile) { const pl = G.pile; pl.count++; pl.damage += o.value; pl.quiet = 0; pop('+' + cash(o.value), 'y'); } },
};
function crashbreaker() {
  const P = ctx.player, pl = G.pile; pl.boom = true; pl.quiet = 0; ctx.wrecks.explode(P.x, P.y, P.z, 1); ctx.fx.explosion(P.x, P.y, P.z, 1.3); audio.play('explosion'); cam.bump(0.6); post.u.uFlash.value = 0.8; banner('DETONATOR!', '', 'y', 1.4);
  for (const o of [...ctx.traffic.list]) { if (o.state !== 'drive') continue; const dx = o.x - P.x, dz = o.z - P.z, d = Math.hypot(dx, dz) || 1; if (d < 32 && wreckVehicle(o, { x: dx / d * 14 + o.vx * 0.4, y: 9 * (1 - d / 42), z: dz / d * 14 + o.vz * 0.4 }, { x: rand(-5, 5), y: rand(-4, 4), z: rand(-5, 5) }, null)) ctx.ev.trafficWreck(o); }
}
function finish(res) { if (G.sub !== 'race') return; G.sub = 'done'; G.doneT = 0; ctx.phase = 'over'; G.result = res; G.crashT = 0; G.tdT = 0; const P = ctx.player, tr = ctx.track; hint(''); ads.stop();
  if (P.state === 'drive') { P.auto = true; P.autoBoost = false; P.autoD = tr.lane(0); cam.set(G.pile ? 'pile' : 'finish', P); }
  const bad = res.missed || res.totaled || res.cut || res.never; banner(res.missed ? 'MISSED!' : res.totaled ? 'WRECKED!' : res.cut ? 'CUT OFF!' : res.never ? 'STOPPED!' : res.timeup ? 'TIME UP!' : res.escaped ? 'ESCAPED!' : res.pile ? 'PILE-UP!' : res.place === 1 ? 'WINNER!' : 'FINISH!', '', bad ? 'r' : 'g', 2.4); audio.play(bad ? 'fail' : 'go'); }
function showResults() {
  const ev = G.ev, st = G.stats, r = G.result, m = ev.mode, P = ctx.player; let medal = 'none', title = '', lines = [], earned = 0, score = null, lowBest = false;
  const byT = v => v >= ev.targets[2] ? 'gold' : v >= ev.targets[1] ? 'silver' : v >= ev.targets[0] ? 'bronze' : 'none', ORD = ['1ST', '2ND', '3RD', '4TH', '5TH', '6TH', '7TH', '8TH', '9TH'];
  if (m === 'race') { const p = r.place; medal = p === 1 ? 'gold' : p === 2 ? 'silver' : p === 3 ? 'bronze' : 'none'; title = ORD[p - 1] + ' PLACE'; lines.push(['TIME', fmtTime(G.time)]); }
  else if (m === 'brawl') { const t = st.takedowns; score = t; title = t + ' RED LIGHTS'; if (ev.targets) { medal = byT(t); lines.push(['MEDAL TARGETS', ev.targets.join(' / ')]); } lines.push(['HEAT REACHED', ctx.heat + 1], ['BEST CHAIN', 'x' + G.bestChain], ['BOUNTIES', st.bounties || 0]); earned += (st.burnouts || 0) * 300; earned += t * 500; }
  else if (m === 'pile') { const total = r.missed ? 0 : Math.round(G.pile.damage * G.pile.mult); medal = byT(total); title = r.missed ? 'MISSED!' : cash(total); lines.push(['VEHICLES WRECKED', G.pile.count], ['MULTIPLIER', 'x' + G.pile.mult], ['MEDAL TARGETS', ev.targets.map(cash).join(' / ')]); earned += Math.round(total / 400); }
  else if (m === 'never') { const d = Math.max(0, Math.round(P.prog - G.prog0)); score = d; title = (d / 1000).toFixed(2) + ' KM'; lines.push(['TIME SURVIVED', fmtTime(G.time)], ['TOP SPEED', Math.round(G.topSpeed * 3.6) + ' KM/H']); earned += Math.round(d * 0.6); }
  else if (m === 'smash') { score = G.smash; title = cash(G.smash); lines.push(['VEHICLES SMASHED', st.wrecked]); earned += Math.round(G.smash / 250); }
  else if (m === 'cutoff') { const p = r.place; score = p; lowBest = true; title = p === 1 ? 'LAST CAR LEFT' : 'CUT IN ' + ORD[p - 1]; lines.push(['TIME', fmtTime(G.time)]); earned += [9000, 6000, 4000, 2500, 1500, 800][p - 1] || 800; }
  else { const ok = !!r.escaped; title = ok ? 'ESCAPED!' : 'CAUGHT'; if (ok) { score = Math.round(G.time * 10) / 10; lowBest = true; } lines.push(['TIME', fmtTime(G.time)], ['CAR HEALTH LEFT', Math.round(G.hp) + '%'], ['DISTANCE', (Math.max(0, P.prog - G.prog0) / 1000).toFixed(2) + ' KM']); earned += ok ? 7000 + Math.round(G.hp * 40) : 1200; }
  if (m !== 'pile' && m !== 'never' && m !== 'smash') lines.push(['RED LIGHTS', st.takedowns]); if (m !== 'pile') lines.push(['NEAR MISSES', st.near], ['ONCOMING', Math.round(st.onc) + ' M'], ['BURNOUTS', st.burnouts || 0], ['CRASHES', st.crashes]); if (m !== 'pile') lines.push(['SIGNATURE TAKEDOWNS', Object.keys(save.sig || {}).length + ' / ' + SIGS.length]);
  const mi = MEDAL.indexOf(medal); earned += G.bonus + st.near * 40 + Math.round((st.onc + st.drift) * 1.5);
  if (ev.fun) { earned += 800; if (score != null) { const old = save.best[ev.id]; if (old == null || (lowBest ? score < old : score > old)) { save.best[ev.id] = score; lines.unshift(['NEW BEST', fmtBest(m, score)]); } else lines.unshift(['YOUR BEST', fmtBest(m, old)]); } }
  else { const prev = MEDAL.indexOf(save.medals[ev.id] || 'none'); earned += [1000, 4000, 7000, 12000][mi]; if (mi > prev) { save.medals[ev.id] = medal; earned += (mi - prev) * 2500; lines.push(['NEW MEDAL BONUS', cash((mi - prev) * 2500)]); } lines.unshift(['MEDAL', medal === 'none' ? 'NO MEDAL' : medal.toUpperCase()]); }
  save.cash += earned; storeSave(); G.earned = earned; G.sub = 'result';
  $('rSub').textContent = ev.name + '  /  ' + CITIES[ev.city].name; $('rTitle').textContent = title; $('rTitle').style.color = ev.fun ? '#fff' : { gold: 'var(--gold)', silver: '#dfe6ee', bronze: '#e08a4a', none: '#fff' }[medal];
  $('rLines').innerHTML = lines.map(([a, b]) => `<div class="rl"><span>${a}</span><b>${b}</b></div>`).join(''); $('rCash').textContent = '+' + cash(earned);
  $('rDouble').classList.toggle('hide', !ads.sdk); $('hud').classList.add('hide'); $('touch').classList.add('hide'); show('sResult'); audio.play(mi > 0 || (ev.fun && score) ? 'cash' : 'fail'); if (mi === 3) ads.happy(); audio.m.mode = 'menu';
}
// simple driver used by tests and the attract demo
function botDrive() {
  const P = ctx.player, tr = ctx.track; if (P.state !== 'drive' || G.tdT > 0) return; let best = tr.lane(0), bc = 1e9;
  for (let k = 0; k < tr.lanes; k++) { const c = tr.lane(k); let cost = Math.abs(c - P.d) * 0.25; for (const o of ctx.obstacles) { if (o === P || o.track !== tr || (o.kind === 'rival' && window.__GL.bot === 'ram')) continue; const ds = tr.delta(o.s, P.s); if (ds < -4 || ds > 260) continue; const rel = P.vs - (o.vs || 0); if (rel <= 2) continue; const tt = ds / rel; if (tt < 2.6 && Math.abs(o.d - c) < 2.4) cost += 60 / (0.25 + tt); } if (cost < bc) { bc = cost; best = c; } }
  P.auto = true; P.autoD = best; P.autoBoost = true; if (window.__GL.cheat) { P.boostExt = 3; P.boost = 4; }
}

// ---------- per-frame game update
// arrows at the bottom of the screen when a rival is right behind you, like Burnout
function incoming() { const el = $('inc'); if (!el) return; const P = ctx.player, tr = ctx.track; let L = null, R = null;
  if (P && P.state === 'drive' && ctx.rivals && G.sub === 'race') for (const r of ctx.rivals) { if (r.state !== 'drive') continue; const ds = tr.delta(r.s, P.s); if (ds > -1.5 || ds < -45) continue; const side = r.d - P.d < 0 ? 'L' : 'R', c = '#' + new THREE.Color(r.revenge ? 0xff2a2a : r.col ?? 0xff3355).getHexString(); if (side === 'L') { if (!L || ds > L.ds) L = { ds, c }; } else if (!R || ds > R.ds) R = { ds, c }; }
  for (const [k, v] of [['L', L], ['R', R]]) { const a = el.children[k === 'L' ? 0 : 1]; a.style.opacity = v ? Math.min(1, 1.25 + v.ds / 40) : 0; if (v) a.style.setProperty('--c', v.c); } }
function playTick(rdt) { incoming(); { const P = ctx.player; if (P && P.boosting && !G.wasBoost) rumble(0.15, 0.35, 160); G.wasBoost = !!(P && P.boosting); }
  if (input.hit('Escape') || input.hit('KeyP')) return togglePause();
  if (input.hit('Backquote') || input.hit('F2')) { G.paused = true; audio.ac && audio.ac.suspend(); renderTune(); return show('sTune'); }
  if (G.paused) return;
  const P = ctx.player, W = ctx.world, tr = ctx.track, ev = G.ev, pl = G.pile;
  let ts = 1; if (G.crashT > 0) ts = pl && pl.t > 1.6 ? 0.6 : CFG.slowmo; else if (G.tdT > 0) ts = 0.35; else if (P.air && P.airT > 0.3 && P.vy < 4) ts = 0.62;
  if (G.hitStop > 0) { G.hitStop -= rdt; ctx.timeScale = 0.04; } else ctx.timeScale = damp(ctx.timeScale, ts, ts < ctx.timeScale ? 30 : 7, rdt); const dt = rdt * ctx.timeScale; ctx.time += dt; ctx.raceT = G.time; G.phaseT += rdt;
  if (G.sub === 'intro') { if (G.phaseT > INTRO_T || (G.phaseT > 0.4 && (input.hit('Space') || input.hit('Enter') || input.touch.boost || padA()))) { G.sub = 'count'; G.phaseT = 0; G.count = 0; cam.set('chase'); cam.snap(P); ctx.cine = false; document.body.classList.remove('cine'); } }
  else if (G.sub === 'count') { const n = 3 - Math.floor(G.phaseT / 0.9), thr = save.opts.auto ? !!(input.boost || input.touch.boost) : (input.throttle || 0) > 0.5; if (thr) { if (G.thrT == null) G.thrT = G.phaseT; } else G.thrT = null; if (G.phaseT < 0.1) hint(save.opts.auto ? 'PRESS BOOST JUST BEFORE GO FOR A BOOST START' : 'HIT ACCELERATE JUST BEFORE GO FOR A BOOST START');
    if (n !== G.count && n > 0) { G.count = n; banner(String(n), '', '', 0.75); audio.play('beep'); W.startMats.forEach((m, i) => m.color.setHex(Math.abs(i - 2) < 4 - n ? 0xff1a1a : 0x220000)); }
    if (G.phaseT >= 2.7) { G.sub = 'race'; ctx.phase = 'race'; P.frozen = false; hint(''); const bs = G.thrT != null && G.thrT >= 2.15; G.thrT = null; if (bs) { P.boost = P.boostMax; P.vx += Math.sin(P.yaw) * 14; P.vz += Math.cos(P.yaw) * 14; rumble(0.6, 0.9, 300); } banner(bs ? 'BOOST START!' : 'GO!', bs ? 'PERFECT LAUNCH' : 'NEVER STOP', bs ? 'y' : 'g', 1.1); audio.play('go'); W.startMats.forEach(m => m.color.setRGB(0.06, 2.4, 0.45)); } }
  if (window.__GL.bot && G.sub === 'race') botDrive();
  const n = Math.max(1, Math.ceil(dt / 0.0105)), h = dt / n; for (let i = 0; i < n; i++) simulate(h);
  ctx.wrecks.update(dt, rdt); propsFrame(dt); if (G.streaks) G.streaks.update(ctx.rivals, ctx.time); P.frame(dt, rdt); for (const r of ctx.rivals) r.frame(dt); ctx.traffic.frame();
  if (G.sub === 'race') {
    G.time += dt; G.topSpeed = Math.max(G.topSpeed, P.speed); if (G.rampT > 0 && (G.rampT -= dt) <= 0) { G.rampT = 0; ctx.rampage = false; pop('RAMPAGE OVER'); }
    if (ev.mode === 'race') { for (const r of ctx.rivals) if (!r.finished && r.prog >= G.goal) { r.finished = true; r.place = ++G.finishers; } if (P.prog >= G.goal && P.state === 'drive') { G.place = ++G.finishers; finish({ place: G.place }); } }
    else if (ev.mode === 'brawl') { ctx.heat = Math.floor(G.stats.takedowns / 5) + Math.floor(G.time / 45); if (G.chainT > 0 && (G.chainT -= dt) <= 0) G.chain = 0;
      if (!G.bounty) { if ((G.bountyT -= dt) <= 0) pickBounty(); } else if ((G.bountyLeft -= dt) <= 0 || G.bounty.state !== 'drive') endBounty(G.bounty, G.bounty.name + ' GOT AWAY'); }
    else if (ev.mode === 'getaway') { if (P.prog >= G.goal && P.state === 'drive') finish({ escaped: true }); }
    else if (ev.mode === 'never' || ev.mode === 'smash') { G.timeLeft -= dt; if (G.timeLeft <= 0) { G.timeLeft = 0; finish({ timeup: true }); } }
    else if (ev.mode === 'cutoff') { G.cutT -= dt; if (G.cutT <= 0) { G.cutT = 20; cutLast(); } }
    else { for (const p of pl.picks) { if (p.got) continue; p.s.position.y = 1.9 + Math.sin(ctx.time * 3 + p.m) * 0.25; if (Math.hypot(P.x - p.x, P.z - p.z) < 4.4) { p.got = true; p.s.visible = false; pl.mult *= p.m; banner('x' + p.m + ' MULTIPLIER', '', 'y', 1.2); audio.play('cash'); } }
      if (!pl.hit) { if (P.s > W.jS + 160 || (G.time > 16 && P.speed < 3)) finish({ missed: true, wait: 1.3 }); }
      else { pl.t += rdt; pl.quiet += rdt; if (!pl.boom && pl.count >= 3 && pl.t > 1.0) { hint(isTouch ? 'TAP BOOST: DETONATOR!' : 'PRESS SPACE: DETONATOR!'); if (input.boost || window.__GL.bot) crashbreaker(); } else hint(''); if ((pl.t > 5 && pl.quiet > 3.4) || pl.t > 17) finish({ pile: true, wait: 1.8 }); } }
    if (G.time < 7 && !isTouch && ev.mode !== 'pile' && !medals()) hint('ARROWS / WASD: DRIVE     SPACE: BOOST     BRAKE + STEER: DRIFT'); else if (ev.mode !== 'pile') hint('');
  } else if (G.sub === 'done') { G.doneT += rdt; if (G.doneT > (G.result.wait || 2.6)) showResults(); }
  if (G.crashT > 0 && !pl && G.cbReady && P.state === 'wreck') { const held = input.boost || input.touch.boost; if (!held) G.cbArm = true; hint(isTouch ? 'TAP BOOST: CRASHBREAKER!' : 'PRESS BOOST: CRASHBREAKER!'); if ((G.cbArm && held) || (window.__GL.bot && G.crashT < 1.6)) raceBreaker(); }
  if (G.sub === 'race' && P.state === 'drive') { if (G.burnOn && P.boost <= 0.02) { G.burnOn = false; G.burnN++; G.stats.burnouts++; P.boost = Math.min(P.boostMax, P.boostMax * 0.5); const c = 400 * G.burnN; G.bonus += c; banner(G.burnN > 1 ? 'BURNOUT x' + G.burnN + '!' : 'BURNOUT!', 'FREE BOOST  /  +$' + c.toLocaleString(), 'y', 1.1); audio.play('boost', 0.9); rumble(0.3, 0.7, 200); } else if (P.boosting && !G.burnOn && P.boost >= P.boostMax - 0.03) { G.burnOn = true; G.burnOff = 0; } else if (G.burnOn) { if (P.boosting) G.burnOff = 0; else if ((G.burnOff = (G.burnOff || 0) + rdt) > 0.45) G.burnOn = false; } }
  if (G.crashT > 0 && !pl) { G.crashT -= rdt; if (G.crashT <= 0) { if ((ev.mode === 'brawl' || ev.mode === 'getaway') && G.hp <= 0) finish({ totaled: true }); else if (P.state === 'wreck' && !(G.result && G.result.totaled)) { P.respawn(); cam.set(G.sub === 'race' ? 'chase' : 'finish', P); cam.snap(P); if (G.sub !== 'race') P.auto = true; } } }
  if (G.tdT > 0) { G.tdT -= rdt; if (G.tdT < 0.75 && (input.boost || (P.inp && P.inp.boost))) G.tdT = 0; if (G.tdT <= 0) { if (cam.mode === 'takedown') { cam.set('chase'); cam.snap(P); } P.auto = G.sub !== 'race'; } }
  if (input.hit('KeyR') && P.state === 'drive' && G.sub === 'race' && !pl) { P.put(tr, P.s, tr.lane(0), 18); P.invuln = 1.5; }
  if (input.hit('KeyC')) { cam.view = cam.view ? 0 : 1; save.opts.cam = cam.view; storeSave(); }
  if (input.hit('KeyV')) clipSave();
  const tun = W.tunnels.some(([a, b]) => P.s > a && P.s < b);
  ctx.fx.update(dt, camera, { x: P.vx, z: P.vz }, tun); drawLights(W.theme.night); cam.update(rdt, P); W.update(ctx.time, camera);
  if (W.sun.castShadow) { W.sun.target.position.set(P.x, P.y, P.z); W.sun.position.set(P.x + W.sunDir.x * 150, P.y + W.sunDir.y * 150, P.z + W.sunDir.z * 150); }
  if (G.spot) G.spot.visible = P.state === 'drive';
  const u = post.u, sf = clamp(P.speed / (100 * spdK()[0]), 0, 1.2), ch = cam.mode === 'chase';
  u.uBlur.value = damp(u.uBlur.value, ch ? CFG.blur * (0.085 * sf * sf + 0.17 * P.boostFx) : 0, 6, rdt); u.uLines.value = damp(u.uLines.value, ch ? clamp(P.boostFx * 0.9 + Math.max(0, sf - 0.72) * 1.4, 0, 1) * Math.min(1, CFG.blur) : 0, 6, rdt); u.uAb.value = damp(u.uAb.value, ch ? 0.014 * P.boostFx : 0, 6, rdt); u.uDesat.value = damp(u.uDesat.value, G.crashT > 0 && !pl ? 0.4 : 0, 6, rdt); u.uFlash.value = damp(u.uFlash.value, 0, 7, rdt); u.uVig.value = 0.32 + 0.22 * P.boostFx; styleFrame(u, P, rdt, false);
  if (G.sub !== 'result') hud(rdt);
  if (P.boosting && !G.wasBoost) audio.play('boost', 0.8); G.wasBoost = P.boosting;
  audio.update(rdt, { on: !P.frozen || G.sub === 'count', speed: P.speed, vmax: P.cfg.vboost * CFG.speed * spdK()[0], throttle: P.auto ? 0.7 : input.throttle, boosting: P.boosting, skid: Math.abs(P.slipFx) > 0.18 && P.speed > 15 && P.state === 'drive' ? 1 : 0, scrape: P.scrape > 0 ? 1 : 0, slow: ctx.timeScale < 0.7, rain: W.theme.weather === 'rain' && !tun });
  audio.m.intensity = damp(audio.m.intensity, Math.max(P.boostFx, G.crashT > 0 ? 0 : sf * 0.6), 3, rdt);
}

// ---------- 2 player split screen: P1 top/left, P2 bottom/right (Settings > 2P split screen)
const EV1 = ctx.ev, P1K = ['KeyA', 'KeyD', 'KeyW', 'KeyS', 'ShiftLeft', 'Space'], P2K = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'ShiftRight', 'Enter'];
function readPad(o, K, pad, dt) {
  const k = input.keys; let st = (k.has(K[1]) ? 1 : 0) - (k.has(K[0]) ? 1 : 0), th = k.has(K[2]) ? 1 : 0, br = k.has(K[3]) ? 1 : 0, bo = k.has(K[4]) || k.has(K[5]);
  try { const g = livePads()[pad]; if (g) { const ax = padX(g, 0), b = i => padB(g, i); if (ax) st = ax; th = Math.max(th, b(7)); br = Math.max(br, b(6)); bo = bo || b(0) > 0.5 || b(5) > 0.5; } } catch (e) { }
  const rate = (st === 0 ? 9 : 5.5) * dt; o.steer += clamp(st - o.steer, -rate, rate); o.throttle = th; o.brake = br; o.boost = !!bo;
}
function vmsg(i, text, cls, dur) { const el = G.vh[i].msg; el.textContent = text; el.className = 'vm show ' + cls; G.vs.msgT[i] = dur; }
function vbig(text, dur) { const el = $('vsBig'); el.textContent = text; el.className = 'show'; G.vbT = dur; }
const EV2 = {
  playerCrash() { const V = G.vs, P = ctx.cur, i = P.pi, o = V.P[1 - i]; V.crashT[i] = 2.2; P.noirC = 0; P.redT = 0; P.redMul = 1; V.cams[i].set('crash', P); V.st[i].crashes++; audio.play('crash', 0.9); P.boostExt = Math.max(0, P.boostExt - 1); P.boost = Math.min(P.boost, P.boostMax) * 0.6; P.auto = !!window.__GL.bot;
    if (P.shoved > 0 && P.shovedBy === o) { V.st[1 - i].red++; o.noirC = Math.min(1, (o.noirC || 0) + 0.34); o.boostExt = Math.min(3, o.boostExt + 1); o.boost = o.boostMax; vmsg(1 - i, 'RED LIGHT!', 'g', 1.6); vmsg(i, 'RED LIGHTED', 'r', 1.8); audio.play('takedown'); } else vmsg(i, 'CRASH!', 'r', 1.5); },
  rivalCrash() { }, respawn() { }, rub() { }, earn() { }, trafficWreck() { },
  nearMiss(o, side) { ctx.cur.addBoost(0.11); vmsg(ctx.cur.pi, 'NEAR MISS', 'y', 0.7); audio.play('near', 0.7, side * 0.7); },
  pass(o, side) { audio.play('whoosh', 0.3, side * 0.6); },
  earnEnd(k, d) { if (d > 60) vmsg(ctx.cur.pi, (k === 'onc' ? 'ONCOMING ' : 'DRIFT ') + Math.round(d) + ' M', 'g', 0.9); },
  land(t) { ctx.cur.addBoost(0.28 * t); audio.play('land', clamp(t, 0.3, 1)); },
};
function renderVs() {
  const mc = medals(), open = ORDER.filter(c => mc >= UNLOCK[c]); if (!open.includes(save.fun.city)) save.fun.city = open[0];
  seg($('vCity'), open.map(c => [c, CITIES[c].name]), save.fun.city, v => { save.fun.city = v; }, renderVs); seg($('vTraffic'), [[true, 'ON'], [false, 'OFF']], save.fun.traffic, v => { save.fun.traffic = v; }, renderVs);
  $('vNote').textContent = isTouch ? 'This mode needs a keyboard or two gamepads.' : 'Two gamepads also work: pad 1 is Player 1, pad 2 is Player 2.';
}
async function startVersus() {
  if (G.loading) return; G.loading = true; G.state = 'loading'; const city = save.fun.city, ev = G.ev = { id: 'vs-' + city, city, mode: 'versus', name: '2 PLAYER RACE', vs: true }; show('sLoad'); $('hud').classList.add('hide'); $('touch').classList.add('hide'); const load = f => { $('lFill').style.width = Math.round(f * 100) + '%'; }; load(0.06); $('lTip').textContent = 'Player 1 (top): W A S D, boost with Left Shift or Space.  Player 2 (bottom): arrow keys, boost with Right Shift or Enter.'; audio.stopMusic();
  try {
    endRace(); await new Promise(r => setTimeout(r, 30)); ctx.mode = 'versus'; ctx.phase = 'grid'; ctx.time = 0; ctx.raceT = 0; ctx.timeScale = 1; ctx.trafficK = save.fun.traffic ? 1.5 : 0; ctx.heat = 0; ctx.viewK = 0.5;
    const tier = pickTier(); if (tier !== ctx.q.name) applyTier(tier);
    const world = await buildWorld(city, 'race'); load(0.5); const [protos] = await Promise.all([loadTraffic(), initPhysics()]); load(0.62);
    const scene = new THREE.Scene(); scene.add(world.group); scene.environment = world.env.env; scene.fog = new THREE.FogExp2(world.theme.fog[0], world.theme.fog[1]);
    ctx.world = world; ctx.track = world.main; ctx.scene = scene; ctx.fx = new FX(scene); ctx.fx.setWeather(world.theme.weather); ctx.wrecks = new Wrecks(world); ctx.traffic = new Traffic(protos, scene); ctx.obstacles = []; ctx.rivals = [];
    const tr = world.main, c1 = save.paint[save.car] ?? CARS[save.car].color ?? null, c2 = (PAINTS.find(p => p[1] !== c1 && /red|crimson|scarlet/i.test(p[0])) || PAINTS.find(p => p[1] !== c1))[1], P = [], cams = [cam, cam2], cameras = [camera, camera2];
    if (G.trail) { G.trail.dispose(); G.trail = null; }
    for (let i = 0; i < 2; i++) { const p = new Player(hoverOn() ? makeCraft('twinblade', i ? HOVER_P2 : HOVER_P1, CARS[save.car], true) : await makeCar(save.car, i ? c2 : c1), scene); p.pi = i; p.inp = { steer: 0, throttle: 0, brake: 0, boost: false }; p.cam = cams[i]; p.camera = cameras[i]; p.put(tr, world.startS - 7, tr.lane(i), 0); p.prog = -7; p.boost = 0.5; p.boostExt = 0; p.frozen = true; P.push(p); load(0.7 + i * 0.12);
      if (world.theme.night) { const sp = new THREE.SpotLight(0xfff1dc, 700, 180, 0.5, 0.8, 1.35); if (p.inst.hover) sp.position.set(0, 0.95, p.dims.hl + 0.4); else sp.position.set(0, 0.95, p.dims.hl * 0.8); sp.target.position.set(0, -1.4, 40); p.root.add(sp, sp.target); } }
    ctx.players = P; ctx.player = ctx.cur = P[0]; ctx.ev = EV2; race = { scene, world, ev };
    G.vs = { P, cams, cameras, crashT: [0, 0], st: [{ red: 0, crashes: 0, top: 0 }, { red: 0, crashes: 0, top: 0 }], msgT: [0, 0], fin: [0, 0], winner: -1 };
    Object.assign(G, { time: 0, phaseT: 0, sub: 'count', count: 0, goal: world.city.laps * tr.L, doneT: 0, result: null, pile: null, hudT: 0, vbT: 0 });
    for (let i = 0; i < 2; i++) { cams[i].view = 0; cams[i].set('chase'); cams[i].snap(P[i]); G.vh[i].msg.className = 'vm'; }
    post.setScene(scene, camera); post.setBloom(world.theme.bloom); post.u.uExpo.value = world.theme.expo || 1; resize(); load(1); await new Promise(r => setTimeout(r, 120));
    show(null); $('hud2').classList.remove('hide'); vsHud(true); G.state = 'play'; G.paused = false; audio.music(city, 'race'); ads.start();
  } catch (e) { console.error(e); $('lTip').textContent = 'Something went wrong while loading: ' + (e && e.message || e); await new Promise(r => setTimeout(r, 2600)); toMenu('title'); }
  G.loading = false;
}
function vsHud(init, rdt = 0) {
  const V = G.vs; for (let i = 0; i < 2; i++) { const p = V.P[i], el = G.vh[i]; el.bar.style.transform = `scaleX(${clamp(p.boost / p.boostMax, 0, 1).toFixed(3)})`; if (V.msgT[i] > 0 && (V.msgT[i] -= rdt) <= 0) el.msg.className = 'vm'; }
  if (G.vbT > 0 && (G.vbT -= rdt) <= 0) $('vsBig').className = '';
  G.hudT -= rdt; if (!init && G.hudT > 0) return; G.hudT = 0.09; const laps = ctx.world.city.laps, lead = V.P[0].prog >= V.P[1].prog ? 0 : 1, mph = save.opts.unit === 'mph';
  for (let i = 0; i < 2; i++) { const p = V.P[i], el = G.vh[i]; setText(el.pos, i === lead ? '1ST' : '2ND'); el.pos.style.color = i === lead ? 'var(--g)' : '#fff'; setText(el.lap, 'PLAYER ' + (i + 1) + '   LAP ' + clamp(Math.floor(p.prog / ctx.track.L) + 1, 1, laps) + '/' + laps); setText(el.spd, Math.round(p.speed * (mph ? 2.237 : 3.6)) + (mph ? ' MPH' : ' KM/H')); }
}
function versusTick(rdt) {
  if (input.hit('Escape') || input.hit('KeyP')) return togglePause(); if (G.paused) return;
  const V = G.vs, W = ctx.world, tr = ctx.track, dt = rdt, bot = window.__GL.bot; ctx.timeScale = 1; ctx.time += dt; ctx.raceT = G.time; G.phaseT += rdt;
  readPad(V.P[0].inp, P1K, 0, rdt); readPad(V.P[1].inp, P2K, 1, rdt);
  if (G.sub === 'count') { const n = 3 - Math.floor(G.phaseT / 0.9); if (n !== G.count && n > 0) { G.count = n; vbig(String(n), 0.75); audio.play('beep'); W.startMats.forEach((m, i) => m.color.setHex(Math.abs(i - 2) < 4 - n ? 0xff1a1a : 0x220000)); }
    if (G.phaseT >= 2.7) { G.sub = 'race'; ctx.phase = 'race'; V.P[0].frozen = V.P[1].frozen = false; vbig('GO!', 1); audio.play('go'); W.startMats.forEach(m => m.color.setRGB(0.06, 2.4, 0.45)); } }
  if (bot && G.sub === 'race') V.P.forEach((p, i) => { if (p.state === 'drive') { p.auto = true; p.autoD = tr.lane(i); p.autoBoost = true; } });
  const n = Math.max(1, Math.ceil(dt / 0.0105)), h = dt / n; for (let i = 0; i < n; i++) simulate(h);
  ctx.wrecks.update(dt, rdt); for (const p of V.P) p.frame(dt, rdt); ctx.traffic.frame();
  if (G.sub === 'race') { G.time += dt;
    for (let i = 0; i < 2; i++) { const p = V.P[i]; V.st[i].top = Math.max(V.st[i].top, p.speed); if (V.winner < 0 && p.prog >= G.goal && p.state === 'drive') { V.winner = i; V.fin[i] = G.time; vmsg(i, 'WINNER!', 'g', 9); vmsg(1 - i, 'YOU LOSE', 'r', 9); audio.play('go'); G.sub = 'done'; G.doneT = 0; ctx.phase = 'over'; ads.stop(); for (const q of V.P) if (q.state === 'drive') { q.auto = true; q.autoBoost = false; q.autoD = tr.lane(q.pi); V.cams[q.pi].set('finish', q); } } } }
  else if (G.sub === 'done') { G.doneT += rdt; if (G.doneT > 3) vsResults(); }
  for (let i = 0; i < 2; i++) { const p = V.P[i]; if (V.crashT[i] > 0) { V.crashT[i] -= rdt; if (V.crashT[i] <= 0 && p.state === 'wreck') { p.respawn(); V.cams[i].set(G.sub === 'race' ? 'chase' : 'finish', p); V.cams[i].snap(p); if (G.sub !== 'race') p.auto = true; } } V.cams[i].update(rdt, p); }
  const p0 = V.P[0], tun = W.tunnels.some(([a, b]) => p0.s > a && p0.s < b); ctx.fx.update(dt, camera, { x: p0.vx, z: p0.vz }, tun); drawLights(W.theme.night);
  if (W.sun.castShadow) { W.sun.target.position.set(p0.x, p0.y, p0.z); W.sun.position.set(p0.x + W.sunDir.x * 150, p0.y + W.sunDir.y * 150, p0.z + W.sunDir.z * 150); }
  if (G.sub !== 'result') vsHud(false, rdt);
  audio.update(rdt, { on: !p0.frozen || G.sub === 'count', speed: Math.max(p0.speed, V.P[1].speed), vmax: p0.cfg.vboost * CFG.speed * spdK()[0], throttle: Math.max(p0.inp.throttle, V.P[1].inp.throttle), boosting: p0.boosting || V.P[1].boosting, skid: 0, scrape: p0.scrape > 0 || V.P[1].scrape > 0 ? 1 : 0, slow: false, rain: W.theme.weather === 'rain' && !tun });
}
function renderSplit(rdt) {
  const V = G.vs, w = innerWidth, h = innerHeight, hh = Math.floor(h / 2), hw = Math.floor(w / 2), sv = save.opts.split === 'v', u = post.u; renderer.setScissorTest(true);
  for (let i = 0; i < 2; i++) { const p = V.P[i], c = V.cameras[i], sf = clamp(p.speed / (100 * spdK()[0]), 0, 1.2), ch = V.cams[i].mode === 'chase', y = i ? 0 : h - hh; post.setScene(race.scene, c); ctx.world.update(ctx.time, c);
    u.uBlur.value = ch ? CFG.blur * (0.085 * sf * sf + 0.17 * p.boostFx) : 0; u.uLines.value = ch ? clamp(p.boostFx * 0.9 + Math.max(0, sf - 0.72) * 1.4, 0, 1) * Math.min(1, CFG.blur) : 0; u.uAb.value = ch ? 0.014 * p.boostFx : 0; u.uVig.value = 0.32 + 0.22 * p.boostFx; u.uDesat.value = V.crashT[i] > 0 ? 0.35 : 0; u.uFlash.value = 0; styleFrame(u, p, rdt, true);
    if (sv) { const x = i ? w - hw : 0; renderer.setViewport(x, 0, hw, h); renderer.setScissor(x, 0, hw, h); } else { renderer.setViewport(0, y, w, hh); renderer.setScissor(0, y, w, hh); } post.render(i ? 0 : rdt); }
  renderer.setScissorTest(false); renderer.setViewport(0, 0, w, h);
}
function vsResults() {
  const V = G.vs, s = V.st, row = (a, f) => `<div class="rl"><span>${a}</span><b>P1  ${f(0)}   /   P2  ${f(1)}</b></div>`; G.sub = 'result'; $('hud2').classList.add('hide');
  $('rSub').textContent = '2 PLAYER RACE  /  ' + CITIES[G.ev.city].name; $('rTitle').textContent = 'PLAYER ' + (V.winner + 1) + ' WINS'; $('rTitle').style.color = 'var(--g)';
  $('rLines').innerHTML = `<div class="rl"><span>WINNING TIME</span><b>${fmtTime(V.fin[V.winner])}</b></div>` + row('RED LIGHTS', i => s[i].red) + row('CRASHES', i => s[i].crashes) + row('TOP SPEED', i => Math.round(s[i].top * 3.6) + ' KM/H');
  $('rCash').textContent = ''; $('rDouble').classList.add('hide'); show('sResult'); audio.play('cash'); audio.m.mode = 'menu';
}
// ---------- main loop
let last = 0; const perf = { acc: 0, n: 0, up: 0, low: 0 };
function loop(now) {
  requestAnimationFrame(loop); const raw = (now - last) / 1000; last = now; if (!(raw > 0)) return; const rdt = Math.min(raw, 0.05);
  input.update(rdt); if (input.hit('KeyF')) { G.showFps = !G.showFps; $('fps').textContent = ''; }
  if (G.state === 'play') { if (!window.__GL.manual) (G.vs ? versusTick : playTick)(rdt); } else if (menu && cam.mode === 'garage') { menu.holder.rotation.y += 0.2 * rdt; cam.update(rdt, null); }
  if (G.screen) padMenu(rdt);
  if (G.styleK !== save.opts.style) { G.styleK = save.opts.style; try { applyStyle(); } catch (e) { } }
  if (G.autoK !== save.opts.auto) { G.autoK = save.opts.auto; document.body.classList.toggle('manual', !save.opts.auto); }
  if (G.state !== 'play' && post) { const st = STY[save.opts.style] || 0; post.u.uStyle.value = st === 3 ? 0 : st; post.u.uColor.value = 0; post.u.uRed.value = 0; }
  if (G.state !== 'loading' && (race || menu)) { if (!window.__GL.noRender) { if (G.vs && G.state === 'play') renderSplit(rdt); else post.render(rdt); clipFrame(); } G.frames = (G.frames || 0) + 1; }
  input.pressed.clear();
  perf.acc += raw; perf.n++;
  if (perf.acc >= 0.8) { const fps = perf.n / perf.acc, q = ctx.q, maxPR = Math.min(q.maxPR, window.devicePixelRatio || 1); perf.acc = perf.n = 0; G.fps = fps; if (G.showFps) $('fps').textContent = Math.round(fps) + ' fps  ' + q.name + '  x' + G.pr.toFixed(2) + '  ' + renderer.info.render.calls + ' calls';
    if (G.state === 'loading' || G.paused || window.__GL.lockPR) return;
    if (fps < 45 && G.pr > q.minPR) { G.pr = Math.max(q.minPR, G.pr - (fps < 30 ? 0.2 : 0.1)); resize(); perf.up = 0; } else if (fps > 57 && G.pr < maxPR) { if (++perf.up >= 3) { G.pr = Math.min(maxPR, G.pr + 0.1); resize(); perf.up = 0; } } else perf.up = 0;
    if (fps < 24 && G.pr <= q.minPR + 0.01 && post.bloom.enabled) { if (++perf.low >= 3) post.bloom.enabled = false; } else perf.low = 0; }
}
async function boot() {
  loadSave(); loadTune(); save.fun = save.fun || { city: 'coast', traffic: true }; save.best = save.best || {}; if (!save.owned.includes('muscle')) { save.owned.push('muscle'); if (save.car === 'hatch') save.car = 'muscle'; } if (!CARS[save.car] || !save.owned.includes(save.car)) save.car = 'muscle'; try { applyStyle(); } catch (e) { }
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' }); ctx.renderer = renderer; renderer.toneMapping = THREE.ACESFilmicToneMapping;
  camera = new THREE.PerspectiveCamera(64, 1, 0.35, 2400); ctx.camera = camera; cam = new Cam(camera); ctx.cam = cam; cam.set('garage'); camera2 = new THREE.PerspectiveCamera(64, 1, 0.35, 2400); cam2 = new Cam(camera2); G.vh = ['hvA', 'hvB'].map(id => { const e = $(id); return { pos: e.querySelector('.vp'), lap: e.querySelector('.vl'), spd: e.querySelector('.vs'), bar: e.querySelector('.vb i'), msg: e.querySelector('.vm') }; }); applyTier(pickTier()); addEventListener('resize', resize); applySplit();
  bindUI(); bindTouch(); document.body.classList.toggle('touch', isTouch); show('sTitle'); G.state = 'title'; refreshCash(); requestAnimationFrame(loop);
  try { await buildMenu(); post.setScene(menu.scene, camera); post.setBloom([0.7, 0.5, 0.85]); cam.set('garage'); await setMenuCar(save.car); $('tMsg').textContent = isTouch ? 'DRAG LEFT SIDE TO STEER / BOOST AND BRAKE ON THE RIGHT' : 'ARROWS OR WASD TO DRIVE / SPACE TO BOOST'; }
  catch (e) { console.error(e); $('tMsg').textContent = 'LOAD ERROR: ' + (e && e.message || e); }
  ads.init(); loadTraffic().catch(() => { }); initPhysics().catch(() => { });
  const im = new Image(); im.onload = () => { $('logo').innerHTML = ''; $('logo').appendChild(im); }; im.src = new URL('../art/logo.png', import.meta.url).href;   // optional custom logo
  window.__done = true;
}
window.__GL = { wreckPlayer, clipFrame, clipSave, renderNow(dt = 1 / 30) { if (G.vs && G.state === 'play') renderSplit(dt); else post.render(dt); }, getPost: () => post, getMenu: () => menu, getCams: () => [cam, cam2, camera, camera2], G, ctx, save, CARS, EVENTS, CFG, input, audio, startEvent, startVersus, toMenu, funEvent, bot: false, step(n, dt = 1 / 60) { for (let i = 0; i < n; i++) { input.update(dt); (G.vs ? versusTick : playTick)(dt); input.pressed.clear(); } } };
boot();
