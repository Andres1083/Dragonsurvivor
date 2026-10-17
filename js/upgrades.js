'use strict';
/* ---------- mejoras ---------- */
const UPG = [
  { id: 'punch', name: () => 'Puño de hierro', tag: 'Ataque', desc: l => l === 0 ? '' : l >= 3 ? 'Más daño y alcance; con nivel 4 pegas dos veces seguidas.' : 'Más daño, alcance y velocidad del puñetazo.', get: () => P.w.punch, max: WEAPON_MAX, apply() { P.w.punch++; } },
  { id: 'kick', name: () => 'Patada giratoria', tag: 'Ataque', desc: () => 'Golpea a todos a tu alrededor. Más daño y radio; nivel 5 repite la patada.', get: () => P.w.kick, max: WEAPON_MAX, apply() { P.w.kick++; } },
  { id: 'ki', only: () => !!getCurrentCharacter().energy, name: () => P.w.ki ? 'Onda de energía' : 'Onda de energía (nueva)', tag: 'Ataque', desc: () => P.w.ki ? 'Más daño y más ondas a la vez.' : 'Lanza una onda de energía al enemigo más cercano.', get: () => P.w.ki, max: WEAPON_MAX, apply() { P.w.ki++; } },
  { id: 'hp', name: () => 'Vigor', tag: 'Cuerpo', desc: () => '+25 vida máxima y te cura 25.', get: () => 0, max: 99, apply() { P.maxHp += 25; P.hp = Math.min(P.maxHp, P.hp + 25); } },
  { id: 'speed', name: () => 'Pies ligeros', tag: 'Cuerpo', desc: () => '+10% velocidad al correr.', get: () => 0, max: 99, apply() { P.speed *= 1.10; } },
  { id: 'power', name: () => 'Entrenamiento', tag: 'Cuerpo', desc: () => '+12% de daño físico y de energía.', get: () => 0, max: 99, apply() { P.dmgMul *= 1.12; P.enMul *= 1.12; } },
  { id: 'haste', name: () => 'Respiración', tag: 'Cuerpo', desc: () => '-10% tiempo de recarga de ataques.', get: () => 0, max: 99, apply() { P.cdMul *= 0.9; } },
  { id: 'magnet', name: () => 'Imán de esencia', tag: 'Cuerpo', desc: () => '+35% radio para recoger experiencia.', get: () => 0, max: 99, apply() { P.magnet *= 1.35; } },
  { id: 'regen', name: () => 'Meditación', tag: 'Cuerpo', desc: () => 'Recuperas +0,6 de vida por segundo.', get: () => 0, max: 99, apply() { P.regen += 0.6; } },
  { id: 'armor', name: () => 'Piel dura', tag: 'Cuerpo', desc: () => '-8% de daño recibido.', get: () => 0, max: 99, apply() { P.armor = Math.min(0.6, P.armor + 0.08); } },
  { id: 'meat', name: () => 'Carne asada', tag: 'Cura', desc: () => 'Recuperas el 50% de tu vida.', get: () => 0, max: 99, only: () => P.hp < P.maxHp * 0.85, apply() { P.hp = Math.min(P.maxHp, P.hp + P.maxHp * 0.5); } }
];
let offer = [], sel = 0;
function openLevelUp() {
  const pool = UPG.filter(u => u.get() < u.max && (!u.only || u.only()));
  offer = [];
  while (offer.length < 3 && pool.length) offer.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  const box = document.getElementById('cards'); box.innerHTML = '';
  offer.forEach((u, i) => {
    const b = document.createElement('button'); b.className = 'card';
    const lv = u.get(), isW = ['punch', 'kick', 'ki'].includes(u.id);
    b.innerHTML = `<b>${i + 1}. ${u.name()}</b><i>${u.tag}${isW && lv ? ' · nivel ' + lv + ' → ' + (lv + 1) : ''}</i><span>${u.desc(lv)}</span>`;
    b.onclick = () => pick(i); box.appendChild(b);
  });
  sel = 0; markSel(); setState('level');
}
function markSel() { [...document.getElementById('cards').children].forEach((c, i) => c.classList.toggle('sel', i === sel)); }
function pick(i) { const u = offer[i]; if (!u) return; u.apply(); sfxBeep(660, 0.08); P.lvl++; checkLevel(); }
function checkLevel() {
  if (P.xp >= P.next) { P.xp -= P.next; P.next = Math.round(5 + P.lvl * 4 + P.lvl * P.lvl * 0.55); openLevelUp(); }
  else setState('play');
}

