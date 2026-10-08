/* Live pixel scene: the building cross-section (grows with the hotel) with lit rooms and the player's staff. */
import { useEffect, useRef } from 'preact/hooks';
import { clamp } from '../sim/core.js';
import { W, H, SPRITE, layoutFor } from './layout.js';
import { C, drawBuilding, drawScaffold, drawStaffSheet } from './placeholders.js';
import { loadSprite, staffRow } from './sprites.js';
import { makeWalker, stepWalker, frameOf, feetY } from './walkers.js';
import { player } from '../ui/session.js';
import { t } from '../i18n/index.js';

const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const artName = (rooms, restaurant) => (restaurant ? 'building-t2.png' : rooms > 8 ? 'building-t1.png' : 'building-t0.png');

export function Scene({ G }) {
  const cv = useRef(null);
  const state = useRef({ walkers: [], art: null, artKey: '', sheet: null, lit: 0, closed: 0, L: null, building: false });
  const h = player(G);
  const last = h.history[h.history.length - 1];
  const L = layoutFor(h.rooms, h.restaurant);
  const roomCount = L.rooms.length;
  const lit = Math.round(clamp(last ? last.occ : 0, 0, 1) * roomCount);
  const closed = h.closed || 0;
  const staffIds = h.staff.map(s => s.id);
  const roleOf = id => h.staff.find(s => s.id === id).role;

  // Keep one walker per hired staff member; new hires start on their own floor.
  const st = state.current;
  st.lit = lit; st.closed = closed; st.L = L; st.building = !!(h.proj && h.proj.build);
  st.walkers = staffIds.map(id => st.walkers.find(w => w.id === id) || makeWalker(id, staffRow(id), Math.random, roleOf(id), L));

  // Building picture for the current size: owner PNG if present, else placeholder.
  const key = artName(h.rooms, h.restaurant);
  if (st.artKey !== key && typeof document !== 'undefined') {
    st.artKey = key;
    st.art = drawBuilding(L, { restaurant: h.restaurant });
    loadSprite(key).then(img => { if (img && st.artKey === key) st.art = img; });
  }

  useEffect(() => {
    let alive = true;
    st.sheet = drawStaffSheet();
    loadSprite('staff-sprites.png').then(img => { if (img && alive) st.sheet = img; });

    const g = cv.current.getContext('2d');
    g.imageSmoothingEnabled = false;
    const still = reducedMotion();
    let prev = performance.now(), raf = 0;
    const frame = now => {
      const dt = Math.min(0.1, (now - prev) / 1000);
      prev = now;
      if (!still) st.walkers.forEach(w => stepWalker(w, dt, Math.random, st.L));
      g.drawImage(st.art, 0, 0, W, H);
      // Window lights follow last week's occupancy; red bar = closed for repair (same rule as before).
      const rooms = st.L.rooms;
      rooms.forEach((r, k) => {
        const isClosed = st.closed && k >= rooms.length - st.closed;
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
      if (st.building) drawScaffold(g);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { alive = false; cancelAnimationFrame(raf); };
  }, []);

  return (
    <div class="scene">
      <canvas ref={cv} width={W} height={H} role="img"
        aria-label={t('scene.aria', { lit, rooms: roomCount, n: staffIds.length })} />
    </div>
  );
}
