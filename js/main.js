'use strict';
/* ---------- bucle principal ---------- */
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  try {
    readPad();
    if ((tapped.has('Escape') || tapped.has('KeyP') || pad.press.has(9)) && (state === 'play' || state === 'pause')) togglePause();
    else if (state !== 'play') menuInput();
    if (state === 'play') update(dt);
    if (P) render(); else { ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.fillStyle = '#4a9a45'; ctx.fillRect(0, 0, W, H); drawTitleBg(now / 1000); }
  } catch (err) { console.error(err); }
  tapped.clear();
}
function drawTitleBg(t) { camx = Math.sin(t * 0.1) * 300; camy = t * 20; ctx.setTransform(DPR * Z, 0, 0, DPR * Z, -camx * DPR * Z, -camy * DPR * Z); drawWorld(camx, camy, W / Z, H / Z, t); }
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'play') togglePause(); });
refreshBest();
requestAnimationFrame(frame);
// para pruebas y depuración desde la consola
window.DS = { get P() { return P; }, get state() { return state; }, startRun, get enemies() { return enemies; }, get time() { return time; }, set time(v) { time = v; } };
