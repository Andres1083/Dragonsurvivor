'use strict';

function shadow(x, y, r) { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.4, 0, 0, TAU); ctx.fill(); }
function limb(x1, y1, x2, y2, w, col) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
function drawEnemy(e) {
  ctx.save(); ctx.translate(e.x, e.y);
  const w = Math.sin(e.ph), s = e.r / 12; shadow(0, e.r * 0.8, e.r * 1.1);
  ctx.scale(e.face * s, s);
  const fl = e.flash > 0; const C = (a) => fl ? '#ffffff' : a;
  if (e.type === 'wolf') {
    const frames = (typeof wolfWalk !== 'undefined' && wolfWalk.length) ? wolfWalk : null;
    let img = (typeof wolfIdle !== 'undefined') ? wolfIdle : null;
    if (frames && frames.length) {
      const idx = Math.floor((e.ph * 2.4) % frames.length);
      img = frames[idx] || frames[0];
    }
    if (img && img.complete && img.naturalWidth) {
      // sprite mira a la izquierda → invertir para que mire al jugador
      ctx.scale(-1, 1);
      const target = 40 / (s || 1);
      if (fl) ctx.filter = 'brightness(2.4)';
      ctx.drawImage(img, -target / 2, -target + 8, target, target);
      ctx.filter = 'none';
    } else {
      limb(-8, 5, -9 + w * 4, 12, 4, C('#6d7280')); limb(6, 5, 7 - w * 4, 12, 4, C('#6d7280'));
      ctx.fillStyle = C('#8a90a0'); ctx.beginPath(); ctx.ellipse(0, 0, 13, 7.5, 0, 0, TAU); ctx.fill();
    }
  } else if (e.type === 'wwolf' && wwolfFrames[0].complete && wwolfFrames[0].naturalWidth) {
    const i = e.frame != null ? e.frame : WWOLF_WALK[Math.floor(e.ph * 1.1) % WWOLF_WALK.length];
    const img = wwolfFrames[i], t = 54 / s;
    ctx.imageSmoothingEnabled = false;
    if (fl) ctx.filter = 'brightness(2.4)';
    ctx.drawImage(img, -t / 2, -t + 9, t, t);
    ctx.filter = 'none'; ctx.imageSmoothingEnabled = true;
  } else if (e.type === 'raptor') {
    limb(-4, 5, -5 + w * 5, 13, 3.5, C('#b5762a')); limb(4, 5, 5 - w * 5, 13, 3.5, C('#b5762a'));
    ctx.fillStyle = C('#d9892f'); ctx.beginPath(); ctx.moveTo(-6, 3); ctx.quadraticCurveTo(-24, 6 + w * 3, -26, -2); ctx.quadraticCurveTo(-14, -2, -8, -8); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, -1, 10, 8, -0.3, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(5, -6); ctx.lineTo(11, -17); ctx.lineTo(20, -15); ctx.lineTo(19, -9); ctx.lineTo(10, -7); ctx.fill();
    ctx.fillStyle = fl ? '#fff' : '#fff6d0'; ctx.fillRect(15, -10, 4, 2); ctx.fillStyle = '#1b1b2f'; ctx.fillRect(14, -14, 2.4, 2.4);
    ctx.fillStyle = C('#a85a1c'); ctx.fillRect(-6, -9, 3, 4); ctx.fillRect(-1, -10, 3, 5);
  } else if (e.type === 'bandit') {
    // Soldado: sprite que mira a la derecha (e.face ya lo voltea hacia el jugador)
    let img = soldierIdle;
    if (soldierWalk.length) img = soldierWalk[Math.floor(e.ph * 0.75) % soldierWalk.length] || soldierWalk[0];
    if (e.pose && soldierPose[e.pose] && soldierPose[e.pose].complete && soldierPose[e.pose].naturalWidth) img = soldierPose[e.pose];
    if (img && img.complete && img.naturalWidth) {
      const h = img.naturalHeight * (84 / 126) / s, wd = h * img.naturalWidth / img.naturalHeight;
      if (fl) ctx.filter = 'brightness(2.4)';
      ctx.drawImage(img, -wd / 2, -h + 9, wd, h);
      ctx.filter = 'none';
    } else {
    limb(-4, 6, -5 + w * 4, 14, 5, C('#4a4660')); limb(4, 6, 5 - w * 4, 14, 5, C('#4a4660'));
    ctx.fillStyle = C('#8a4a3a'); ctx.fillRect(-9, -9, 18, 17);
    ctx.fillStyle = C('#3b3552'); ctx.fillRect(-9, 2, 18, 3);
    limb(8, -6, 15, 2 + w * 2, 4.5, C('#e0b088')); limb(-8, -6, -12, 2 - w * 2, 4.5, C('#e0b088'));
    limb(15, 2 + w * 2, 20, -12 + w * 2, 4, C('#6b4a22')); ctx.fillStyle = C('#5a3c18'); ctx.beginPath(); ctx.arc(21, -14 + w * 2, 4.5, 0, TAU); ctx.fill();
    ctx.fillStyle = C('#e0b088'); ctx.beginPath(); ctx.arc(0, -16, 8.5, 0, TAU); ctx.fill();
    ctx.fillStyle = C('#2a2a38'); ctx.fillRect(-9, -18, 18, 6); ctx.fillStyle = fl ? '#fff' : '#ffd23f'; ctx.fillRect(2, -17, 3, 2.4); ctx.fillRect(-4, -17, 3, 2.4);
    ctx.fillStyle = C('#c0392b'); ctx.beginPath(); ctx.moveTo(-9, -22); ctx.lineTo(9, -22); ctx.lineTo(7, -26); ctx.lineTo(-7, -26); ctx.fill();
    }
  } else if (e.type === 'boss' && yamchaIdle.complete && yamchaIdle.naturalWidth) {
    // Jefe Yamcha: pixel art que mira a la derecha (e.face lo voltea hacia el jugador). Cerca de Goku usa los puñetazos.
    const near = Math.hypot(P.x - e.x, P.y - e.y) < e.r + P.r + 36;
    const set = near ? yamchaAttack : yamchaWalk;
    const img = set[Math.floor(e.ph * (near ? 0.5 : 0.75)) % set.length] || yamchaIdle;
    const h = 130 / s, wd = h * img.naturalWidth / img.naturalHeight;
    ctx.imageSmoothingEnabled = false;            // mantiene nítidos los píxeles al ampliar
    if (fl) ctx.filter = 'brightness(2.4)';
    ctx.drawImage(img, -wd / 2, -h + 9, wd, h);
    ctx.filter = 'none'; ctx.imageSmoothingEnabled = true;
  } else { // oso (y jefe: más grande y rojo)
    const boss = e.type === 'boss', bc = boss ? '#a8321f' : '#7a5230', bc2 = boss ? '#c84a30' : '#946438';
    limb(-9, 8, -10 + w * 3, 17, 8, C(bc)); limb(9, 8, 10 - w * 3, 17, 8, C(bc));
    ctx.fillStyle = C(bc); ctx.beginPath(); ctx.ellipse(0, 0, 18, 15, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = C(bc2); ctx.beginPath(); ctx.ellipse(1, 3, 10, 9, 0, 0, TAU); ctx.fill();
    limb(14, -2, 22, 6 + w * 3, 8, C(bc)); limb(-14, -2, -21, 6 - w * 3, 8, C(bc));
    ctx.fillStyle = C(bc); ctx.beginPath(); ctx.arc(8, -15, 11, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(0, -23, 4.5, 0, TAU); ctx.arc(15, -23, 4.5, 0, TAU); ctx.fill();
    ctx.fillStyle = C('#e0c8a0'); ctx.beginPath(); ctx.ellipse(13, -12, 5.5, 4.5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1b1b2f'; ctx.beginPath(); ctx.arc(16, -13, 1.8, 0, TAU); ctx.fill(); ctx.fillRect(5, -19, 3, 2.4);
    ctx.fillStyle = fl ? '#fff' : '#ffd23f'; if (boss) { ctx.fillRect(4, -19, 3, 3); ctx.fillRect(10, -19, 3, 3); }
  }
  ctx.restore();
  if (e.hp < e.maxHp && e.type !== 'boss') { const bw = e.r * 2, by = e.y - (ETYPES[e.type].barY || e.r * 1.8) - 6; ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(e.x - bw / 2, by, bw, 3); ctx.fillStyle = '#ff5a5a'; ctx.fillRect(e.x - bw / 2, by, bw * Math.max(0, e.hp / e.maxHp), 3); }
}

function drawFx() {
  for (const g of gems) {
    if (g.magnet) {   // imán en U roja con puntas blancas
      const b = Math.sin(g.t * 5) * 2; ctx.lineWidth = 5; ctx.lineCap = 'butt'; ctx.strokeStyle = '#d9323c';
      ctx.beginPath(); ctx.arc(g.x, g.y + b, 8, Math.PI, 0, true); ctx.moveTo(g.x - 8, g.y + b); ctx.lineTo(g.x - 8, g.y + b + 7); ctx.moveTo(g.x + 8, g.y + b); ctx.lineTo(g.x + 8, g.y + b + 7); ctx.stroke();
      ctx.fillStyle = '#f2f2f2'; ctx.fillRect(g.x - 10.5, g.y + b + 6, 5, 5); ctx.fillRect(g.x + 5.5, g.y + b + 6, 5, 5);
      continue;
    }
    if (g.capsule) {  // cápsula tirada en el suelo (mitad blanca, mitad azul)
      const b = Math.sin(g.t * 3) * 1.5; shadow(g.x, g.y + 9, 10);
      ctx.save(); ctx.translate(g.x, g.y - 4 + b); ctx.rotate(-0.5);
      ctx.fillStyle = '#f4f6fa'; ctx.beginPath(); ctx.arc(-4, 0, 9, Math.PI / 2, Math.PI * 1.5); ctx.rect(-4, -9, 4, 18); ctx.fill();
      ctx.fillStyle = '#2f7de0'; ctx.beginPath(); ctx.arc(4, 0, 9, -Math.PI / 2, Math.PI / 2); ctx.rect(0, -9, 4, 18); ctx.fill();
      ctx.strokeStyle = '#1b1b2f'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(-4, 0, 9, Math.PI / 2, Math.PI * 1.5); ctx.lineTo(4, -9); ctx.arc(4, 0, 9, -Math.PI / 2, Math.PI / 2); ctx.closePath(); ctx.stroke();
      ctx.restore();
      continue;
    }
    if (g.meat) {
      ctx.fillStyle = '#d96a3a'; ctx.beginPath(); ctx.ellipse(g.x, g.y, 9, 6, -0.4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#f5e8d0'; ctx.fillRect(g.x + 6, g.y - 8, 3, 8);
      ctx.beginPath(); ctx.arc(g.x + 8, g.y - 9, 3, 0, TAU); ctx.arc(g.x + 5, g.y - 9, 3, 0, TAU); ctx.fill();
      continue;
    }
    if (g.zeni) {
      const b = Math.sin(g.t * 6) * 2;
      const frames = (typeof coinFrames !== 'undefined' && coinFrames.length) ? coinFrames : null;
      if (frames && frames.length) {
        const idx = Math.floor(g.t * 12) % frames.length;
        const img = frames[idx];
        if (img && img.complete && img.naturalWidth) {
          const sz = 22;
          ctx.drawImage(img, g.x - sz / 2, g.y - sz / 2 + b, sz, sz);
          continue;
        }
      }
      // fallback círculo dorado
      ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(g.x, g.y + b, 7, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#b3541e'; ctx.lineWidth = 1.5; ctx.stroke();
      continue;
    }
    const b = Math.sin(g.t * 5) * 1.5, c = g.v >= 3 ? '#ffb347' : g.v >= 2 ? '#5fd4ff' : '#7dffb0';
    ctx.fillStyle = c; ctx.globalAlpha = .35; ctx.beginPath(); ctx.arc(g.x, g.y + b, 8, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.moveTo(g.x, g.y - 6 + b); ctx.lineTo(g.x + 5, g.y + b); ctx.lineTo(g.x, g.y + 6 + b); ctx.lineTo(g.x - 5, g.y + b); ctx.closePath(); ctx.fill();
  }
}
function drawFxTop() {
  for (const f of fx) {
    if (drawSkillFx(f)) continue;
    const k = 1 - f.t / f.max;
    if (f.k === 'ring') { ctx.strokeStyle = `rgba(255,240,160,${1 - k})`; ctx.lineWidth = 10 * (1 - k) + 2; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (0.4 + 0.6 * k), 0, TAU); ctx.stroke(); }
    else { ctx.fillStyle = `rgba(255,236,150,${0.8 * (1 - k)})`; ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, r = f.r * (0.3 + 0.5 * k) * (i % 2 ? 0.55 : 1); ctx[i ? 'lineTo' : 'moveTo'](f.x + Math.cos(a) * r, f.y + Math.sin(a) * r); } ctx.closePath(); ctx.fill(); }
  }
  for (const b of eshots) {
    const a = Math.atan2(b.vy, b.vx); ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(a);
    ctx.fillStyle = 'rgba(255,200,80,.45)'; ctx.fillRect(-16, -1.5, 16, 3);
    ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.ellipse(0, 0, 6, 3, 0, 0, TAU); ctx.fill(); ctx.restore();
  }
  for (const s of shots) {
    const a = Math.atan2(s.vy, s.vx); ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(a);
    const g = ctx.createRadialGradient(0, 0, 1, 0, 0, 16); g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, '#7fe0ff'); g.addColorStop(1, 'rgba(80,180,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(-6, 0, 22, 11, 0, 0, TAU); ctx.fill(); ctx.restore();
  }
  for (const p of parts) { ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  ctx.textAlign = 'center'; ctx.lineJoin = 'round';
  for (const t of texts) { ctx.globalAlpha = Math.min(1, t.t * 2.5); ctx.font = `bold ${Math.round(15 * t.size)}px "Trebuchet MS",sans-serif`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.65)'; ctx.strokeText(t.s, t.x, t.y); ctx.fillStyle = t.col; ctx.fillText(t.s, t.x, t.y); } ctx.globalAlpha = 1;
}

function drawHUD() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const pad = 12;
  const name = (typeof getCurrentCharacter === 'function' ? getCurrentCharacter().name : 'Héroe');

  const panelW = Math.min(280, W * 0.55);
  ctx.fillStyle = 'rgba(10,18,28,.55)';
  ctx.beginPath();
  const x = pad, y = pad, w = panelW, h = 54, r = 10;
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.fill();

  ctx.textAlign = 'left'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.55)';
  ctx.font = 'bold 15px "Trebuchet MS",sans-serif';
  ctx.fillStyle = '#fff';
  ctx.strokeText(name, x + 12, y + 20); ctx.fillText(name, x + 12, y + 20);

  ctx.font = 'bold 12px "Trebuchet MS",sans-serif';
  ctx.fillStyle = '#c8d6e8';
  const lv = 'Nv. ' + P.lvl;
  ctx.strokeText(lv, x + 12, y + 38); ctx.fillText(lv, x + 12, y + 38);

  const bx = x + 56, by = y + 28, bw = panelW - 70, bh = 12;
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(bx, by, bw, bh);
  const ratio = clamp(P.hp / P.maxHp, 0, 1);
  ctx.fillStyle = ratio < 0.3 ? '#ff4a4a' : '#ee5a6a';
  ctx.fillRect(bx, by, bw * ratio, bh);
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.5; ctx.strokeRect(bx, by, bw, bh);
  ctx.font = 'bold 11px "Trebuchet MS",sans-serif'; ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  const hpS = Math.ceil(P.hp) + ' / ' + P.maxHp;
  ctx.strokeStyle = 'rgba(0,0,0,.5)'; ctx.lineWidth = 2;
  ctx.strokeText(hpS, bx + bw / 2, by + 10); ctx.fillText(hpS, bx + bw / 2, by + 10);

  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(x + 12, y + 44, panelW - 24, 5);
  ctx.fillStyle = '#5fd4ff'; ctx.fillRect(x + 12, y + 44, (panelW - 24) * clamp(P.xp / P.next, 0, 1), 5);

  { const ky = y + h + 5, kw = panelW * 0.7;
    ctx.fillStyle = 'rgba(10,18,28,.55)'; ctx.fillRect(x, ky, kw, 12);
    ctx.fillStyle = '#3aa0ff'; ctx.fillRect(x + 2, ky + 2, (kw - 4) * clamp(P.ki / P.kiMax, 0, 1), 8);
    ctx.font = 'bold 9px "Trebuchet MS",sans-serif'; ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.fillText('KI ' + Math.floor(P.ki), x + 6, ky + 9.5); }
  ctx.textAlign = 'center'; ctx.font = 'bold 26px "Trebuchet MS",sans-serif';
  ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.fillStyle = '#fff';
  ctx.strokeText(fmtTime(time), W / 2, 36); ctx.fillText(fmtTime(time), W / 2, 36);

  ctx.font = 'bold 12px "Trebuchet MS",sans-serif'; ctx.fillStyle = 'rgba(200,220,200,.85)';
  ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 2;
  const sub = kills + ' derrotados  ·  +' + runZeni + ' Zeni';
  ctx.strokeText(sub, W / 2, 54); ctx.fillText(sub, W / 2, 54);

  if (bossRef) {
    const bw2 = Math.min(420, W - 40), bx2 = (W - bw2) / 2;
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(bx2, 64, bw2, 14);
    ctx.fillStyle = '#c0392b'; ctx.fillRect(bx2, 64, bw2 * clamp(bossRef.hp / bossRef.maxHp, 0, 1), 14);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.strokeRect(bx2, 64, bw2, 14);
    ctx.textAlign = 'center'; ctx.font = 'bold 12px "Trebuchet MS",sans-serif';
    ctx.strokeText(ETYPES.boss.name, W / 2, 61); ctx.fillText(ETYPES.boss.name, W / 2, 61);
  }

  if (touch.id !== null) {
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(touch.ox, touch.oy, 60, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.beginPath(); ctx.arc(touch.x, touch.y, 24, 0, TAU); ctx.fill();
  }
}

function render() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
  const vw = W / Z, vh = H / Z; let sx = 0, sy = 0; if (shake > 0) { sx = rnd(-1, 1) * shake * 14; sy = rnd(-1, 1) * shake * 14; }
  ctx.setTransform(DPR * Z, 0, 0, DPR * Z, (-camx + sx) * DPR * Z, (-camy + sy) * DPR * Z);
  drawWorld(camx, camy, vw, vh, performance.now() / 1000);
  drawFx();
  const list = enemies.map(e => ({ y: e.y, f: () => drawEnemy(e) })); list.push({ y: P.y, f: drawHero }); list.sort((a, b) => a.y - b.y); for (const o of list) o.f();
  drawSkillProjectiles();
  drawFxTop();
  drawHUD();
}

