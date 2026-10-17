'use strict';
/* ---------- Habilidades personales (botones abajo) ----------
   Las básicas (puño, patada giratoria) son automáticas y están en combat.js.
   Las personales se desbloquean con copias del personaje: la copia nº k+1 desbloquea la habilidad k y cada copia extra la sube de nivel. */
const SKILL_MAX_LV = 5;
const SKILLS = {
  baculo_sagrado:   { name: 'Báculo sagrado',    cd: 6, cost: 25,  icon: 'staff',   desc: 'Golpe frontal de largo alcance contra un enemigo.' },
  baculo_giro:      { name: 'Giro del báculo',   cd: 9, cost: 35,  icon: 'spin',    desc: 'El báculo gira alrededor de Goku y golpea en círculo.' },
  baculo_boomerang: { name: 'Báculo boomerang',  cd: 12, cost: 30, icon: 'boom',    desc: 'Lanza el báculo, que atraviesa enemigos y vuelve.' },
  rogafufuken:      { name: 'Rōgafūfūken',       cd: 7, cost: 30,  icon: 'wolf',    desc: 'Ráfaga de zarpazos del Puño del Colmillo de Lobo.' },
  katana:           { name: 'Katana',            cd: 10, cost: 35, icon: 'katana',  desc: 'Embestida con tajo que corta todo en línea recta.' },
  jankenpon:        { name: '¡Jan-Ken-Pon!',    cd: 8,  cost: 20, icon: 'jkp',     desc: 'Piedra, papel o tijera al azar: golpe fuerte, área o doble tajo.' },
  lanzacohetes:     { name: 'Lanzacohetes',      cd: 14, cost: 45, icon: 'rocket',  desc: 'Cohete explosivo que daña en área.' }
};
const skillImg = {};
for (const n of ['baculo', 'arco_1', 'arco_2']) { const i = new Image(); i.src = 'assets/skills/' + n + '.png'; skillImg[n] = i; }

/* copias guardadas por personaje */
function getCopies(id) { const c = store.get('ds_copies', {}) || {}; return Math.max(c[id] | 0, (CHARACTERS[id] && CHARACTERS[id].startCopies) | 0); }
function addCopy(id, n) { const c = store.get('ds_copies', {}) || {}; c[id] = Math.max(c[id] | 0, getCopies(id)) + (n || 1); store.set('ds_copies', c); return c[id]; }
function skillLevel(charId, k) { const ch = CHARACTERS[charId]; if (!ch || !ch.skills) return 0; return clamp(getCopies(charId) - k, 0, SKILL_MAX_LV); }
function equippedSkills(charId) {
  const ch = CHARACTERS[charId]; if (!ch || !ch.skills) return [];
  return ch.skills.map((id, k) => ({ id, lv: skillLevel(charId, k), slot: k }));
}

let boomers = [], rockets = [];
function activePassives(charId) { const ch = CHARACTERS[charId], c = getCopies(charId); return ch && ch.passives ? ch.passives.filter(p => c >= p.stars) : []; }
function applyPassives() {
  P.pas = {};
  for (const p of activePassives(P.charId)) {
    P.pas[p.id] = true;
    if (p.id === 'cola') P.evasion += 0.03;
    if (p.id === 'resist') { P.maxHp = Math.round(P.maxHp * 1.1); P.hp = P.maxHp; }
    if (p.id === 'instinto') P.dmgMul *= 1.08;
    if (p.id === 'ligero') P.speed *= 1.1;
    if (p.id === 'kireserva') { P.kiMax = Math.round(P.kiMax * 1.2); P.ki = P.kiMax; P.kiRegen *= 1.2; }
    if (p.id === 'evade') P.evasion += 0.05;
  }
  P.idle = 0; P.repelT = 3; capsT = 30;
}
let capsT = 30;
function resetSkills() {
  boomers = []; rockets = [];
  applyPassives();
  P.skills = equippedSkills(P.charId).filter(s => s.lv > 0);
  P.scd = {}; for (const s of P.skills) P.scd[s.id] = 3;   // empiezan casi listas
  buildSkillBar();
}
function aimDir(range) {
  const t = nearest(range || 400); let dx = P.face, dy = 0;
  if (t) { dx = t.x - P.x; dy = t.y - P.y; } else if (P.moving) { dx = P.dx; dy = P.dy; }
  const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
  if (Math.abs(dx) > 0.2) P.face = dx > 0 ? 1 : -1;
  return { dx, dy, a: Math.atan2(dy, dx), t };
}
function inLine(e, x0, y0, dx, dy, len, w) {   // ¿está el enemigo dentro del rectángulo (x0,y0)->len, ancho w?
  const rx = e.x - x0, ry = e.y - y0, along = rx * dx + ry * dy, side = Math.abs(-rx * dy + ry * dx);
  return along > -e.r && along < len + e.r && side < w / 2 + e.r;
}

