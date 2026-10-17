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
      // Los ataques solo salen si hay un enemigo al alcance real del golpe (si no, se reintenta pronto sin gastar la recarga)
      if (k === 'punch') { if (nearest(30 + 44 + P.w.punch * 4)) doPunch(); else { P.cd[k] = 0.1; continue; } }
      else if (k === 'kick') { if (nearest(82 + P.w.kick * 9)) doKick(); else { P.cd[k] = 0.1; continue; } }
      else { if (nearest(480)) doKi(); else { P.cd[k] = 0.15; continue; } }
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
    let mv = 1, contact = true;
    if (e.type === 'bandit') { mv = soldierAI(e, dt, d); contact = false; }
    else if (e.type === 'wwolf') { mv = wwolfAI(e, dt, d); contact = false; }
    e.x += (dx / d * e.spd * mv + e.kx) * dt; e.y += (dy / d * e.spd * mv + e.ky) * dt;
    e.kx *= Math.pow(0.02, dt); e.ky *= Math.pow(0.02, dt);
    if (Math.abs(dx) > 4) e.face = dx > 0 ? 1 : -1;
    if (contact && d < e.r + P.r) hurtPlayer(e.dmg);
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
  // balas enemigas
  for (const b of eshots) { b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt; if ((b.x - P.x) ** 2 + (b.y - P.y) ** 2 < (P.r + 5) ** 2) { hurtPlayer(b.dmg); b.life = 0; } }
  eshots = eshots.filter(b => b.life > 0);
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


/* IA del soldado: avanza hasta ~250 px, se detiene a apuntar y disparar; si Goku se acerca, golpea con el rifle. Devuelve el factor de velocidad. */
function soldierAI(e, dt, d) {
  const meleeR = e.r + P.r + 34;
  e.stT -= dt; e.cd -= dt;
  if (e.st === 'melee') {
    e.pose = e.stT > 0.22 ? 'melee_2' : 'melee_3';
    if (!e.hit && e.stT <= 0.22) { e.hit = true; if (d < meleeR + 22) hurtPlayer(e.dmg * 1.4); }
    if (e.stT <= 0) { e.st = 'walk'; e.cd = 0.9; e.pose = null; }
    return 0;
  }
  if (e.st === 'aim') {
    e.pose = e.stT > 0.18 ? 'aim' : (Math.floor(e.stT * 20) % 2 ? 'shoot_1' : 'shoot_2');
    if (!e.fired && e.stT <= 0.18) {
      e.fired = true;
      const ox = e.x + e.face * 36, oy = e.y - 24, a = Math.atan2(P.y - 6 - oy, P.x - ox);
      eshots.push({ x: ox, y: oy, vx: Math.cos(a) * 330, vy: Math.sin(a) * 330, dmg: e.dmg * 0.8, life: 1.6 });
      fx.push({ k: 'burst', x: ox + e.face * 8, y: oy, r: 14, t: 0.1, max: 0.1 }); sfxBeep(300, 0.06, 'square');
    }
    if (e.stT <= 0) { e.st = 'walk'; e.cd = 1.7 + Math.random() * 0.6; e.pose = null; }
    return 0;
  }
  if (d < meleeR) { e.st = 'melee'; e.stT = 0.55; e.hit = false; return 0; }
  if (d < 270 && d > 110 && e.cd <= 0) { e.st = 'aim'; e.stT = 0.6; e.fired = false; return 0; }
  return d < 250 && d > 110 ? 0.35 : 1;
}

/* IA del lobo blanco: corre hacia Goku y, al tenerlo cerca, prepara la mordida, salta y muerde (daño en el frame de la dentellada). */
function wwolfAI(e, dt, d) {
  e.stT -= dt; e.cd -= dt;
  if (e.st === 'bite') {
    const t = 0.55 - e.stT;                       // 0..0.55
    e.frame = t < 0.18 ? 4 : t < 0.3 ? 5 : 6;
    if (!e.hit && t >= 0.3) { e.hit = true; if (d < e.r + P.r + 26) hurtPlayer(e.dmg * 1.2); }
    if (e.stT <= 0) { e.st = 'walk'; e.cd = 0.7; e.frame = null; }
    return t >= 0.18 && t < 0.4 ? 2.4 : 0;        // pequeño salto hacia delante al morder
  }
  if (d < e.r + P.r + 20 && e.cd <= 0) { e.st = 'bite'; e.stT = 0.55; e.hit = false; return 0; }
  return 1;
}
