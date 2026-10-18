'use strict';
/* exePlays: Ungehusstled — ein Bedwars-Mobile-Game mit Leon & Moritz
   inspiriert vom YouTube-Kanal exePlays (@exeplays1041) */

// ---------- Charaktere ----------
// Skins aus den Videos: "Squizzer99" (braune Haare, rote Augen, schwarzer Hoodie mit grünen Streifen)
// und "MCexe" (schwarze Haare über einem Auge, rote Jacke).
const SKINS = {
  squizzer: { hair: '#4a2c17', hair2: '#3a2010', skin: '#e0ac7e', eye: '#d01818', eyeW: '#ffffff', jacket: '#1d1d1d', jacket2: '#2a2a2a',
    shirt: '#e9e9e9', accent: '#2ecc40', pants: '#151515', pants2: '#2ecc40', shoes: '#2ecc40', fringe: false },
  exe: { hair: '#141414', hair2: '#222', skin: '#e8b48a', eye: '#2f7bff', eyeW: '#ffffff', jacket: '#c8242b', jacket2: '#a01b21',
    shirt: '#e9e9e9', accent: '#c8242b', pants: '#1c2740', pants2: '#24314f', shoes: '#f2f2f2', fringe: true },
};
const CHARS = {
  leon: { name: 'Leon', ign: 'Squizzer99', skin: 'squizzer',
    perk: 'Der Lehrling: sneakt an Kanten (fällt nie freiwillig runter) und ist schneller. Haut aber schwächer.', speed: 4.4, dmgBonus: 0, bridgeCd: 0.12, sneak: true, kb: 5.5 },
  moritz: { name: 'Moritz', ign: 'MCexe', skin: 'exe',
    perk: 'Alter Hustler: Hustlerschule-Abschluss, +1 Schaden, Knockback wie ein LKW. Ist aber immer Schuld.', speed: 4.0, dmgBonus: 1, bridgeCd: 0.08, sneak: false, kb: 7.5 },
};
const other = k => (k === 'leon' ? 'moritz' : 'leon');

// ---------- Steckbriefe (aus den Videos herausgearbeitet) ----------
const BIOS = {
  moritz: [
    'Gastgeber von exePlays: eröffnet jede Folge mit <q>Jamoin und herzlich willkommen!</q>',
    'Nennt sich selbst <q>alter Hustler</q> und den Meister, Leon ist sein <q>Lehrling</q>. Daher kommt auch der Serienname: <q>eher ungehusselt als gehusselt</q>.',
    'Betreibt den eigenen Server UserMC (Minecraft Leben) und verteilt die Rechte.',
    'Shader-Fan (<q>das sieht schon episch aus</q>), ist aber dauernd mit FPS-Problemen beschäftigt.',
    'Kauft aus Versehen 64 Äpfel und sagt Boden statt Bogen.',
    'Laut Best-of ist <q>exe</q> immer Schuld. Und gewinnt nie: <q>Schade Moritz, nächstes Mal dir :)</q>',
  ],
  leon: [
    'Ist immer <q>heute mit dabei</q> und meldet sich mit einem trockenen <q>Hallo!</q>',
    'Der Lehrling: sneakt viel, stirbt beim Weg-Bauen (<q>er wollte den Weg bauen und hat verkackt</q>).',
    'Will in Minecraft Leben lieber Bauer sein und Tiere aufziehen. Moritz baut nebenan.',
    'Fan-Liebling in den Kommentaren: <q>Squizzer ist bester Mann!</q> #exeplaysarmy',
    'Erklärt Moritz geduldig, dass es Bogen heißt und nicht Boden.',
  ],
};

// ---------- Sprüche aus den Videos ----------
const TIPS = [
  'Tipp: Am Anfang steht der Schwamm.',
  'Tipp: Emulatoren sind bööööse (wenn ihr das Original nicht besitzt).',
  'Heute mal anstatt Minecraaaaaaaaaaaaaaaft ... ach nee, doch Minecraft.',
  'Tipp: Wenn jemand "Wo bist du??" fragt, immer mit genauer Ortsangabe antworten.',
  'Tipp: Das Gold gehört dem Team. Nicht dem Boy, der es snackt.',
  'Tipp: Käse heilt. Wissenschaftlich bewiesen in Blockgehustled #2.',
  'Wir entschuldigen uns für die weitere Zeit der kreativen Phase.',
  '#exeplaysarmy',
  'Tipp: Wer ins Void fällt, ist ungehusstled.',
  'Tipp: Es heißt BOGEN. Nicht Boden. Bedwars ist kein Boden.',
  'Tipp: Gelb ist immer das Lappenteam. Wissen wir schon länger.',
  'Tipp: Shader an = episch. Shader an = auch 3 FPS.',
  'Organspender HD, wenn du das hier spielst: schöne Grüße!',
  'Keine Sau guckt das Video. Aber das Spiel hier spielt jeder.',
  'Tipp: Wer stirbt, ist alles los. Schwert, Blöcke, Gold. Einfach weg.',
  'Tipp: Mit 🧱 baust du eine Mauer vor dich. Die Gegner müssen sie erst kaputthauen.',
];

// ---------- Setup ----------
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
const $ = id => document.getElementById(id);
const T = 32; // tile px in world units
const MW = MAP_W, MH = MAP_H;
const TEAMS = {
  gruen: { name: 'Grün', col: '#3ccf3c', dark: '#1e7a1e' },
  rot: { name: 'Rot', col: '#e53935', dark: '#8e1b1b' },
  blau: { name: 'Blau', col: '#3d6df2', dark: '#1d3790' },
  gelb: { name: 'Gelb', col: '#ffd52e', dark: '#9c7b00' },
  lila: { name: 'Lila', col: '#b44ce0', dark: '#6a1f8c' },
};
const SWORDS = [
  { name: 'Holzschwert', dmg: 2, col: '#9c7a45' },
  { name: 'Steinschwert', dmg: 3, col: '#8a8a8a' },
  { name: 'Eisenschwert', dmg: 4, col: '#e6e6e6' },
  { name: 'Diamantschwert', dmg: 6, col: '#4ee8e0' },
];
const SWORD_PRICES = [{ iron: 3 }, { iron: 8 }, { gold: 4 }];
const AI_SWORD_DMG = [2, 2.5, 3.5, 4.5];

let W = 0, H = 0, DPR = 1, zoom = 1;
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  zoom = Math.max(1, Math.min(W / (10.5 * T), H / (15 * T)));
  zoom = Math.max(zoom, 1.05);
}
window.addEventListener('resize', resize);
resize();

// ---------- Audio ----------
let AC = null;
function beep(freq, dur = 0.08, type = 'square', vol = 0.06, slide = 0) {
  if (!AC) return;
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.value = freq;
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), AC.currentTime + dur);
  g.gain.value = vol; g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + dur);
  o.connect(g); g.connect(AC.destination); o.start(); o.stop(AC.currentTime + dur);
}
const sfx = {
  hit: () => beep(180, 0.08, 'square', 0.07, -80),
  hurt: () => beep(120, 0.15, 'sawtooth', 0.07, -60),
  pick: () => beep(900 + Math.random() * 200, 0.05, 'triangle', 0.05),
  place: () => beep(260, 0.03, 'square', 0.03),
  crack: () => beep(140, 0.05, 'square', 0.04, -40),
  fall: () => beep(500, 0.6, 'sine', 0.08, -440),
  bed: () => { beep(90, 0.5, 'sawtooth', 0.1, -50); setTimeout(() => beep(70, 0.5, 'sawtooth', 0.1, -40), 120); },
  buy: () => { beep(660, 0.06, 'square', 0.05); setTimeout(() => beep(990, 0.08, 'square', 0.05), 60); },
  win: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.18, 'square', 0.06), i * 130)),
};

// ---------- Pixel-Sprites ----------
// 12x21 Pixel: Arme seitlich, Kopf 8x8, Körper 8x7, Beine 8x6
function makeSprite(s, frame) {
  const c = document.createElement('canvas'); c.width = 12; c.height = 21;
  const g = c.getContext('2d');
  const px = (x, y, col, w = 1, h = 1) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  px(2, 0, s.hair, 8, 2);
  px(2, 2, s.skin, 8, 6);
  px(2, 2, s.hair, 1, 3); px(9, 2, s.hair, 1, 3);
  px(3, 2, s.hair2, 6, 1);
  px(3, 4, s.eyeW); px(4, 4, s.eye); px(7, 4, s.eye); px(8, 4, s.eyeW);
  if (s.fringe) { px(2, 2, s.hair, 4, 3); px(3, 5, s.hair, 2, 1); }
  px(5, 6, '#a0603c', 2, 1);
  const bodyY = 8;
  px(2, bodyY, s.jacket, 8, 7);
  px(5, bodyY, s.shirt, 2, 7);
  px(4, bodyY + 1, s.accent, 1, 3); px(7, bodyY + 1, s.accent, 1, 3);
  px(2, bodyY + 6, s.jacket2, 8, 1);
  const a = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  px(0, bodyY + a, s.jacket, 2, 6); px(0, bodyY + 6 + a, s.skin, 2, 1);
  px(10, bodyY - a, s.jacket, 2, 6); px(10, bodyY + 6 - a, s.skin, 2, 1);
  const l = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  px(2, 15 + l, s.pants, 4, 5); px(6, 15 - l, s.pants, 4, 5);
  px(2, 15 + l, s.pants2, 1, 4); px(9, 15 - l, s.pants2, 1, 4);
  px(2, 19 + l, s.shoes, 4, 1); px(6, 19 - l, s.shoes, 4, 1);
  return c;
}
function enemySkin(team) {
  const t = TEAMS[team];
  const hairs = ['#3b2414', '#d9b25b', '#111', '#7a3a10'];
  return { hair: hairs[(Math.random() * 4) | 0], hair2: '#00000033', skin: '#d79d72', eye: '#3a2a8a', eyeW: '#fff', jacket: t.col, jacket2: t.dark,
    shirt: t.dark, accent: t.dark, pants: '#2b2b5a', pants2: '#23234a', shoes: '#555', fringe: false };
}
const spriteCache = {};
function spritesFor(key, skin) {
  if (!spriteCache[key]) spriteCache[key] = [0, 1, 2].map(f => makeSprite(skin, f));
  return spriteCache[key];
}

