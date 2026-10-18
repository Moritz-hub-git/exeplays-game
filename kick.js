'use strict';
/* Bonus-Minispiel "AmTorVorbeigehustled": Elfmeterschießen per Wischen.
   Inspiriert von den exePlays-Folgen Super Smash Football und FIFA 15 ("FifaBugsgehustled"). */

let K = null;
const KICK_SHOTS = 10;
const kickBest = +(localStorage.getItem('exe_kick_best') || 0);

function startKick(charKey) {
  selectedChar = charKey;
  K = {
    t: 0, shots: 0, goals: 0, phase: 'aim', msgT: 0, swipe: null, ball: null,
    me: CHARS[charKey], keeperDef: CHARS[other(charKey)],
    keeper: { x: 0, vx: 0, dive: 0, diveDir: 0, target: null, react: 0, spin: 0 },
    bug: null, done: false, best: +(localStorage.getItem('exe_kick_best') || 0),
  };
  K.keeperSprites = spritesFor(K.keeperDef.skin, SKINS[K.keeperDef.skin]);
  K.meSprites = spritesFor(K.me.skin, SKINS[K.me.skin]);
  ['menu', 'over', 'intro'].forEach(id => $(id).classList.add('hidden'));
  $('hud').classList.add('hidden');
  $('kickExit').classList.remove('hidden');
  kickSay(`Du kriegst keinen rein, ${K.me.name}!`);
  caption('AmTorVorbeigehustled\nexePlays Originals', -5, 0.08, 0.42);
}
function kickSay(t, dur = 2.2) { K.say = t; K.sayT = dur; }

function kickGeom() {
  const gw = Math.min(W * 0.82, 340), gh = gw * 0.36;
  return { gw, gh, gx: W / 2 - gw / 2, gy: H * 0.2, line: H * 0.2 + gh, sx: W / 2, sy: H * 0.74 };
}

// Wisch-Eingabe
window.addEventListener('pointerdown', e => {
  if (!K || K.done || K.phase !== 'aim' || e.target.closest('button')) return;
  K.swipe = { x: e.clientX, y: e.clientY, t: performance.now() };
});
window.addEventListener('pointerup', e => {
  if (!K || !K.swipe || K.phase !== 'aim') return;
  const dx = e.clientX - K.swipe.x, dy = e.clientY - K.swipe.y, dt = Math.max(40, performance.now() - K.swipe.t);
  K.swipe = null;
  if (dy > -25) { kickSay('Nach OBEN wischen! 😂'); return; }
  shoot(dx, dy, dt);
});

function shoot(dx, dy, dtMs) {
  const g = kickGeom();
  const ratio = dx / -dy;                        // seitliche Richtung
  const speed = Math.hypot(dx, dy) / dtMs;       // px pro ms
  const tx = g.sx + ratio * (g.sy - g.line) * 1.05;
  const height = Math.max(0, (speed - 0.35) * 0.9);   // 0 = flach, >1 = drüber
  K.ball = { t: 0, x: g.sx, y: g.sy, tx, th: height, dur: 0.55 };
  K.phase = 'fly'; K.shots++;
  beep(150, 0.12, 'square', 0.08, -60);
  // Torwart
  const skill = 0.55 + Math.random() * 0.25;
  const err = (Math.random() - 0.5) * g.gw * 0.55 * (1 - skill + 0.35);
  // Torwart rät eine Ecke: in ~60 % der Fälle liegt er komplett falsch
  const guess = g.sx + (Math.random() < 0.5 ? -1 : 1) * g.gw * (0.15 + Math.random() * 0.25);
  K.keeper.target = Math.random() < 0.6 ? guess : tx + err;
  K.keeper.react = 0.14 + Math.random() * 0.16;
  // FIFA-Bug?
  K.bug = Math.random() < 0.13 ? (Math.random() < 0.5 ? 'orbit' : 'wall') : null;
}

function kickUpdate(dt) {
  K.t += dt;
  if (K.sayT > 0) K.sayT -= dt;
  const g = kickGeom(), kp = K.keeper;
  if (K.phase === 'aim') {
    kp.x = Math.sin(K.t * 1.6) * g.gw * 0.18; kp.dive = Math.max(0, kp.dive - dt * 3); kp.spin = 0;
  }
  if (K.phase === 'fly') {
    const b = K.ball; b.t += dt / b.dur;
    if (kp.react > 0) kp.react -= dt;
    else {
      const want = K.keeper.target - g.sx, d = want - kp.x;
      kp.x += Math.sign(d) * Math.min(Math.abs(d), dt * g.gw * 0.95);
      kp.dive = Math.min(1, kp.dive + dt * 4); kp.diveDir = Math.sign(d) || 1;
    }
    if (K.bug === 'orbit' && b.t > 0.3) { kp.spin += dt * 25; kp.x += dt * 600; }
    if (b.t >= 1) resolveShot();
  }
  if (K.phase === 'result') {
    K.msgT -= dt;
    if (K.ball && K.ball.out) { K.ball.x += K.ball.vx * dt; K.ball.y += K.ball.vy * dt; }
    if (K.msgT <= 0) {
      if (K.shots >= KICK_SHOTS) endKick();
      else { K.phase = 'aim'; K.ball = null; K.keeper.x = 0; K.keeper.dive = 0; K.keeper.spin = 0; }
    }
  }
}

