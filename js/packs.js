'use strict';
/* ---------- Lanzamiento de sobres: coverflow ---------- */
const PACKS = [
  { id: 'normal',    name: 'Sobre Normal',    img: 'assets/gacha/packs/pack_normal.png',    open: true, video: 'assets/gacha/packs/pack_open_normal.mp4',
    rates: { N: 80, R: 15, SR: 4.5, SSR: 0.5 } },
  { id: 'epic',      name: 'Sobre Épico',     img: 'assets/gacha/packs/pack_epic.png',      open: true,
    rates: { N: 30, R: 40, SR: 27, SSR: 3 } },
  { id: 'legendary', name: 'Sobre Legendario', img: 'assets/gacha/packs/pack_legendary.png' },
  { id: 'mythic',    name: 'Sobre Mítico',    img: 'assets/gacha/packs/pack_mythic.png' }
];
/* sobres conseguidos en las cápsulas de las partidas */
function getPacks() { return store.get('ds_packs', {}) || {}; }
function addPack(id, n) { const p = getPacks(); p[id] = (p[id] | 0) + (n || 1); store.set('ds_packs', p); return p[id]; }
const packIcon = {};
for (const id of ['normal', 'epic', 'legendary', 'mythic']) { const i = new Image(); i.src = 'assets/gacha/packs/icon_' + id + '.png'; packIcon[id] = i; }

let packSel = 0, packBusy = false, swiped = false;
(function () {
  const st = document.getElementById('cf-stage'); let x0 = null;
  st.addEventListener('pointerdown', e => { x0 = e.clientX; swiped = false; });
  const end = e => {
    if (x0 === null) return;
    const dx = e.clientX - x0; x0 = null;
    if (!packBusy && Math.abs(dx) > 35) {
      swiped = true; setTimeout(() => { swiped = false; }, 300);
      packSel = Math.max(0, Math.min(PACKS.length - 1, packSel + (dx < 0 ? 1 : -1))); layoutPacks();
    }
  };
  st.addEventListener('pointerup', end); st.addEventListener('pointercancel', () => { x0 = null; });
})();

function renderPacks() {
  const st = document.getElementById('cf-stage');
  if (!st.children.length) {
    PACKS.forEach((p, i) => {
      const c = document.createElement('div');
      c.className = 'cf-card' + (p.open ? '' : ' locked');
      c.innerHTML = '<img src="' + p.img + '" alt="' + p.name + '">' + (p.open ? '<span class="cf-badge"></span>' : '<div class="cf-lock">🔒</div>');
      c.onclick = () => { if (packBusy || swiped) return; if (i === packSel) packOpen(); else { packSel = i; layoutPacks(); } };
      st.appendChild(c);
    });
  }
  packSel = 0; layoutPacks(); refreshPackBadges();
}
function refreshPackBadges() {
  const have = getPacks();
  [...document.getElementById('cf-stage').children].forEach((c, i) => {
    const b = c.querySelector('.cf-badge'); if (!b) return;
    const n = have[PACKS[i].id] | 0; b.textContent = '×' + n; b.hidden = n <= 0;
  });
}

function layoutPacks() {
  const st = document.getElementById('cf-stage');
  const cw = st.firstChild ? st.firstChild.offsetWidth || 200 : 200;
  [...st.children].forEach((c, i) => {
    const d = i - packSel;
    let tf, op = 1;
    if (d === 0) tf = 'translateX(0) translateZ(60px)';
    else if (d < 0) tf = 'translateX(' + (-cw * 0.55 + d * cw * 0.6) + 'px) translateZ(' + (60 * d) + 'px) rotateY(42deg) scale(' + (1 + d * 0.04) + ')';
    else tf = 'translateX(' + (cw * 0.55 + d * cw * 0.6) + 'px) translateZ(' + (-60 * d) + 'px) rotateY(-42deg) scale(' + (1 - d * 0.04) + ')';
    c.style.transform = tf; c.style.opacity = op; c.style.zIndex = 20 - Math.abs(d); 
    c.classList.toggle('sel', d === 0);
  });
}