// ---------- Kacheln ----------
// 0 Void, 1 Gras, 2 Sandstein, 3 Stein, 4 Holzboden, 5 Endstein, 6 Holzwand, 7 gesetzte Mauer, 8 Kiesweg, 9 Baum
const TILECOL = {
  1: ['#5fa843', '#6cb84c', '#55993b'], 2: ['#e3d39a', '#d8c88c', '#ecdfab'], 3: ['#8c8c8c', '#7e7e7e', '#999'],
  4: ['#a8814b', '#9a7442', '#b58c53'], 5: ['#e8e8b0', '#dcdca0', '#f0f0c0'], 6: ['#6e4b26', '#7a5530', '#62421f'],
  7: ['#d9c486', '#cdb877', '#e4d197'], 8: ['#9a948a', '#8a847a', '#aaa49a'], 9: ['#2f7a2a', '#3b8c33', '#266322'],
};
const WALL_TOP = { 6: '#8a6236', 7: '#efe0ad', 9: '#4caf3c' }, WALL_SIDE = { 6: '#4a3015', 7: '#b8a368', 9: '#5a3a1a' };
const isWall = t => t === 6 || t === 7 || t === 9;
const walkable = t => t > 0 && !isWall(t);
const tileTex = {};
function buildTiles() {
  for (const k in TILECOL) {
    const c = document.createElement('canvas'); c.width = 8; c.height = 8;
    const g = c.getContext('2d'); const cols = TILECOL[k];
    let seed = +k * 97;
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = cols[(rnd() * 3) | 0]; g.fillRect(x, y, 1, 1); }
    if (k === '4' || k === '6') { g.fillStyle = k === '6' ? '#4a3015' : '#7d5a2f'; g.fillRect(0, 3, 8, 1); g.fillRect(0, 7, 8, 1); }
    if (k === '2') { g.fillStyle = '#cbb97a'; g.fillRect(0, 7, 8, 1); }
    if (k === '7') { g.fillStyle = '#b8a368'; g.fillRect(0, 3, 8, 1); g.fillRect(0, 7, 8, 1); g.fillRect(3, 0, 1, 3); g.fillRect(6, 4, 1, 3); }
    tileTex[k] = c;
  }
}
buildTiles();

// ---------- Spielzustand ----------
let S = null; // state
let selectedChar = 'leon';
let selectedMap = localStorage.getItem('exe_map') || 'klassik';
if (!MAPS[selectedMap]) selectedMap = 'klassik';
let episode = +(localStorage.getItem('exe_episode') || 14);
const best = JSON.parse(localStorage.getItem('exe_best') || '{"wins":0,"kills":0}');

function freshInv() { return { bronze: 0, iron: 0, gold: 0, sand: 0 }; }

function startGame(charKey, mapId = selectedMap) {
  selectedChar = charKey; selectedMap = mapId; localStorage.setItem('exe_map', mapId);
  const def = MAPS[mapId], M = def.build();
  const pc = CHARS[charKey], oc = CHARS[other(charKey)];
  const beds = {};
  for (const k in M.beds) { const [x, y, hp] = M.beds[k]; beds[k] = { x, y, hp, max: hp, alive: true }; }
  S = {
    t: 0, mapId, mapDef: def, map: M.map, under: new Uint8Array(MW * MH), mapVer: 0, C: M.C, void: M.void,
    enemyTeams: M.enemyTeams, allTeams: ['gruen', ...M.enemyTeams], ai: M.ai, border: M.border ? { ...M.border, r: M.border.r0, tick: 0 } : null,
    beds,
    spawn: { x: M.spawn[0], y: M.spawn[1] },
    shopNpc: { x: M.shop[0], y: M.shop[1] },
    gens: M.gens.map(([x, y, kind, every, cap]) => ({ x, y, kind, every, cap, t: Math.random() * every })),
    items: [], ents: [], parts: [], floats: [], arrows: [], fields: {},
    inv: { bronze: 4, iron: 0, gold: 0, sand: 24 },
    sword: 0, armor: 0, bow: 0, apples: 0, appleT: 0, shader: false,
    kills: 0, deaths: 0, bedsBroken: 0, fallsP: 0, goldSnacked: 0, cheese: 0, lost: 0,
    eco: {}, enemyTimer: {}, guardTimer: {}, alertT: {}, shopTimer: 2,
    gagT: 18, over: false, overT: 0, shake: 0,
    firstBedHit: false, wave: 1,
  };
  M.enemyTeams.forEach((k, i) => {
    S.eco[k] = { ...M.ai.startEco, sword: 0, armor: 0, bow: 0 };
    S.enemyTimer[k] = 12 + i * 6; S.guardTimer[k] = 0;
  });
  S.player = mkChar(charKey, pc, S.spawn.x, S.spawn.y, true);
  cam.x = S.spawn.x * T; cam.y = S.spawn.y * T;
  S.partner = mkChar(other(charKey), oc, S.spawn.x + 1, S.spawn.y + 0.5, false);
  S.ents.push(S.player, S.partner);
  // Endstein unter die Betten
  for (const k in S.beds) { const b = S.beds[k]; setTile(b.x, b.y, 5); setTile(b.x, b.y + 1, 5); }
  $('hud').classList.remove('hidden');
  ['menu', 'over', 'intro'].forEach(id => $(id).classList.add('hidden'));
  updateHud(true);
  setTimeout(() => say(S.player, `Jamoin und herzlich willkommen! Heute dabei: ${S.partner.def.ign}`, 3.2), 400);
  setTimeout(() => say(S.partner, 'Hallo!'), 2600);
  setTimeout(() => caption(`Bedwars #${episode}\n${def.name}`, -6, 0.45, 0.3), 300);
  feed(`<span class="tag">[BedWars]</span> ${def.name}: ${def.desc}`);
  if (mapId === 'loldorf') setTimeout(() => say(S.partner, 'Wo ist mein Haus??'), 6000);
  if (mapId === 'border') setTimeout(() => caption('Du bist 21 Blöcke\nvom Border entfernt!', -5, 0.1, 0.5), 5000);
  if (mapId === 'duell') setTimeout(() => say(S.partner, 'Pass auf, die haben Bogen!'), 6000);
}

function mkChar(key, def, x, y, isPlayer) {
  const skin = SKINS[def.skin];
  return { kind: 'hero', key, def, name: def.name, team: 'gruen', x, y, vx: 0, vy: 0, hp: 20, max: 20, dir: 1, fx: 0, fy: -1,
    sprites: spritesFor(def.skin, skin), isPlayer, atkCd: 0, hurtT: 0, walk: 0, dead: false, respawnT: 0,
    fallT: 0, kbx: 0, kby: 0, bubble: null, bubbleT: 0, bridgeCd: 0, buildT: 0 };
}
const NAMES = ['xXProGamerXx', 'Linus_Ben', 'DragoNick10', 'Jusaka', 'divam131', 'minkmunu1919', 'boy9gamehd', 'Michelb2004', 'ROBOMANIC', 'DerAMinecraftLP', 'Braeli_Berust', 'meynkraft', 'Kartoffelkopf_46', 'Linke_Socke', 'OrganspenderHD'];
function bedFront(team, d = 1.8) {
  const b = S.beds[team], bx = b.x + 0.5, by = b.y + 1, a = Math.atan2(S.C + 0.5 - by, S.C + 0.5 - bx);
  return { x: bx + Math.cos(a) * d, y: by + Math.sin(a) * d };
}
function mkEnemy(team) {
  const eco = S.eco[team], st = S.ai.strength;
  const hp = Math.round((8 + S.wave * 2) * st);
  const skinKey = 'en_' + team + '_' + ((Math.random() * 4) | 0);
  const f = bedFront(team);
  // Ausrüstung kommt aus der Team-Kasse (Computer-Shop)
  const sand = Math.min(eco.sand, 24); eco.sand -= sand;
  return { kind: 'enemy', team, name: NAMES[(Math.random() * NAMES.length) | 0], x: f.x + (Math.random() - 0.5) * 0.4, y: f.y + (Math.random() - 0.5) * 0.4,
    vx: 0, vy: 0, hp, max: hp, dir: 1, sprites: spritesFor(skinKey, enemySkin(team)), atkCd: 1, hurtT: 0, walk: 0, dead: false,
    fallT: 0, kbx: 0, kby: 0, buildT: 0, breakT: 0, speed: 1.7 + Math.random() * 0.5 + S.wave * 0.05, bubble: null, bubbleT: 0,
    sword: eco.sword, armor: eco.armor, bow: eco.bow, sand, mode: 'attack', shotCd: 1 + Math.random() };
}

// ---------- Map helpers ----------
const tileAt = (x, y) => { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= MW || y >= MH) return S.void ? 0 : 9; return S.map[y * MW + x]; };
function setTile(x, y, v) {
  x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= MW || y >= MH) return;
  if (S.map[y * MW + x] !== v) { S.map[y * MW + x] = v; S.mapVer++; }
}
const bedAt = (x, y) => { x = Math.floor(x); y = Math.floor(y); for (const k in S.beds) { const b = S.beds[k]; if (b.alive && b.x === x && (b.y === y || b.y + 1 === y)) return k; } return null; };
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// ---------- Wegfindung (Dijkstra-Flussfeld) ----------
// Kosten: Boden 1, Void 3 (überbrücken), gesetzte Mauer 4, Holzwand 7, Bäume/Betten unpassierbar
function tileCost(t, voidCost) { if (t === 0) return voidCost; if (t === 9) return Infinity; if (t === 7) return 4; if (t === 6) return 7; return 1; }
function fieldTo(sources, key, voidCost) {
  const cached = S.fields[key];
  if (cached && (cached.ver === S.mapVer || S.t - cached.t < 0.35)) return cached.d;
  const N = MW * MH, d = new Float32Array(N).fill(Infinity);
  const heap = []; // [dist, idx]
  const push = (v, i) => { heap.push([v, i]); let c = heap.length - 1; while (c > 0) { const p = (c - 1) >> 1; if (heap[p][0] <= heap[c][0]) break; [heap[p], heap[c]] = [heap[c], heap[p]]; c = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let c = 0; for (;;) { const l = c * 2 + 1, r = l + 1; let m = c; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === c) break; [heap[m], heap[c]] = [heap[c], heap[m]]; c = m; } } return top; };
  for (const [x, y] of sources) { if (x < 0 || y < 0 || x >= MW || y >= MH) continue; const i = y * MW + x; d[i] = 0; push(0, i); }
  const bedCells = new Set(); for (const k in S.beds) { const b = S.beds[k]; if (b.alive) { bedCells.add(b.y * MW + b.x); bedCells.add((b.y + 1) * MW + b.x); } }
  while (heap.length) {
    const [dv, i] = pop(); if (dv > d[i]) continue;
    const x = i % MW, y = (i / MW) | 0;
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue;
      const j = ny * MW + nx; if (bedCells.has(j)) continue;
      const c = tileCost(S.map[j], voidCost); if (c === Infinity) continue;
      if (dv + c < d[j]) { d[j] = dv + c; push(d[j], j); }
    }
  }
  if (Object.keys(S.fields).length > 30) S.fields = {};
  S.fields[key] = { d, ver: S.mapVer, t: S.t };
  return d;
}
function bedSources(team) { const b = S.beds[team]; return [[b.x, b.y], [b.x, b.y + 1]]; }
// nächste Zelle Richtung Ziel
function nextCell(e, d) {
  const x = Math.floor(e.x), y = Math.floor(e.y);
  let best = null, bv = d[y * MW + x] ?? Infinity;
  for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
    if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue;
    const v = d[ny * MW + nx]; if (v < bv) { bv = v; best = { x: nx, y: ny }; }
  }
  return best;
}

