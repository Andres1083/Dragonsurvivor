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

function setMachineFrame(frame) {
  const img = document.getElementById('gacha-machine');
  if (!img) return;
  const map = {
    idle: 'machine_idle_ui.png',
    glow: 'machine_glow_ui.png',
    drop: 'machine_drop_ui.png',
    end: 'machine_end_ui.png'
  };
  img.src = GACHA_PATH + (map[frame] || map.idle);
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

  gachaBusy = true;
  renderGachaScreen();
  const res = document.getElementById('gacha-result');
  if (res) { res.dataset.keep = ''; res.innerHTML = '<span class="muted">La cápsula gira…</span>'; }

  const def = GACHA_TYPES[gachaSelected];
  const frames = ['glow', 'glow', 'drop', 'end'];
  let i = 0;
  setMachineFrame('glow');

  const step = () => {
    if (i < frames.length) {
      setMachineFrame(frames[i++]);
      setTimeout(step, 280);
      return;
    }
    const reward = resolveReward(pickWeighted(def.table));
    if (res) {
      res.dataset.keep = '1';
      res.innerHTML = `<span class="good">¡${reward.label}!</span>`;
    }
    try { sfxBeep(660, 0.08, 'square'); } catch (e) {}
    gachaBusy = false;
    setMachineFrame('idle');
    refreshZeni();
    renderGachaScreen();
  };
  setTimeout(step, 320);
}

function openGacha() {
  gachaBusy = false;
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
