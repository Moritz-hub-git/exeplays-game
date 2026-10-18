'use strict';
/* Maps und Spielmodi für exePlays: Ungehusstled.
   Jede Map lässt sich mit jedem Modus kombinieren.
   Kacheln: 0 Void, 1 Gras, 2 Sand(stein), 3 Stein, 4 Holzboden, 5 Endstein, 6 Holzwand, 7 gesetzte Mauer,
            8 Kiesweg, 9 Baum, 10 Wasser (bremst), 11 Lava (brennt), 12 Käse, 13 Netherrack, 14 Hecke, 15 Palme */

const MAP_W = 45, MAP_H = 45;

function mapTools() {
  const m = new Uint8Array(MAP_W * MAP_H);
  const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < MAP_W && y < MAP_H) m[y * MAP_W + x] = v; };
  const get = (x, y) => (x >= 0 && y >= 0 && x < MAP_W && y < MAP_H ? m[y * MAP_W + x] : 0);
  const island = (cx, cy, r, v = 1) => {
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++)
      if (Math.abs(x) + Math.abs(y) * 0.9 <= r + 0.6 || (Math.abs(x) < r && Math.abs(y) < r)) set(cx + x, cy + y, v);
  };
  const disc = (cx, cy, r, v) => { for (let y = -Math.ceil(r); y <= r; y++) for (let x = -Math.ceil(r); x <= r; x++) if (x * x + y * y <= r * r) set(cx + x, cy + y, v); };
  const rect = (x0, y0, x1, y1, v) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, v); };
  // 4-zusammenhängende Linie (begehbar ohne Ecken-Lücken)
  const line = (x0, y0, x1, y1, v, w = 1) => {
    let x = x0, y = y0; const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = Math.sign(x1 - x0), sy = Math.sign(y1 - y0);
    let err = dx - dy;
    const put = (px, py) => { for (let a = 0; a < w; a++) for (let b = 0; b < w; b++) set(px + a - (w >> 1), py + b - (w >> 1), v); };
    put(x, y);
    while (x !== x1 || y !== y1) {
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; put(x, y); }
      if (e2 < dx && (x !== x1 || y !== y1)) { err += dx; y += sy; put(x, y); }
    }
  };
  return { m, set, get, island, disc, rect, line };
}
function rng(seed) { return () => ((seed = (seed * 9301 + 49297) % 233280) / 233280); }
const C0 = (MAP_W / 2) | 0;
// fünf Basen im Fünfeck, Grün unten
function pentagon(r) { return ['gruen', 'rot', 'blau', 'gelb', 'lila'].map((k, i) => { const a = Math.PI / 2 + i * Math.PI * 2 / 5; return [k, Math.round(C0 + Math.cos(a) * r), Math.round(C0 + Math.sin(a) * r)]; }); }