// ---------- Input ----------
const input = { mx: 0, my: 0, hit: false, build: false, keys: {} };
let stickId = null, stickOrigin = null;
const stick = $('stick'), knob = $('knob');
function stickPos() { const r = stick.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width / 2 }; }
window.addEventListener('pointerdown', e => {
  if (!S || S.over || e.target.closest('button') || !$('shop').classList.contains('hidden')) return;
  if (e.clientX < W * 0.55 && stickId === null) {
    stickId = e.pointerId; stickOrigin = stickPos();
    stick.style.left = (e.clientX - stickOrigin.r) + 'px';
    stick.style.top = (e.clientY - stickOrigin.r) + 'px'; stick.style.bottom = 'auto';
    stickOrigin = stickPos(); moveStick(e);
  }
});
window.addEventListener('pointermove', e => { if (e.pointerId === stickId) moveStick(e); });
const endStick = e => {
  if (e.pointerId !== stickId) return;
  stickId = null; input.mx = input.my = 0; knob.style.transform = '';
  stick.style.left = ''; stick.style.top = ''; stick.style.bottom = '';
};
window.addEventListener('pointerup', endStick); window.addEventListener('pointercancel', endStick);
function moveStick(e) {
  let dx = e.clientX - stickOrigin.x, dy = e.clientY - stickOrigin.y;
  const L = Math.hypot(dx, dy), max = stickOrigin.r * 0.75;
  if (L > max) { dx *= max / L; dy *= max / L; }
  knob.style.transform = `translate(${dx}px,${dy}px)`;
  const n = Math.min(1, L / max);
  input.mx = L > 4 ? (dx / (Math.hypot(dx, dy) || 1)) * n : 0;
  input.my = L > 4 ? (dy / (Math.hypot(dx, dy) || 1)) * n : 0;
}
function holdButton(el, flag) {
  el.addEventListener('pointerdown', e => { e.preventDefault(); input[flag] = true; el.classList.add('on'); });
  const up = () => { input[flag] = false; el.classList.remove('on'); };
  el.addEventListener('pointerup', up); el.addEventListener('pointerleave', up); el.addEventListener('pointercancel', up);
}
holdButton($('bHit'), 'hit');
holdButton($('bBuild'), 'build');
$('bShop').addEventListener('click', () => openShop());
window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  input.keys[k] = true;
  if (e.key === ' ') { input.hit = true; e.preventDefault(); }
  if (k === 'q' || k === 'f') input.build = true;
  if (k === 'e' && S && !S.over) { $('shop').classList.contains('hidden') ? openShop() : closeShop(); }
});
window.addEventListener('keyup', e => {
  const k = e.key.toLowerCase(); input.keys[k] = false;
  if (e.key === ' ') input.hit = false;
  if (k === 'q' || k === 'f') input.build = false;
});

// ---------- UI: Sprechblasen, Captions, Feed ----------
function say(ent, text, t = 2.6) { if (!ent) return; ent.bubble = text; ent.bubbleT = t; }
function caption(text, rot = -8, x = Math.random() * 0.35 + 0.05, y = Math.random() * 0.3 + 0.18) {
  const d = document.createElement('div'); d.className = 'cap'; d.textContent = text;
  d.style.setProperty('--r', rot + 'deg'); d.style.left = (x * 100) + '%'; d.style.top = (y * 100) + '%';
  $('captions').appendChild(d); setTimeout(() => d.remove(), 3300);
}
function feed(html) {
  const f = $('feed'); const d = document.createElement('div'); d.innerHTML = html; f.appendChild(d);
  while (f.children.length > 4) f.firstChild.remove();
  setTimeout(() => d.remove(), 6200);
}
function floatText(x, y, text, col = '#fff') { S.floats.push({ x, y, text, col, t: 1 }); }

let lastHud = '';
function updateHud(force) {
  const p = S.player;
  const hearts = Math.ceil(Math.max(0, p.hp) / 2);
  const h = '❤️'.repeat(hearts) + '🖤'.repeat(10 - hearts) + (S.armor ? ' 🛡️' : '') + (S.bow ? ' 🏹' : '') + (S.sword ? ' ⚔️' + S.sword : '');
  const ecoKey = S.enemyTeams.map(k => S.eco[k].sword + '' + S.eco[k].bow + S.eco[k].armor).join();
  const key = h + S.apples + JSON.stringify(S.inv) + Object.values(S.beds).map(b => b.alive + '' + (b.hp | 0)).join() + S.ents.length + ecoKey + (S.border ? S.border.r | 0 : '');
  if (!force && key === lastHud) return;
  lastHud = key;
  $('hearts').textContent = h;
  $('apples').textContent = S.apples ? `🍎 ${S.apples}` : '';
  $('rBronze').textContent = S.inv.bronze; $('rIron').textContent = S.inv.iron; $('rGold').textContent = S.inv.gold; $('rSand').textContent = S.inv.sand;
  let html = `<div class="t">${S.mapDef.name}</div>`;
  for (const k of S.allTeams) {
    const b = S.beds[k];
    const alive = S.ents.filter(e => e.team === k && !e.dead).length;
    const mark = b.alive ? '✔' : (alive ? alive : '✘');
    const gear = k === 'gruen' ? '' : `<span class="gear">${S.eco[k].sword ? '⚔' + S.eco[k].sword : ''}${S.eco[k].armor ? '🛡' : ''}${S.eco[k].bow ? '🏹' : ''}</span>`;
    html += `<div><span style="color:${TEAMS[k].col}">■</span> ${TEAMS[k].name}${k === 'gruen' ? ' (Du)' : ''} ${gear}<b style="float:right;margin-left:6px;color:${b.alive ? '#5f5' : '#f55'}">${mark}</b></div>`;
  }
  if (S.border) html += `<div class="t" style="margin-top:3px">Border: ${Math.max(0, S.border.r).toFixed(0)}</div>`;
  $('board').innerHTML = html;
}

// ---------- Shop ----------
const SHOP = [
  { ic: '🧱', name: '16× Sandstein', desc: 'Zum Bridgen und für Mauern (🧱-Knopf). Ohne Blöcke: Void.', price: { bronze: 4 }, buy: () => (S.inv.sand += 16) },
  { ic: '🧀', name: 'Käse', desc: 'Heilt 8 Herzen-Hälften. Ein Klassiker (Blockgehustled #2).', price: { bronze: 10 }, buy: () => { S.player.hp = Math.min(S.player.max, S.player.hp + 8); S.cheese++; caption('KÄSE!', -10); } },
  { ic: '🍎', name: 'Apfel', desc: 'Ein einziger Apfel. Ganz sicher nur einer.', price: { bronze: 2 }, buy: () => { S.apples += 64; S.applesBought = (S.applesBought || 0) + 1; caption('64 Äpfel?!\nBin ich denn\nbescheuert?', -9); setTimeout(() => say(S.partner, '64 Äpfel? 😂'), 900); } },
  { ic: '⚔️', name: () => S.sword < SWORDS.length - 1 ? SWORDS[S.sword + 1].name : 'Schwert maxed', desc: 'Mehr Schaden, mehr Knockback. Weg, wenn du stirbst.', price: () => SWORD_PRICES[S.sword] || null, buy: () => S.sword++ },
  { ic: '🏹', name: () => S.bow ? 'Bogen (hast du schon)' : 'Bogen', desc: 'Bogen bringt mehr! Schießt automatisch, wenn kein Gegner in Schwertreichweite ist. (Nicht Boden.)', price: () => (S.bow ? null : { gold: 3 }), buy: () => { S.bow = 1; say(S.partner, 'Bedwars ist eigentlich Boden.'); setTimeout(() => say(S.player, 'Es heißt BOGEN!'), 1300); } },
  { ic: '🛡️', name: 'Kettenrüstung', desc: 'Halber Schaden. Weg, wenn du stirbst.', price: () => (S.armor ? null : { iron: 10 }), buy: () => (S.armor = 1) },
  { ic: '🛏️', name: 'Bett mit Endstein zubauen', desc: '+40 Bett-HP. Damit diesmal nicht exe Schuld ist.', price: { iron: 6 }, buy: () => { const b = S.beds.gruen; b.max += 40; b.hp += 40; } },
  { ic: '⚡', name: () => `${S.partner.name} Energy-Drink`, desc: () => `${S.partner.name} wird schneller und haut doppelt zu. Bis er stirbt.`, price: { gold: 3 }, buy: () => { S.partner.boost = (S.partner.boost || 0) + 1; say(S.partner, 'LETS GOOO!'); } },
  { ic: '🌅', name: () => S.shader ? 'Shader ausmachen' : 'Cuda-Shader anmachen', desc: 'Sieht episch aus. "Mit dem Shader erkennt man ja echt nichts hier."', price: {}, buy: () => { S.shader = !S.shader; caption(S.shader ? 'Das sieht schon\nepisch aus.' : 'Shader kurz aus\nwegen FPS', -6); } },
  { ic: '💣', name: 'TNT', desc: 'Sprengt Gegner in der Nähe weg und reißt Mauern ein.', price: { gold: 2, iron: 2 }, buy: () => tnt() },
];
const val = (v) => (typeof v === 'function' ? v() : v);
function canPay(p, inv = S.inv) { if (!p) return false; if (!Object.keys(p).length) return true; for (const k in p) if ((inv[k] || 0) < p[k]) return false; return true; }
function pay(p, inv) { for (const k in p) inv[k] -= p[k]; }
const RES_ICON = { bronze: '🟫', iron: '⬜', gold: '🟨' };
function priceStr(p) { if (p && !Object.keys(p).length) return 'gratis'; return p ? Object.entries(p).map(([k, v]) => `${v}${RES_ICON[k]}`).join(' ') : '—'; }
function nearShop() { return S && !S.player.dead && dist(S.player, S.shopNpc) < 2.6; }
function openShop() {
  if (!S || S.over) return;
  if (!nearShop()) { caption('Der Dealer steht\nbei deinem Bett!', -5); return; }
  $('shop').classList.remove('hidden'); renderShop();
  input.mx = input.my = 0;
}
function closeShop() { $('shop').classList.add('hidden'); }
$('shopClose').addEventListener('click', closeShop);
function renderShop() {
  const box = $('shopItems'); box.innerHTML = '';
  SHOP.forEach(it => {
    const p = val(it.price); const ok = canPay(p);
    const d = document.createElement('div'); d.className = 'item' + (ok ? '' : ' no');
    d.innerHTML = `<div class="ic">${it.ic}</div><div class="tx"><b>${val(it.name)}</b><br>${val(it.desc)}</div><div class="pr">${priceStr(p)}</div>`;
    d.addEventListener('click', () => {
      const p2 = val(it.price);
      if (!canPay(p2)) { beep(110, 0.12, 'square', 0.05); return; }
      pay(p2, S.inv);
      it.buy(); sfx.buy(); renderShop(); updateHud(true);
    });
    box.appendChild(d);
  });
  $('shopInv').textContent = `${S.inv.bronze} Bronze · ${S.inv.iron} Eisen · ${S.inv.gold} Gold · ${S.inv.sand} Sandstein · ${SWORDS[S.sword].name}`;
}
function tnt() {
  const p = S.player; S.shake = 0.5;
  for (let i = 0; i < 30; i++) S.parts.push({ x: p.x, y: p.y, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8, t: 0.6, col: Math.random() < 0.5 ? '#ff5722' : '#ffd52e', s: 4 });
  beep(60, 0.6, 'sawtooth', 0.12, -30);
  for (const e of S.ents) if (e.kind === 'enemy' && !e.dead && dist(e, p) < 4.5) {
    const a = Math.atan2(e.y - p.y, e.x - p.x); e.kbx = Math.cos(a) * 9; e.kby = Math.sin(a) * 9; e.lastHitBy = p; damage(e, 6, p);
  }
  for (let y = Math.floor(p.y) - 2; y <= Math.floor(p.y) + 2; y++) for (let x = Math.floor(p.x) - 2; x <= Math.floor(p.x) + 2; x++) {
    const t = tileAt(x, y); if (t === 6 || t === 7) breakWall(x, y);
  }
  closeShop(); caption('BOOOM', 8);
}

