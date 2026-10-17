'use strict';
/* ---------- Gachaball Capsule Corp ---------- */

const GACHA_PATH = 'assets/gacha/';

const GACHA_TYPES = {
  normal: {
    id: 'normal',
    name: 'Invocación normal',
    ticketKey: 'silver',
    ticketImg: 'ticket_normal_silver_ui.png',
    costZeni: 80,
    // recompensas temporales (hasta más personajes)
    table: [
      { w: 50, kind: 'zeni', amount: [30, 60] },
      { w: 25, kind: 'zeni', amount: [80, 120] },
      { w: 15, kind: 'ticket', ticket: 'silver', n: 1 },
      { w: 8,  kind: 'ticket', ticket: 'gold', n: 1 },
      { w: 2,  kind: 'ticket', ticket: 'legendary', n: 1 }
    ]
  },
  premium: {
    id: 'premium',
    name: 'Invocación premium',
    ticketKey: 'gold',
    ticketImg: 'ticket_premium_gold_ui.png',
    costZeni: 220,
    table: [
      { w: 35, kind: 'zeni', amount: [100, 160] },
      { w: 30, kind: 'zeni', amount: [180, 260] },
      { w: 20, kind: 'ticket', ticket: 'gold', n: 1 },
      { w: 10, kind: 'ticket', ticket: 'silver', n: 2 },
      { w: 5,  kind: 'ticket', ticket: 'legendary', n: 1 }
    ]
  },
  legendary: {
    id: 'legendary',
    name: 'Invocación legendaria',
    ticketKey: 'legendary',
    ticketImg: 'ticket_legendary_ui.png',
    costZeni: 0, // solo con ticket mítico
    table: [
      { w: 40, kind: 'zeni', amount: [300, 450] },
      { w: 25, kind: 'ticket', ticket: 'gold', n: 2 },
      { w: 20, kind: 'ticket', ticket: 'legendary', n: 1 },
      { w: 15, kind: 'zeni', amount: [500, 800] }
    ]
  }
};

function getTickets() {
  return store.get('ds_tickets', { silver: 3, gold: 1, legendary: 0 });
}
function setTickets(t) {
  store.set('ds_tickets', t);
}
function addTickets(key, n) {
  const t = getTickets();
  t[key] = (t[key] | 0) + n;
  setTickets(t);
  return t;
}

function pickWeighted(table) {
  const total = table.reduce((s, r) => s + r.w, 0);
  let r = Math.random() * total;
  for (const row of table) {
    r -= row.w;
    if (r <= 0) return row;
  }
  return table[table.length - 1];
}

function resolveReward(row) {
  if (row.kind === 'zeni') {
    const [a, b] = row.amount;
    const n = a + Math.floor(Math.random() * (b - a + 1));
    addZeni(n);
    return { kind: 'zeni', amount: n, label: `+${n} Zeni` };
  }
  if (row.kind === 'ticket') {
    addTickets(row.ticket, row.n);
    const names = { silver: 'Ticket normal', gold: 'Ticket premium', legendary: 'Ticket mítico' };
    return { kind: 'ticket', ticket: row.ticket, n: row.n, label: `+${row.n} ${names[row.ticket]}` };
  }
  return { kind: 'none', label: 'Nada…' };
}

let gachaBusy = false;
let gachaSelected = 'normal';

function canPull(typeId) {
  const def = GACHA_TYPES[typeId];
  if (!def) return { ok: false, reason: 'tipo' };
  const tickets = getTickets();
  const hasTicket = (tickets[def.ticketKey] | 0) > 0;
  if (hasTicket) return { ok: true, pay: 'ticket' };
  if (def.costZeni > 0 && getZeni() >= def.costZeni) return { ok: true, pay: 'zeni' };
  if (def.costZeni <= 0) return { ok: false, reason: 'ticket' };
  return { ok: false, reason: 'zeni' };
}

function payForPull(typeId, pay) {
  const def = GACHA_TYPES[typeId];
  if (pay === 'ticket') {
    const t = getTickets();
    if ((t[def.ticketKey] | 0) <= 0) return false;
    t[def.ticketKey]--;
    setTickets(t);
    return true;
  }
  if (pay === 'zeni') {
    if (getZeni() < def.costZeni) return false;
    store.set('ds_zeni', getZeni() - def.costZeni);
    return true;
  }
  return false;
}