const MAPS = {
  // ------------------------------------------------------------ Inselwelt
  insel: {
    name: 'Inselwelt', ep: 'Bedwars #1', theme: { bg: ['#7fb6ea', '#bfe0fb'], clouds: true },
    desc: 'Der Klassiker: Inseln im Void, Gold in der Mitte. Brücken bauen, Gegner runterhauen.',
    build() {
      const { m, set, island } = mapTools(); const C = C0;
      island(C, C + 15, 3); island(C, C - 15, 3); island(C - 15, C, 3); island(C + 15, C, 3); island(C + 11, C - 11, 2);
      island(C, C, 3, 3); set(C, C, 4); set(C - 1, C, 4); set(C + 1, C, 4); set(C, C - 1, 4); set(C, C + 1, 4);
      return { map: m, C, void: true, beds: { gruen: [C, C + 16], rot: [C, C - 16], blau: [C - 16, C], gelb: [C + 16, C], lila: [C + 12, C - 12] },
        gens: [[C + 0.5, C + 0.5, 'gold', 7, 8]] };
    },
  },
  // ------------------------------------------------------------ Brückenstern
  stern: {
    name: 'Brückenstern', ep: 'Bedwars #8', theme: { bg: ['#f3a37a', '#ffd9a8'], clouds: true },
    desc: 'Fünf Inseln, verbunden nur durch 1-Block-Brücken zur Mitte und zum Nachbarn. Ein Treffer und du fliegst.',
    build() {
      const { m, set, island, line } = mapTools(); const C = C0;
      const P = pentagon(15);
      island(C, C, 2, 3); set(C, C, 5);
      P.forEach(([, x, y], i) => { island(x, y, 3); line(x, y, C, C, 2); const [, nx, ny] = P[(i + 1) % 5]; line(x, y, nx, ny, 2); });
      const beds = {}; P.forEach(([k, x, y]) => (beds[k] = [x, y - 1]));
      return { map: m, C, void: true, beds, gens: [[C + 0.5, C + 0.5, 'gold', 8, 6]] };
    },
  },
  // ------------------------------------------------------------ Loldorf
  dorf: {
    name: 'Das Loldorf', ep: 'Minecraft Leben #4', theme: { bg: ['#2f6b28', '#244f20'], clouds: false },
    desc: 'Kein Void! Jedes Team wohnt in einem Haus. Mauern vor die Tür bauen, Gegner reißen sie ein. Wo ist mein Haus??',
    build() {
      const { m, set, get, rect } = mapTools(); const C = C0;
      rect(0, 0, MAP_W - 1, MAP_H - 1, 1);
      rect(C - 1, 1, C + 1, MAP_H - 2, 8); rect(1, C - 1, MAP_W - 2, C + 1, 8);
      rect(C - 3, C - 3, C + 3, C + 3, 3);
      const house = (x0, y0, x1, y1, door) => {
        rect(x0, y0, x1, y1, 6); rect(x0 + 1, y0 + 1, x1 - 1, y1 - 1, 4);
        const cx = (x0 + x1) >> 1, cy = (y0 + y1) >> 1;
        if (door === 'top') rect(cx - 1, y0, cx + 1, y0, 4);
        if (door === 'bottom') rect(cx - 1, y1, cx + 1, y1, 4);
        if (door === 'left') rect(x0, cy - 1, x0, cy + 1, 4);
        if (door === 'right') rect(x1, cy - 1, x1, cy + 1, 4);
      };
      house(C - 5, C + 11, C + 5, C + 19, 'top'); house(C - 5, C - 19, C + 5, C - 11, 'bottom');
      house(C - 19, C - 5, C - 11, C + 5, 'right'); house(C + 11, C - 5, C + 19, C + 5, 'left');
      house(C + 10, C - 20, C + 19, C - 12, 'bottom');
      for (let i = 0; i < MAP_W; i++) { set(i, 0, 9); set(i, MAP_H - 1, 9); set(0, i, 9); set(MAP_W - 1, i, 9); }
      const r = rng(1337);
      for (let n = 0; n < 70; n++) {
        const x = 2 + ((r() * (MAP_W - 4)) | 0), y = 2 + ((r() * (MAP_H - 4)) | 0);
        let ok = true;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (get(x + dx, y + dy) !== 1) ok = false;
        if (ok) set(x, y, 9);
      }
      return { map: m, C, void: false, beds: { gruen: [C, C + 16], rot: [C, C - 17], blau: [C - 17, C - 1], gelb: [C + 16, C - 1], lila: [C + 15, C - 18] },
        gens: [[C + 0.5, C + 0.5, 'gold', 6, 8]] };
    },
  },
  // ------------------------------------------------------------ Riesen-Insel
  riesen: {
    name: 'Riesen-Insel', ep: 'Special', theme: { bg: ['#6fa8dc', '#cfe8ff'], clouds: true },
    desc: 'Eine einzige riesige Insel für alle. Kein Bridgen nötig, dafür überall Kämpfe.',
    build() {
      const { m, set, disc } = mapTools(); const C = C0; const r = rng(4242);
      for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) if (Math.hypot(x - C, y - C) <= 20.5) set(x, y, r() < 0.18 ? 3 : 1);
      disc(C, C, 2.5, 5);
      const beds = {}; pentagon(12.5).forEach(([k, x, y]) => (beds[k] = [x, y - 1]));
      return { map: m, C, void: true, beds, gens: [[C + 0.5, C + 0.5, 'gold', 5, 10], [C + 0.5, C + 0.5, 'iron', 3, 10]] };
    },
  },
  // ------------------------------------------------------------ TukTukIsland
  tuktuk: {
    name: 'TukTukIsland', ep: 'Bedwars #2', theme: { bg: ['#53c7e8', '#1b88b5'], clouds: true },
    desc: 'Tropische Sandinseln mit Palmen in einer Lagune. Durchs Wasser kommt man überall hin, aber nur langsam.',
    build() {
      const { m, set, get, disc } = mapTools(); const C = C0; const r = rng(777);
      disc(C, C, 19.5, 10);
      const P = pentagon(14);
      P.forEach(([, x, y]) => disc(x, y, 3.6, 2));
      disc(C, C, 2.6, 2);
      [[C - 8, C + 2], [C + 8, C + 2], [C, C - 9]].forEach(([x, y]) => disc(x, y, 1.6, 2));
      const beds = {}; P.forEach(([k, x, y]) => (beds[k] = [x, y - 1]));
      // Palmen am Rand der Inseln, nicht an den Basen
      for (let n = 0; n < 160; n++) {
        const x = 2 + ((r() * (MAP_W - 4)) | 0), y = 2 + ((r() * (MAP_H - 4)) | 0);
        if (get(x, y) !== 2) continue;
        let edge = false; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (get(x + dx, y + dy) === 10) edge = true;
        if (!edge || Object.values(beds).some(([bx, by]) => Math.hypot(bx - x, by - y) < 3.2) || Math.hypot(x - C, y - C) < 3) continue;
        set(x, y, 15);
      }
      return { map: m, C, void: true, beds, gens: [[C + 0.5, C + 0.5, 'gold', 7, 8], [C - 7.5, C + 2.5, 'iron', 5, 5], [C + 8.5, C + 2.5, 'iron', 5, 5]] };
    },
  },
  // ------------------------------------------------------------ Käse
  kaese: {
    name: 'Käse', ep: 'Blockgehustled #2', theme: { bg: ['#ffcf70', '#ff9f40'], clouds: true },
    desc: 'Ein riesiger Käse voller Löcher ins Void. Wer zu nah am Loch kämpft, ist ungehusstled.',
    build() {
      const { m, rect, disc } = mapTools(); const C = C0; const r = rng(9001);
      rect(4, 4, MAP_W - 5, MAP_H - 5, 12);
      const beds = { gruen: [C, C + 15], rot: [C, C - 16], blau: [C - 16, C - 1], gelb: [C + 15, C - 1], lila: [C + 13, C - 14] };
      const keep = [...Object.values(beds).map(([x, y]) => [x, y + 0.5]), [C, C]];
      let holes = 0;
      for (let n = 0; n < 400 && holes < 26; n++) {
        const x = 5 + r() * (MAP_W - 10), y = 5 + r() * (MAP_H - 10), rad = 1 + r() * 1.8;
        if (keep.some(([kx, ky]) => Math.hypot(kx - x, ky - y) < rad + 4.2)) continue;
        disc(Math.round(x), Math.round(y), rad, 0); holes++;
      }
      return { map: m, C, void: true, beds, gens: [[C + 0.5, C + 0.5, 'gold', 7, 8]] };
    },
  },
  // ------------------------------------------------------------ Netherfestung
  nether: {
    name: 'Netherfestung', ep: 'neu', theme: { bg: ['#4a0d0d', '#140303'], clouds: false, lava: true },
    desc: 'Lavaflüsse verbinden die Basen: der schnellste Weg, aber er brennt. Wer sicher will, baut Brücken über das Void.',
    build() {
      const { m, set, island, line } = mapTools(); const C = C0;
      const P = pentagon(15);
      P.forEach(([, x, y]) => line(x, y, C, C, 11, 3));
      island(C, C, 3, 13); set(C, C, 5);
      P.forEach(([, x, y]) => island(x, y, 3, 13));
      const beds = {}; P.forEach(([k, x, y]) => (beds[k] = [x, y - 1]));
      return { map: m, C, void: true, beds, gens: [[C + 0.5, C + 0.5, 'gold', 6, 8]] };
    },
  },
  // ------------------------------------------------------------ Heckenlabyrinth
  labyrinth: {
    name: 'Heckenlabyrinth', ep: 'neu', theme: { bg: ['#1f4d1c', '#173a15'], clouds: false },
    desc: 'Ein Irrgarten aus Hecken, kein Void. Wer den Weg nicht kennt, haut sich einfach durch die Hecke.',
    build() {
      const { m, set, rect, disc } = mapTools(); const C = C0; const r = rng(31337);
      rect(0, 0, MAP_W - 1, MAP_H - 1, 14);
      const N = 11, cell = 4; // 11x11 Zellen, Gänge 3 breit
      const seen = new Uint8Array(N * N), st = [[5, 5]]; seen[5 * N + 5] = 1;
      const open = (cx, cy) => rect(1 + cx * cell, 1 + cy * cell, cx * cell + 3, cy * cell + 3, 1);
      open(5, 5);
      while (st.length) {
        const [cx, cy] = st[st.length - 1];
        const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [cx + dx, cy + dy, dx, dy]).filter(([x, y]) => x >= 0 && y >= 0 && x < N && y < N && !seen[y * N + x]);
        if (!nb.length) { st.pop(); continue; }
        const [nx, ny, dx] = nb[(r() * nb.length) | 0];
        seen[ny * N + nx] = 1; open(nx, ny);
        if (dx) rect(1 + Math.min(cx, nx) * cell + 3, 1 + cy * cell, 1 + Math.min(cx, nx) * cell + 3, cy * cell + 3, 1);
        else rect(1 + cx * cell, 1 + Math.min(cy, ny) * cell + 3, cx * cell + 3, 1 + Math.min(cy, ny) * cell + 3, 1);
        st.push([nx, ny]);
      }
      // ein paar Durchbrüche extra, damit es Schleifen gibt
      for (let n = 0; n < 40; n++) { const x = 2 + ((r() * (MAP_W - 4)) | 0), y = 2 + ((r() * (MAP_H - 4)) | 0); if ((x % cell === 0) !== (y % cell === 0)) set(x, y, 1); }
      const beds = { gruen: [C, C + 16], rot: [C, C - 17], blau: [C - 17, C - 1], gelb: [C + 16, C - 1], lila: [C + 14, C - 15] };
      Object.values(beds).forEach(([x, y]) => disc(x, y + 1, 3.6, 1));
      disc(C, C, 3.6, 3);
      for (let i = 0; i < MAP_W; i++) { set(i, 0, 9); set(i, MAP_H - 1, 9); set(0, i, 9); set(MAP_W - 1, i, 9); }
      return { map: m, C, void: false, beds, gens: [[C + 0.5, C + 0.5, 'gold', 6, 8]] };
    },
  },
};
const MAP_ORDER = ['insel', 'stern', 'dorf', 'riesen', 'tuktuk', 'kaese', 'nether', 'labyrinth'];