// ---------- Computer-Shop: Teams verdienen und kaufen selbst ----------
function aiEconomy(dt) {
  const mult = 1 + S.wave * 0.12;
  for (const k of S.enemyTeams) {
    if (!S.beds[k].alive) continue;
    const eco = S.eco[k];
    eco.bronze += dt * 0.7 * mult; eco.iron += dt * 0.085 * mult; eco.gold += dt * 0.02 * mult;
  }
  S.shopTimer -= dt;
  if (S.shopTimer > 0) return;
  S.shopTimer = 2;
  for (const k of S.enemyTeams) {
    if (!S.beds[k].alive) continue;
    const eco = S.eco[k], tn = `<b style="color:${TEAMS[k].col}">Team ${TEAMS[k].name}</b>`;
    if (eco.sand < 40 && eco.bronze >= 4) { pay({ bronze: 4 }, eco); eco.sand += 16; }
    const sp = SWORD_PRICES[eco.sword];
    if (sp && canPay(sp, eco)) { pay(sp, eco); eco.sword++; feed(`<span class="tag">[Shop]</span> ${tn} kauft ein ${SWORDS[eco.sword].name}.`); }
    else if (!eco.armor && eco.iron >= 10) { pay({ iron: 10 }, eco); eco.armor = 1; feed(`<span class="tag">[Shop]</span> ${tn} kauft Kettenrüstung.`); }
    else if (!eco.bow && S.t >= S.ai.bowAfter && eco.gold >= 3) { pay({ gold: 3 }, eco); eco.bow = 1; feed(`<span class="tag">[Shop]</span> ${tn} kauft Bögen. Bogen bringt mehr!`); }
  }
}

// ---------- Kampf ----------
function damage(e, amount, from) {
  if (e.dead || e.fallT > 0) return;
  if (e === S.player && S.armor) amount *= 0.5;
  if (e.kind === 'enemy' && e.armor) amount *= 0.6;
  e.hp -= amount; e.hurtT = 0.25;
  floatText(e.x, e.y - 1.2, '-' + Math.max(1, Math.round(amount)), '#ff5555');
  if (e === S.player) { sfx.hurt(); S.shake = Math.max(S.shake, 0.15); if (Math.random() < 0.06) say(S.player, ['Ich kassiere gerade von irgendwo!', 'Woher bekomm ich den ganzen Schaden?', 'Ich sterbe, ich sterbe!'][(Math.random() * 3) | 0]); }
  else sfx.hit();
  for (let i = 0; i < 5; i++) S.parts.push({ x: e.x, y: e.y - 0.5, vx: (Math.random() - 0.5) * 3, vy: -Math.random() * 3, t: 0.4, col: '#b00', s: 3 });
  if (e.hp <= 0) kill(e, from, false);
}
// Wer stirbt, verliert seine komplette Ausrüstung. Niemand bekommt sie.
function loseEverything() {
  const inv = S.inv, had = inv.bronze + inv.iron + inv.gold + inv.sand + S.sword + S.armor + S.bow + (S.apples ? 1 : 0);
  S.inv = freshInv(); S.sword = 0; S.armor = 0; S.bow = 0; S.apples = 0;
  if (had > 0) { S.lost++; setTimeout(() => caption('Alles weg!\nSchwert, Blöcke, Gold...', -7, 0.12, 0.55), 900); }
}
function kill(e, by, fell) {
  if (e.dead) return;
  e.dead = true;
  const nm = n => `<b style="color:${TEAMS[n.team].col}">${n.name}</b>`;
  if (fell) feed(`<span class="tag">[BedWars]</span> ${nm(e)} ist ins Void gefallen${by && by !== e ? ` (Knockback von ${nm(by)})` : ''}.`);
  else feed(`<span class="tag">[BedWars]</span> ${nm(e)} wurde von ${by ? nm(by) : '???'} getötet.`);
  if (e.kind === 'enemy') {
    // Ausrüstung und Blöcke des Gegners sind einfach weg
    e.sand = 0; e.sword = 0; e.armor = 0; e.bow = 0;
    if (by === S.player) { S.kills++; S.inv.bronze += 3; floatText(e.x, e.y - 1.6, '+3 Bronze', '#e8a060'); }
    if (by === S.partner && Math.random() < 0.3) say(S.partner, ['EZ', 'Gönn dir!', 'Uncut!', 'Ungehusstled!'][(Math.random() * 4) | 0]);
  } else {
    e.respawnT = 4;
    if (e === S.player) {
      S.deaths++;
      loseEverything();
      if (!S.beds.gruen.alive) { endGame(false); return; }
      if (fell) { S.fallsP++; caption(['FAIL!!!', 'Wieso nur?\nWieso?', 'Beim Weg\nverkackt.'][S.fallsP % 3], -8); setTimeout(() => say(S.partner, ['Was machst du?? 😂', 'Er wollte den Weg bauen und hat verkackt.', 'Das hat er nicht gelernt.'][(Math.random() * 3) | 0]), 700); }
      else caption('Du bist gestorben!\nRespawn in 4...', -4, 0.15, 0.35);
    } else if (e === S.partner) {
      e.boost = 0;
      if (!S.beds.gruen.alive) { e.respawnT = 99999; feed(`<b>${e.name}</b> ist raus. Ab jetzt alleine...`); }
      else if (fell) setTimeout(() => say(S.player, 'Richtig! exe ist Schuld'), 400);
    }
  }
  updateHud(true);
}
function heroDmg(a) {
  if (a === S.partner) return 1.5 + (a.boost ? 2 : 0);
  return SWORDS[S.sword].dmg + (a.def.dmgBonus || 0);
}
function attack(a) {
  if (a.atkCd > 0 || a.dead || a.fallT > 0) return false;
  let target = null, td = 1.45;
  for (const e of S.ents) {
    if (e === a || e.dead || e.team === a.team || e.fallT > 0) continue;
    const d = dist(a, e); if (d < td) { td = d; target = e; }
  }
  const dmg = a.kind === 'hero' ? heroDmg(a) : AI_SWORD_DMG[a.sword] * (0.8 + S.ai.strength * 0.2);
  if (target) {
    a.atkCd = a.kind === 'hero' ? 0.38 : 0.95;
    const ang = Math.atan2(target.y - a.y, target.x - a.x);
    const kb = a === S.player ? a.def.kb : 4.5;
    target.kbx = Math.cos(ang) * kb; target.kby = Math.sin(ang) * kb; target.lastHitBy = a;
    a.dir = Math.cos(ang) >= 0 ? 1 : -1; a.swing = 0.18;
    damage(target, dmg, a);
    return true;
  }
  // Betten hauen
  for (const k in S.beds) {
    const b = S.beds[k];
    if (!b.alive || k === a.team) continue;
    const d = Math.hypot(a.x - (b.x + 0.5), a.y - (b.y + 1));
    if (d < 1.9) {
      a.atkCd = a.kind === 'hero' ? 0.45 : 0.9; a.swing = 0.18;
      hitBed(k, a.kind === 'hero' ? 2 + Math.floor(S.sword / 2) : 2, a);
      return true;
    }
  }
  if (a === S.player && S.bow) {
    let tgt = null, bd = 7.5;
    for (const e of S.ents) if (e.kind === 'enemy' && !e.dead && e.fallT <= 0) { const d = dist(a, e); if (d < bd) { bd = d; tgt = e; } }
    if (tgt) {
      shootArrow(a, tgt, 14, 2, 0);
      a.atkCd = 0.6; beep(700, 0.06, 'triangle', 0.05, -300);
      return true;
    }
  }
  // Spieler haut Mauern ein
  if (a === S.player) {
    const tx = Math.floor(a.x + a.fx * 0.9), ty = Math.floor(a.y + a.fy * 0.9);
    const t = tileAt(tx, ty);
    if (t === 6 || t === 7) { a.atkCd = 0.3; a.swing = 0.18; chipWall(tx, ty, 0.35); return true; }
    a.atkCd = 0.25; a.swing = 0.18;
  }
  return false;
}
function shootArrow(from, tgt, speed, dmg, spread) {
  const ang = Math.atan2(tgt.y - from.y, tgt.x - from.x) + (Math.random() - 0.5) * spread;
  S.arrows.push({ x: from.x, y: from.y - 0.5, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, t: 0.9, team: from.team, from, dmg });
  from.dir = Math.cos(ang) >= 0 ? 1 : -1;
}
function hitBed(k, dmg, by) {
  const b = S.beds[k]; b.hp -= dmg; sfx.hit();
  for (let i = 0; i < 4; i++) S.parts.push({ x: b.x + 0.5, y: b.y + 1, vx: (Math.random() - 0.5) * 3, vy: -Math.random() * 3, t: 0.5, col: TEAMS[k].col, s: 3 });
  if (k === 'gruen' && !S.firstBedHit) { S.firstBedHit = true; caption('Euer Bett wird\nangegriffen!', -6); setTimeout(() => caption('Richtig!\nexe ist Schuld', -12), 1500); }
  if (k === 'gruen' && Math.random() < 0.08) say(S.partner, 'BETT!! BETT!!');
  // Gegner-Team ruft Verstärkung, wenn sein Bett angegriffen wird
  if (k !== 'gruen' && b.hp > 0 && (S.alertT[k] || 0) <= S.t) {
    S.alertT[k] = S.t + 20;
    const g = mkEnemy(k); g.guard = true; g.hp = g.max = Math.round((10 + S.wave * 3) * S.ai.strength); S.eco[k].sand += g.sand; g.sand = 0;
    S.ents.push(g); say(g, ['Unser Bett!!', 'Weg da!', 'BETT VERTEIDIGEN!'][(Math.random() * 3) | 0]);
  }
  if (b.hp <= 0) destroyBed(k, by);
}
function destroyBed(k, by) {
  const b = S.beds[k]; if (!b.alive) return;
  b.alive = false; sfx.bed(); S.shake = 0.4; S.mapVer++;
  const byName = by ? by.name : 'dem Border';
  if (k === 'gruen') {
    caption('Euer Bett wurde\nzerstört!', -6, 0.1, 0.3);
    setTimeout(() => say(S.partner, 'Das kann doch nicht wahr sein!'), 500);
    feed(`<span class="tag">[BedWars]</span> <b style="color:${TEAMS.gruen.col}">Euer Bett</b> wurde von ${byName} zerstört! Kein Respawn mehr!`);
  } else {
    S.bedsBroken++;
    for (const g of S.ents) if (g.guard && g.team === k) { g.guard = false; say(g, 'NEIN! Mein Bett!'); }
    feed(`<span class="tag">[BedWars]</span> Das Bett von Team <b style="color:${TEAMS[k].col}">${TEAMS[k].name}</b> wurde von <b>${byName}</b> zerstört!`);
    if (by) {
      caption(['#exeplaysarmy', 'Gönn dir!', 'Bett weg, Spaß da', 'Ungehusstled!!'][S.bedsBroken % 4], -10);
      S.inv.gold += 2; S.inv.iron += 3;
      if (k === 'gelb') setTimeout(() => say(S.player, 'Gelb ist halt das Lappenteam.'), 1200);
      if (by !== S.partner) setTimeout(() => say(S.partner, 'Jaaaa! Ehrenmann!'), 400);
    }
  }
  updateHud(true);
}

