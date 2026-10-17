'use strict';
/* ---------- Equipo: cápsulas que dan mejoras. Cada personaje tiene 1 hueco y puede desbloquear un 2º con Zeni. ---------- */
const GEAR = {
  vital:  { name: 'Cápsula Vital',  cost: 150, desc: '+15% de vida máxima.',            apply: () => { P.maxHp = Math.round(P.maxHp * 1.15); P.hp = P.maxHp; } },
  veloz:  { name: 'Cápsula Veloz',  cost: 150, desc: '+8% de velocidad.',               apply: () => { P.speed *= 1.08; } },
  ki:     { name: 'Cápsula de Ki',  cost: 200, desc: '+25 de Ki máximo.',               apply: () => { P.kiMax += 25; P.ki = P.kiMax; } },
  iman:   { name: 'Cápsula Imán',   cost: 120, desc: '+30% de radio para recoger.',     apply: () => { P.magnet *= 1.3; } },
  escudo: { name: 'Cápsula Escudo', cost: 250, desc: '+5% de evasión.',                 apply: () => { P.evasion += 0.05; } },
  poder:  { name: 'Cápsula Poder',  cost: 300, desc: '+8% de daño físico y de energía.', apply: () => { P.dmgMul *= 1.08; P.enMul *= 1.08; } }
};
const SLOT2_COST = 500;
function gearData() { const d = store.get('ds_gear', null) || {}; d.owned = d.owned || []; d.eq = d.eq || {}; d.slot2 = d.slot2 || {}; return d; }
function saveGear(d) { store.set('ds_gear', d); }
function gearSlots(charId) { return gearData().slot2[charId] ? 2 : 1; }
function equippedGear(charId) { const d = gearData(); return (d.eq[charId] || []).filter(id => id && d.owned.includes(id)).slice(0, gearSlots(charId)); }
function buyGear(id) {
  const d = gearData(), g = GEAR[id]; if (!g || d.owned.includes(id)) return false;
  if (getZeni() < g.cost) return false;
  store.set('ds_zeni', getZeni() - g.cost); d.owned.push(id); saveGear(d); return true;
}
function toggleGear(charId, id) {
  const d = gearData(), cur = (d.eq[charId] || []).slice();
  const i = cur.indexOf(id);
  if (i >= 0) cur.splice(i, 1);
  else { if (cur.filter(Boolean).length >= gearSlots(charId)) return false; cur.push(id); }
  d.eq[charId] = cur; saveGear(d); return true;
}
function buySlot2(charId) {
  const d = gearData(); if (d.slot2[charId] || getZeni() < SLOT2_COST) return false;
  store.set('ds_zeni', getZeni() - SLOT2_COST); d.slot2[charId] = true; saveGear(d); return true;
}
function applyGear() { for (const id of equippedGear(P.charId)) GEAR[id].apply(); }

function gearHtml(charId) {
  const d = gearData(), eq = equippedGear(charId), slots = gearSlots(charId), z = getZeni();
  let h = `<div class="skill-list"><b>Equipo</b> <span class="small">· huecos ${eq.length}/${slots}</span>`;
  for (const id in GEAR) {
    const g = GEAR[id], own = d.owned.includes(id), on = eq.includes(id);
    const btn = !own ? `<button class="btn-upg" data-gear="buy:${id}" ${z < g.cost ? 'disabled' : ''}>Comprar · ${g.cost} Z</button>`
      : `<button class="btn-upg" data-gear="eq:${id}" ${!on && eq.length >= slots ? 'disabled' : ''}>${on ? 'Quitar' : 'Equipar'}</button>`;
    h += `<div class="skill-row${own ? '' : ' off'}"><span>${on ? '✅ ' : ''}${g.name}</span>${btn}<i>${g.desc}</i></div>`;
  }
  if (slots < 2) h += `<div class="skill-row"><span>🔒 Segundo hueco</span><button class="btn-upg" data-gear="slot2" ${z < SLOT2_COST ? 'disabled' : ''}>Desbloquear · ${SLOT2_COST} Z</button></div>`;
  return h + '</div>';
}
function bindGear(panel, charId, rerender) {
  panel.querySelectorAll('[data-gear]').forEach(b => {
    b.onclick = () => {
      const [a, id] = b.dataset.gear.split(':');
      if (a === 'buy') buyGear(id); else if (a === 'eq') toggleGear(charId, id); else if (a === 'slot2') buySlot2(charId);
      refreshZeni(); rerender();
    };
  });
}
