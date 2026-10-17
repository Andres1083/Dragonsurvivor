'use strict';
/* ---------- mundo: bioma de montaña, bosque y río ---------- */
const T = 48;
/* árboles pixel art */
const treeOak = new Image(); treeOak.src = 'assets/world/tree_oak.png';
const treePine = new Image(); treePine.src = 'assets/world/tree_pine.png';

function terrain(tx, ty) {
  const dx = tx, dy = ty;
  const near = Math.hypot(dx, dy) < 7;                       // zona de inicio siempre es pradera
  if (!near) {
    const river = Math.abs(vnoise(tx * 0.045 + 50, ty * 0.045 + 20) - 0.5) < 0.028;
    if (river) return 'water';
  }
  const hi = vnoise(tx * 0.06 + 200, ty * 0.06 + 90);
  if (!near && hi > 0.64) return 'rock';
  const d = vnoise(tx * 0.12 + 9, ty * 0.12 + 40);
  if (d > 0.7) return 'dirt';
  return 'grass';
}
function drawWorld(camx, camy, vw, vh, time) {
  const x0 = Math.floor(camx / T) - 1, x1 = Math.floor((camx + vw) / T) + 1;
  const y0 = Math.floor(camy / T) - 1, y1 = Math.floor((camy + vh) / T) + 1;
  const trees = [];
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const k = terrain(tx, ty), h = hash(tx, ty), px = tx * T, py = ty * T;
    let col;
    if (k === 'water') { const w = 0.5 + 0.5 * Math.sin(time * 1.5 + tx * 0.7 + ty * 0.5); col = `rgb(${54 + w * 14},${150 + w * 18},${215 + w * 10})`; }
    else if (k === 'rock') { const g = 138 + h * 26; col = `rgb(${g},${g - 4},${g - 12})`; }
    else if (k === 'dirt') { const g = h * 22; col = `rgb(${200 - g},${160 - g},${100 - g * .6})`; }
    else { const g = h * 24; col = `rgb(${88 - g * .5},${178 - g},${70 - g * .4})`; }
    ctx.fillStyle = col; ctx.fillRect(px, py, T + 1, T + 1);
    if (k === 'water') {
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.beginPath();
      const wy = py + 14 + h * 20, wx = px + 6 + Math.sin(time + tx) * 4; ctx.moveTo(wx, wy); ctx.quadraticCurveTo(wx + 10, wy - 5, wx + 20, wy); ctx.stroke();
    } else if (k === 'grass') {
      if (h > 0.55 && h < 0.8) { ctx.strokeStyle = 'rgba(30,110,40,.55)'; ctx.lineWidth = 2; ctx.beginPath(); const gx = px + h * 40, gy = py + 20 + h * 14; ctx.moveTo(gx, gy); ctx.lineTo(gx - 3, gy - 8); ctx.moveTo(gx, gy); ctx.lineTo(gx + 3, gy - 9); ctx.stroke(); }
      if (h > 0.96) { ctx.fillStyle = h > 0.98 ? '#ffe45c' : '#ff9ad0'; ctx.beginPath(); ctx.arc(px + 24, py + 26, 3, 0, TAU); ctx.fill(); }
      if (h < 0.045) trees.push([px + 24, py + 30, h]);
    } else if (k === 'rock') {
      if (h > 0.8) { // peñasco
        const bx = px + 24, by = py + 28, r = 14 + (h - 0.8) * 60;
        ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(bx + 3, by + r * .55, r, r * .35, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#8b8a82'; ctx.beginPath(); ctx.moveTo(bx - r, by + r * .5); ctx.lineTo(bx - r * .6, by - r * .6); ctx.lineTo(bx + r * .2, by - r); ctx.lineTo(bx + r, by + r * .2); ctx.lineTo(bx + r * .8, by + r * .55); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#b9b8ae'; ctx.beginPath(); ctx.moveTo(bx - r * .6, by - r * .6); ctx.lineTo(bx + r * .2, by - r); ctx.lineTo(bx + r * .1, by - r * .1); ctx.lineTo(bx - r * .5, by); ctx.closePath(); ctx.fill();
      }
    } else if (k === 'dirt' && h > 0.9) { ctx.fillStyle = 'rgba(90,60,30,.35)'; ctx.beginPath(); ctx.ellipse(px + 20, py + 28, 6, 3, 0, 0, TAU); ctx.fill(); }
  }
  for (const [x, y, h] of trees) {
    const pine = ((h * 1000) | 0) % 2 === 0;
    const img = pine ? treePine : treeOak;
    const sc = pine ? (0.35 + h * 2.4) : (0.28 + h * 2.0);
    const iw = (img.naturalWidth || 40) * sc * 0.18;
    const ih = (img.naturalHeight || 50) * sc * 0.18;
    ctx.fillStyle = 'rgba(0,0,0,.22)';
    ctx.beginPath(); ctx.ellipse(x, y + 2, iw * 0.35, Math.max(4, ih * 0.06), 0, 0, TAU); ctx.fill();
    if (img.complete && img.naturalWidth) {
      ctx.drawImage(img, x - iw / 2, y - ih + 4, iw, ih);
    } else {
      // fallback simple
      ctx.fillStyle = '#7b4b25'; ctx.fillRect(x - 4, y - 20, 8, 22);
      ctx.fillStyle = '#2f8f3c'; ctx.beginPath(); ctx.arc(x, y - 28, 16, 0, TAU); ctx.fill();
    }
  }
}