// ---------- Mauern ----------
const wallHp = {};
function chipWall(x, y, amount) {
  const i = y * MW + x, t = S.map[i];
  const max = t === 6 ? 1.6 : 0.9;
  wallHp[i] = (wallHp[i] ?? max) - amount; sfx.crack();
  for (let n = 0; n < 3; n++) S.parts.push({ x: x + 0.5, y: y + 0.6, vx: (Math.random() - 0.5) * 3, vy: -Math.random() * 3, t: 0.4, col: WALL_TOP[t] || '#ccc', s: 3 });
  if (wallHp[i] <= 0) breakWall(x, y);
}
function breakWall(x, y) {
  const i = y * MW + x, t = S.map[i];
  delete wallHp[i];
  setTile(x, y, t === 6 ? 4 : (S.under[i] || 2));
}
function playerBuild(p, dt) {
  p.buildT -= dt;
  if (!input.build || p.buildT > 0 || p.dead || p.fallT > 0) return;
  p.buildT = 0.22;
  let tx = Math.floor(p.x + p.fx * 0.95), ty = Math.floor(p.y + p.fy * 0.95);
  if (tx === Math.floor(p.x) && ty === Math.floor(p.y)) { tx = Math.floor(p.x + p.fx * 1.6); ty = Math.floor(p.y + p.fy * 1.6); }
  const t = tileAt(tx, ty);
  if (S.inv.sand <= 0) { if (!p.warnedSand) { p.warnedSand = true; caption('Keine Blöcke mehr!\nAb zum Dealer', -6); setTimeout(() => (p.warnedSand = false), 3000); } return; }
  if (bedAt(tx, ty) || isWall(t)) return;
  if (S.ents.some(e => !e.dead && Math.floor(e.x) === tx && Math.floor(e.y) === ty)) return;
  if (t === 0) setTile(tx, ty, 2);                                   // im Void: Brücke
  else { S.under[ty * MW + tx] = t; setTile(tx, ty, 7); }            // auf Boden: Mauer
  S.inv.sand--; sfx.place();
  if (Math.random() < 0.05) say(S.partner, 'Ich bau da links auch noch die Wand hin.');
}

// ---------- Gags / Partner-Events ----------
const GAGS = [
  () => { if (S.inv.gold > 0) { S.inv.gold--; S.goldSnacked++; caption('Der Boy ist\ndas Gold am\nsnacken', -14); say(S.partner, '*mampf* 😋'); } else say(S.partner, 'Hat jemand Gold? Ich hab Hunger.'); },
  () => { say(S.partner, '...(viel zu leise)...', 2.5); setTimeout(() => say(S.partner, 'Welcher Vollidiot hat mich wieder so leise gemacht??'), 2600); },
  () => say(S.partner, ['Jamoin!', 'Heute flott geschnitten!', 'Gelbes Team!!!', 'Wir sind noch drin!', 'Uncut!', 'Wo ist mein Haus??'][(Math.random() * 6) | 0]),
  () => { if (dist(S.player, S.partner) > 7) { say(S.partner, 'Wo bist du??'); setTimeout(() => say(S.player, 'Ich bin hier (genaue Ortsangabe)'), 1400); } else say(S.partner, 'Folge 14 und immer noch keine 100 Abos 😭'); },
  () => say(S.partner, ['Keine Sau guckt das Video!', 'Organspender HD, schöne Grüße!', 'Gelb ist immer das Lappenteam.', 'Hab ich in der Hustlerschule gelernt.', 'Ich bin premiumst ausgerüstet.', 'Ich lauf nackt auf die Gegner zu!', 'Mit der bloßen Faust runtergeboxt!', 'Alter, der hatte volle Ausrüstung!', 'Ich spiel immer auf YOLO.', 'Ich hab mich mehrfach eingebaut.', 'Kann man da so eine Zeitlupe einblenden?'][(Math.random() * 11) | 0]),
  () => { if (S.inv.gold > 1) { say(S.partner, 'Hast du Gold? Tu das in die Kiste!'); setTimeout(() => say(S.player, 'Nein, ich hab ja alles was ich brauche.'), 1500); } else say(S.partner, 'Mitte ist gerade komplett frei!'); },
  () => { if (selectedChar === 'moritz') say(S.partner, 'Moritz, wenn du mich schlägst, dann schlag ich dich.'); else say(S.partner, 'Raus aus meinem Haus! Das ist MEIN Haus!'); },
  () => { say(S.partner, 'Ich bau mal kurz was...'); setTimeout(() => caption(`Failure\nBuilt by: ${S.partner.def.ign}`, -4), 1800); },
];

// ---------- Update ----------
function update(dt) {
  S.t += dt;
  if (S.over) { S.overT += dt; }
  // Generatoren
  for (const g of S.gens) {
    g.t += dt;
    if (g.t >= g.every) {
      g.t = 0;
      if (walkable(tileAt(g.x, g.y)) && S.items.filter(i => i.gen === g).length < g.cap)
        S.items.push({ x: g.x + (Math.random() - 0.5) * 0.8, y: g.y + (Math.random() - 0.5) * 0.8, kind: g.kind, gen: g, bob: Math.random() * 6 });
    }
  }
  S.wave = 1 + Math.floor(S.t / 90) + S.bedsBroken;
  aiEconomy(dt);
  if (S.border) updateBorder(dt);
  // Bett-Verteidiger
  for (const k of S.enemyTeams) {
    if (!S.beds[k].alive || S.ents.some(e => e.guard && e.team === k && !e.dead)) continue;
    S.guardTimer[k] -= dt;
    if (S.guardTimer[k] <= 0) { const g = mkEnemy(k); g.guard = true; g.hp = g.max = Math.round((12 + S.wave * 3) * S.ai.strength); g.name = g.name + ' 🛡'; S.eco[k].sand += g.sand; g.sand = 0; S.ents.push(g); S.guardTimer[k] = 15; }
  }
  // Gegner-Spawns
  const maxAlive = (S.ai.maxAlive || 99);
  for (const k of S.enemyTeams) {
    if (!S.beds[k].alive) continue;
    S.enemyTimer[k] -= dt;
    if (S.enemyTimer[k] <= 0) {
      const alive = S.ents.filter(e => e.kind === 'enemy' && !e.dead && !e.guard).length;
      if (alive < Math.min(maxAlive, 3 + S.wave)) S.ents.push(mkEnemy(k));
      S.enemyTimer[k] = Math.max(6, S.ai.spawnBase - S.t / 14) + Math.random() * 6;
    }
  }
  // Spieler
  const p = S.player;
  let mx = input.mx, my = input.my;
  if (input.keys['w'] || input.keys['arrowup']) my = -1;
  if (input.keys['s'] || input.keys['arrowdown']) my = 1;
  if (input.keys['a'] || input.keys['arrowleft']) mx = -1;
  if (input.keys['d'] || input.keys['arrowright']) mx = 1;
  const ml = Math.hypot(mx, my); if (ml > 1) { mx /= ml; my /= ml; }
  if (!$('shop').classList.contains('hidden')) { mx = my = 0; }
  if (Math.hypot(mx, my) > 0.3) { const L = Math.hypot(mx, my); p.fx = mx / L; p.fy = my / L; }
  if (!p.dead && p.fallT <= 0) {
    p.vx = mx * p.def.speed; p.vy = my * p.def.speed;
    if (input.hit) attack(p);
  }
  playerBuild(p, dt);
  partnerAI(S.partner, dt);
  for (const e of S.ents) if (e.kind === 'enemy') enemyAI(e, dt);
  for (const e of S.ents) physics(e, dt);
  S.ents = S.ents.filter(e => !(e.kind === 'enemy' && e.dead));
  // Items einsammeln
  for (let i = S.items.length - 1; i >= 0; i--) {
    const it = S.items[i];
    if (!walkable(tileAt(it.x, it.y))) { S.items.splice(i, 1); continue; }
    if (!p.dead && p.fallT <= 0 && Math.hypot(it.x - p.x, it.y - p.y) < 0.9) {
      S.inv[it.kind]++; S.items.splice(i, 1); sfx.pick();
    }
  }
  // Pfeile (vom Spieler und von Gegner-Bogenschützen)
  for (const ar of S.arrows) {
    ar.x += ar.vx * dt; ar.y += ar.vy * dt; ar.t -= dt;
    if (isWall(tileAt(ar.x, ar.y + 0.5))) { ar.t = 0; continue; }
    for (const e of S.ents) if (e.team !== ar.team && !e.dead && e.fallT <= 0 && Math.hypot(e.x - ar.x, e.y - 0.5 - ar.y) < 0.6) {
      const L = Math.hypot(ar.vx, ar.vy); e.kbx = ar.vx / L * 6; e.kby = ar.vy / L * 6; e.lastHitBy = ar.from; damage(e, ar.dmg, ar.from); ar.t = 0; break;
    }
  }
  S.arrows = S.arrows.filter(a => a.t > 0);
  // Äpfel automatisch essen
  if (S.apples > 0 && !p.dead && p.hp < p.max) { S.appleT -= dt; if (S.appleT <= 0) { S.apples--; p.hp = Math.min(p.max, p.hp + 1); S.appleT = 1.5; floatText(p.x, p.y - 1.4, '🍎 +1', '#7f7'); } }
  // "Der fällt schon freiwillig"
  if (S.void) for (const e of S.ents) if (e.kind === 'enemy' && !e.dead && e.fallT <= 0 && tileAt(e.x, e.y) === 2 && Math.random() < dt * 0.012) {
    e.kbx = (Math.random() < 0.5 ? -1 : 1) * 4; e.lastHitBy = null;
    setTimeout(() => S && caption('Der fällt schon\nfreiwillig.', -8), 600);
  }
  // Gags
  S.gagT -= dt;
  if (S.gagT <= 0 && !S.over) { GAGS[(Math.random() * GAGS.length) | 0](); S.gagT = 20 + Math.random() * 18; }
  // Partikel
  for (const q of S.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 6 * dt; q.t -= dt; }
  S.parts = S.parts.filter(q => q.t > 0);
  for (const f of S.floats) { f.y -= dt * 0.8; f.t -= dt; }
  S.floats = S.floats.filter(f => f.t > 0);
  S.shake = Math.max(0, S.shake - dt);
  $('shopHint').classList.toggle('hidden', !nearShop());
  // Sieg?
  if (!S.over && S.enemyTeams.every(k => !S.beds[k].alive) && !S.ents.some(e => e.kind === 'enemy' && !e.dead)) endGame(true);
  updateHud();
}

