'use strict';
/* Maps für exePlays: Ungehusstled.
   Jede Map hat eigene Regeln, nicht nur ein anderes Layout.
   Kacheln: 0 Void, 1 Gras, 2 Sandstein, 3 Stein, 4 Holzboden, 5 Endstein,
            6 Holzwand (Haus), 7 gesetzte Mauer, 8 Kiesweg, 9 Baum */

const MAP_W = 45, MAP_H = 45;

function mapTools() {
  const m = new Uint8Array(MAP_W * MAP_H);
  const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < MAP_W && y < MAP_H) m[y * MAP_W + x] = v; };
  const get = (x, y) => (x >= 0 && y >= 0 && x < MAP_W && y < MAP_H ? m[y * MAP_W + x] : 0);
  const island = (cx, cy, r, v = 1) => {
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++)
      if (Math.abs(x) + Math.abs(y) * 0.9 <= r + 0.6 || (Math.abs(x) < r && Math.abs(y) < r)) set(cx + x, cy + y, v);
  };
  const rect = (x0, y0, x1, y1, v) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, v); };
  return { m, set, get, island, rect };
}
function rng(seed) { return () => ((seed = (seed * 9301 + 49297) % 233280) / 233280); }

const MAPS = {
  // ---------------------------------------------------------------- Klassik
  klassik: {
    name: 'Klassik 4x4', ep: 'Bedwars #1',
    desc: 'Fünf Inseln im Void, Gold in der Mitte. Brücken bauen, Gegner runterhauen, alle vier Betten zerstören.',
    build() {
      const { m, set, island } = mapTools();
      const C = (MAP_W / 2) | 0;
      island(C, C + 15, 3); island(C, C - 15, 3); island(C - 15, C, 3); island(C + 15, C, 3);
      island(C, C, 3, 3);
      set(C, C, 4); set(C - 1, C, 4); set(C + 1, C, 4); set(C, C - 1, 4); set(C, C + 1, 4);
      island(C + 11, C - 11, 2);
      return {
        map: m, C, void: true,
        enemyTeams: ['rot', 'blau', 'gelb', 'lila'],
        beds: { gruen: [C, C + 16, 60], rot: [C, C - 16, 70], blau: [C - 16, C, 70], gelb: [C + 16, C, 70], lila: [C + 12, C - 12, 70] },
        spawn: [C + 0.5, C + 14.5], shop: [C - 2.5, C + 14.5],
        gens: [[C + 2.5, C + 16.5, 'bronze', 1.1, 16], [C + 2.5, C + 16.5, 'iron', 6.5, 12], [C + 2.5, C + 16.5, 'gold', 22, 6], [C + 0.5, C + 0.5, 'gold', 7, 8]],
        ai: { strength: 1, roster: 2, maxRoster: 3, bowAfter: 150 },
      };
    },
  },
  // ---------------------------------------------------------------- 2er Runde
  duell: {
    name: '2er Runde', ep: 'Bedwars #8',
    desc: 'Duell gegen ein einziges, starkes Team. Drei schmale Brücken, Bogenschützen von Anfang an. Ein Treffer und du fliegst.',
    build() {
      const { m, set, island, rect } = mapTools();
      const C = (MAP_W / 2) | 0;
      island(C, C + 14, 3); island(C, C - 14, 3);
      island(C, C, 2, 3); set(C, C, 5);
      // drei 1-Block-Brücken
      rect(C, C - 11, C, C + 11, 2);
      rect(C - 7, C - 10, C - 7, C + 10, 2); rect(C + 7, C - 10, C + 7, C + 10, 2);
      rect(C - 7, C + 10, C - 1, C + 10, 2); rect(C + 1, C + 10, C + 7, C + 10, 2);
      rect(C - 7, C - 10, C - 1, C - 10, 2); rect(C + 1, C - 10, C + 7, C - 10, 2);
      island(C - 7, C, 1, 3); island(C + 7, C, 1, 3);
      return {
        map: m, C, void: true,
        enemyTeams: ['rot'],
        beds: { gruen: [C, C + 15, 80], rot: [C, C - 16, 90] },
        spawn: [C + 0.5, C + 13.5], shop: [C - 2.5, C + 14.5],
        gens: [[C + 2.5, C + 15.5, 'bronze', 0.9, 16], [C + 2.5, C + 15.5, 'iron', 5, 12], [C - 6.5, C + 0.5, 'iron', 4, 6], [C + 7.5, C + 0.5, 'iron', 4, 6], [C + 0.5, C + 0.5, 'gold', 5, 8]],
        ai: { strength: 1.15, roster: 2, maxRoster: 4, bowAfter: 0 },
      };
    },
  },
  // ---------------------------------------------------------------- Loldorf
  loldorf: {
    name: 'Das Loldorf', ep: 'Minecraft Leben #4',
    desc: 'Kein Void! Jedes Team wohnt in einem Haus. Mauern vor die Tür bauen, Gegner reißen sie ein. Wo ist mein Haus??',
    build() {
      const { m, set, get, rect } = mapTools();
      const C = (MAP_W / 2) | 0;
      rect(0, 0, MAP_W - 1, MAP_H - 1, 1);
      rect(C - 1, 1, C + 1, MAP_H - 2, 8); rect(1, C - 1, MAP_W - 2, C + 1, 8);
      rect(C - 3, C - 3, C + 3, C + 3, 3);            // Marktplatz
      const house = (x0, y0, x1, y1, door) => {
        rect(x0, y0, x1, y1, 6); rect(x0 + 1, y0 + 1, x1 - 1, y1 - 1, 4);
        const cx = (x0 + x1) >> 1, cy = (y0 + y1) >> 1;
        if (door === 'top') rect(cx - 1, y0, cx + 1, y0, 4);
        if (door === 'bottom') rect(cx - 1, y1, cx + 1, y1, 4);
        if (door === 'left') rect(x0, cy - 1, x0, cy + 1, 4);
        if (door === 'right') rect(x1, cy - 1, x1, cy + 1, 4);
      };
      house(C - 5, C + 11, C + 5, C + 19, 'top');      // Grün
      house(C - 5, C - 19, C + 5, C - 11, 'bottom');   // Rot
      house(C - 19, C - 5, C - 11, C + 5, 'right');    // Blau
      house(C + 11, C - 5, C + 19, C + 5, 'left');     // Gelb
      // Bäume, Ränder
      for (let i = 0; i < MAP_W; i++) { set(i, 0, 9); set(i, MAP_H - 1, 9); set(0, i, 9); set(MAP_W - 1, i, 9); }
      const r = rng(1337);
      for (let n = 0; n < 70; n++) {
        const x = 2 + ((r() * (MAP_W - 4)) | 0), y = 2 + ((r() * (MAP_H - 4)) | 0);
        let ok = true;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (get(x + dx, y + dy) !== 1) ok = false;
        if (ok) set(x, y, 9);
      }
      return {
        map: m, C, void: false,
        enemyTeams: ['rot', 'blau', 'gelb'],
        beds: { gruen: [C, C + 16, 60], rot: [C, C - 17, 70], blau: [C - 17, C - 1, 70], gelb: [C + 16, C - 1, 70] },
        spawn: [C + 0.5, C + 13.5], shop: [C - 3.5, C + 13.5],
        gens: [[C + 3.5, C + 17.5, 'bronze', 1.0, 16], [C + 3.5, C + 17.5, 'iron', 6, 12], [C + 3.5, C + 17.5, 'gold', 20, 6], [C + 0.5, C + 0.5, 'gold', 6, 8]],
        ai: { strength: 1.1, roster: 2, maxRoster: 4, bowAfter: 180 },
      };
    },
  },
  // ---------------------------------------------------------------- Border
  border: {
    name: 'Border', ep: 'Special',
    desc: 'Eine riesige Insel mit fünf Teams. Die Weltgrenze frisst alles von außen nach innen, auch Betten. Am Ende zählt nur die Mitte.',
    build() {
      const { m, set } = mapTools();
      const C = (MAP_W / 2) | 0;
      const r = rng(4242);
      for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
        const d = Math.hypot(x - C, y - C);
        if (d <= 20.5) set(x, y, r() < 0.18 ? 3 : 1);
      }
      for (let y = C - 2; y <= C + 2; y++) for (let x = C - 2; x <= C + 2; x++) set(x, y, 5);
      const beds = { gruen: [C, C + 12, 60] };
      const teams = ['rot', 'blau', 'gelb', 'lila'];
      teams.forEach((k, i) => {
        const a = Math.PI / 2 + (i + 1) * (Math.PI * 2 / 5);
        beds[k] = [Math.round(C + Math.cos(a) * 12.5), Math.round(C + Math.sin(a) * 12.5) - 1, 60];
      });
      return {
        map: m, C, void: true,
        enemyTeams: teams,
        beds,
        spawn: [C + 0.5, C + 10.5], shop: [C - 2.5, C + 10.5],
        gens: [[C + 2.5, C + 12.5, 'bronze', 1.0, 16], [C + 2.5, C + 12.5, 'iron', 5.5, 12], [C + 0.5, C + 0.5, 'gold', 5, 10], [C + 0.5, C + 0.5, 'iron', 3, 10]],
        border: { r0: 21, r1: 3.5, start: 40, dur: 420 },
        ai: { strength: 1, roster: 2, maxRoster: 3, bowAfter: 120 },
      };
    },
  },
};
const MAP_ORDER = ['klassik', 'duell', 'loldorf', 'border'];