const SKILL_FN = {
  baculo_sagrado(L) {
    const d = aimDir(260), len = 150 + L * 14, dmg = 34 + L * 14;
    P.a.punch = 0.3;
    let best = null, bd = 1e9;
    for (const e of enemies) if (!e.dead && inLine(e, P.x, P.y, d.dx, d.dy, len, 90)) { const q = (e.x - P.x) ** 2 + (e.y - P.y) ** 2; if (q < bd) { bd = q; best = e; } }
    fx.push({ k: 'staffswing', x: P.x, y: P.y - 12, a: d.a, len, t: 0.3, max: 0.3 });
    pending.push({ t: 0.12, fn: () => { if (best && !best.dead) { hurtEnemy(best, dmg, d.dx, d.dy, 320); shake = Math.max(shake, 0.12); burst(best.x, best.y, '#ff5a7a', 10, 220); } sfxBeep(160, 0.12, 'sawtooth'); } });
  },
  baculo_giro(L) {
    const R = 115 + L * 10, dmg = 22 + L * 8, hits = 3;
    P.a.kick = 0.45;
    fx.push({ k: 'staffspin', x: P.x, y: P.y, r: R, t: 0.6, max: 0.6, follow: true });
    for (let i = 0; i < hits; i++) pending.push({ t: 0.1 + i * 0.16, fn: () => {
      for (const e of enemies) if (!e.dead && (e.x - P.x) ** 2 + (e.y - P.y) ** 2 < (R + e.r) ** 2) hurtEnemy(e, dmg, e.x - P.x, e.y - P.y, 240);
      sfxBeep(240, 0.07, 'square'); } });
  },
  baculo_boomerang(L) {
    const d = aimDir(500);
    P.a.punch = 0.25;
    boomers.push({ x: P.x, y: P.y - 10, dx: d.dx, dy: d.dy, out: 260 + L * 25, d: 0, back: false, rot: 0, dmg: 20 + L * 7, hit: new Set() });
    sfxBeep(420, 0.08, 'triangle');
  },
  rogafufuken(L) {
    const d = aimDir(240), n = 5 + L, dmg = 7 + L * 3, len = 120 + L * 6;
    P.a.punch = 0.2 + n * 0.06;
    for (let i = 0; i < n; i++) pending.push({ t: i * 0.07, fn: () => {
      if (!P) return; P.a.punch = 0.2;
      const off = (i % 2 ? 1 : -1) * 10;
      fx.push({ k: 'claw', x: P.x + d.dx * 50, y: P.y + d.dy * 50 - 6 + off, a: d.a, t: 0.16, max: 0.16 });
      for (const e of enemies) if (!e.dead && inLine(e, P.x, P.y, d.dx, d.dy, len, 80)) hurtEnemy(e, dmg, d.dx, d.dy, 90);
      sfxBeep(500 + i * 40, 0.04, 'sawtooth'); } });
  },
  katana(L) {
    const d = aimDir(320), dist = 150 + L * 12, dmg = 30 + L * 12;
    P.a.punch = 0.3;
    const x0 = P.x, y0 = P.y;
    fx.push({ k: 'katana', x: x0, y: y0 - 10, a: d.a, len: dist, t: 0.28, max: 0.28 });
    for (const e of enemies) if (!e.dead && inLine(e, x0, y0, d.dx, d.dy, dist, 56)) hurtEnemy(e, dmg, d.dx, d.dy, 200);
    P.x += d.dx * dist; P.y += d.dy * dist; P.inv = Math.max(P.inv, 0.25);
    sfxBeep(900, 0.08, 'sawtooth'); shake = Math.max(shake, 0.1);
  },
  jankenpon(L) {
    const d = aimDir(260), pick = Math.floor(Math.random() * 3), names = ['¡Piedra!', '¡Papel!', '¡Tijera!'], cols = ['#ffd27a', '#8ee08e', '#8ec8ff'];
    addText(P.x, P.y - 48, names[pick], cols[pick], 1.4); P.a.punch = 0.3;
    if (pick === 0) {          // piedra: puñetazo único muy fuerte
      const t = nearest(200), dmg = 40 + L * 14;
      fx.push({ k: 'fist', x: P.x + d.dx * 40, y: P.y + d.dy * 40 - 8, t: 0.25, max: 0.25, r: 40 });
      if (t) { hurtEnemy(t, dmg, d.dx, d.dy, 380); shake = Math.max(shake, 0.15); }
    } else if (pick === 1) {   // papel: palmada en área
      const R = 105 + L * 8; fx.push({ k: 'ring', x: P.x, y: P.y, t: 0.35, max: 0.35, r: R });
      for (const e of enemies) if (!e.dead && (e.x - P.x) ** 2 + (e.y - P.y) ** 2 < (R + e.r) ** 2) hurtEnemy(e, 20 + L * 7, e.x - P.x, e.y - P.y, 260);
    } else {                   // tijera: dos tajos seguidos al frente
      for (let i = 0; i < 2; i++) pending.push({ t: i * 0.12, fn: () => {
        fx.push({ k: 'katana', x: P.x, y: P.y - 10, a: d.a + (i ? 0.25 : -0.25), len: 170, t: 0.2, max: 0.2 });
        for (const e of enemies) if (!e.dead && inLine(e, P.x, P.y, d.dx, d.dy, 170, 80)) hurtEnemy(e, 17 + L * 6, d.dx, d.dy, 150);
        sfxBeep(700, 0.05, 'sawtooth'); } });
    }
    sfxBeep(350, 0.08, 'square');
  },
  lanzacohetes(L) {
    const d = aimDir(500);
    P.a.ki = 0.3;
    rockets.push({ x: P.x + d.dx * 20, y: P.y - 10 + d.dy * 20, vx: d.dx * 330, vy: d.dy * 330, life: 1.6, R: 85 + L * 9, dmg: 45 + L * 16 });
    sfxBeep(120, 0.15, 'sawtooth');
  }
};
function useSkill(i) {
  if (!P || state !== 'play' || !P.skills) return;
  const s = P.skills[i]; if (!s || P.scd[s.id] > 0) return;
  const cost = SKILLS[s.id].cost || 0;
  if (P.ki < cost) { if (!P.kiWarn || time - P.kiWarn > 0.8) { P.kiWarn = time; addText(P.x, P.y - 40, 'Ki insuficiente', '#8ec8ff'); } return; }
  P.ki -= cost;
  SKILL_FN[s.id](s.lv);
  P.scd[s.id] = SKILLS[s.id].cd * P.cdMul;
  P.scdMax = P.scdMax || {}; P.scdMax[s.id] = P.scd[s.id];
}
function explode(x, y, R, dmg) {
  fx.push({ k: 'boom', x, y, r: R, t: 0.35, max: 0.35 }); burst(x, y, '#ffb347', 16, 260); shake = Math.max(shake, 0.25);
  for (const e of enemies) if (!e.dead && (e.x - x) ** 2 + (e.y - y) ** 2 < (R + e.r) ** 2) hurtEnemy(e, dmg, e.x - x, e.y - y, 300, true);
  sfxBeep(90, 0.2, 'sawtooth');
}
function updateSkills(dt) {
  if (!P.skills) return;
  P.idle = P.moving ? 0 : P.idle + dt;
  const charging = P.pas.carga && P.idle > 1;
  P.ki = Math.min(P.kiMax, P.ki + P.kiRegen * dt * (charging ? 3 : 1));
  if (charging) {
    if (Math.random() < 0.5) parts.push({ x: P.x + rnd(-14, 14), y: P.y + rnd(-6, 10), vx: 0, vy: -60, life: 0.5, max: 0.5, col: '#7fd0ff', r: 2.5 });
    if (P.pas.repel && (P.repelT -= dt) <= 0) {
      P.repelT = 3; fx.push({ k: 'ring', x: P.x, y: P.y, t: 0.3, max: 0.3, r: 100 });
      for (const e of enemies) { const dx = e.x - P.x, dy = e.y - P.y, d = Math.hypot(dx, dy) || 1; if (d < 100 + e.r) { e.kx += dx / d * 380; e.ky += dy / d * 380; } }
    }
  }
  // cápsulas en el suelo: cada cierto tiempo aparece una cerca (máx. 2)
  capsT -= dt;
  if (capsT <= 0) { capsT = 40; if (gems.filter(g => g.capsule).length < 2) { const a = Math.random() * TAU, r = 260 + Math.random() * 160; gems.push({ x: P.x + Math.cos(a) * r, y: P.y + Math.sin(a) * r, v: 0, capsule: true, t: 0 }); } }
  P.skills.forEach((s, i) => {
    if (P.scd[s.id] > 0) P.scd[s.id] = Math.max(0, P.scd[s.id] - dt);
    if (tapped.has('Digit' + (i + 1)) || tapped.has('Numpad' + (i + 1)) || pad.press.has([2, 3, 1, 4][i])) useSkill(i);
  });
  // báculo boomerang
  for (const b of boomers) {
    b.rot += dt * 18;
    if (!b.back) { const v = 420 * dt; b.x += b.dx * v; b.y += b.dy * v; b.d += v; if (b.d >= b.out) { b.back = true; b.hit = new Set(); } }
    else { const tx = P.x - b.x, ty = P.y - 10 - b.y, m = Math.hypot(tx, ty) || 1, v = 480 * dt; b.x += tx / m * v; b.y += ty / m * v; if (m < 24) b.done = true; }
    for (const e of enemies) if (!e.dead && !b.hit.has(e) && (e.x - b.x) ** 2 + (e.y - b.y) ** 2 < (e.r + 22) ** 2) { b.hit.add(e); hurtEnemy(e, b.dmg, b.dx * (b.back ? -1 : 1), b.dy * (b.back ? -1 : 1), 160); }
  }
  boomers = boomers.filter(b => !b.done);
  // cohetes
  for (const r of rockets) {
    r.x += r.vx * dt; r.y += r.vy * dt; r.life -= dt;
    if (Math.random() < 0.7) parts.push({ x: r.x - r.vx * 0.03, y: r.y - r.vy * 0.03, vx: -r.vx * 0.1, vy: -r.vy * 0.1, life: 0.3, max: 0.3, col: Math.random() < 0.5 ? '#ffd23f' : '#ff7a2a', r: 3 });
    let hit = r.life <= 0; for (const e of enemies) if (!e.dead && (e.x - r.x) ** 2 + (e.y - r.y) ** 2 < (e.r + 10) ** 2) { hit = true; break; }
    if (hit) { r.dead = true; explode(r.x, r.y, r.R, r.dmg); }
  }
  rockets = rockets.filter(r => !r.dead);
  updateSkillBar();
}