function packsInput(left, right, ok) {
  if (packBusy) {
    if (ok || tapped.has('Escape') || pad.press.has(1)) { if (document.getElementById('pack-reward').hidden) packSkip(); else if (ok) packClose(); }
    return;
  }
  if (tapped.has('Escape') || pad.press.has(1)) { setState('title'); return; }
  if (left && packSel > 0) { packSel--; layoutPacks(); }
  if (right && packSel < PACKS.length - 1) { packSel++; layoutPacks(); }
  if (ok) {
    packOpen();
  }
}

function packRoll(p) {
  const r = Math.random() * 100; let acc = 0, rar = 'N';
  for (const k of ['N', 'R', 'SR', 'SSR']) { acc += p.rates[k]; if (r < acc) { rar = k; break; } }
  const ids = Object.keys(CHARACTERS);
  let pool = ids.filter(id => CHARACTERS[id].rarity === rar);
  // sin personajes de esa rareza todavía: cae al más cercano disponible
  for (let o = 1; !pool.length && o < 4; o++) {
    const order = ['N', 'R', 'SR', 'SSR'], k = order.indexOf(rar);
    pool = ids.filter(id => [order[k - o], order[k + o]].includes(CHARACTERS[id].rarity));
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

let packResult = null;
function packOpen() {
  const p = PACKS[packSel];
  if (!p.open) {
    const c = document.getElementById('cf-stage').children[packSel];
    c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake');
    return;
  }
  const have = getPacks();
  if (!TEST_UNLOCK) {   // en modo pruebas la apertura es gratis
    if ((have[p.id] | 0) <= 0) {
      const c = document.getElementById('cf-stage').children[packSel];
      c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake');
      return;
    }
    have[p.id]--; store.set('ds_packs', have);
  }
  packBusy = true;
  const id = packRoll(p), had = getCopies(id) > 0, n = addCopy(id, 1);
  packResult = { id, label: had ? 'Copia de ' + CHARACTERS[id].name + ' (×' + n + ')' : '¡NUEVO! ' + CHARACTERS[id].name + ' se une al equipo' };
  const fx = document.getElementById('pack-fx'), v = document.getElementById('pack-video'), rw = document.getElementById('pack-reward');
  rw.hidden = true; fx.hidden = false;
  if (!p.video) { packReveal(); return; }   // sin video propio todavía: va directo al resultado
  v.hidden = false; v.src = p.video; v.currentTime = 0; v.muted = false;
  v.onended = packReveal;
  v.onclick = packSkip;
  v.onerror = packReveal;
  const pr = v.play(); if (pr && pr.catch) pr.catch(() => { v.muted = true; const q = v.play(); if (q && q.catch) q.catch(packReveal); });
}

function packSkip() { const v = document.getElementById('pack-video'); if (!v.hidden) packReveal(); }

function packReveal() {
  const v = document.getElementById('pack-video'), rw = document.getElementById('pack-reward');
  if (!packResult) return;
  v.pause(); v.hidden = true;
  const ch = CHARACTERS[packResult.id];
  rw.innerHTML = '<img src="' + ch.portrait + '" alt=""><span class="rarity ' + ch.rarity + '">' + ch.rarity + ' · ' + RARITY_NAMES[ch.rarity] + '</span><span class="good">' + packResult.label + '</span><button class="btn sel" id="b-pack-ok">Continuar</button>';
  rw.hidden = false; packResult = null;
  document.getElementById('b-pack-ok').onclick = packClose;
}

function packClose() {
  document.getElementById('pack-fx').hidden = true;
  packBusy = false; refreshPackBadges();
  if (typeof refreshZeni === 'function') refreshZeni();
}
document.getElementById('b-packs-back').onclick = () => { if (!packBusy) setState('title'); };