const MODES = {
  klassik: { name: 'Klassik', ico: '🛏️', desc: 'Alle Teams der Map gegeneinander. Betten zerstören, wer übrig bleibt, gewinnt.',
    ai: { strength: 1, roster: 2, maxRoster: 3, bowAfter: 150 } },
  duell: { name: '2er Runde', ico: '⚔️', desc: 'Nur ein Gegner-Team (das am weitesten weg), dafür stark und mit Bögen ab Minute 1.',
    ai: { strength: 1.15, roster: 2, maxRoster: 4, bowAfter: 0 }, oneEnemy: true, bedHp: 1.3 },
  border: { name: 'Border', ico: '🔴', desc: 'Die Weltgrenze schrumpft und frisst die Map samt Betten. Am Ende zählt nur die Mitte.',
    ai: { strength: 1, roster: 2, maxRoster: 3, bowAfter: 120 }, border: true },
  rush: { name: 'Rush', ico: '⚡', desc: 'Generatoren doppelt so schnell, Betten halb so stabil, Gegner aggressiv. Kurz und heftig.',
    ai: { strength: 1, roster: 3, maxRoster: 4, bowAfter: 60 }, genMul: 0.5, bedHp: 0.6 },
};
const MODE_ORDER = ['klassik', 'duell', 'border', 'rush'];

