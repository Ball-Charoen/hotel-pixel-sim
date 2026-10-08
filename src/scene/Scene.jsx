/* Live pixel scene: the hostel cross-section with lit rooms and the player's staff walking around. */
import { useEffect, useRef } from 'preact/hooks';
import { clamp, ROOMS as ROOM_COUNT } from '../sim/core.js';
import { W, H, ROOMS, SPRITE } from './layout.js';
import { C, drawBuilding, drawStaffSheet } from './placeholders.js';
import { loadSprite, staffRow } from './sprites.js';
import { makeWalker, stepWalker, frameOf, feetY } from './walkers.js';
import { player } from '../ui/session.js';
import { t } from '../i18n/index.js';

const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function Scene({ G }) {
  const cv = useRef(null);
  const state = useRef({ walkers: [], art: null, sheet: null, lit: 0, closed: 0 });
  const h = player(G);
  const last = h.history[h.history.length - 1];
  const lit = Math.round(clamp(last ? last.occ : 0, 0, 1) * ROOM_COUNT);
  const closed = h.closed || 0;
  const staffIds = h.staff.map(s => s.id);

  // Keep one walker per hired staff member; new hires start in the lobby.
  const st = state.current;
  st.lit = lit; st.closed = closed;
  st.walkers = staffIds.map(id => st.walkers.find(w => w.id === id) || makeWalker(id, staffRow(id), Math.random, 0));

  useEffect(() => {
    let alive = true;
    st.art = drawBuilding();
    st.sheet = drawStaffSheet();
    loadSprite('building-t0.png').then(img => { if (img && alive) st.art = img; });
    loadSprite('staff-sprites.png').then(img => { if (img && alive) st.sheet = img; });

    const g = cv.current.getContext('2d');
    g.imageSmoothingEnabled = false;
    const still = reducedMotion();
    let prev = performance.now(), raf = 0;
    const frame = now => {
      const dt = Math.min(0.1, (now - prev) / 1000);
      prev = now;
      if (!still) st.walkers.forEach(w => stepWalker(w, dt, Math.random));
      g.drawImage(st.art, 0, 0, W, H);
      // Window lights follow last week's occupancy; red bar = closed for repair (same rule as before).
      ROOMS.forEach((r, k) => {
        const isClosed = st.closed && k >= ROOM_COUNT - st.closed;
        if (isClosed) { g.fillStyle = C.red; g.fillRect(r.x, r.y + r.h / 2 - 3, r.w, 6); }
        else if (k < st.lit) { g.globalAlpha = 0.8; g.fillStyle = C.lamp; g.fillRect(r.x, r.y, r.w, r.h); g.globalAlpha = 1; }
      });
      st.walkers.slice().sort((a, b) => a.floor - b.floor).forEach(w => {
        const sx = frameOf(w) * SPRITE, sy = w.row * SPRITE;
        const x = Math.round(w.x - SPRITE / 2), y = feetY(w) - SPRITE;
        if (w.dir < 0) {
          g.save(); g.translate(x + SPRITE, y); g.scale(-1, 1);
          g.drawImage(st.sheet, sx, sy, SPRITE, SPRITE, 0, 0, SPRITE, SPRITE);
          g.restore();
        } else g.drawImage(st.sheet, sx, sy, SPRITE, SPRITE, x, y, SPRITE, SPRITE);
      });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { alive = false; cancelAnimationFrame(raf); };
  }, []);

  return (
    <div class="scene">
      <canvas ref={cv} width={W} height={H} role="img"
        aria-label={t('scene.aria', { lit, rooms: ROOM_COUNT, n: staffIds.length })} />
    </div>
  );
}
