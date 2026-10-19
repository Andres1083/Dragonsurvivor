'use strict';
/* Goku adulto (SR): cuadros de su hoja de sprites (assets/personajes/goku_adulto). Miran a la derecha. */
const GAD_PATH = 'assets/personajes/goku_adulto/';
const GAD_COUNTS = { idle: 4, run: 6, punch: 3, kick: 2, crea: 4, raf: 6, vol: 5, death: 4, kame: 5 };
const GAD_AX = {"idle_1": 20, "idle_2": 20, "idle_3": 20, "idle_4": 19, "run_1": 21, "run_2": 20, "run_3": 20, "run_4": 18, "run_5": 17, "run_6": 16, "punch_1": 19, "punch_2": 18, "punch_3": 20, "kick_1": 20, "kick_2": 22, "raf_1": 19, "raf_2": 18, "raf_3": 19, "raf_4": 20, "raf_5": 19, "raf_6": 18, "vol_1": 19, "portrait": 13, "crea_1": 18, "crea_2": 20, "crea_3": 20, "crea_4": 28, "vol_2": 21, "vol_3": 31, "vol_4": 31, "vol_5": 30, "death_1": 18, "death_2": 21, "death_3": 29, "death_4": 28};
const gad = {};
for (const k in GAD_COUNTS) for (let i = 1; i <= GAD_COUNTS[k]; i++) { const n = k + '_' + i, img = new Image(); img.src = GAD_PATH + n + '.png'; img.axKey = n; gad[n] = img; }
const GAD_SCALE = 1.7;

function gadReady(img) { return img && img.complete && img.naturalWidth; }

/** Cuadro según lo que haga (habilidad > ataque básico > moverse > reposo) */
function gadPick(moving) {
  if (P.poseT > 0 && typeof P.poseN === 'string' && gadReady(gad[P.poseN])) return gad[P.poseN];
  if (P.a.kick > 0) return gad['kick_' + (1 + Math.floor(time * 12) % 2)];
  if (P.a.punch > 0 || P.a.ki > 0) return gad['punch_' + (1 + Math.floor(time * 12) % 3)];
  if (moving) return gad['run_' + (1 + Math.floor(P.walk * 0.7) % 6)];
  return gad['idle_' + (1 + Math.floor(time * 5) % 4)];
}
function drawGokuAdultoHero(moving) {
  const img = gadPick(moving);
  if (!gadReady(img)) return;
  const dw = img.naturalWidth * GAD_SCALE, dh = img.naturalHeight * GAD_SCALE;
  const ax = (GAD_AX[img.axKey] != null ? GAD_AX[img.axKey] : img.naturalWidth / 2) * GAD_SCALE;
  ctx.drawImage(img, -ax, -dh + 6, dw, dh);
}
