
'use strict';
/* Personaje: Kid Goku */
const GOKU_PATH = 'assets/personajes/goku_kid/';
const gokuFrames = { idle: [], walk: [], punch: [], kick: [], ki: [] };
let spriteLoaded = false;

(function loadGokuFrames() {
  const list = [
    ['idle',  'idle_01.png'],
    ['punch', 'punch_01.png'], ['punch', 'punch_02.png'], ['punch', 'punch_03.png'],
    ['kick',  'kick_01.png'],  ['kick',  'kick_02.png'],  ['kick',  'kick_03.png'],
    ['ki',    'ki_01.png'],    ['ki',    'ki_02.png']
  ];
  let pending = list.length;
  list.forEach(([key, file]) => {
    const img = new Image();
    img.onload = () => { if (--pending === 0) { spriteLoaded = true; console.log('¡Kid Goku listo!'); } };
    img.onerror = () => { console.warn('Fallo al cargar', file); if (--pending === 0) spriteLoaded = true; };
    img.src = GOKU_PATH + file; img.axKey = file.replace('.png', '');
    gokuFrames[key].push(img);
  });
})();

/* poses nuevas de Kid Goku (hoja con el báculo): 1-3 guardia/respiración, 4-5 estocada, 6 patada, 7 puñetazo */
const gokuWalk8 = [];
for (let i = 1; i <= 8; i++) { const img = new Image(); img.src = GOKU_PATH + 'walk_0' + i + '.png'; img.axKey = 'walk_0' + i; gokuWalk8.push(img); }
// Anclas X (px del sprite) bajo los pies de cada cuadro, para que Goku no "salte" de lado entre poses
const GOKU_AX = {"idle_01": 16, "ki_01": 20, "ki_02": 21, "pose_01": 16, "pose_02": 16, "pose_03": 16, "pose_04": 16, "pose_05": 16, "pose_06": 26, "pose_07": 20, "punch_01": 20, "punch_02": 15, "punch_03": 15, "staffA_1": 20, "staffA_2": 20, "staffA_3": 20, "staffA_4": 20, "staffB_0": 20, "staffB_1": 18, "staffB_2": 20, "staffB_3": 20, "staffB_4": 20, "walk_01": 18, "walk_02": 20, "walk_03": 19, "walk_04": 18, "walk_05": 20, "walk_06": 19, "walk_07": 18, "walk_08": 20};
const GOKU_POSE_NAMES = [null, 'pose_01', 'pose_02', 'pose_03', 'pose_04', 'pose_05', 'pose_06', 'pose_07',
  'staffA_1', 'staffA_2', 'staffA_3', 'staffA_4', 'staffB_0', 'staffB_1', 'staffB_2', 'staffB_3', 'staffB_4'];
const gokuPose = GOKU_POSE_NAMES.map(n => { if (!n) return null; const img = new Image(); img.src = GOKU_PATH + n + '.png'; img.axKey = n; return img; });
const IDLE_POSES = [1, 2, 3, 2];
function drawHero() {
  const f = P.face, sw = Math.sin(P.walk), moving = P.moving;

  if (P.inv > 0 && Math.floor(P.inv * 25) % 2) ctx.globalAlpha = 0.45;
  ctx.save(); ctx.translate(P.x, P.y);

  ctx.fillStyle = 'rgba(0,0,0,.25)';
  ctx.beginPath(); ctx.ellipse(-3 * f, 2, 17, 3.5, 0, 0, TAU); ctx.fill();

  const bob = moving && P.a.punch <= 0 && P.a.kick <= 0 && P.a.ki <= 0
    ? Math.abs(sw) * -0.8
    : Math.sin(time * 3) * 0.8;
  ctx.translate(0, bob + (P.water ? 5 : 0));

  if (P.water) { ctx.beginPath(); ctx.rect(-80, -200, 160, 200); ctx.clip(); }

  if (P.charId === 'yamcha' && yamchaIdle.complete && yamchaIdle.naturalWidth) {
    // Yamcha jugable: mismos sprites del jefe (miran a la derecha)
    ctx.save(); ctx.scale(f, 1); ctx.imageSmoothingEnabled = false;
    const atk = P.a.punch > 0 || P.a.kick > 0 || P.a.ki > 0;
    const set = atk ? yamchaAttack : yamchaWalk;
    let img = yamchaIdle;
    if (atk) img = set[Math.floor((time * 14)) % set.length] || img;
    else if (moving) img = set[Math.floor(P.walk * 1.2) % set.length] || img;
    const dh = 78, dw = dh * img.naturalWidth / img.naturalHeight;
    ctx.drawImage(img, -dw / 2, -dh + 8, dw, dh);
    ctx.restore();
  } else if (spriteLoaded) {
    ctx.save();
    ctx.scale(f, 1);

    let img = gokuFrames.idle[0];
    const scale = 1.85;

    if (P.dodgeT > 0 && dodgeImg.complete && dodgeImg.naturalWidth) {
      img = dodgeImg;
    } else if (P.poseT > 0 && gokuPose[P.poseN] && gokuPose[P.poseN].complete && gokuPose[P.poseN].naturalWidth) {
      img = gokuPose[P.poseN];
    } else if (P.a.ki > 0) {
      const idx = P.a.ki > 0.14 ? 0 : Math.min(1, gokuFrames.ki.length - 1);
      img = gokuFrames.ki[idx] || img;
    } else if (P.a.kick > 0) {
      const t = 1 - P.a.kick / 0.38;
      const idx = Math.min(gokuFrames.kick.length - 1, Math.floor(t * gokuFrames.kick.length));
      img = gokuFrames.kick[idx] || img;
    } else if (P.a.punch > 0) {
      const t = 1 - P.a.punch / 0.22;
      const idx = Math.min(gokuFrames.punch.length - 1, Math.floor(t * gokuFrames.punch.length));
      img = gokuFrames.punch[idx] || img;
    } else if (!moving && gokuPose[1].complete && gokuPose[1].naturalWidth) {
      img = gokuPose[IDLE_POSES[Math.floor(time * 3.5) % IDLE_POSES.length]] || img;
    } else if (moving && gokuWalk8[0].complete && gokuWalk8[0].naturalWidth) {
      img = gokuWalk8[Math.floor(P.walk * 0.8) % gokuWalk8.length];
    }

    if (img && img.complete && img.naturalWidth) {
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      const ax = img.axKey && GOKU_AX[img.axKey] != null ? GOKU_AX[img.axKey] * scale : dw / 2;
      ctx.drawImage(img, -ax, -dh + 6, dw, dh);
    }
    ctx.restore();
  } else {
    ctx.fillStyle = '#ff7700';
    ctx.beginPath(); ctx.arc(0, -15, 14, 0, TAU); ctx.fill();
  }

  ctx.restore(); ctx.globalAlpha = 1;
}