function resolveShot() {
  const g = kickGeom(), b = K.ball, kp = K.keeper;
  const kx = g.sx + kp.x;
  const inside = b.tx > g.gx + 6 && b.tx < g.gx + g.gw - 6 && b.th < 1;
  const reachX = 18 + kp.dive * 22, reachH = 0.5 + kp.dive * 0.3;
  const saved = K.bug !== 'orbit' && Math.abs(b.tx - kx) < reachX && b.th < reachH;
  K.info = Math.round(b.tx - g.sx) + '/' + Math.round(kp.x) + '/' + b.th.toFixed(2);
  let res;
  if (K.bug === 'wall') {
    res = 'miss'; caption('FifaBugsgehustled!\nUnsichtbare Wand?!', -7, 0.1, 0.5);
    b.out = true; b.vx = (Math.random() - 0.5) * 200; b.vy = 500;
  } else if (!inside) {
    res = 'miss'; caption(b.th >= 1 ? 'Drüber!\nAm Tor vorbei-\ngehustled.' : 'Am Tor vorbei-\ngehustled.', -8, 0.1, 0.5);
    kickSay(['Daneben! 😂', 'Wie geht das?', 'Das war nix.'][(Math.random() * 3) | 0]);
  } else if (saved) {
    res = 'save'; beep(100, 0.2, 'sawtooth', 0.08, -40);
    caption('GEHALTEN!', -6, 0.15, 0.5);
    kickSay(['Mit der bloßen Faust!', 'Hab ich in der Hustlerschule gelernt.', 'Ehrenmann-Parade!'][(Math.random() * 3) | 0]);
  } else {
    res = 'goal'; K.goals++; sfx.win();
    if (K.bug === 'orbit') caption('FifaBugsgehustled!\nTorwart im Orbit', -6, 0.1, 0.5);
    else caption(['TOOOOR!', 'Einfach in\nden Winkel!', 'Super Smash\nFootball!'][(Math.random() * 3) | 0], -9, 0.12, 0.5);
    kickSay(['Wie geht das?', 'Einfach ein bisschen Glück haben.', 'Das geht nur um Glück!', 'Den hätte ich gehabt...'][(Math.random() * 4) | 0]);
  }
  K.last = res; K.phase = 'result'; K.msgT = 1.6;
}

function endKick() {
  K.done = true;
  const best = Math.max(K.goals, K.best); localStorage.setItem('exe_kick_best', best);
  const c = K.goals;
  $('overTitle').textContent = c >= 8 ? 'STRIKER AWARD!' : c >= 5 ? 'Solide!' : 'Vorbeigehustled';
  $('overSub').textContent = c >= 8 ? `${K.me.name} holt den Striker Award.\n${K.keeperDef.name}: "Das geht nur um Glück!"`
    : c >= 5 ? `Super Smash Football!\n${K.keeperDef.name} will Revanche.` : `${K.keeperDef.name} hält wie ein Ehrenmann.\nNächstes Mal dir :)`;
  $('overStats').innerHTML = `Tore: <b>${c}/${KICK_SHOTS}</b><br>Torwart: <b>${K.keeperDef.name}</b><br><span style="color:#ffd83a">Rekord: ${best}/${KICK_SHOTS}</span>`;
  $('kickExit').classList.add('hidden');
  $('over').classList.remove('hidden');
}
function exitKick() { K = null; $('kickExit').classList.add('hidden'); $('over').classList.add('hidden'); showMenu(); }