// Border-Map: die Weltgrenze frisst die Insel von außen
function updateBorder(dt) {
  const B = S.border, C = S.C + 0.5;
  const k = Math.min(1, Math.max(0, (S.t - B.start) / B.dur));
  B.r = B.r0 - (B.r0 - B.r1) * k;
  B.tick -= dt; if (B.tick > 0) return; B.tick = 0.5;
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    if (S.map[y * MW + x] && Math.hypot(x + 0.5 - C, y + 0.5 - C) > B.r) setTile(x, y, 0);
  }
  for (const t in S.beds) {
    const b = S.beds[t];
    if (b.alive && Math.hypot(b.x + 0.5 - C, b.y + 1 - C) > B.r - 0.5) destroyBed(t, null);
  }
  const inside = o => Math.hypot(o.x - C, o.y - C) < B.r - 1.2;
  if (!inside(S.shopNpc)) { S.shopNpc.x = C - 1.8; S.shopNpc.y = C + 1.2; feed('<span class="tag">[BedWars]</span> Der Dealer flüchtet in die Mitte.'); }
  if (!inside(S.spawn)) { S.spawn.x = C; S.spawn.y = C + 1; }
  if (!B.warned && k > 0 && Math.hypot(S.player.x - C, S.player.y - C) > B.r - 3) { B.warned = true; caption('Der Border kommt!\nAb in die Mitte!', -6); setTimeout(() => (B.warned = false), 8000); }
}

function moveToward(a, gx, gy, sp) {
  const dx = gx - a.x, dy = gy - a.y, L = Math.hypot(dx, dy) || 1;
  a.vx = dx / L * sp; a.vy = dy / L * sp;
}
function partnerAI(a, dt) {
  if (a.dead || a.fallT > 0) return;
  const bed = S.beds.gruen;
  const home = bed.alive ? bedFront('gruen', 1.4) : { x: S.player.x - 1, y: S.player.y + 0.5 };
  if (bed.alive) home.x += Math.sin(S.t * 0.4) * 1.2;
  let target = null, td = 9;
  for (const e of S.ents) if (e.kind === 'enemy' && !e.dead && e.fallT <= 0) {
    const d = Math.min(bed.alive ? dist(e, { x: bed.x + 0.5, y: bed.y + 1 }) : 99, dist(e, a) + 2);
    if (d < td && walkable(tileAt(e.x, e.y))) { td = d; target = e; }
  }
  const goal = target || home;
  const sp = 3.1 * (a.boost ? 1.35 : 1);
  const L = dist(a, goal);
  if (target && L < 1.4) { a.vx = a.vy = 0; attack(a); return; }
  if (L < 0.5) { a.vx = a.vy = 0; return; }
  // Wegfindung ohne Bridgen (Partner baut keine Brücken)
  const d = fieldTo([[Math.floor(goal.x), Math.floor(goal.y)]], 'p' + Math.floor(goal.x) + ',' + Math.floor(goal.y), Infinity);
  const n = L > 1.5 ? nextCell(a, d) : null;
  if (n && !isWall(tileAt(n.x, n.y))) moveToward(a, n.x + 0.5, n.y + 0.5, sp);
  else if (walkable(tileAt(a.x + (goal.x - a.x) / L * 0.4, a.y + (goal.y - a.y) / L * 0.4))) moveToward(a, goal.x, goal.y, sp);
  else a.vx = a.vy = 0;
}

function enemyAI(e, dt) {
  if (e.dead || e.fallT > 0) return;
  const p = S.player, pt = S.partner;
  e.shotCd -= dt;
  // nahe Helden
  let near = null, nd = e.guard ? 6 : 3.2;
  for (const h of [p, pt]) if (!h.dead && h.fallT <= 0) { const d = dist(h, e); if (d < nd && (!e.guard || dist(h, bedFront(e.team, 0)) < 6.5)) { nd = d; near = h; } }
  // Bogenschützen schießen aus der Distanz
  if (e.bow && e.shotCd <= 0) {
    let tgt = null, bd = 7;
    for (const h of [p, pt]) if (!h.dead && h.fallT <= 0) { const d = dist(h, e); if (d > 1.8 && d < bd) { bd = d; tgt = h; } }
    if (tgt) { shootArrow(e, tgt, 11, 1.5, 0.25); e.shotCd = 2.4 + Math.random(); beep(600, 0.05, 'triangle', 0.03, -250); }
  }
  if (near && nd < 1.25) { e.vx = e.vy = 0; attack(e); return; }
  if (e.guard) {
    const h = near || bedFront(e.team, 1.8 + Math.sin(S.t + e.x) * 0.6);
    const L = dist(e, h);
    if (L < 0.3) { e.vx = e.vy = 0; return; }
    const ax = e.x + (h.x - e.x) / L * 0.4, ay = e.y + (h.y - e.y) / L * 0.4;
    if (walkable(tileAt(ax, ay))) moveToward(e, h.x, h.y, e.speed); else e.vx = e.vy = 0;
    return;
  }
  if (near) { // auf Helden zulaufen, wenn möglich
    const ax = e.x + (near.x - e.x) / nd * 0.5, ay = e.y + (near.y - e.y) / nd * 0.5;
    if (walkable(tileAt(ax, ay))) { moveToward(e, near.x, near.y, e.speed); return; }
  }
  const bed = S.beds.gruen;
  // ohne Blöcke heim zum Nachkaufen (falls Brücke nötig)
  if (e.mode === 'restock') {
    const home = bedFront(e.team, 1.5);
    if (dist(e, home) < 1.6) {
      const eco = S.eco[e.team], take = Math.min(eco.sand, 24);
      if (take > 0) { eco.sand -= take; e.sand += take; e.mode = 'attack'; say(e, 'Blöcke geholt!'); }
      else { e.vx = e.vy = 0; return; }
    } else {
      const d = fieldTo(bedSources(e.team), 'home_' + e.team, 3);
      return followField(e, d, dt, true);
    }
  }
  if (bed.alive && Math.hypot(e.x - (bed.x + 0.5), e.y - (bed.y + 1)) < 1.6) {
    e.vx = e.vy = 0; if (e.atkCd <= 0) { e.atkCd = 1.0; e.swing = 0.18; hitBed('gruen', 2 + Math.floor(S.wave / 3), e); } return;
  }
  let d;
  if (bed.alive) d = fieldTo(bedSources('gruen'), 'bed_gruen', 3);
  else { const h = p.dead ? pt : p, hx = Math.floor(h.x), hy = Math.floor(h.y); d = fieldTo([[hx, hy]], 'hero' + hx + ',' + hy, 3); }
  followField(e, d, dt, false);
}
function followField(e, d, dt, homeward) {
  const n = nextCell(e, d);
  if (!n) { e.vx = e.vy = 0; return; }
  const t = tileAt(n.x, n.y);
  if (t === 0) {
    if (e.sand <= 0) {
      if (!homeward) { e.mode = 'restock'; say(e, 'Keine Blöcke mehr!'); }
      e.vx = e.vy = 0; return;
    }
    // zum Rand laufen, dann Brücke bauen
    const cx = Math.floor(e.x) + 0.5, cy = Math.floor(e.y) + 0.5;
    if (Math.hypot(e.x - cx, e.y - cy) > 0.25) { moveToward(e, cx, cy, e.speed); return; }
    e.vx = e.vy = 0; e.buildT += dt;
    if (e.buildT > 0.45) { e.buildT = 0; setTile(n.x, n.y, 2); e.sand--; if (Math.random() < 0.3) sfx.place(); }
    return;
  }
  if (isWall(t)) {
    e.vx = e.vy = 0; e.breakT += dt; e.swing = e.swing || 0;
    if (e.breakT > 0.5) { e.breakT = 0; e.swing = 0.18; chipWall(n.x, n.y, 0.3 + e.sword * 0.08); if (Math.random() < 0.04) say(e, 'Mach die Mauer weg!!'); }
    return;
  }
  e.breakT = 0;
  moveToward(e, n.x + 0.5, n.y + 0.5, e.speed);
}

function physics(e, dt) {
  e.atkCd = Math.max(0, e.atkCd - dt); e.hurtT = Math.max(0, e.hurtT - dt); e.swing = Math.max(0, (e.swing || 0) - dt);
  if (e.bubbleT > 0) { e.bubbleT -= dt; if (e.bubbleT <= 0) e.bubble = null; }
  if (e.dead) {
    if (e.kind === 'hero') {
      e.respawnT -= dt;
      if (e.respawnT <= 0 && !S.beds.gruen.alive && e.isPlayer) { endGame(false); return; }
      if (e.respawnT <= 0 && S.beds.gruen.alive && !S.over) {
        e.dead = false; e.hp = e.max; e.fallT = 0; e.x = S.spawn.x + (e.isPlayer ? 0 : 1); e.y = S.spawn.y; e.kbx = e.kby = 0;
        if (e.isPlayer) caption('Respawn!\nMit leeren Taschen.', -5, 0.3, 0.3);
      }
    }
    return;
  }
  if (e.fallT > 0) {
    e.fallT += dt;
    if (e.fallT > 0.9) kill(e, e.lastHitBy || e, true);
    return;
  }
  e.kbx *= Math.pow(0.002, dt); e.kby *= Math.pow(0.002, dt);
  let vx = e.vx + e.kbx, vy = e.vy + e.kby;
  if (Math.abs(vx) + Math.abs(vy) > 0.1) {
    e.walk += dt * 10; if (Math.abs(vx) > 0.1 && Math.abs(e.kbx) < 0.5) e.dir = vx > 0 ? 1 : -1;
  } else e.walk = 0;
  let nx = e.x + vx * dt, ny = e.y + vy * dt;
  // Spieler: Auto-Bridge über dem Void
  if (e === S.player && S.void && Math.abs(e.kbx) + Math.abs(e.kby) < 1) {
    const lx = nx + Math.sign(vx) * 0.32, ly = ny + Math.sign(vy) * 0.32;
    if (!tileAt(lx, ly) && (vx || vy)) {
      e.bridgeCd -= dt;
      if (S.inv.sand > 0 && e.bridgeCd <= 0) { setTile(lx, ly, 2); S.inv.sand--; sfx.place(); e.bridgeCd = e.def.bridgeCd; }
      if (!tileAt(lx, ly)) {
        if (S.inv.sand <= 0 && !e.warnedSand) { e.warnedSand = true; caption('Keine Blöcke mehr!\nAb zum Dealer', -6); setTimeout(() => (e.warnedSand = false), 4000); }
        // Leon bleibt an der Kante stehen, Moritz läuft ohne Blöcke einfach weiter ins Void
        if (e.def.sneak || S.inv.sand > 0) { e.walk = 0; return; }
      }
    }
  }
  // Wände und Betten blockieren (mit Gleiten entlang der Wand)
  const blocked = (x, y) => isWall(tileAt(x, y)) || (bedAt(x, y) && !bedAt(e.x, e.y));
  const r = 0.28;
  if (blocked(nx + Math.sign(vx) * r, e.y)) { nx = e.x; e.kbx = 0; }
  if (blocked(nx, ny + Math.sign(vy) * r)) { ny = e.y; e.kby = 0; }
  e.x = Math.max(0.3, Math.min(MW - 0.3, nx)); e.y = Math.max(0.3, Math.min(MH - 0.3, ny));
  if (!tileAt(e.x, e.y)) { e.fallT = 0.001; if (e === S.player || Math.random() < 0.5) sfx.fall(); }
}