/* ---------- efectos visuales ---------- */
function drawSkillFx(f) {
  const k = 1 - f.t / f.max, st = skillImg.baculo;
  const staff = (x, y, ang, len) => {   // dibuja el báculo (sprite vertical) con su punta hacia 'ang'
    if (!st.complete || !st.naturalWidth) return;
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang + Math.PI / 2); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(st, -st.naturalWidth * 1.2, -len / 2, st.naturalWidth * 2.4, len); ctx.restore();
  };
  if (f.k === 'staffswing') {
    const a = f.a - 1.3 + 2.6 * Math.min(1, k * 1.6); staff(f.x + Math.cos(a) * f.len * 0.5, f.y + Math.sin(a) * f.len * 0.5, a, f.len);
    const s = skillImg.arco_1; if (s.complete && s.naturalWidth) { ctx.save(); ctx.globalAlpha = 1 - k; ctx.translate(f.x + Math.cos(f.a) * f.len * 0.55, f.y + Math.sin(f.a) * f.len * 0.55); ctx.rotate(f.a); ctx.imageSmoothingEnabled = false; ctx.scale(2.4, 2.4); ctx.drawImage(s, -s.naturalWidth / 2, -s.naturalHeight / 2); ctx.restore(); }
    return true;
  }
  if (f.k === 'staffspin') {
    f.x = P.x; f.y = P.y - 12;
    const a = k * TAU * 2.5;
    ctx.save(); ctx.globalAlpha = 0.6 * (1 - k); ctx.strokeStyle = '#ff5a7a'; ctx.lineWidth = 6 * (1 - k) + 2; ctx.beginPath(); ctx.arc(f.x, f.y + 12, f.r * (0.6 + 0.4 * Math.min(1, k * 3)), 0, TAU); ctx.stroke(); ctx.restore();
    for (let i = 0; i < 2; i++) { const b = a + i * Math.PI; staff(f.x + Math.cos(b) * f.r * 0.55, f.y + Math.sin(b) * f.r * 0.55 * 0.8, b, f.r * 0.95); }
    return true;
  }
  if (f.k === 'claw') {
    ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.a); ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#fff6b0'; ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-20 + k * 30, i * 9 - 12); ctx.quadraticCurveTo(0 + k * 30, i * 9, 22 + k * 30, i * 9 + 12); ctx.stroke(); }
    ctx.restore(); return true;
  }
  if (f.k === 'katana') {
    ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.a); ctx.globalAlpha = 1 - k;
    const g = ctx.createLinearGradient(0, 0, f.len, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,.95)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(f.len, -14 * (1 - k) - 2); ctx.lineTo(f.len, 14 * (1 - k) + 2); ctx.lineTo(0, 3); ctx.closePath(); ctx.fill(); ctx.restore(); return true;
  }
  if (f.k === 'boom') {
    ctx.save(); const r = f.r * (0.3 + 0.7 * k); ctx.globalAlpha = 1 - k;
    const g = ctx.createRadialGradient(f.x, f.y, 2, f.x, f.y, r); g.addColorStop(0, '#fff7c0'); g.addColorStop(0.5, '#ffa030'); g.addColorStop(1, 'rgba(255,80,20,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, TAU); ctx.fill(); ctx.restore(); return true;
  }
  return false;
}
function drawSkillProjectiles() {
  const st = skillImg.baculo;
  for (const b of boomers) { if (!st.complete) continue; ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rot); ctx.imageSmoothingEnabled = false; ctx.drawImage(st, -st.naturalWidth * 1.2, -34, st.naturalWidth * 2.4, 68); ctx.restore(); }
  for (const r of rockets) {
    ctx.save(); ctx.translate(r.x, r.y); ctx.rotate(Math.atan2(r.vy, r.vx));
    ctx.fillStyle = '#8a8f9c'; ctx.fillRect(-9, -3, 16, 6); ctx.fillStyle = '#d9323c'; ctx.beginPath(); ctx.moveTo(7, -3); ctx.lineTo(13, 0); ctx.lineTo(7, 3); ctx.fill();
    ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.moveTo(-9, -2); ctx.lineTo(-17 - Math.random() * 4, 0); ctx.lineTo(-9, 2); ctx.fill(); ctx.restore();
  }
}

