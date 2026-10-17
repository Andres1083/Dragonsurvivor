'use strict';
function update(dt) {
  time += dt;
  // movimiento
  const [mx, my] = moveVec(); P.moving = !!(mx || my);
  P.water = terrain(Math.floor(P.x / T), Math.floor(P.y / T)) === 'water';
  const sp = P.speed * (P.water ? 0.55 : 1);
  if (P.moving) { P.x += mx * sp * dt; P.y += my * sp * dt; P.walk += dt * (P.water ? 7 : 11); P.dx = mx; P.dy = my; if (Math.abs(mx) > 0.15) P.face = mx > 0 ? 1 : -1; }
  P.inv = Math.max(0, P.inv - dt); P.hp = Math.min(P.maxHp, P.hp + P.regen * dt);
  P.a.punch = Math.max(0, P.a.punch - dt); P.a.kick = Math.max(0, P.a.kick - dt); P.a.ki = Math.max(0, P.a.ki - dt);
  // recargas
  const cdv = { punch: 0.85, kick: 2.4, ki: 1.5 };
  for (const k of ['punch', 'kick', 'ki']) {
    if (!P.w[k]) continue;
    P.cd[k] -= dt;
    if (P.cd[k] <= 0) {
      if (k === 'punch') { if (nearest(120) || P.moving || true) doPunch(); } else if (k === 'kick') { if (nearest(160)) doKick(); else { P.cd[k] = 0.2; continue; } } else doKi();
      P.cd[k] = cdv[k] * P.cdMul * (k === 'punch' ? Math.max(0.45, 1 - P.w.punch * 0.06) : k === 'kick' ? Math.max(0.55, 1 - P.w.kick * 0.05) : Math.max(0.5, 1 - P.w.ki * 0.05));
    }
  }
  for (const p of pending) p.t -= dt; for (const p of pending.filter(p => p.t <= 0)) p.fn(); pending = pending.filter(p => p.t > 0);
  spawnLogic(dt);
  // enemigos
  for (const e of enemies) {
    if (e.dead) continue;
    const dx = P.x - e.x, dy = P.y - e.y, d = Math.hypot(dx, dy) || 1;
    e.ph += dt * 8; e.flash = Math.max(0, e.flash - dt);
    e.x += (dx / d * e.spd + e.kx) * dt; e.y += (dy / d * e.spd + e.ky) * dt;
    e.kx *= Math.pow(0.02, dt); e.ky *= Math.pow(0.02, dt);
    if (Math.abs(dx) > 4) e.face = dx > 0 ? 1 : -1;
    if (d < e.r + P.r) hurtPlayer(e.dmg);
    if (d > 1100) { e.x = P.x + (Math.random() - .5) * 600; e.y = P.y + Math.sign(Math.random() - .5) * 560; } // los que se quedan lejos reaparecen cerca
  }
  // separación simple (los pegados se apartan)
  const n = enemies.length;
  for (let i = 0; i < n; i++) { const a = enemies[i]; if (a.dead) continue; for (let j = i + 1; j < n; j++) { const b = enemies[j]; if (b.dead) continue; const dx = b.x - a.x, dy = b.y - a.y, md = a.r + b.r - 4; if (Math.abs(dx) > md || Math.abs(dy) > md) continue; const d = Math.hypot(dx, dy) || 0.01; if (d < md) { const f = (md - d) * 0.35 / d; a.x -= dx * f; a.y -= dy * f; b.x += dx * f; b.y += dy * f; } } }
  // ondas de energía
  for (const s of shots) {
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    for (const e of enemies) { if (e.dead || s.hit.has(e) || (e.x - s.x) ** 2 + (e.y - s.y) ** 2 > (e.r + 10) ** 2) continue; s.hit.add(e); hurtEnemy(e, s.dmg, s.vx, s.vy, 70); if (s.pierce-- <= 0) { s.life = 0; break; } }
  }
  shots = shots.filter(s => s.life > 0);
  enemies = enemies.filter(e => !e.dead);
  // gemas
  const mr = 70 * P.magnet;
  for (const g of gems) {
    g.t += dt; const dx = P.x - g.x, dy = P.y - g.y, d = Math.hypot(dx, dy);
    if (d < mr || g.pull) { g.pull = true; const v = 260 + (mr - Math.min(d, mr)) * 4 + 120; g.x += dx / (d || 1) * v * dt; g.y += dy / (d || 1) * v * dt; }
    if (d < P.r + 10) {
      g.got = true;
      if (g.meat) {
        P.hp = Math.min(P.maxHp, P.hp + P.maxHp * 0.3);
        addText(P.x, P.y - 30, '+vida', '#7dffa0');
      } else if (g.zeni) {
        addZeni(g.zeni);
        addText(P.x, P.y - 28, '+' + g.zeni + ' Z', '#ffe566');
        sfxBeep(1200, 0.04, 'sine');
      } else {
        P.xp += g.v;
        sfxBeep(900 + Math.min(400, P.xp * 8), 0.03, 'sine');
      }
    }
  }
  gems = gems.filter(g => !g.got);
  if (gems.length > 400) gems.splice(0, gems.length - 400);
  if (P.xp >= P.next && state === 'play') checkLevel();
  // efectos
  for (const p of parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy *= 0.92; p.life -= dt; } parts = parts.filter(p => p.life > 0);
  for (const t of texts) { t.t -= dt; t.y -= 30 * dt; } texts = texts.filter(t => t.t > 0);
  for (const f of fx) f.t -= dt; fx = fx.filter(f => f.t > 0);
  shake = Math.max(0, shake - dt);
  // cámara
  const vw = W / Z, vh = H / Z; camx += (P.x - vw / 2 - camx) * Math.min(1, dt * 8); camy += (P.y - vh / 2 - camy) * Math.min(1, dt * 8);
}

