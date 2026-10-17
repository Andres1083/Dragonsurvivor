'use strict';
/* ---------- estado de la partida ---------- */
let state = 'title';
let P, enemies, gems, shots, eshots, parts, texts, fx, pending, time, kills, spawnT, bossN, camx, camy, shake, bossRef;
let runZeni = 0;
const WEAPON_MAX = 8;

function getZeni() {
  return store.get('ds_zeni', 0) | 0;
}
function addZeni(n) {
  if (!n) return getZeni();
  const total = getZeni() + n;
  store.set('ds_zeni', total);
  runZeni += n;
  return total;
}

function newRun() {
  currentCharacterId = selectedCharId || 'goku_kid';
  const ch = getCurrentCharacter();
  const st = getEffectiveStats(ch.id);

  // recarga: valores < 1 son mejores (cd más corto)
  const cdMul = Math.max(0.45, st.recarga != null ? st.recarga : 1);

  P = {
    x: 0, y: 0,
    hp: st.hp, maxHp: st.hp,
    speed: 175 * (st.velocidad || 1),
    r: 13, face: 1, dx: 1, dy: 0, walk: 0, inv: 0,
    lvl: 1, xp: 0, next: 6, moving: false,
    dmgMul: st.fuerza || 1,
    cdMul: cdMul,
    magnet: st.magnet || 1,
    regen: 0, armor: 0, water: false,
    a: { punch: 0, kick: 0, ki: 0 }, aim: [1, 0],
    w: { punch: 1, kick: 1, ki: 0 },
    cd: { punch: 0.3, kick: 1.6, ki: 1 },
    charId: ch.id
  };
  enemies = []; gems = []; shots = []; eshots = []; parts = []; texts = []; fx = []; pending = [];
  time = 0; kills = 0; spawnT = 0; bossN = 0; shake = 0; bossRef = null;
  runZeni = 0;
  camx = -W / 2; camy = -H / 2;
  if (typeof resetSkills === 'function') resetSkills();
}
