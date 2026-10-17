'use strict';

/* Sprites enemigos / items */
const wolfWalk = [];
(function loadWolf() {
  for (const id of ['01','03','05','07','09','11','13']) {
    const img = new Image();
    img.src = 'assets/enemigos/lobo/walk_' + id + '.png';
    wolfWalk.push(img);
  }
})();
const wolfIdle = new Image(); wolfIdle.src = 'assets/enemigos/lobo/idle.png';

/* Soldado (antes "Bandido"/leñador): ciclo de 4 frames, el sprite mira a la derecha */
const soldierWalk = [];
(function loadSoldier() {
  for (const id of ['01', '02', '03', '04']) {
    const img = new Image();
    img.src = 'assets/enemigos/soldado/walk_' + id + '.png';
    soldierWalk.push(img);
  }
})();
const soldierIdle = new Image(); soldierIdle.src = 'assets/enemigos/soldado/idle.png';

/* Jefe Yamcha (pixel art, mira a la derecha): 6 frames de guardia al caminar y 2 de puñetazo al estar cerca */
const yamchaWalk = [], yamchaAttack = [];
(function loadYamcha() {
  for (let i = 1; i <= 6; i++) { const img = new Image(); img.src = 'assets/enemigos/yamcha/walk_0' + i + '.png'; yamchaWalk.push(img); }
  for (let i = 1; i <= 2; i++) { const img = new Image(); img.src = 'assets/enemigos/yamcha/attack_0' + i + '.png'; yamchaAttack.push(img); }
})();
const yamchaIdle = new Image(); yamchaIdle.src = 'assets/enemigos/yamcha/idle.png';

const coinFrames = [];
(function loadCoins() {
  for (let i = 1; i <= 10; i++) {
    const img = new Image();
    img.src = 'assets/items/moneda/coin_' + String(i).padStart(2, '0') + '.png';
    coinFrames.push(img);
  }
})();

/* ---------- enemigos ---------- */
const ETYPES = {
  wolf:   { name: 'Lobo', hp: 14, spd: 118, dmg: 6, r: 12, xp: 1, from: 0 },
  bandit: { name: 'Soldado', hp: 26, spd: 80, dmg: 8, r: 16, xp: 2, from: 40, barY: 74 },
  raptor: { name: 'Raptor', hp: 22, spd: 150, dmg: 8, r: 13, xp: 2, from: 100 },
  bear:   { name: 'Oso', hp: 95, spd: 58, dmg: 14, r: 21, xp: 6, from: 160 },
  boss:   { name: 'Yamcha', hp: 900, spd: 66, dmg: 22, r: 40, xp: 40, from: 1e9 }
};
function spawnEnemy(type, near) {
  const d = ETYPES[type], a = Math.random() * TAU, dist = near ? 260 : Math.hypot(W, H) / Z / 2 + 60;
  const k = 1 + time / 150 + bossN * 0.5;
  const e = { type, x: P.x + Math.cos(a) * dist, y: P.y + Math.sin(a) * dist, hp: d.hp * k, maxHp: d.hp * k, spd: d.spd * (1 + Math.min(0.5, time / 600)), dmg: d.dmg * (1 + time / 300), r: d.r, xp: d.xp, face: 1, flash: 0, kx: 0, ky: 0, ph: Math.random() * 9 };
  enemies.push(e); return e;
}
function spawnLogic(dt) {
  spawnT -= dt;
  if (spawnT <= 0) {
    spawnT = Math.max(0.1, 0.85 - time / 260);
    const n = 1 + Math.floor(time / 110);
    for (let i = 0; i < n && enemies.length < 260; i++) {
      const pool = ['wolf']; for (const t of ['bandit', 'raptor', 'bear']) if (time >= ETYPES[t].from) pool.push(t);
      let t = pool[Math.floor(Math.random() * pool.length)]; if (t === 'bear' && Math.random() < 0.6) t = 'wolf';
      spawnEnemy(t);
    }
  }
  if (time >= (bossN + 1) * 180 && !bossRef) { bossRef = spawnEnemy('boss'); bossN++; addText(P.x, P.y - 60, '¡' + ETYPES.boss.name + '!', '#ff6a4a', 1.6); sfxBeep(110, 0.4, 'sawtooth'); }
}