// ---------- Ende ----------
function endGame(win) {
  if (S.over) return;
  S.over = true;
  if (win) { sfx.win(); best.wins++; } else beep(200, 0.8, 'sawtooth', 0.08, -150);
  best.kills = Math.max(best.kills, S.kills);
  localStorage.setItem('exe_best', JSON.stringify(best));
  episode++; localStorage.setItem('exe_episode', episode);
  const me = CHARS[selectedChar];
  setTimeout(() => {
    $('overTitle').textContent = win ? 'GG!!!' : 'FAIL!!!';
    $('overSub').textContent = win
      ? `Gehusstled! Vom Meister? Ja, diesmal ${me.name}!`
      : ['Schade ' + me.name + ',\nnächstes Mal dir :)', 'Vom Meister?\nNein sry, wieder nicht ' + me.name, 'Die Folge war eher\nungehusstled als gehusstled.'][(Math.random() * 3) | 0];
    $('overStats').innerHTML = `
      Map: <b>${S.mapDef.name}</b><br>
      Kills: <b>${S.kills}</b> · Tode: <b>${S.deaths}</b><br>
      Betten zerstört: <b>${S.bedsBroken}/${S.enemyTeams.length}</b><br>
      Ins Void gefallen: <b>${S.fallsP}×</b> · Alles verloren: <b>${S.lost}×</b><br>
      Gold gesnackt von ${S.partner.name}: <b>${S.goldSnacked}</b><br>
      Käse gegessen: <b>${S.cheese}</b> · Äpfel gekauft: <b>${(S.applesBought || 0) * 64}</b><br>
      Zeit: <b>${Math.floor(S.t / 60)}:${String(Math.floor(S.t % 60)).padStart(2, '0')}</b><br>
      <span style="color:#ffd83a">Siege gesamt: ${best.wins} · Rekord-Kills: ${best.kills}</span>`;
    $('over').classList.remove('hidden');
  }, 1300);
}
$('again').addEventListener('click', () => (K ? startKick(selectedChar) : startGame(selectedChar)));
$('toMenu').addEventListener('click', () => { if (K) { exitKick(); return; } $('over').classList.add('hidden'); showMenu(); });

// ---------- Rendering ----------
let cam = { x: 0, y: 0 };
const clouds = Array.from({ length: 14 }, () => ({ x: Math.random() * MW * T, y: Math.random() * MH * T, w: 60 + Math.random() * 90, s: 4 + Math.random() * 8 }));

function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const grd = ctx.createLinearGradient(0, 0, 0, cv.height);
  if (S && !S.void) { grd.addColorStop(0, '#2f6b28'); grd.addColorStop(1, '#244f20'); }
  else { grd.addColorStop(0, '#7fb6ea'); grd.addColorStop(1, '#bfe0fb'); }
  ctx.fillStyle = grd; ctx.fillRect(0, 0, cv.width, cv.height);
  if (!S) return;
  const p = S.player;
  const tx = p.x * T, ty = p.y * T;
  cam.x += (tx - cam.x) * 0.15; cam.y += (ty - cam.y) * 0.15;
  const sc = DPR * zoom;
  let sx = 0, sy = 0; if (S.shake > 0) { sx = (Math.random() - 0.5) * 10 * S.shake; sy = (Math.random() - 0.5) * 10 * S.shake; }
  ctx.setTransform(sc, 0, 0, sc, Math.round(cv.width / 2 - cam.x * sc + sx), Math.round(cv.height / 2 - cam.y * sc + sy));
  ctx.imageSmoothingEnabled = false;
  if (S.void) {
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    for (const c of clouds) {
      c.x += c.s * 0.016; if (c.x > MW * T + 200) c.x = -200;
      ctx.fillRect(c.x, c.y, c.w, 16); ctx.fillRect(c.x + 14, c.y - 10, c.w * 0.6, 12);
    }
  }
  const vw = W / zoom / 2 + T * 2, vh = H / zoom / 2 + T * 3;
  const x0 = Math.max(0, Math.floor((cam.x - vw) / T)), x1 = Math.min(MW - 1, Math.ceil((cam.x + vw) / T));
  const y0 = Math.max(0, Math.floor((cam.y - vh) / T)), y1 = Math.min(MH - 1, Math.ceil((cam.y + vh) / T));
  // Inselseiten (Tiefe)
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const t = S.map[y * MW + x]; if (!t) continue;
    if (!tileAt(x, y + 1) && S.void) {
      ctx.fillStyle = t === 2 || t === 7 ? '#bda968' : t === 5 ? '#c3c38a' : t === 3 ? '#666' : '#7a5230';
      ctx.fillRect(x * T, (y + 1) * T, T, 12);
      ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(x * T, (y + 1) * T + 12, T, 8);
    }
  }
  // Böden
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const t = S.map[y * MW + x]; if (!t) continue;
    ctx.drawImage(tileTex[isWall(t) ? (t === 7 ? (S.under[y * MW + x] || 2) : t === 6 ? 4 : 1) : t], x * T, y * T, T, T);
  }
  // Border-Linie
  if (S.border) {
    ctx.strokeStyle = 'rgba(255,60,60,.8)'; ctx.lineWidth = 4; ctx.setLineDash([12, 8]);
    ctx.beginPath(); ctx.arc((S.C + 0.5) * T, (S.C + 0.5) * T, Math.max(0.1, S.border.r) * T, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
  }
  // Generator-Plattformen
  for (const g of S.gens) {
    if (g.kind === 'iron' || !tileAt(g.x, g.y)) continue;
    ctx.fillStyle = g.kind === 'bronze' ? '#8a5a2b' : '#c9a227';
    ctx.fillRect(g.x * T - 10, g.y * T - 10, 20, 20);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(g.x * T - 6, g.y * T - 6, 12, 12);
  }
  // Betten
  for (const k in S.beds) {
    const b = S.beds[k]; if (!b.alive) continue;
    const bx = b.x * T + 3, by = b.y * T + 2;
    ctx.fillStyle = '#6b4a2a'; ctx.fillRect(bx - 1, by - 1, T - 4, T * 2 - 2);
    ctx.fillStyle = '#f2f2f2'; ctx.fillRect(bx + 1, by + 1, T - 8, 14);
    ctx.fillStyle = TEAMS[k].col; ctx.fillRect(bx + 1, by + 16, T - 8, T * 2 - 22);
    ctx.fillStyle = TEAMS[k].dark; ctx.fillRect(bx + 1, by + 16, T - 8, 3);
    const pct = Math.max(0, b.hp / b.max);
    ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(b.x * T - 4, b.y * T - 10, T + 8, 6);
    ctx.fillStyle = pct > 0.5 ? '#4ce04c' : pct > 0.25 ? '#ffd52e' : '#ff4040'; ctx.fillRect(b.x * T - 3, b.y * T - 9, (T + 6) * pct, 4);
  }
  // Items
  for (const it of S.items) {
    const bob = Math.sin(S.t * 4 + it.bob) * 2;
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(it.x * T - 4, it.y * T + 4, 8, 3);
    ctx.fillStyle = it.kind === 'bronze' ? '#c0773a' : it.kind === 'iron' ? '#e6e6e6' : '#ffd83a';
    ctx.fillRect(it.x * T - 5, it.y * T - 6 + bob, 10, 8);
    ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(it.x * T - 5, it.y * T - 6 + bob, 4, 2);
  }
  // Wände und Figuren zeilenweise (damit Figuren hinter Wänden verschwinden)
  const list = S.ents.filter(e => !e.dead).concat([{ villager: true, x: S.shopNpc.x, y: S.shopNpc.y }]).sort((a, b) => a.y - b.y);
  let li = 0;
  for (let y = y0; y <= y1; y++) {
    while (li < list.length && list[li].y < y + 0.5) { const e = list[li++]; e.villager ? drawVillager(e.x * T, e.y * T) : drawEnt(e); }
    for (let x = x0; x <= x1; x++) {
      const t = S.map[y * MW + x]; if (!isWall(t)) continue;
      drawWall(x, y, t);
    }
  }
  while (li < list.length) { const e = list[li++]; e.villager ? drawVillager(e.x * T, e.y * T) : drawEnt(e); }
  // Pfeile
  ctx.lineWidth = 2;
  for (const ar of S.arrows) { const L = Math.hypot(ar.vx, ar.vy); ctx.strokeStyle = ar.team === 'gruen' ? '#5a3a1a' : TEAMS[ar.team].dark; ctx.beginPath(); ctx.moveTo(ar.x * T, ar.y * T); ctx.lineTo((ar.x - ar.vx / L * 0.5) * T, (ar.y - ar.vy / L * 0.5) * T); ctx.stroke(); }
  // Bau-Vorschau
  if (input.build && !p.dead) {
    const bx = Math.floor(p.x + p.fx * 0.95), by = Math.floor(p.y + p.fy * 0.95);
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.strokeRect(bx * T + 1, by * T + 1, T - 2, T - 2);
  }
  // Partikel
  for (const q of S.parts) { ctx.fillStyle = q.col; ctx.fillRect(q.x * T, q.y * T, q.s, q.s); }
  ctx.textAlign = 'center'; ctx.font = 'bold 11px monospace';
  for (const f of S.floats) { ctx.globalAlpha = Math.min(1, f.t * 2); ctx.fillStyle = '#000'; ctx.fillText(f.text, f.x * T + 1, f.y * T + 1); ctx.fillStyle = f.col; ctx.fillText(f.text, f.x * T, f.y * T); }
  ctx.globalAlpha = 1;
  for (const e of list) if (e.bubble) drawBubble(e);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (S.shader) {
    const sg = ctx.createRadialGradient(cv.width / 2, cv.height / 2, cv.height * 0.15, cv.width / 2, cv.height / 2, cv.height * 0.75);
    sg.addColorStop(0, 'rgba(255,190,90,0.10)'); sg.addColorStop(1, 'rgba(60,20,0,0.55)');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, cv.width, cv.height);
  }
  drawArrows(sc);
}
function drawWall(x, y, t) {
  const h = 14, px = x * T, py = y * T;
  if (t === 9) { // Baum
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(px + 12, py + 8, 8, T - 8);
    ctx.fillStyle = '#2f7a2a'; ctx.fillRect(px - 2, py - 18, T + 4, 28);
    ctx.fillStyle = '#3b8c33'; ctx.fillRect(px + 2, py - 22, T - 4, 10);
    return;
  }
  ctx.fillStyle = WALL_SIDE[t]; ctx.fillRect(px, py + T - h, T, h);
  ctx.drawImage(tileTex[t], px, py - h, T, T);
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(px, py + T - h, T, 2);
  const hp = wallHp[y * MW + x];
  if (hp !== undefined) { ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px + 6, py - h + 6); ctx.lineTo(px + 16, py - h + 16); ctx.lineTo(px + 12, py); ctx.stroke(); }
}

