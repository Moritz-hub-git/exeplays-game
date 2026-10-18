'use strict';
/* Multiplayer: direkt von Gerät zu Gerät (WebRTC über PeerJS).
   Der Host rechnet das Spiel, der Mitspieler schickt seine Eingaben und zeichnet die Snapshots.
   Verbindung über einen dreistelligen Code. */

const MP = { role: null, peer: null, conn: null, code: null, coop: true, nid: 0, snapT: 0, inT: 0, G: null, lastHp: 20 };
const MP_PREFIX = 'exeplays-ungehusstled-v1-';

function mpStatus(t) { const el = $('mpStatus'); if (el) el.textContent = t; }
function mpAvailable() { if (typeof Peer === 'undefined') { mpStatus('Multiplayer gerade nicht verfügbar (keine Verbindung zum Vermittlungsdienst).'); return false; } return true; }
function mpReset() {
  try { if (MP.conn) MP.conn.close(); } catch (e) { }
  try { if (MP.peer) MP.peer.destroy(); } catch (e) { }
  Object.assign(MP, { role: null, peer: null, conn: null, code: null, G: null });
  $('mpCode').classList.add('hidden'); $('mpShare').classList.add('hidden');
}

// ---------------- Host ----------------
function mpHost(coop) {
  if (!mpAvailable()) return;
  mpReset(); MP.role = 'host'; MP.coop = coop;
  mpStatus('Starte Session…');
  const tryCode = (n = 0) => {
    MP.code = String(100 + Math.floor(Math.random() * 900));
    const peer = MP.peer = new Peer(MP_PREFIX + MP.code);
    peer.on('open', () => {
      $('mpCode').textContent = MP.code; $('mpCode').classList.remove('hidden'); $('mpShare').classList.remove('hidden');
      mpStatus(`Code ${MP.code}: Mitspieler gibt ihn ein (oder du teilst den Link). Modus: ${coop ? 'Miteinander' : 'Gegeneinander'}.`);
    });
    peer.on('error', err => {
      if (err.type === 'unavailable-id' && n < 5) { peer.destroy(); tryCode(n + 1); }
      else mpStatus('Fehler beim Starten: ' + err.type);
    });
    peer.on('connection', conn => {
      if (MP.conn && MP.conn.open) { conn.on('open', () => { conn.send({ t: 'full' }); setTimeout(() => conn.close(), 400); }); return; }
      MP.conn = conn;
      conn.on('open', () => {
        conn.send({ t: 'hello', coop: MP.coop });
        mpStatus(`✅ Mitspieler verbunden (${MP.coop ? 'miteinander' : 'gegeneinander'})! Map und Modus wählen, dann auf deine Figur tippen.`);
        beep(880, 0.08, 'triangle', 0.06); setTimeout(() => beep(1320, 0.1, 'triangle', 0.06), 90);
        if (S && !S.over) feed('<span class="tag">[Team]</span> Mitspieler ist da, startet in der nächsten Runde.');
      });
      conn.on('data', d => mpHostData(d));
      conn.on('close', () => mpLost());
      conn.on('error', () => mpLost());
    });
  };
  tryCode();
}
function mpShareLink() {
  const url = location.origin + location.pathname + '?join=' + MP.code;
  const text = `Komm in mein exePlays-Spiel! Code ${MP.code}`;
  if (navigator.share) navigator.share({ title: 'exePlays: Ungehusstled', text, url }).catch(() => { });
  else if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => mpStatus('Link kopiert: ' + url)).catch(() => mpStatus(url));
  else mpStatus(url);
}
// im Spiel: Mitspieler als Held anlegen
function mpSetupGuest() {
  if (MP.role !== 'host' || !MP.conn || !MP.conn.open) return;
  const gc = other(selectedChar), def = CHARS[gc];
  const team = MP.coop ? 'gruen' : (S.enemyTeams.includes('rot') ? 'rot' : S.enemyTeams[0]);
  const sp = team === 'gruen' ? nearestWalkable(S.spawn.x + 1, S.spawn.y) : spawnPoint(team);
  const g = mkChar(gc, def, sp.x, sp.y, false);
  g.team = team; g.remote = true; if (!MP.coop) g.name = def.name + ' (P2)'; g.rin = { mx: 0, my: 0, hit: false, build: false, shop: false };
  g.inv.bronze = 4; g.inv.sand = 24;
  if (MP.coop) { S.ents = S.ents.filter(e => e !== S.partner); S.partner = g; }
  S.ents.push(g); S.guest = g;
  S.netDiff = []; S.netOut = [];
  for (const e of S.ents) e.id = e.id || ++MP.nid;
  MP.conn.send({ t: 'init', mapId: S.mapId, modeId: S.modeId, map: Array.from(S.map), coop: MP.coop, myId: g.id, team,
    dealers: Object.fromEntries(Object.entries(S.dealers).map(([k, d]) => [k, [d.x, d.y]])), gens: S.gens.map(x => [x.x, x.y, x.kind, x.team]), spawn: sp });
  feed(`<span class="tag">[Team]</span> <b>${g.name}</b> spielt ${MP.coop ? 'mit dir' : 'für Team ' + TEAMS[team].name + ' gegen dich'}!`);
}
function mpHostData(d) {
  const g = S && S.guest;
  if (d.t === 'in' && g) g.rin = d;
  if (d.t === 'buy' && g) remoteBuy(g, d.id);
}
// Eingaben des Mitspielers anwenden (Host)
function netControl(g, dt) {
  if (g.dead || g.fallT > 0) return;
  const r = g.rin;
  let mx = r.mx || 0, my = r.my || 0; const L = Math.hypot(mx, my);
  if (L > 1) { mx /= L; my /= L; }
  if (L > 0.3) { g.fx = mx / Math.hypot(mx, my); g.fy = my / Math.hypot(mx, my); }
  g.vx = r.shop ? 0 : mx * g.def.speed; g.vy = r.shop ? 0 : my * g.def.speed;
  if (r.hit && !r.shop) attack(g);
  heroBuild(g, dt, r.build && !r.shop);
}
function remoteBuy(g, id) {
  const dl = S.dealers[g.team]; if (!dl || dist(g, dl) > 2.9 || g.dead) return;
  const o = {
    sand: { p: { bronze: 4 }, f: () => (g.inv.sand += 16) },
    cheese: { p: { bronze: 10 }, f: () => (g.hp = Math.min(g.max, g.hp + 8)) },
    sword: { p: SWORD_PRICES[g.sword] || null, f: () => g.sword++ },
    bow: { p: g.bow ? null : { gold: 3 }, f: () => (g.bow = 1) },
    armor: { p: g.armor ? null : { iron: 10 }, f: () => (g.armor = 1) },
    bed: { p: { iron: 6 }, f: () => { const b = S.beds[g.team]; if (b.alive) { b.max += 40; b.hp += 40; } } },
    tnt: { p: { gold: 2, iron: 2 }, f: () => tnt(g) },
  }[id];
  if (!o || !o.p || !canPay(o.p, g.inv)) return;
  pay(o.p, g.inv); o.f(); dl.talkT = 1;
  for (const [k, v] of Object.entries(o.p)) for (let n = 0; n < Math.min(v, 6); n++) S.flyers.push({ x: g.x, y: g.y - 0.7, to: dl, t: -n * 0.05, d: 0.4, kind: k });
}
// Spielstand an den Mitspieler (15× pro Sekunde)
function mpHostTick(dt) {
  if (MP.role !== 'host' || !S || !S.guest || !MP.conn || !MP.conn.open) return;
  MP.snapT -= dt; if (MP.snapT > 0) return; MP.snapT = 1 / 15;
  for (const e of S.ents) e.id = e.id || ++MP.nid;
  const g = S.guest, r2 = v => Math.round(v * 100) / 100;
  MP.conn.send({
    t: 'snap', time: r2(S.t),
    e: S.ents.filter(e => !e.dead || e === g).map(e => [e.id, e.kind === 'hero' ? 'h:' + e.def.skin : e.skinKey, e.team, e.name, r2(e.x), r2(e.y), e.dir,
      Math.abs(e.vx) + Math.abs(e.vy) > 0.1 ? 1 : 0, Math.round(e.hp * 10) / 10, e.max, e === S.player ? S.sword : e.sword,
      (e === S.player ? S.armor : e.armor) ? 1 : 0, (e === S.player ? S.bow : e.bow) ? 1 : 0, r2(e.fallT || 0), e.hurtT > 0 ? 1 : 0, r2(e.swing || 0), e.bubble || 0, e.dead ? 1 : 0, e.kind]),
    it: S.items.map(i => [r2(i.x), r2(i.y), i.kind]),
    ar: S.arrows.map(a => [r2(a.x), r2(a.y), r2(a.vx), r2(a.vy), a.team]),
    b: Object.fromEntries(Object.entries(S.beds).map(([k, b]) => [k, [Math.ceil(b.hp), b.max, b.alive ? 1 : 0]])),
    d: S.netDiff.splice(0), o: S.netOut.splice(0),
    br: S.border ? r2(S.border.r) : 0,
    dl: Object.fromEntries(Object.entries(S.dealers).map(([k, d]) => [k, [r2(d.x), r2(d.y), d.talkT > 0 ? 1 : 0]])),
    me: { inv: g.inv, sword: g.sword, armor: g.armor, bow: g.bow, dead: g.dead, rt: g.respawnT },
  });
}
function mpSendOver(hostWin) {
  if (MP.role !== 'host' || !MP.conn || !MP.conn.open || !S.guest) return;
  MP.conn.send({ t: 'over', win: MP.coop ? hostWin : !hostWin, kills: S.kills, time: Math.floor(S.t) });
}
function mpGuestOut() { if (MP.role === 'host' && MP.conn && MP.conn.open) MP.conn.send({ t: 'over', win: false, out: true }); }
function mpLost() {
  if (MP.role === 'host') {
    if (S && S.guest) {
      const g = S.guest; S.guest = null;
      if (MP.coop) { g.remote = false; g.state = 'guard'; feed('<span class="tag">[Team]</span> Mitspieler weg, die KI übernimmt seine Figur.'); }
      else { S.ents = S.ents.filter(e => e !== g); feed('<span class="tag">[Team]</span> Dein Gegner hat das Spiel verlassen.'); }
    }
    MP.conn = null; mpStatus('Mitspieler getrennt. Der Code gilt weiter, er kann neu beitreten.');
  } else if (MP.role === 'guest') {
    const wasInGame = S && S.guestMode;
    mpReset(); S = null;
    if (wasInGame) { $('hud').classList.add('hidden'); $('over').classList.add('hidden'); closeShop(); showMenu(); }
    mpStatus('Verbindung zum Host verloren.');
  }
}