/* ---------- daño, efectos ---------- */
function addText(x, y, s, col, size) { texts.push({ x, y, s, col, t: 0.8, size: size || 1 }); }
function burst(x, y, col, n, sp) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = rnd(sp * 0.3, sp); parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rnd(0.25, 0.5), max: 0.5, col, r: rnd(2, 4) }); } }
function hurtEnemy(e, dmg, kx, ky, kb) {
  if (e.dead) return;
  dmg *= P.dmgMul; e.hp -= dmg; e.flash = 0.1;
  const m = Math.hypot(kx, ky) || 1; const resist = e.type === 'boss' ? 0.12 : e.type === 'bear' ? 0.5 : 1;
  e.kx += kx / m * kb * resist; e.ky += ky / m * kb * resist;
  addText(e.x + rnd(-8, 8), e.y - e.r - 6, String(Math.round(dmg)), '#fff4b0');
  burst(e.x, e.y, '#ffe9a0', 4, 120);
  if (e.hp <= 0) killEnemy(e);
}
function zeniDropChance(type) {
  if (type === 'boss') return 1;
  if (type === 'bear') return 0.40;
  if (type === 'bandit' || type === 'raptor') return 0.22;
  return 0.12; // lobo y similares
}
function zeniFor(type) {
  if (type === 'boss') return 50;
  if (type === 'bear') return 6 + (Math.random() < 0.5 ? 2 : 0);
  if (type === 'bandit' || type === 'raptor') return 2 + (Math.random() < 0.4 ? 1 : 0);
  return 1 + (Math.random() < 0.3 ? 1 : 0); // lobo 1–2
}
function killEnemy(e) {
  e.dead = true; kills++;
  // XP siempre
  gems.push({ x: e.x, y: e.y, v: e.xp, t: 0 });
  // Zeni solo a veces (no todos los enemigos)
  if (Math.random() < zeniDropChance(e.type)) {
    const z = zeniFor(e.type);
    gems.push({ x: e.x + rnd(-6, 6), y: e.y + rnd(-6, 6), zeni: z, t: 0 });
  }
  if (e.type === 'boss') {
    bossRef = null;
    for (let i = 0; i < 12; i++) gems.push({ x: e.x + rnd(-40, 40), y: e.y + rnd(-40, 40), v: 3, t: 0 });
    for (let i = 0; i < 6; i++) gems.push({ x: e.x + rnd(-50, 50), y: e.y + rnd(-50, 50), zeni: 4 + (Math.random() * 4 | 0), t: 0 });
    gems.push({ x: e.x, y: e.y + 30, v: 0, meat: true, t: 0 });
    shake = 0.5;
  } else if (Math.random() < 0.012) {
    gems.push({ x: e.x + 8, y: e.y, v: 0, meat: true, t: 0 });
  }
  burst(e.x, e.y, '#ffffff', 8, 160);
}
function hurtPlayer(d) {
  if (P.inv > 0 || state !== 'play') return;
  d *= 1 - P.armor; P.hp -= d; P.inv = 0.55; shake = Math.max(shake, 0.18);
  addText(P.x, P.y - 30, '-' + Math.round(d), '#ff5a5a', 1.2); burst(P.x, P.y, '#ff6a6a', 8, 160); sfxBeep(180, 0.12, 'square');
  if (P.hp <= 0) gameOver();
}

/* ---------- ataques automáticos ---------- */
function nearest(maxD) { let best = null, bd = maxD * maxD; for (const e of enemies) { if (e.dead) continue; const d = (e.x - P.x) ** 2 + (e.y - P.y) ** 2; if (d < bd) { bd = d; best = e; } } return best; }
function doPunch() {
  const t = nearest(240); let dx = P.dx, dy = P.dy;
  if (t) { dx = t.x - P.x; dy = t.y - P.y; } const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
  P.aim = [dx, dy]; if (Math.abs(dx) > 0.2) P.face = dx > 0 ? 1 : -1;
  const L = P.w.punch, hit = () => {
    const cx = P.x + dx * 30, cy = P.y + dy * 30, R = 44 + L * 4;
    P.a.punch = 0.22; fx.push({ k: 'fist', x: P.x + dx * (36 + L * 2), y: P.y + dy * (36 + L * 2) - 8, t: 0.18, max: 0.18, r: R * 0.7 });
    for (const e of enemies) if (!e.dead && (e.x - cx) ** 2 + (e.y - cy) ** 2 < (R + e.r) ** 2) hurtEnemy(e, 11 + L * 5, dx, dy, 130 + L * 12);
    sfxBeep(300, 0.05, 'square');
  };
  hit(); if (L >= 4) pending.push({ t: 0.14, fn: hit });
}
function doKick() {
  const L = P.w.kick, R = 82 + L * 9;
  const spin = () => {
    P.a.kick = 0.38; fx.push({ k: 'ring', x: P.x, y: P.y, t: 0.3, max: 0.3, r: R });
    for (const e of enemies) if (!e.dead && (e.x - P.x) ** 2 + (e.y - P.y) ** 2 < (R + e.r) ** 2) hurtEnemy(e, 14 + L * 6, e.x - P.x, e.y - P.y, 260 + L * 14);
    sfxBeep(200, 0.09, 'sawtooth');
  };
  spin(); if (L >= 5) pending.push({ t: 0.25, fn: spin });
}
function doKi() {
  const L = P.w.ki, n = 1 + Math.floor((L - 1) / 2), t = nearest(480); if (!t) return;
  const base = Math.atan2(t.y - P.y, t.x - P.x);
  P.a.ki = 0.28; // pose de carga/disparo
  if (Math.abs(Math.cos(base)) > 0.2) P.face = Math.cos(base) > 0 ? 1 : -1;
  for (let i = 0; i < n; i++) { const a = base + (i - (n - 1) / 2) * 0.22; shots.push({ x: P.x, y: P.y - 8, vx: Math.cos(a) * 430, vy: Math.sin(a) * 430, life: 1.3, dmg: 12 + L * 5, pierce: L >= 3 ? 3 : 0, hit: new Set() }); }
  sfxBeep(520, 0.08, 'sine');
}