/* ---------- barra de botones (DOM) ---------- */
const SKILL_ICON = {
  staff:  '<img src="assets/skills/baculo.png" style="transform:rotate(45deg) scale(1.1)">',
  spin:   '<img src="assets/skills/baculo.png" style="transform:rotate(-30deg)"><b class="sk-sym">⟳</b>',
  boom:   '<img src="assets/skills/baculo.png" style="transform:rotate(60deg)"><b class="sk-sym">↺</b>',
  wolf:   '<b class="sk-emoji">🐺</b>', jkp: '<b class="sk-emoji">✊</b>', katana: '<b class="sk-emoji">🗡️</b>', rocket: '<b class="sk-emoji">🚀</b>'
};
function buildSkillBar() {
  const bar = document.getElementById('skillbar'); if (!bar) return;
  bar.innerHTML = '';
  const list = equippedSkills(P.charId);
  for (let i = 0; i < 4; i++) {
    const s = list[i], b = document.createElement('button'); b.type = 'button'; b.className = 'sk-btn';
    if (s && s.lv > 0) {
      const def = SKILLS[s.id], idx = P.skills.findIndex(x => x.id === s.id);
      b.dataset.skill = s.id; b.title = def.name + ' · Nv ' + s.lv + ' · ' + (def.cost || 0) + ' Ki';
      b.innerHTML = `<span class="sk-ico">${SKILL_ICON[def.icon] || ''}</span><span class="sk-fill"></span><span class="sk-key">${idx + 1}</span><span class="sk-lv">Nv${s.lv}</span><span class="sk-cost">${def.cost || 0}</span>`;
      const fire = e => { e.preventDefault(); e.stopPropagation(); useSkill(idx); };
      b.addEventListener('pointerdown', fire);
    } else if (s) { b.classList.add('locked'); b.innerHTML = '<span class="sk-ico"><b class="sk-emoji">🔒</b></span>'; b.title = 'Consigue otra copia en el gacha'; }
    else { b.classList.add('empty'); }
    bar.appendChild(b);
  }
  bar.hidden = !P.skills.length && !list.length;
}
function updateSkillBar() {
  const bar = document.getElementById('skillbar'); if (!bar) return;
  for (const b of bar.querySelectorAll('.sk-btn[data-skill]')) {
    const id = b.dataset.skill, rem = P.scd[id] || 0, mx = (P.scdMax && P.scdMax[id]) || SKILLS[id].cd * P.cdMul;
    const p = rem > 0 ? clamp(rem / mx, 0, 1) : 0;
    b.style.setProperty('--p', (p * 360).toFixed(1) + 'deg');
    b.classList.toggle('ready', rem <= 0 && P.ki >= (SKILLS[id].cost || 0));
    b.classList.toggle('nok', P.ki < (SKILLS[id].cost || 0));
  }
}
