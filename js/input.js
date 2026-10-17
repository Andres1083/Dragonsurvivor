'use strict';
/* ---------- entrada: teclado, mando, táctil ---------- */
const keys = new Set(), tapped = new Set();
addEventListener('keydown', e => { if (!keys.has(e.code)) tapped.add(e.code); keys.add(e.code); if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault(); });
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('blur', () => keys.clear());
const pad = { x: 0, y: 0, down: new Set(), press: new Set() };
function readPad() {
  const prev = pad.down; pad.down = new Set(); pad.press = new Set(); pad.x = 0; pad.y = 0;
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  for (const p of pads) {
    if (!p || !p.connected) continue;
    p.buttons.forEach((b, i) => { if (b.pressed || b.value > 0.5) pad.down.add(i); });
    const ax = p.axes[0] || 0, ay = p.axes[1] || 0, m = Math.hypot(ax, ay);
    if (m > 0.22) { const k = Math.min(1, (m - 0.22) / 0.78) / m; pad.x += ax * k; pad.y += ay * k; }
    if (pad.down.has(14)) pad.x -= 1; if (pad.down.has(15)) pad.x += 1; if (pad.down.has(12)) pad.y -= 1; if (pad.down.has(13)) pad.y += 1;
  }
  for (const b of pad.down) if (!prev.has(b)) pad.press.add(b);
  const m = Math.hypot(pad.x, pad.y); if (m > 1) { pad.x /= m; pad.y /= m; }
}
const touch = { id: null, ox: 0, oy: 0, x: 0, y: 0, vx: 0, vy: 0 };
cv.addEventListener('touchstart', e => { const t = e.changedTouches[0]; if (touch.id === null) { touch.id = t.identifier; touch.ox = touch.x = t.clientX; touch.oy = touch.y = t.clientY; } e.preventDefault(); }, { passive: false });
cv.addEventListener('touchmove', e => { for (const t of e.changedTouches) if (t.identifier === touch.id) { touch.x = t.clientX; touch.y = t.clientY; } e.preventDefault(); }, { passive: false });
const endT = e => { for (const t of e.changedTouches) if (t.identifier === touch.id) { touch.id = null; touch.vx = touch.vy = 0; } };
cv.addEventListener('touchend', endT); cv.addEventListener('touchcancel', endT);
function moveVec() {
  if (touch.id !== null) {
    let dx = touch.x - touch.ox, dy = touch.y - touch.oy; const m = Math.hypot(dx, dy), R = 60;
    if (m > R) { touch.ox = touch.x - dx / m * R; touch.oy = touch.y - dy / m * R; dx = touch.x - touch.ox; dy = touch.y - touch.oy; }
    const k = Math.min(1, m / R); touch.vx = m > 8 ? dx / Math.max(m, 1) * k : 0; touch.vy = m > 8 ? dy / Math.max(m, 1) * k : 0;
    if (touch.vx || touch.vy) return [touch.vx, touch.vy];
  }
  if (pad.x || pad.y) return [pad.x, pad.y];
  let x = 0, y = 0;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) x--; if (keys.has('KeyD') || keys.has('ArrowRight')) x++;
  if (keys.has('KeyW') || keys.has('ArrowUp')) y--; if (keys.has('KeyS') || keys.has('ArrowDown')) y++;
  const m = Math.hypot(x, y); return m ? [x / m, y / m] : [0, 0];
}