function drawEnt(e) {
  const x = e.x * T, y = e.y * T;
  let fallS = 1;
  if (e.fallT > 0) { fallS = Math.max(0.05, 1 - e.fallT * 1.1); }
  ctx.save();
  ctx.translate(x, y);
  if (e.fallT > 0) { ctx.translate(0, e.fallT * 30); ctx.rotate(e.fallT * 4); }
  ctx.scale(fallS * e.dir, fallS);
  if (!e.fallT) { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-9, -2, 18, 5); }
  const fr = e.walk > 0 ? (Math.floor(e.walk) % 4 === 1 ? 1 : Math.floor(e.walk) % 4 === 3 ? 2 : 0) : 0;
  const spr = e.sprites[fr];
  const ps = 2;
  ctx.drawImage(spr, -6 * ps, -21 * ps, 12 * ps, 21 * ps);
  // Rüstung
  if ((e === S.player && S.armor) || (e.kind === 'enemy' && e.armor)) { ctx.fillStyle = 'rgba(180,180,190,.55)'; ctx.fillRect(-4 * ps, -13 * ps, 8 * ps, 6 * ps); }
  if (e.hurtT > 0) { ctx.globalAlpha = 0.5; ctx.fillStyle = '#f00'; ctx.fillRect(-6 * ps, -21 * ps, 12 * ps, 21 * ps); ctx.globalAlpha = 1; }
  // Schwert oder Bogen
  const sw = e.swing > 0 ? (e.swing / 0.18) : 0;
  ctx.save();
  ctx.translate(11, -20);
  ctx.rotate(-0.6 + sw * 1.8);
  const lvl = e === S.player ? S.sword : e.kind === 'enemy' ? e.sword : 1;
  ctx.fillStyle = '#5a3a1a'; ctx.fillRect(-2, -1, 4, 7);
  ctx.fillStyle = '#333'; ctx.fillRect(-5, -3, 10, 3);
  ctx.fillStyle = SWORDS[lvl].col; ctx.fillRect(-2, -17, 4, 14);
  ctx.restore();
  if ((e === S.player && S.bow) || (e.kind === 'enemy' && e.bow)) { ctx.strokeStyle = '#7a4a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(-12, -20, 8, -1.2, 1.2); ctx.stroke(); }
  ctx.restore();
  if (e.fallT > 0) return;
  ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
  const label = e.name + (e.kind === 'enemy' && S.void && e.sand > 0 && !e.guard ? ` 🧱${e.sand}` : '');
  const w = ctx.measureText(label).width + 6;
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(x - w / 2, y - 56, w, 11);
  ctx.fillStyle = e.kind === 'hero' ? '#fff' : TEAMS[e.team].col; ctx.fillText(label, x, y - 47.5);
  if (e.hp < e.max) {
    ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(x - 12, y - 61, 24, 4);
    ctx.fillStyle = '#e33'; ctx.fillRect(x - 12, y - 61, 24 * Math.max(0, e.hp / e.max), 4);
  }
}
function drawVillager(x, y) {
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x - 9, y - 2, 18, 5);
  ctx.fillStyle = '#6b4a2a'; ctx.fillRect(x - 9, y - 26, 18, 26);
  ctx.fillStyle = '#4a321b'; ctx.fillRect(x - 9, y - 16, 18, 4);
  ctx.fillStyle = '#c99a72'; ctx.fillRect(x - 8, y - 42, 16, 16);
  ctx.fillStyle = '#b07f5a'; ctx.fillRect(x - 2, y - 34, 4, 9);
  ctx.fillStyle = '#2e7d32'; ctx.fillRect(x - 6, y - 37, 3, 2); ctx.fillRect(x + 3, y - 37, 3, 2);
  ctx.fillStyle = '#4a321b'; ctx.fillRect(x - 8, y - 40, 16, 2);
  ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(x - 22, y - 56, 44, 11);
  ctx.fillStyle = '#ffd83a'; ctx.fillText('DEALER', x, y - 47.5);
}
function drawBubble(e) {
  const x = e.x * T, y = e.y * T - 66;
  ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
  const words = e.bubble.split(' '); const lines = []; let cur = '';
  for (const w of words) { if ((cur + ' ' + w).trim().length > 18) { lines.push(cur.trim()); cur = w; } else cur += ' ' + w; }
  lines.push(cur.trim());
  const bw = Math.max(...lines.map(l => ctx.measureText(l).width)) + 10, bh = lines.length * 12 + 6;
  const vl = cam.x - W / zoom / 2 + 4, vr = cam.x + W / zoom / 2 - 4;
  const bx = Math.max(vl + bw / 2, Math.min(vr - bw / 2, x));
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#222'; ctx.lineWidth = 2;
  ctx.fillRect(bx - bw / 2, y - bh, bw, bh); ctx.strokeRect(bx - bw / 2, y - bh, bw, bh);
  ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x, y + 6); ctx.lineTo(x + 4, y); ctx.fill();
  ctx.fillStyle = '#222';
  lines.forEach((l, i) => ctx.fillText(l, bx, y - bh + 14 + i * 12));
}
function drawArrows(sc) {
  const p = S.player;
  const targets = [];
  if (S.beds.gruen.alive && dist(p, S.beds.gruen) > 9) targets.push({ x: S.beds.gruen.x + 0.5, y: S.beds.gruen.y + 1, col: TEAMS.gruen.col });
  for (const k of S.enemyTeams) { const b = S.beds[k]; if (b.alive) targets.push({ x: b.x + 0.5, y: b.y + 1, col: TEAMS[k].col }); }
  for (const t of targets) {
    const dx = (t.x - p.x) * T * sc, dy = (t.y - p.y) * T * sc;
    const cx = cv.width / 2, cy = cv.height / 2;
    if (Math.abs(dx) < cx * 0.85 && Math.abs(dy) < cy * 0.8) continue;
    const a = Math.atan2(dy, dx);
    const r = Math.min(cx * 0.82 / Math.abs(Math.cos(a) || 1e-3), cy * 0.6 / Math.abs(Math.sin(a) || 1e-3));
    const ax = cx + Math.cos(a) * r, ay = cy + Math.sin(a) * r;
    ctx.save(); ctx.translate(ax, ay); ctx.rotate(a);
    ctx.fillStyle = t.col; ctx.strokeStyle = '#000'; ctx.lineWidth = 2 * DPR;
    ctx.beginPath(); ctx.moveTo(14 * DPR, 0); ctx.lineTo(-8 * DPR, -9 * DPR); ctx.lineTo(-8 * DPR, 9 * DPR); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#fff'; ctx.font = `bold ${10 * DPR}px monospace`; ctx.textAlign = 'center';
    ctx.fillText('🛏', ax, ay - 14 * DPR);
  }
}

// ---------- Menü ----------
function renderMaps() {
  const box = $('maps'); box.innerHTML = '';
  for (const id of MAP_ORDER) {
    const m = MAPS[id];
    const d = document.createElement('div'); d.className = 'mapCard' + (id === selectedMap ? ' sel' : '');
    d.innerHTML = `<div class="mn">${m.name}</div><div class="me">${m.ep}</div><div class="md">${m.desc}</div>`;
    d.addEventListener('click', () => { selectedMap = id; localStorage.setItem('exe_map', id); renderMaps(); });
    box.appendChild(d);
  }
}
function showMenu() {
  S = null; K = null;
  $('hud').classList.add('hidden'); $('menu').classList.remove('hidden');
  $('episode').textContent = '#' + episode;
  $('tip').textContent = TIPS[(Math.random() * TIPS.length) | 0];
  $('hs').textContent = best.wins || best.kills ? `Siege: ${best.wins} · Rekord-Kills: ${best.kills}` : '';
  renderMaps();
  const box = $('chars'); box.innerHTML = '';
  for (const k of ['leon', 'moritz']) {
    const c = CHARS[k];
    const d = document.createElement('div'); d.className = 'char';
    const pv = document.createElement('canvas'); pv.width = 12; pv.height = 21;
    pv.getContext('2d').drawImage(makeSprite(SKINS[c.skin], 0), 0, 0);
    d.appendChild(pv);
    d.insertAdjacentHTML('beforeend', `<div class="n">${c.name}</div><div class="ign">${c.ign}</div><div class="perk">${c.perk}</div>`);
    d.addEventListener('click', () => { initAudio(); startGame(k); });
    box.appendChild(d);
  }
}
function showBios() {
  const box = $('bioList'); box.innerHTML = '';
  for (const k of ['moritz', 'leon']) {
    const c = CHARS[k]; const d = document.createElement('div'); d.className = 'bio';
    const pv = document.createElement('canvas'); pv.width = 12; pv.height = 21;
    pv.getContext('2d').drawImage(makeSprite(SKINS[c.skin], 0), 0, 0);
    d.appendChild(pv);
    d.insertAdjacentHTML('beforeend', `<div><h3>${c.name}</h3><div class="ign">Ingame: ${c.ign}</div><ul>${BIOS[k].map(x => `<li>${x}</li>`).join('')}</ul></div>`);
    box.appendChild(d);
  }
  $('bios').classList.remove('hidden');
}
$('bBios').addEventListener('click', showBios);
document.querySelectorAll('.kickBtn').forEach(b => b.addEventListener('click', () => { initAudio(); startKick(b.dataset.char); }));
$('kickExit').addEventListener('click', () => exitKick());
$('biosClose').addEventListener('click', () => $('bios').classList.add('hidden'));
function initAudio() { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); AC.resume(); } catch (e) { } }
$('intro').addEventListener('click', () => { initAudio(); $('intro').classList.add('hidden'); showMenu(); });

// ---------- Loop ----------
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (K) { if (!K.done) kickUpdate(dt); kickRender(); }
  else { if (S && $('shop').classList.contains('hidden')) update(dt); render(); }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// Debug-Hook für Tests