function renderGachaScreen() {
  const tickets = getTickets();
  const zEl = document.getElementById('gacha-zeni');
  if (zEl) zEl.textContent = 'Zeni: ' + getZeni();

  const setT = (id, key) => {
    const el = document.getElementById(id);
    if (el) el.textContent = '×' + (tickets[key] | 0);
  };
  setT('gacha-t-silver', 'silver');
  setT('gacha-t-gold', 'gold');
  setT('gacha-t-legendary', 'legendary');

  document.querySelectorAll('.gacha-opt').forEach(btn => {
    const id = btn.getAttribute('data-type');
    btn.classList.toggle('sel', id === gachaSelected);
    const def = GACHA_TYPES[id];
    const can = canPull(id);
    const costEl = btn.querySelector('.gacha-cost');
    if (costEl && def) {
      const t = getTickets();
      if ((t[def.ticketKey] | 0) > 0) {
        costEl.textContent = '1 ticket';
      } else if (def.costZeni > 0) {
        costEl.textContent = def.costZeni + ' Zeni';
      } else {
        costEl.textContent = 'Requiere ticket';
      }
    }
    btn.disabled = gachaBusy;
  });

  const pullBtn = document.getElementById('b-gacha-pull');
  if (pullBtn) {
    const can = canPull(gachaSelected);
    pullBtn.disabled = gachaBusy || !can.ok;
    pullBtn.textContent = gachaBusy ? 'Invocando…' : 'Invocar';
  }

  const res = document.getElementById('gacha-result');
  if (res && !gachaBusy && !res.dataset.keep) res.innerHTML = '';
}

/* ---------- animaciones (sprites en assets/gacha/anim) ---------- */
const GACHA_ANIM = GACHA_PATH + 'anim/';
const pad2 = n => String(n).padStart(2, '0');
const GACHA_SEQ = {
  activate: Array.from({ length: 8 }, (_, i) => GACHA_ANIM + 'activate_' + pad2(i + 1) + '.png'),   // luz y movimiento
  drop:     Array.from({ length: 10 }, (_, i) => GACHA_ANIM + 'drop_' + pad2(i + 1) + '.png'),      // salida de la cápsula
  spin: {
    silver: Array.from({ length: 8 }, (_, i) => GACHA_ANIM + 'ticket_silver_spin_' + pad2(i + 1) + '.png'),
    gold:   Array.from({ length: 9 }, (_, i) => GACHA_ANIM + 'ticket_gold_spin_' + pad2(i + 1) + '.png')
  }
};
const GACHA_IDLE = GACHA_PATH + 'machine_idle_ui.png';
const GACHA_REWARD_ICON = {
  silver: GACHA_ANIM + 'ticket_silver_glow.png',
  gold: GACHA_ANIM + 'ticket_gold_glow.png',
  legendary: GACHA_PATH + 'ticket_legendary_ui.png'
};
// precarga: así el cambio de frame no parpadea
(function preloadGacha() {
  const all = [GACHA_IDLE, ...GACHA_SEQ.activate, ...GACHA_SEQ.drop, ...GACHA_SEQ.spin.silver, ...GACHA_SEQ.spin.gold, ...Object.values(GACHA_REWARD_ICON)];
  window._gachaPre = all.map(src => { const im = new Image(); im.src = src; return im; });
})();

let gachaToken = 0; // al salir/reabrir se invalida la animación en curso

function setMachineFrame(frame) {
  const img = document.getElementById('gacha-machine');
  if (!img) return;
  img.src = frame === 'idle' ? GACHA_IDLE : frame;
}

/* reproduce una lista de imágenes, una cada `ms`, y llama a done() al terminar */
function playSeq(tok, srcs, ms, show, done, onFrame) {
  let i = 0;
  const tick = () => {
    if (tok !== gachaToken) return;
    if (i >= srcs.length) { if (done) done(); return; }
    show(srcs[i]);
    if (onFrame) onFrame(i);
    i++;
    setTimeout(tick, ms);
  };
  tick();
}

