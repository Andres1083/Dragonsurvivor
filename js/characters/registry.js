'use strict';
/* Registro de personajes + mejoras con Zeni */

const CHARACTERS = {
  goku_kid: {
    id: 'goku_kid',
    name: 'Kid Goku',
    rarity: 'N',
    description: 'El pequeño guerrero saiyajin. Equilibrado y listo para pelear.',
    unlocked: true,
    dodge: true,     // tiene Esquiva (impulso con invulnerabilidad breve)
    energy: false,   // sin ataques de energía (la onda de ki queda para versiones posteriores)
    startCopies: 1,
    skills: ['baculo_sagrado', 'baculo_giro', 'baculo_boomerang', 'jankenpon'],
    passives: [
      { id: 'cola', stars: 2, name: 'Cola ágil', desc: '+3% de evasión.' },
      { id: 'resist', stars: 3, name: 'Resistencia', desc: '+10% de vida máxima.' },
      { id: 'carga', stars: 4, name: 'Carga de Ki', desc: 'Si te quedas quieto más de 1 s, el Ki se recarga ×3.' },
      { id: 'repel', stars: 5, name: 'Aura repelente', desc: 'Cargando Ki quieto, cada 3 s empujas a los enemigos cercanos.' }
    ],
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
    rarity: 'R',
    description: 'Bandido del desierto y maestro del Puño del Colmillo de Lobo. Más fuerte, algo más lento.',
    unlocked: false,           // se consigue con copias del gacha
    energy: true,
    skills: ['rogafufuken', 'katana', 'lanzacohetes'],
    passives: [
      { id: 'instinto', stars: 1, name: 'Instinto de bandido', desc: '+8% de daño físico.' },
      { id: 'ligero', stars: 2, name: 'Paso ligero', desc: '+10% de velocidad.' },
      { id: 'kireserva', stars: 3, name: 'Reserva de Ki', desc: '+20% de Ki máximo y de recarga.' },
      { id: 'evade', stars: 4, name: 'Reflejos', desc: '+5% de evasión.' }
    ],
    portrait: 'assets/personajes/yamcha/portrait.png',
    base: { hp: 115, fuerza: 1.1, velocidad: 0.95, magnet: 1.0, recarga: 1.0, evasion: 0.03, energia: 1.0, ki: 100 }
  },
  goku_adulto: {
    id: 'goku_adulto',
    name: 'Goku',
    rarity: 'SR',
    description: 'El guerrero saiyajin ya adulto, con el gi naranja de la Tortuga. Combate cuerpo a cuerpo: patadas, ráfagas de puños y vuelo.',
    unlocked: false,           // se consigue en los sobres
    energy: true,
    skills: ['patada_creciente', 'rafaga_punos', 'patada_voladora', 'kamehameha'],
    passives: [
      { id: 'instinto', stars: 1, name: 'Entrenamiento de la Tortuga', desc: '+8% de daño físico.' },
      { id: 'resist', stars: 2, name: 'Cuerpo curtido', desc: '+10% de vida máxima.' },
      { id: 'kireserva', stars: 3, name: 'Reserva de Ki', desc: '+20% de Ki máximo y de recarga.' },
      { id: 'ligero', stars: 4, name: 'Paso veloz', desc: '+10% de velocidad.' }
    ],
    portrait: 'assets/personajes/goku_adulto/portrait.png',
    base: { hp: 130, fuerza: 1.2, velocidad: 1.0, magnet: 1.0, recarga: 0.95, evasion: 0.05, energia: 0.8, ki: 120 }
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

const RARITY_NAMES = { N: 'Común', R: 'Poco común', SR: 'Rara', SSR: 'Épica' };

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
