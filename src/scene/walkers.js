/* Staff walking inside the building. Purely visual: uses Math.random-style rnd(), never the game RNG,
   so the simulation stays deterministic. Pure functions so tests can run them in node.
   L = building layout from layout.js (T0: 2 guest floors, T1/T2: 4). */
import { LAYOUT_T0 } from './layout.js';

export const SPEED = 24;          // px per second
export const STEP_FRAME = 0.18;   // seconds per walking frame
export const FRAME = { idle: 0, walk1: 1, walk2: 2, serve: 3 };

const rand = (rnd, a, b) => a + rnd() * (b - a);
const guestFloors = L => L.floors.map((f, i) => i).slice(1);

/* role: 'fo' works the reception desk, 'hk' the guest floors, 'fb' the restaurant tables in the lobby. */
export function makeWalker(id, row, rnd, role = 'fo', L = LAYOUT_T0) {
  const floor = role === 'hk' ? 1 : 0;
  return { id, row, role, floor, x: rand(rnd, L.walk[0], L.walk[1]), tx: 0, dir: 1, mode: 'idle', then: null, wait: rand(rnd, 0.3, 1.5), anim: 0, L };
}

function go(w, x, then) {
  w.tx = Math.max(w.L.walk[0], Math.min(w.L.walk[1], x));
  w.then = then;
  w.mode = 'walk';
}

/* Choose the next thing to do once the current one ends. */
function plan(w, rnd, L) {
  const r = rnd(), [lo, hi] = L.walk, stairs = L.stairsX, rest = L.restX;
  if (w.role !== 'hk') {
    if (w.floor !== 0) return go(w, stairs, 'stairs');
    if (w.role === 'fb') return r < 0.6 ? go(w, rand(rnd, rest[0], rest[1]), 'serve') : go(w, rand(rnd, rest[0] - 20, hi), 'idle');
    if (r < 0.45) return go(w, L.deskX + rand(rnd, -6, 6), 'serve');
    return go(w, rand(rnd, lo, hi), 'idle');
  }
  if (w.floor === 0) return go(w, stairs, 'stairs'); // housekeeping heads back up to the rooms
  if (r < 0.5) {
    const rooms = L.rooms.filter(rm => rm.floor === w.floor);
    const room = rooms[Math.floor(rnd() * rooms.length)];
    return go(w, room.x + room.w / 2, 'serve');
  }
  if (r < 0.6) return go(w, stairs, 'stairs');
  return go(w, rand(rnd, lo, hi), 'idle');
}

/* Advance one walker by dt seconds. Passing a new layout (the hotel grew) keeps the walker on a valid floor. */
export function stepWalker(w, dt, rnd, L = w.L) {
  if (L !== w.L) { w.L = L; w.floor = Math.min(w.floor, L.floors.length - 1); w.x = Math.max(L.walk[0], Math.min(L.walk[1], w.x)); }
  w.anim += dt;
  if (w.mode === 'walk') {
    const d = w.tx - w.x;
    if (Math.abs(d) <= SPEED * dt) {
      w.x = w.tx;
      if (w.then === 'stairs') {
        // Take the stairs to another floor and pause there briefly.
        const floors = w.role === 'hk' ? guestFloors(L) : [0];
        const others = floors.filter(f => f !== w.floor);
        w.floor = others.length ? others[Math.floor(rnd() * others.length)] : floors[0];
        w.mode = 'idle'; w.wait = rand(rnd, 0.4, 1.2);
      } else if (w.then === 'serve') {
        w.mode = 'serve'; w.wait = rand(rnd, 1.2, 2.5);
      } else {
        w.mode = 'idle'; w.wait = rand(rnd, 0.8, 2.5);
      }
    } else {
      w.dir = d > 0 ? 1 : -1;
      w.x += w.dir * SPEED * dt;
    }
    return w;
  }
  w.wait -= dt;
  if (w.wait <= 0) plan(w, rnd, L);
  return w;
}

export function frameOf(w) {
  if (w.mode === 'serve') return FRAME.serve;
  if (w.mode === 'walk') return Math.floor(w.anim / STEP_FRAME) % 2 ? FRAME.walk2 : FRAME.walk1;
  return FRAME.idle;
}

/* Feet position (bottom of the floor band) for drawing. */
export const feetY = w => w.L.floors[w.floor].bottom;
