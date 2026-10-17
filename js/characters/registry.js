'use strict';
/* Registro de personajes + mejoras con Zeni */

const CHARACTERS = {
  goku_kid: {
    id: 'goku_kid',
    name: 'Kid Goku',
    rarity: 'R',
    description: 'El pequeño guerrero saiyajin. Equilibrado y listo para pelear.',
    unlocked: true,
    energy: false,   // sin ataques de energía (la onda de ki queda para versiones posteriores)
    startCopies: 1,
    skills: ['baculo_sagrado', 'baculo_giro', 'baculo_boomerang', 'jankenpon'],
    portrait: 'assets/personajes/goku_kid/idle_01.png',
    // valores base (antes de mejoras)
    base: {
      hp: 100,
      fuerza: 1.0,
      velocidad: 1.0,
      magnet: 1.0,
      recarga: 1.0,
      evasion: 0.04,   // primera aparición: esquiva poco
      energia: 0.5,    // todavía no domina el ki: es físico/tanque
      ki: 100
    }
  },
  yamcha: {
    id: 'yamcha',
    name: 'Yamcha',
    rarity: 'SR',
    description: 'Bandido del desierto y maestro del Puño del Colmillo de Lobo. Más fuerte, algo más lento.',
    unlocked: false,           // se consigue con copias del gacha
    energy: true,
    skills: ['rogafufuken', 'katana', 'lanzacohetes'],
    portrait: 'assets/enemigos/yamcha/idle.png',
    base: { hp: 115, fuerza: 1.1, velocidad: 0.95, magnet: 1.0, recarga: 1.0, evasion: 0.03, energia: 1.0, ki: 100 }
  }
};

/** Definición de cada stat mejorable */
const STAT_DEFS = [
  { key: 'hp',        label: 'Vida',        unit: '',   perLevel: 12,   max: 15, costBase: 40 },
  { key: 'fuerza',    label: 'Fuerza',      unit: '×',  perLevel: 0.06, max: 15, costBase: 50 },
  { key: 'velocidad', label: 'Velocidad',   unit: '×',  perLevel: 0.04, max: 12, costBase: 45 },
  { key: 'magnet',    label: 'Imán XP',     unit: '×',  perLevel: 0.08, max: 10, costBase: 35 },
  { key: 'recarga',   label: 'Recarga',     unit: '×',  perLevel: -0.03, max: 10, costBase: 55 }, // menor = mejor (cdMul)
  { key: 'evasion',   label: 'Evasión',     unit: '%',  perLevel: 0.01, max: 10, costBase: 60, def: 0 },
  { key: 'energia',   label: 'Energía',     unit: '×',  perLevel: 0.06, max: 15, costBase: 50 },   // daño de ataques de energía
  { key: 'ki',        label: 'Ki',          unit: '',   perLevel: 8,    max: 10, costBase: 40, def: 100 }  // reserva que gastan las habilidades
];

let currentCharacterId = 'goku_kid';
let selectedCharId = 'goku_kid';

function getCurrentCharacter() {
  return CHARACTERS[currentCharacterId] || CHARACTERS.goku_kid;
}

function getUnlockedCharacters() {
  return Object.values(CHARACTERS).filter(c => c.unlocked || (typeof getCopies === 'function' && getCopies(c.id) > 0));
}

/** Niveles de mejora guardados por personaje */
function getUpgrades(charId) {
  const all = store.get('ds_upgrades', {}) || {};
  const u = all[charId] || {};
  const out = {};
  STAT_DEFS.forEach(s => { out[s.key] = Math.min(s.max, u[s.key] | 0); });
  return out;
}

function setUpgrade(charId, key, level) {
  const all = store.get('ds_upgrades', {}) || {};
  if (!all[charId]) all[charId] = {};
  all[charId][key] = level;
  store.set('ds_upgrades', all);
}

/** Stats finales = base + mejoras */
function getEffectiveStats(charId) {
  const ch = CHARACTERS[charId] || CHARACTERS.goku_kid;
  const base = ch.base || {};
  const up = getUpgrades(charId);
  const st = {};
  STAT_DEFS.forEach(s => {
    const b = base[s.key] != null ? base[s.key] : (s.def != null ? s.def : s.key === 'hp' ? 100 : 1);
    st[s.key] = b + up[s.key] * s.perLevel;
  });
  return st;
}

/** Costo del siguiente nivel de un stat */
function upgradeCost(charId, key) {
  const def = STAT_DEFS.find(s => s.key === key);
  if (!def) return 99999;
  const lv = getUpgrades(charId)[key] | 0;
  if (lv >= def.max) return null; // max
  return Math.floor(def.costBase * (1 + lv * 0.75));
}

function tryUpgrade(charId, key) {
  const cost = upgradeCost(charId, key);
  if (cost == null) return { ok: false, reason: 'max' };
  if (getZeni() < cost) return { ok: false, reason: 'zeni' };
  // gastar zeni
  store.set('ds_zeni', getZeni() - cost);
  const lv = (getUpgrades(charId)[key] | 0) + 1;
  setUpgrade(charId, key, lv);
  return { ok: true, level: lv, cost };
}