function kickRender() {
  const g = kickGeom();
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.imageSmoothingEnabled = false;
  // Stadion
  ctx.fillStyle = '#1b1f2a'; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 260; i++) {
    const x = (i * 97.3) % W, y = ((i * 41.7) % (g.gy - 10));
    ctx.fillStyle = ['#c8242b', '#2ecc40', '#f2f2f2', '#3d6df2', '#ffd52e'][i % 5];
    ctx.fillRect(x, y + Math.sin(K.t * 6 + i) * (K.last === 'goal' && K.phase === 'result' ? 3 : 0.6), 3, 3);
  }
  // Rasen
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = i % 2 ? '#3f8f2f' : '#4aa037';
    const y0 = g.gy - 6 + i * (H - g.gy) / 12;
    ctx.fillRect(0, y0, W, (H - g.gy) / 12 + 1);
  }
  // Strafraum-Linien
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 3;
  ctx.strokeRect(g.gx - g.gw * 0.25, g.line, g.gw * 1.5, (g.sy - g.line) * 0.55);
  ctx.beginPath(); ctx.moveTo(0, g.line); ctx.lineTo(W, g.line); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.fillRect(g.sx - 4, g.sy + 10, 8, 4);
  // Tor (Netz)
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(g.gx, g.gy, g.gw, g.gh);
  ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1;
  for (let x = g.gx; x < g.gx + g.gw; x += 10) { ctx.beginPath(); ctx.moveTo(x, g.gy); ctx.lineTo(x, g.line); ctx.stroke(); }
  for (let y = g.gy; y < g.line; y += 10) { ctx.beginPath(); ctx.moveTo(g.gx, y); ctx.lineTo(g.gx + g.gw, y); ctx.stroke(); }
  ctx.fillStyle = '#fff'; ctx.fillRect(g.gx - 6, g.gy - 6, g.gw + 12, 6); ctx.fillRect(g.gx - 6, g.gy - 6, 6, g.gh + 6); ctx.fillRect(g.gx + g.gw, g.gy - 6, 6, g.gh + 6);
  // Torwart
  const kp = K.keeper, ks = 3.2, kx = g.sx + kp.x, ky = g.line;
  ctx.save(); ctx.translate(kx, ky - 4);
  ctx.rotate(kp.dive * kp.diveDir * 1.1 + kp.spin);
  ctx.drawImage(K.keeperSprites[0], -6 * ks, -21 * ks, 12 * ks, 21 * ks);
  ctx.fillStyle = '#ffd52e'; ctx.fillRect(-7 * ks, -13 * ks, 2 * ks, 2 * ks); ctx.fillRect(5 * ks, -13 * ks, 2 * ks, 2 * ks); // Handschuhe
  ctx.restore();
  ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(kx - 30, ky + 4, 60, 14);
  ctx.fillStyle = '#fff'; ctx.fillText(K.keeperDef.name, kx, ky + 15);
  // Sprechblase Torwart
  if (K.sayT > 0) {
    ctx.font = 'bold 12px monospace';
    const tw = ctx.measureText(K.say).width + 14, bx = Math.max(tw / 2 + 6, Math.min(W - tw / 2 - 6, kx)), by = g.gy - 30;
    ctx.fillStyle = '#fff'; ctx.strokeStyle = '#222'; ctx.lineWidth = 2;
    ctx.fillRect(bx - tw / 2, by - 18, tw, 22); ctx.strokeRect(bx - tw / 2, by - 18, tw, 22);
    ctx.fillStyle = '#222'; ctx.fillText(K.say, bx, by - 3);
  }
  // Schütze (von hinten)
  if (K.phase === 'aim' || (K.ball && K.ball.t < 0.25)) {
    ctx.drawImage(K.meSprites[0], g.sx - 50, g.sy - 20, 12 * 4, 21 * 4);
  }
  // Ball
  let bx = g.sx, by = g.sy, bs = 1;
  if (K.ball) {
    const b = K.ball, t = Math.min(1, b.t);
    if (b.out) { bx = b.x; by = b.y; bs = 0.55; }
    else {
      bx = g.sx + (b.tx - g.sx) * t;
      const endY = g.line - Math.min(b.th, 1.6) * g.gh;
      by = g.sy + (endY - g.sy) * t - Math.sin(t * Math.PI) * 30 * b.th;
      bs = 1 - t * 0.5;
      if (K.phase === 'result') { b.x = bx; b.y = by; }
    }
  }
  if (K.ball || K.phase === 'aim') {
    const r = 13 * bs;
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(bx, by + r, r, r * 0.35, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(bx, by, r, 0, 7); ctx.fill();
    ctx.fillStyle = '#222'; ctx.fillRect(bx - r * 0.3, by - r * 0.3, r * 0.6, r * 0.6);
    ctx.fillRect(bx - r * 0.9, by - r * 0.15, r * 0.3, r * 0.3); ctx.fillRect(bx + r * 0.6, by - r * 0.15, r * 0.3, r * 0.3);
  }
  // HUD
  ctx.textAlign = 'left'; ctx.font = 'bold 15px monospace';
  ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(8, 8, 228, 44);
  ctx.fillStyle = '#4ccf3f'; ctx.fillText('AmTorVorbeigehustled', 16, 26);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 13px monospace';
  ctx.fillText(`Schuss ${Math.min(K.shots + (K.phase === 'aim' ? 1 : 0), KICK_SHOTS)}/${KICK_SHOTS} · Tore ${K.goals}`, 16, 44);
  if (K.phase === 'aim' && K.shots < 2) {
    ctx.textAlign = 'center'; ctx.font = 'bold 15px monospace';
    ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(W / 2 - 150, H * 0.86, 300, 46);
    ctx.fillStyle = '#fff';
    ctx.fillText('Nach oben wischen = Schuss', W / 2, H * 0.86 + 19);
    ctx.font = '12px monospace'; ctx.fillText('schnell = hoch · schräg = Ecke', W / 2, H * 0.86 + 37);
  }
  // Schusspfeil während des Wischens
  if (K.swipe && K.phase === 'aim') {
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 4; ctx.setLineDash([8, 6]);
    ctx.beginPath(); ctx.moveTo(g.sx, g.sy); ctx.lineTo(g.sx, g.line + 20); ctx.stroke(); ctx.setLineDash([]);
  }
}
