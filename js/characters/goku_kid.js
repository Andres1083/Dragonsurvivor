
'use strict';
/* Personaje: Kid Goku */
const GOKU_PATH = 'assets/personajes/goku_kid/';
const gokuFrames = { idle: [], walk: [], punch: [], kick: [], ki: [] };
let spriteLoaded = false;

(function loadGokuFrames() {
  const list = [
    ['idle',  'idle_01.png'],
    ['walk',  'walk_01.png'], ['walk',  'walk_02.png'], ['walk',  'walk_03.png'],
    ['punch', 'punch_01.png'], ['punch', 'punch_02.png'], ['punch', 'punch_03.png'],
    ['kick',  'kick_01.png'],  ['kick',  'kick_02.png'],  ['kick',  'kick_03.png'],
    ['ki',    'ki_01.png'],    ['ki',    'ki_02.png']
  ];
  let pending = list.length;
  list.forEach(([key, file]) => {
    const img = new Image();
    img.onload = () => { if (--pending === 0) { spriteLoaded = true; console.log('¡Kid Goku listo!'); } };
    img.onerror = () => { console.warn('Fallo al cargar', file); if (--pending === 0) spriteLoaded = true; };
    img.src = GOKU_PATH + file;
    gokuFrames[key].push(img);
  });
})();

function drawHero() {
  const f = P.face, sw = Math.sin(P.walk), moving = P.moving;

  if (P.inv > 0 && Math.floor(P.inv * 25) % 2) ctx.globalAlpha = 0.45;
  ctx.save(); ctx.translate(P.x, P.y);

  ctx.fillStyle = 'rgba(0,0,0,.25)';
  ctx.beginPath(); ctx.ellipse(0, 7, 12, 4, 0, 0, TAU); ctx.fill();

  const bob = moving && P.a.punch <= 0 && P.a.kick <= 0 && P.a.ki <= 0
    ? Math.abs(sw) * -2.5
    : Math.sin(time * 3) * 0.8;
  ctx.translate(0, bob + (P.water ? 5 : 0));

  if (P.water) { ctx.beginPath(); ctx.rect(-30, -50, 60, 56); ctx.clip(); }

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
    const scale = 1.7;

    if (P.a.ki > 0) {
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
    } else if (moving && gokuFrames.walk.length) {
      const idx = Math.floor(P.walk * 2) % gokuFrames.walk.length;
      img = gokuFrames.walk[idx];
    }

    if (img && img.complete && img.naturalWidth) {
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(img, -dw / 2, -dh + 6, dw, dh);
    }
    ctx.restore();
  } else {
    ctx.fillStyle = '#ff7700';
    ctx.beginPath(); ctx.arc(0, -15, 14, 0, TAU); ctx.fill();
  }

  ctx.restore(); ctx.globalAlpha = 1;
}
