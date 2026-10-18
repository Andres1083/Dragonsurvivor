'use strict';
/* ---------- pantallas ---------- */
const OV = {
  title: 'ov-title',
  chars: 'ov-chars',
  gacha: 'ov-gacha',
  level: 'ov-level',
  pause: 'ov-pause',
  over: 'ov-over'
};

function setState(s) {
  state = s;
  for (const k in OV) {
    const el = document.getElementById(OV[k]);
    if (el) el.classList.toggle('show', k === s);
  }
  if (s === 'title') {
    refreshBest();
    refreshZeni();
  }
  if (s === 'chars') renderCharList();
  if (s === 'gacha' && typeof renderGachaScreen === 'function') renderGachaScreen();
  const pb = document.getElementById('btn-pause');
  if (pb) pb.hidden = (s !== 'play');
  const sb = document.getElementById('skillbar');
  if (sb) sb.style.visibility = (s === 'play') ? 'visible' : 'hidden';
  mSel = 0;
}

document.getElementById('btn-pause').onclick = (e) => {
  e.preventDefault(); e.stopPropagation();
  if (state === 'play') togglePause();
};

function startRun() {
  newRun();
  setState('play');
}

function gameOver() {
  const best = store.get('ds_best', 0), newBest = time > best;
  if (newBest) store.set('ds_best', time);
  store.set('ds_kills', Math.max(store.get('ds_kills', 0), kills));
  document.getElementById('over-text').innerHTML =
    `Aguantaste <b>${fmtTime(time)}</b> y derrotaste a <b>${kills}</b> enemigos (nivel ${P.lvl}).` +
    `<br>Zeni ganado: <b>+${runZeni}</b> · Total: <b>${getZeni()}</b>` +
    (newBest ? '<br>¡Nuevo récord!' : '<br>Récord: ' + fmtTime(best));
  setState('over');
  playDeathAnim();
  refreshBest();
  refreshZeni();
}

function refreshBest() {
  const b = store.get('ds_best', 0);
  const el = document.getElementById('t-best');
  if (el) el.textContent = b ? 'Tu mejor tiempo: ' + fmtTime(b) : '';
}

function refreshZeni() {
  const z = getZeni();
  const a = document.getElementById('t-zeni');
  if (a) a.textContent = 'Zeni: ' + z;
  const b = document.getElementById('chars-zeni');
  if (b) b.textContent = 'Zeni: ' + z;
}

function pauseStats() {
  const ch = getCurrentCharacter(), base = getEffectiveStats(ch.id), w = P.w, pc = n => Math.round(n * 100) + '%';
  const row = (l, v) => `<div class="ps-row"><span>${l}</span><b>${v}</b></div>`;
  const perm = STAT_DEFS.map(d => row(d.label, fmtStat(d.key, base[d.key]))).join('');
  const run =
    row('Nivel', P.lvl) + row('Vida', Math.ceil(P.hp) + ' / ' + P.maxHp) + row('Ki', Math.floor(P.ki) + ' / ' + P.kiMax) +
    row('Tiempo', fmtTime(time)) + row('Derrotados', kills) + row('Zeni de la partida', '+' + runZeni) +
    row('Puño / Patada', 'Nv ' + w.punch + ' / Nv ' + w.kick) + (w.ki ? row('Onda de energía', 'Nv ' + w.ki) : '') +
    row('Daño físico', '×' + P.dmgMul.toFixed(2)) + row('Daño de energía', '×' + P.enMul.toFixed(2)) +
    row('Recarga', '×' + P.cdMul.toFixed(2)) + row('Velocidad', Math.round(P.speed)) +
    row('Defensa', pc(P.armor)) + row('Evasión', pc(P.evasion)) + row('Regeneración', P.regen.toFixed(1) + '/s');
  const skl = (P.skills || []).map(s => `${SKILLS[s.id].name} Nv ${s.lv}`).join(' · ');
  document.getElementById('pause-stats').innerHTML =
    `<div class="ps-grid"><div class="ps-card"><h3>${ch.name}</h3>${perm}</div><div class="ps-card"><h3>Esta partida</h3>${run}</div></div>` +
    (skl ? `<div class="small ps-skills">${skl}</div>` : '');
}

function togglePause() {
  if (state === 'play') { pauseStats(); setState('pause'); }
  else if (state === 'pause') setState('play');
}

function fmtStat(key, val) {
  if (key === 'hp' || key === 'ki') return String(Math.round(val));
  if (key === 'evasion') return Math.round(val * 100) + '%';
  if (key === 'recarga') return '×' + val.toFixed(2); // menor = mejor
  return '×' + val.toFixed(2);
}