// Map + Modus zu einem spielbaren Setup zusammenbauen (auch für die 3D-Vorschau)
function buildSetup(mapId, modeId) {
  const map = MAPS[mapId], mode = MODES[modeId], M = map.build();
  let enemyTeams = ['rot', 'blau', 'gelb', 'lila'].filter(k => M.beds[k]);
  if (mode.oneEnemy) {
    const [gx, gy] = M.beds.gruen;
    enemyTeams = [enemyTeams.sort((a, b) => Math.hypot(M.beds[b][0] - gx, M.beds[b][1] - gy) - Math.hypot(M.beds[a][0] - gx, M.beds[a][1] - gy))[0]];
  }
  const teams = ['gruen', ...enemyTeams];
  const beds = {};
  for (const k of teams) { const [x, y] = M.beds[k]; const base = k === 'gruen' ? 60 : 70; beds[k] = { x, y, hp: Math.round(base * (mode.bedHp || 1)) }; }
  let border = null;
  if (mode.border) {
    let r0 = 0; for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) if (M.map[y * MAP_W + x]) r0 = Math.max(r0, Math.hypot(x + 0.5 - M.C - 0.5, y + 0.5 - M.C - 0.5));
    border = { r0: Math.min(r0 + 0.5, 30), r1: 3.5, start: 40, dur: 420 };
  }
  return { ...M, def: map, mode, enemyTeams, teams, beds, border, genMul: mode.genMul || 1 };
}
