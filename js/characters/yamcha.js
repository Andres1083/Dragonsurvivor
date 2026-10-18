'use strict';
/* Yamcha jugable: cuadros de su hoja de sprites (assets/personajes/yamcha). Miran a la derecha. */
const YAM_PATH = 'assets/personajes/yamcha/';
const YAM_COUNTS = { idle: 6, run: 4, punch: 3, kick: 2, roga: 6, katana: 5, bazo: 10, death: 4, hit: 1, rocket: 2 };
const YAM_AX = {"idle_1": 23, "idle_2": 23, "idle_3": 22, "idle_4": 20, "idle_5": 21, "idle_6": 22, "run_1": 27, "run_2": 27, "run_3": 23, "run_4": 23, "punch_1": 23, "punch_2": 22, "punch_3": 22, "kick_1": 28, "kick_2": 28, "roga_1": 22, "roga_2": 22, "roga_3": 22, "roga_4": 22, "roga_5": 22, "roga_6": 22, "katana_1": 18, "katana_2": 22, "katana_3": 22, "katana_4": 23, "katana_5": 23, "bazo_1": 22, "bazo_2": 22, "bazo_3": 22, "bazo_4": 21, "bazo_5": 20, "bazo_6": 22, "bazo_7": 22, "bazo_8": 22, "bazo_9": 22, "bazo_10": 22, "death_1": 27, "death_2": 29, "death_3": 30, "death_4": 32, "hit_1": 27, "rocket_1": 20, "rocket_2": 22, "portrait": 15};
const yam = {};
for (const k in YAM_COUNTS) for (let i = 1; i <= YAM_COUNTS[k]; i++) { const n = k + '_' + i, img = new Image(); img.src = YAM_PATH + n + '.png'; img.axKey = n; yam[n] = img; }
const YAM_SCALE = 1.55;

function yamReady(img) { return img && img.complete && img.naturalWidth; }

/** Elige el cuadro de Yamcha según lo que esté haciendo (habilidad > ataque básico > moverse > reposo) */
function yamPick(moving) {
  if (P.poseT > 0 && typeof P.poseN === 'string' && yamReady(yam[P.poseN])) return yam[P.poseN];
  if (P.a.kick > 0) return yam['kick_' + (1 + Math.floor(time * 12) % 2)];
  if (P.a.punch > 0 || P.a.ki > 0) return yam['punch_' + (2 + Math.floor(time * 12) % 2)];
  if (moving) return yam['run_' + (1 + Math.floor(P.walk * 0.7) % 4)];
  return yam['idle_' + (1 + Math.floor(time * 5) % 6)];
}
function drawYamchaHero(moving) {
  const img = yamPick(moving);
  if (!yamReady(img)) return;
  const dw = img.naturalWidth * YAM_SCALE, dh = img.naturalHeight * YAM_SCALE;
  const ax = (YAM_AX[img.axKey] != null ? YAM_AX[img.axKey] : img.naturalWidth / 2) * YAM_SCALE;
  ctx.drawImage(img, -ax, -dh + 6, dw, dh);
}