function statBarPct(key, val, upLv, def) {
  // barra visual 0–100 relativa al máximo posible
  const base = (CHARACTERS[selectedCharId] || {}).base || {};
  const b = base[key] != null ? base[key] : (def.def != null ? def.def : key === 'hp' ? 100 : 1);
  const maxV = b + def.max * def.perLevel;
  if (key === 'recarga') {
    // recarga baja es mejor: invertir visual
    const minV = b + def.max * def.perLevel;
    const span = b - minV || 1;
    return clamp(((b - val) / span) * 100, 0, 100);
  }
  const span = maxV - b || 1;
  return clamp(((val - b) / span) * 100, 5, 100);
}

function renderCharList() {
  refreshZeni();
  const box = document.getElementById('char-list');
  if (!box) return;
  box.innerHTML = '';
  const list = getUnlockedCharacters();
  if (!list.find(c => c.id === selectedCharId) && list[0]) selectedCharId = list[0].id;

  list.forEach(c => {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'char-tile' + (c.id === selectedCharId ? ' active' : '');
    tile.innerHTML =
      (c.portrait ? `<img src="${c.portrait}" alt="">` : '') +
      `<span class="name">${c.name}</span>` +
      `<span class="rarity ${c.rarity || ''}">${c.rarity || '?'}</span>`;
    tile.onclick = () => {
      selectedCharId = c.id;
      renderCharList();
    };
    box.appendChild(tile);
  });
  renderCharDetail();
}

let charTab = 'stats';
function renderCharDetail() {
  const panel = document.getElementById('char-detail');
  if (!panel) return;
  const c = CHARACTERS[selectedCharId];
  if (!c) {
    panel.innerHTML = '<p class="small">Selecciona un guerrero</p>';
    return;
  }
  const st = getEffectiveStats(c.id);
  const up = getUpgrades(c.id);
  const z = getZeni();

  let rows = '';
  STAT_DEFS.forEach(def => {
    const lv = up[def.key] | 0;
    const val = st[def.key];
    const cost = upgradeCost(c.id, def.key);
    const maxed = cost == null;
    const can = !maxed && z >= cost;
    const pct = statBarPct(def.key, val, lv, def);
    rows +=
      `<div class="stat-row">` +
        `<span class="label">${def.label}</span>` +
        `<div class="stat-bar"><i style="width:${pct}%"></i></div>` +
        `<span class="val">${fmtStat(def.key, val)}</span>` +
        `<div class="upg">` +
          `<span class="lv">Nv ${lv}/${def.max}</span>` +
          `<button class="btn-upg" data-stat="${def.key}" ${maxed || !can ? 'disabled' : ''}>` +
            (maxed ? 'MÁX' : `Mejorar · ${cost} Z`) +
          `</button>` +
        `</div>` +
      `</div>`;
  });

  let sk = '', gearStr = '';
  if (c.skills && typeof SKILLS !== 'undefined') {
    sk = `<div class="skill-list"><b>Habilidades personales</b> <span class="small">· Copias: ${getCopies(c.id)}</span>` +
      c.skills.map((id, k) => { const lv = skillLevel(c.id, k), d = SKILLS[id];
        return `<div class="skill-row${lv ? '' : ' off'}"><span>${lv ? '' : '🔒 '}${d.name}</span><span class="lv">${lv ? 'Nv ' + lv + '/' + SKILL_MAX_LV : 'Copia ' + (k + 1)}</span><i>${d.desc}</i></div>`; }).join('') + `</div>`;
  }
  if (c.passives) {
    const cp = getCopies(c.id);
    sk += `<div class="skill-list"><b>Pasivas</b> <span class="small">· ★ ${cp}</span>` +
      c.passives.map(p => `<div class="skill-row${cp >= p.stars ? '' : ' off'}"><span>${cp >= p.stars ? '' : '🔒 '}${p.name}</span><span class="lv">${'★'.repeat(p.stars)}</span><i>${p.desc}</i></div>`).join('') + `</div>`;
  }
  if (typeof gearHtml === 'function') gearStr = gearHtml(c.id);
  const tabs = [['stats', 'Estadísticas'], ['skills', 'Habilidades'], ['gear', 'Equipo']];
  const body = charTab === 'skills' ? sk : charTab === 'gear' ? gearStr : rows;
  panel.innerHTML =
    `<div class="hd">` +
      (c.portrait ? `<img src="${c.portrait}" alt="">` : '') +
      `<div class="meta"><b>${c.name}</b><span class="rarity ${c.rarity || ''}">${c.rarity || '?'}</span></div>` +
    `</div>` +
    (c.description ? `<div class="desc">${c.description}</div>` : '') +
    `<div class="cd-tabs">` + tabs.map(([k, n]) => `<button type="button" class="btn btn-sm${k === charTab ? ' tab-on' : ''}" data-tab="${k}">${n}</button>`).join('') + `</div>` +
    `<div class="cd-body">${body}</div>` +
    `<div class="actions">` +
      `<button class="btn" id="b-select-char">Elegir compañero</button>` +
    `</div>`;

  panel.querySelectorAll('[data-tab]').forEach(b => { b.onclick = () => { charTab = b.dataset.tab; renderCharDetail(); }; });
  if (typeof bindGear === 'function') bindGear(panel, c.id, renderCharDetail);
  panel.querySelectorAll('.btn-upg[data-stat]').forEach(btn => {
    btn.onclick = () => {
      const key = btn.getAttribute('data-stat');
      const res = tryUpgrade(c.id, key);
      if (!res.ok) {
        if (res.reason === 'zeni') btn.textContent = 'Sin Zeni';
        return;
      }
      refreshZeni();
      renderCharDetail();
    };
  });

  const selBtn = document.getElementById('b-select-char');
  if (selBtn) {
    selBtn.onclick = () => {
      currentCharacterId = c.id;
      selectedCharId = c.id;
      setState('title');
    };
  }
}