// ---------------- Mitspieler (Gast) ----------------
function mpJoin(code) {
  if (!/^\d{3}$/.test(code)) { mpStatus('Bitte einen dreistelligen Code eingeben.'); return; }
  if (!mpAvailable()) return;
  mpReset(); MP.role = 'guest';
  mpStatus(`Verbinde mit Spiel ${code}…`);
  const peer = MP.peer = new Peer();
  peer.on('open', () => {
    const conn = MP.conn = peer.connect(MP_PREFIX + code, { reliable: true });
    conn.on('open', () => mpStatus('Verbunden! Warte, bis der Host das Spiel startet…'));
    conn.on('data', d => mpGuestData(d));
    conn.on('close', () => mpLost());
    setTimeout(() => { if (MP.role === 'guest' && MP.conn === conn && !conn.open) mpStatus(`Kein offenes Spiel mit Code ${code} gefunden.`); }, 9000);
  });
  peer.on('error', err => mpStatus(err.type === 'peer-unavailable' ? `Kein offenes Spiel mit Code ${code} gefunden.` : 'Fehler: ' + err.type));
}
function mpGuestData(d) {
  if (d.t === 'hello') mpStatus(`✅ Verbunden (${d.coop ? 'miteinander' : 'gegeneinander'})! Der Host wählt Map und startet.`);
  if (d.t === 'full') mpStatus('Das Spiel ist schon voll.');
  if (d.t === 'init') guestStart(d);
  if (d.t === 'snap' && S && S.guestMode) guestSnap(d);
  if (d.t === 'over' && S && S.guestMode) guestOver(d);
}
function guestStart(d) {
  const G = buildSetup(d.mapId, d.modeId), def = G.def;
  MP.coop = d.coop;
  MP.G = { ents: new Map(), myId: d.myId, team: d.team };
  S = {
    guestMode: true, t: 0, mapId: d.mapId, modeId: d.modeId, mapDef: def, mode: G.mode, theme: def.theme, C: G.C, void: G.void,
    map: Uint8Array.from(d.map), under: new Uint8Array(MW * MH), placed: new Uint8Array(MW * MH), skipGap: {},
    enemyTeams: G.enemyTeams, allTeams: G.teams, border: G.border ? { ...G.border, r: G.border.r0 } : null,
    beds: Object.fromEntries(Object.entries(G.beds).map(([k, b]) => [k, { x: b.x, y: b.y, hp: b.hp, max: b.hp, alive: true }])),
    dealers: Object.fromEntries(Object.entries(d.dealers).map(([k, [x, y]]) => [k, { x, y, team: k, talkT: 0 }])),
    gens: d.gens.map(([x, y, kind, team]) => ({ x, y, kind, team })),
    items: [], ents: [], parts: [], floats: [], flyers: [], arrows: [],
    inv: freshInv(), sword: 0, armor: 0, bow: 0, apples: 0, shader: false, shake: 0, over: false,
    player: null, partner: null, spawn: d.spawn,
  };
  S.shopNpc = S.dealers[d.team];
  cam.x = d.spawn.x * T; cam.y = d.spawn.y * T;
  ['menu', 'over', 'intro', 'shop'].forEach(id => $(id).classList.add('hidden'));
  $('hud').classList.remove('hidden');
  caption(MP.coop ? 'Zusammen hustlen!' : `Du spielst für\nTeam ${TEAMS[d.team].name}!`, -6, 0.3, 0.3);
}
function guestSnap(d) {
  const L = MP.G;
  for (let i = 0; i < d.d.length; i += 2) S.map[d.d[i]] = d.d[i + 1];
  for (const [k, [hp, max, alive]] of Object.entries(d.b)) { const b = S.beds[k]; if (b) { b.hp = hp; b.max = max; if (b.alive && !alive) sfx.bed(); b.alive = !!alive; } }
  S.items = d.it.map(([x, y, kind], i) => ({ x, y, kind, bob: i }));
  S.arrows = d.ar.map(([x, y, vx, vy, team]) => ({ x, y, vx, vy, team }));
  if (S.border) S.border.r = d.br;
  for (const [k, [x, y, talk]] of Object.entries(d.dl)) { const dl = S.dealers[k]; if (dl) { dl.x = x; dl.y = y; dl.talkT = talk ? 0.5 : 0; } }
  for (const ev of d.o) { if (ev[0] === 'f') feed(ev[1]); else if (ev[0] === 'c') caption(ev[1], ev[2], ev[3], ev[4]); }
  const seen = new Set();
  for (const r of d.e) {
    const [id, skin, team, name, x, y, dir, mv, hp, max, sword, armor, bow, fallT, hurt, swing, bubble, dead, kind] = r;
    seen.add(id);
    let e = L.ents.get(id);
    if (!e) {
      const sprites = skin.startsWith('h:') ? spritesFor(skin.slice(2), SKINS[skin.slice(2)]) : spritesFor(skin, enemySkin(team));
      e = { id, x, y, tx: x, ty: y, sprites, walk: 0, inv: freshInv() };
      L.ents.set(id, e);
    }
    Object.assign(e, { team, name, tx: x, ty: y, dir, mv, hp, max, sword, armor, bow, fallT, hurtT: hurt ? 0.2 : 0, swing, bubble: bubble || null, dead: !!dead, kind });
    if (Math.hypot(e.x - x, e.y - y) > 3) { e.x = x; e.y = y; } // Respawn/Teleport: nicht durchs Bild gleiten
  }
  for (const id of [...L.ents.keys()]) if (!seen.has(id)) L.ents.delete(id);
  S.ents = [...L.ents.values()];
  const me = L.ents.get(L.myId);
  if (me) {
    if (!S.player) { me.fx = 0; me.fy = -1; }
    else { me.fx = S.player.fx; me.fy = S.player.fy; }
    S.player = me;
    if (d.me.dead && !MP.wasDead) caption('Du bist gestorben!\nAlles weg.', -4, 0.15, 0.35);
    if (!d.me.dead && MP.wasDead) caption('Respawn!', -5, 0.3, 0.3);
    MP.wasDead = d.me.dead;
    if (me.hp < MP.lastHp - 0.01 && !me.dead) { sfx.hurt(); S.shake = 0.15; }
    MP.lastHp = me.hp;
  }
  S.inv = d.me.inv; S.sword = d.me.sword; S.armor = d.me.armor; S.bow = d.me.bow;
  guestHud();
  if (!$('shop').classList.contains('hidden')) renderGuestShop();
}
function guestTick(dt) {
  S.t += dt;
  const k = 1 - Math.exp(-dt * 14);
  for (const e of S.ents) { e.x += (e.tx - e.x) * k; e.y += (e.ty - e.y) * k; e.walk = e.mv ? e.walk + dt * 10 : 0; }
  for (const a of S.arrows) { a.x += a.vx * dt; a.y += a.vy * dt; }
  for (const f of S.floats) { f.y -= dt * 0.8; f.t -= dt; }
  S.floats = S.floats.filter(f => f.t > 0);
  S.shake = Math.max(0, S.shake - dt);
  // Eingaben einsammeln und 20× pro Sekunde an den Host schicken
  let mx = input.mx, my = input.my;
  if (input.keys['w'] || input.keys['arrowup']) my = -1;
  if (input.keys['s'] || input.keys['arrowdown']) my = 1;
  if (input.keys['a'] || input.keys['arrowleft']) mx = -1;
  if (input.keys['d'] || input.keys['arrowright']) mx = 1;
  const shopOpen = !$('shop').classList.contains('hidden');
  if (S.player && Math.hypot(mx, my) > 0.3) { const L = Math.hypot(mx, my); S.player.fx = mx / L; S.player.fy = my / L; }
  MP.inT -= dt;
  if (MP.inT <= 0 && MP.conn && MP.conn.open) { MP.inT = 1 / 20; MP.conn.send({ t: 'in', mx, my, hit: input.hit, build: input.build, shop: shopOpen }); }
  const near = S.player && !S.player.dead && dist(S.player, S.shopNpc) < 2.6;
  $('shopHint').classList.toggle('hidden', !near);
  if (shopOpen && !near) closeShop();
  if (S.player) render(); else { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = S.theme.bg[0]; ctx.fillRect(0, 0, cv.width, cv.height); }
}
function guestHud() {
  const me = S.player; if (!me) return;
  const hearts = Math.ceil(Math.max(0, me.hp) / 2);
  $('hearts').textContent = '❤️'.repeat(hearts) + '🖤'.repeat(10 - hearts) + (S.armor ? ' 🛡️' : '') + (S.bow ? ' 🏹' : '') + (S.sword ? ' ⚔️' + S.sword : '');
  $('apples').textContent = '';
  $('rBronze').textContent = S.inv.bronze; $('rIron').textContent = S.inv.iron; $('rGold').textContent = S.inv.gold; $('rSand').textContent = S.inv.sand;
  let html = `<div class="t">${S.mode.ico} ${S.mode.name} · ${S.mapDef.name}</div>`;
  for (const k of S.allTeams) {
    const b = S.beds[k], alive = S.ents.filter(e => e.team === k && !e.dead).length;
    html += `<div><span style="color:${TEAMS[k].col}">■</span> ${TEAMS[k].name}${k === MP.G.team ? ' (Du)' : ''}<b style="float:right;margin-left:6px;color:${b.alive ? '#5f5' : '#f55'}">${b.alive ? '✔' : (alive || '✘')}</b></div>`;
  }
  html += `<div class="pg">👥 ${MP.coop ? 'Miteinander' : 'Gegeneinander'}</div>`;
  $('board').innerHTML = html;
}
const GUEST_SHOP = [
  { id: 'sand', ic: '🧱', name: () => '16× Sandstein', desc: 'Zum Bridgen und für Mauern.', price: () => ({ bronze: 4 }) },
  { id: 'cheese', ic: '🧀', name: () => 'Käse', desc: 'Heilt 8 Herzen-Hälften.', price: () => ({ bronze: 10 }) },
  { id: 'sword', ic: '⚔️', name: () => S.sword < 3 ? SWORDS[S.sword + 1].name : 'Schwert maxed', desc: 'Mehr Schaden. Weg, wenn du stirbst.', price: () => SWORD_PRICES[S.sword] || null },
  { id: 'bow', ic: '🏹', name: () => S.bow ? 'Bogen (hast du schon)' : 'Bogen', desc: 'Schießt automatisch auf Gegner in Reichweite.', price: () => (S.bow ? null : { gold: 3 }) },
  { id: 'armor', ic: '🛡️', name: () => 'Kettenrüstung', desc: 'Halber Schaden. Weg, wenn du stirbst.', price: () => (S.armor ? null : { iron: 10 }) },
  { id: 'bed', ic: '🛏️', name: () => 'Bett mit Endstein zubauen', desc: '+40 Bett-HP für dein Team.', price: () => ({ iron: 6 }) },
  { id: 'tnt', ic: '💣', name: () => 'TNT', desc: 'Sprengt Gegner und Mauern in der Nähe weg.', price: () => ({ gold: 2, iron: 2 }) },
];
function guestOpenShop() {
  if (!S.player || S.player.dead || dist(S.player, S.shopNpc) > 2.6) { caption('Der Dealer steht\nbei deinem Bett!', -5); return; }
  $('shop').classList.remove('hidden'); input.mx = input.my = 0; renderGuestShop(true);
}
function renderGuestShop(rebuild) {
  const box = $('shopItems');
  if (rebuild || box.children.length !== GUEST_SHOP.length || !box.firstChild._gid) {
    box.innerHTML = '';
    for (const it of GUEST_SHOP) {
      const d = document.createElement('div'); d.className = 'item'; d._gid = it.id; d._it = it;
      d.innerHTML = `<div class="ic">${it.ic}</div><div class="tx"><b></b><br>${it.desc}</div><div class="pr"></div>`;
      d.addEventListener('click', () => {
        const p = it.price();
        if (!canPay(p, S.inv)) { beep(110, 0.12, 'square', 0.05); return; }
        MP.conn.send({ t: 'buy', id: it.id }); sfx.buy();
      });
      box.appendChild(d);
    }
  }
  for (const d of box.children) {
    const it = d._it, p = it.price();
    d.classList.toggle('no', !canPay(p, S.inv));
    d.querySelector('.pr').textContent = priceStr(p); d.querySelector('.tx b').textContent = it.name();
  }
  $('shopInv').textContent = `${S.inv.bronze} Bronze · ${S.inv.iron} Eisen · ${S.inv.gold} Gold · ${S.inv.sand} Sandstein · ${SWORDS[S.sword].name}`;
}
function guestOver(d) {
  S.over = true; closeShop();
  if (d.win) sfx.win(); else beep(200, 0.8, 'sawtooth', 0.08, -150);
  setTimeout(() => {
    $('overTitle').textContent = d.win ? 'GG!!!' : 'FAIL!!!';
    $('overSub').textContent = d.out ? 'Dein Team ist raus.\nNächstes Mal dir :)' : d.win ? (MP.coop ? 'Zusammen gehusstled!' : 'Du hast den Host besiegt!') : (MP.coop ? 'Die Folge war eher\nungehusstled als gehusstled.' : 'Der Host war besser.\nRevanche?');
    $('overStats').innerHTML = `👥 ${MP.coop ? 'Miteinander' : 'Gegeneinander'}<br>Der Host startet die nächste Runde.`;
    $('over').classList.remove('hidden');
  }, 900);
}

// ---------------- Menü-Anbindung ----------------
$('mpHostCoop').addEventListener('click', () => { initAudio(); mpHost(true); });
$('mpHostVs').addEventListener('click', () => { initAudio(); mpHost(false); });
$('mpJoinBtn').addEventListener('click', () => { initAudio(); mpJoin($('mpCodeIn').value.trim()); });
$('mpCodeIn').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') mpJoin($('mpCodeIn').value.trim()); });
$('mpShare').addEventListener('click', mpShareLink);
$('mpLeave').addEventListener('click', () => { mpReset(); mpStatus('Allein spielen.'); });
// Link mit ?join=123: Code eintragen und nach dem Intro beitreten
(() => {
  const j = new URLSearchParams(location.search).get('join');
  if (j && /^\d{3}$/.test(j)) { $('mpCodeIn').value = j; $('intro').addEventListener('click', () => setTimeout(() => mpJoin(j), 200), { once: true }); }
})();
