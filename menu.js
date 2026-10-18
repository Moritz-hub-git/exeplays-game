'use strict';
/* Menü: Spielmodus-Auswahl und Map-Slider mit drehender 3D-Vorschau (isometrisch) */

const PV = { cv: null, ctx: null, angle: 0.6, setup: null, key: '', slide: 0, slideDir: 0, acc: 0 };
const TOP_COL = {}, SIDE_COL = {};
for (const k in TILECOL) { TOP_COL[k] = TILECOL[k][0]; SIDE_COL[k] = shade(TILECOL[k][0], -0.35); }
TOP_COL[6] = '#8a6236'; TOP_COL[7] = '#efe0ad'; TOP_COL[9] = '#3b8c33'; TOP_COL[14] = '#3f8f37'; TOP_COL[15] = '#3b9c33';
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(v + v * f))));
  return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
}
const WALL_H = { 6: 2.2, 7: 1.4, 9: 3, 14: 2.4, 15: 3.2 };

function previewSetup() {
  const key = selectedMap + '|' + selectedMode;
  if (PV.key !== key) { PV.key = key; PV.setup = buildSetup(selectedMap, selectedMode); }
  return PV.setup;
}
function renderPreview() {
  const cv = PV.cv; if (!cv) return;
  const ctx = PV.ctx, G = previewSetup();
  const w = cv.width, h = cv.height, dpr = cv.width / cv.clientWidth || 1;
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, G.def.theme.bg[0]); bg.addColorStop(1, G.def.theme.bg[1]);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  const s = Math.min(w / 58, h / 34), ox = w / 2 + PV.slide * w, oy = h * 0.46;
  const ca = Math.cos(PV.angle), sa = Math.sin(PV.angle), C = G.C + 0.5;
  const proj = (x, y, z) => { const dx = x - C, dy = y - C, rx = dx * ca - dy * sa, ry = dx * sa + dy * ca; return [ox + (rx - ry) * s, oy + (rx + ry) * s * 0.5 - z * s]; };
  // Kacheln nach Tiefe sortiert zeichnen (Maler-Algorithmus)
  const cells = [];
  for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
    const t = G.map[y * MAP_W + x]; if (!t) continue;
    const cx = x + 0.5 - C, cy = y + 0.5 - C;
    cells.push([(cx * ca - cy * sa) + (cx * sa + cy * ca), x, y, t]);
  }
  cells.sort((a, b) => a[0] - b[0]);
  const bedCells = {};
  for (const k in G.beds) { const b = G.beds[k]; bedCells[b.y * MAP_W + b.x] = k; bedCells[(b.y + 1) * MAP_W + b.x] = k; }
  const quad = (x, y, z, col) => {
    const a = proj(x, y, z), b = proj(x + 1, y, z), c = proj(x + 1, y + 1, z), d = proj(x, y + 1, z);
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath(); ctx.fill();
  };
  const thick = G.void ? 1.2 : 0.4;
  for (const [, x, y, t] of cells) {
    const top = TOP_COL[t] || '#888', side = SIDE_COL[t] || shade(top, -0.35);
    const hgt = WALL_H[t] || 0;
    // Seiten: von unten nach oben gestapelte Flächen
    for (let z = -thick; z < hgt; z += 0.45) quad(x, y, z, side);
    const team = bedCells[y * MAP_W + x];
    quad(x, y, hgt, team ? TEAMS[team].col : top);
    if (t === 11) { ctx.globalAlpha = 0.25 + 0.2 * Math.sin(performance.now() / 300 + x + y); quad(x, y, 0.01, '#ffe080'); ctx.globalAlpha = 1; }
  }
  // Betten mit Fähnchen
  for (const k in G.beds) {
    const b = G.beds[k], [px, py] = proj(b.x + 0.5, b.y + 1, 0.4);
    ctx.fillStyle = '#222'; ctx.fillRect(px - 1, py - 7 * dpr, 2, 7 * dpr);
    ctx.fillStyle = TEAMS[k].col; ctx.fillRect(px + 1, py - 7 * dpr, 6 * dpr, 4 * dpr);
  }
  // Gold in der Mitte
  for (const [gx, gy, kind] of G.gens) {
    const [px, py] = proj(gx, gy, 0.6 + Math.sin(performance.now() / 400) * 0.2);
    ctx.fillStyle = kind === 'gold' ? '#ffd83a' : '#e6e6e6'; ctx.fillRect(px - 2 * dpr, py - 2 * dpr, 4 * dpr, 4 * dpr);
  }
  // Border-Ring
  if (G.border) {
    ctx.strokeStyle = 'rgba(255,60,60,.9)'; ctx.lineWidth = 2 * dpr; ctx.setLineDash([6 * dpr, 4 * dpr]); ctx.beginPath();
    for (let i = 0; i <= 48; i++) { const a = i / 48 * Math.PI * 2; const [px, py] = proj(C + Math.cos(a) * G.border.r0, C + Math.sin(a) * G.border.r0, 0); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.stroke(); ctx.setLineDash([]);
  }
}
function previewTick(dt) {
  // Menü-Hintergrund bleibt das Canvas des Spiels: einfach Himmel zeichnen
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  PV.angle += dt * 0.22;
  if (PV.slideDir) {
    PV.slide += PV.slideDir * dt * 5;
    if (Math.abs(PV.slide) >= 1) { // Wechsel: neue Map kommt von der anderen Seite
      const i = MAP_ORDER.indexOf(selectedMap), n = MAP_ORDER.length;
      selectedMap = MAP_ORDER[(i + (PV.slideDir < 0 ? 1 : -1) + n) % n];
      localStorage.setItem('exe_map', selectedMap);
      PV.slide = -PV.slideDir * 1; PV.slideDir = 0; PV.returning = true;
      updateMapInfo();
    }
  } else if (PV.returning) {
    PV.slide *= Math.pow(0.0005, dt);
    if (Math.abs(PV.slide) < 0.002) { PV.slide = 0; PV.returning = false; }
  }
  PV.acc += dt;
  if (PV.acc < 1 / 30) return;
  PV.acc = 0;
  renderPreview();
}
function slideMap(dir) { if (PV.slideDir || PV.returning) return; PV.slideDir = -dir; beep(500 + dir * 60, 0.05, 'triangle', 0.04); }
function updateMapInfo() {
  const m = MAPS[selectedMap];
  $('mapName').textContent = m.name; $('mapEp').textContent = m.ep === 'neu' ? 'Neue Map' : 'aus ' + m.ep; $('mapDesc').textContent = m.desc;
  $('mapDots').innerHTML = MAP_ORDER.map(id => `<i class="${id === selectedMap ? 'on' : ''}"></i>`).join('');
}
function renderMenuSelect() {
  const box = $('modes'); box.innerHTML = '';
  for (const id of MODE_ORDER) {
    const m = MODES[id];
    const b = document.createElement('button'); b.className = 'modeChip' + (id === selectedMode ? ' on' : '');
    b.innerHTML = `<span>${m.ico}</span>${m.name}`;
    b.addEventListener('click', () => { selectedMode = id; localStorage.setItem('exe_mode', id); renderMenuSelect(); beep(700, 0.04, 'triangle', 0.04); });
    box.appendChild(b);
  }
  $('modeDesc').textContent = MODES[selectedMode].desc;
  updateMapInfo();
  // Canvas-Größe an die Breite anpassen
  const cv = PV.cv = $('mapCanvas'); PV.ctx = cv.getContext('2d');
  const r = cv.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.round((r.width || 300) * dpr); cv.height = Math.round((r.height || 190) * dpr);
  renderPreview();
}
$('mapPrevBtn').addEventListener('click', () => slideMap(-1));
$('mapNextBtn').addEventListener('click', () => slideMap(1));
// Wischen auf der Vorschau
(() => {
  let sx = null;
  const el = $('mapStage');
  el.addEventListener('pointerdown', e => { sx = e.clientX; });
  el.addEventListener('pointerup', e => { if (sx === null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 35) slideMap(dx < 0 ? 1 : -1); });
  el.addEventListener('pointercancel', () => (sx = null));
})();
window.addEventListener('resize', () => { if (!$('menu').classList.contains('hidden')) renderMenuSelect(); });