function rewardHtml(r) {
  const icon = r.kind === 'ticket' && GACHA_REWARD_ICON[r.ticket]
    ? `<img class="gacha-reward-ticket" src="${GACHA_REWARD_ICON[r.ticket]}" alt="">` : '';
  return `${icon}<span class="good">¡${r.label}!</span>`;
}

function runGachaPull() {
  if (gachaBusy) return;
  const can = canPull(gachaSelected);
  if (!can.ok) {
    const res = document.getElementById('gacha-result');
    if (res) {
      res.dataset.keep = '1';
      res.innerHTML = can.reason === 'ticket'
        ? '<span class="bad">Necesitas un ticket mítico</span>'
        : '<span class="bad">No tienes Zeni ni tickets suficientes</span>';
    }
    return;
  }
  if (!payForPull(gachaSelected, can.pay)) return;

  const tok = ++gachaToken;
  gachaBusy = true;
  renderGachaScreen();               // muestra el saldo ya descontado
  const res = document.getElementById('gacha-result');
  if (res) { res.dataset.keep = ''; res.innerHTML = '<span class="muted">La cápsula gira…</span>'; }

  const def = GACHA_TYPES[gachaSelected];
  // el premio se aplica ya (si el jugador sale a mitad de la animación no lo pierde); solo se muestra al final
  const reward = resolveReward(pickWeighted(def.table));
  const mach = document.getElementById('gacha-machine');
  const fx = document.getElementById('gacha-ticket-fx');
  const showMachine = src => { if (mach) mach.src = src; };
  const beep = (f, d, t) => { try { sfxBeep(f, d, t); } catch (e) {} };

  const finish = () => {
    if (tok !== gachaToken) return;
    if (mach) mach.classList.remove('shake');
    if (res) { res.dataset.keep = '1'; res.innerHTML = rewardHtml(reward); }
    beep(660, 0.08, 'square');
    gachaBusy = false;
    refreshZeni();
    renderGachaScreen();
    // deja la cápsula afuera un momento y vuelve al reposo
    setTimeout(() => { if (tok === gachaToken && !gachaBusy) setMachineFrame('idle'); }, 1000);
  };
  const drop = () => {
    if (mach) mach.classList.remove('shake');
    playSeq(tok, GACHA_SEQ.drop, 100, showMachine, finish, i => { if (i === 4) beep(520, 0.1, 'triangle'); });
  };
  const activate = () => {
    beep(300, 0.18, 'sawtooth');
    playSeq(tok, GACHA_SEQ.activate, 90, showMachine, drop, i => { if (mach) mach.classList.toggle('shake', i >= 4); });
  };

  // 1) el ticket gira y entra en la máquina
  const spin = GACHA_SEQ.spin[def.ticketKey];
  if (fx) {
    fx.hidden = false;
    fx.classList.remove('fly'); void fx.offsetWidth; fx.classList.add('fly');
    const hide = () => { fx.hidden = true; fx.classList.remove('fly'); };
    if (spin) {
      playSeq(tok, spin, 76, src => { fx.src = src; }, () => { hide(); activate(); });
    } else {                           // ticket mítico: sin hoja de giro, entra tal cual
      fx.src = GACHA_REWARD_ICON[def.ticketKey] || '';
      setTimeout(() => { if (tok !== gachaToken) return; hide(); activate(); }, 640);
    }
  } else {
    activate();
  }
}

function openGacha() {
  gachaToken++;
  gachaBusy = false;
  const _fx = document.getElementById('gacha-ticket-fx'); if (_fx) { _fx.hidden = true; _fx.classList.remove('fly'); }
  const _m = document.getElementById('gacha-machine'); if (_m) _m.classList.remove('shake');
  gachaSelected = 'normal';
  setMachineFrame('idle');
  const res = document.getElementById('gacha-result');
  if (res) { res.dataset.keep = ''; res.innerHTML = ''; }
  setState('gacha');
  renderGachaScreen();
}

function initGachaUI() {
  document.querySelectorAll('.gacha-opt').forEach(btn => {
    btn.onclick = () => {
      if (gachaBusy) return;
      gachaSelected = btn.getAttribute('data-type');
      renderGachaScreen();
    };
  });
  const pull = document.getElementById('b-gacha-pull');
  if (pull) pull.onclick = runGachaPull;
  const back = document.getElementById('b-gacha-back');
  if (back) back.onclick = () => setState('title');
}