/* botones menú */
document.getElementById('b-start').onclick = startRun;
document.getElementById('b-chars').onclick = () => setState('chars');
document.getElementById('b-chars-back').onclick = () => setState('title');
document.getElementById('b-gacha').onclick = () => openGacha();
if (typeof initGachaUI === 'function') initGachaUI();
document.getElementById('b-again').onclick = startRun;
document.getElementById('b-over-menu').onclick = () => setState('title');
document.getElementById('b-resume').onclick = () => setState('play');
document.getElementById('b-quit').onclick = () => setState('title');

/* ---------- navegación con teclado / mando ---------- */
function menuButtons() {
  const el = document.querySelector('.ov.show');
  return el ? [...el.querySelectorAll('.btn:not([disabled]), .btn-upg:not([disabled]), .char-tile')] : [];
}
let mSel = 0;
function menuInput() {
  const left = tapped.has('ArrowLeft') || tapped.has('KeyA') || pad.press.has(14);
  const right = tapped.has('ArrowRight') || tapped.has('KeyD') || pad.press.has(15);
  const up = tapped.has('ArrowUp') || tapped.has('KeyW') || pad.press.has(12);
  const down = tapped.has('ArrowDown') || tapped.has('KeyS') || pad.press.has(13);
  const ok = tapped.has('Enter') || tapped.has('Space') || pad.press.has(0);

  if (state === 'level') {
    if (left) { sel = (sel + offer.length - 1) % offer.length; markSel(); }
    if (right) { sel = (sel + 1) % offer.length; markSel(); }
    for (let i = 0; i < offer.length; i++) {
      if (tapped.has('Digit' + (i + 1)) || tapped.has('Numpad' + (i + 1))) { pick(i); return; }
    }
    if (ok) pick(sel);
    return;
  }

  const bs = menuButtons();
  if (!bs.length) return;
  if (up || left) mSel = (mSel + bs.length - 1) % bs.length;
  if (down || right) mSel = (mSel + 1) % bs.length;
  mSel = clamp(mSel, 0, bs.length - 1);
  bs.forEach((b, i) => b.classList.toggle('sel', i === mSel));
  if (bs[mSel] && (up || down || left || right) && bs[mSel].scrollIntoView) bs[mSel].scrollIntoView({ block: 'nearest' });
  if (ok) bs[mSel].click();
  if (state === 'over' && tapped.has('KeyR')) startRun();
}

/* Goku cae y queda tendido en la pantalla de "Has caído" */
let deathTimer = null;
function playDeathAnim() {
  const img = document.getElementById('over-sprite'); if (!img) return;
  clearInterval(deathTimer);
  const dd = { goku_kid: ['goku_kid', 3], yamcha: ['yamcha', 4] }[P && P.charId];
  if (!dd) { img.hidden = true; return; }
  const frames = Array.from({ length: dd[1] }, (_, i) => 'assets/personajes/' + dd[0] + '/death_' + (i + 1) + '.png');
  let i = 0; img.hidden = false; img.src = frames[0];
  deathTimer = setInterval(() => { i++; if (i >= frames.length) { clearInterval(deathTimer); return; } img.src = frames[i]; }, 420);
}
