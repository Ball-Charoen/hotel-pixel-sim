/* Staff walking inside the building. Purely visual: uses Math.random-style rnd(), never the game RNG,
   so the simulation stays deterministic. Pure functions so tests can run them in node. */
import { FLOORS, ROOMS, WALK_MIN, WALK_MAX, STAIRS_X, DESK_X } from './layout.js';

export const SPEED = 24;          // px per second
export const STEP_FRAME = 0.18;   // seconds per walking frame
export const FRAME = { idle: 0, walk1: 1, walk2: 2, serve: 3 };

const rand = (rnd, a, b) => a + rnd() * (b - a);

/* role: 'fo' works the lobby (desk), 'hk' works the guest floors, others stay in the lobby. */
export function makeWalker(id, row, rnd, role = 'fo') {
  const floor = role === 'hk' ? 1 : 0;
  return { id, row, role, floor, x: rand(rnd, WALK_MIN, WALK_MAX), tx: 0, dir: 1, mode: 'idle', then: null, wait: rand(rnd, 0.3, 1.5), anim: 0 };
}

/* Choose the next thing to do once the current one ends. */
function plan(w, rnd) {
  const r = rnd();
  if (w.role !== 'hk') {
    // Front office (and anyone else) stays in the lobby, mostly at the reception desk.
    if (w.floor !== 0) return go(w, STAIRS_X, 'stairs');
    if (r < 0.45) return go(w, DESK_X + rand(rnd, -6, 6), 'serve');
    return go(w, rand(rnd, WALK_MIN, WALK_MAX), 'idle');
  }
  if (w.floor === 0) return go(w, STAIRS_X, 'stairs'); // housekeeping heads back up to the rooms
  if (r < 0.5) {
    const rooms = ROOMS.filter(rm => rm.floor === w.floor);
    const room = rooms[Math.floor(rnd() * rooms.length)];
    return go(w, room.x + room.w / 2, 'serve');
  }
  if (r < 0.55) return go(w, STAIRS_X, 'stairs');
  return go(w, rand(rnd, WALK_MIN, WALK_MAX), 'idle');
}

function go(w, x, then) {
  w.tx = Math.max(WALK_MIN, Math.min(WALK_MAX, x));
  w.then = then;
  w.mode = 'walk';
}

/* Advance one walker by dt seconds. */
export function stepWalker(w, dt, rnd) {
  w.anim += dt;
  if (w.mode === 'walk') {
    const d = w.tx - w.x;
    if (Math.abs(d) <= SPEED * dt) {
      w.x = w.tx;
      if (w.then === 'stairs') {
        // Take the stairs to another floor and pause there briefly.
        const floors = w.role === 'hk' ? [1, 2] : [0];
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
  if (w.wait <= 0) plan(w, rnd);
  return w;
}

export function frameOf(w) {
  if (w.mode === 'serve') return FRAME.serve;
  if (w.mode === 'walk') return Math.floor(w.anim / STEP_FRAME) % 2 ? FRAME.walk2 : FRAME.walk1;
  return FRAME.idle;
}

/* Feet position (bottom of the floor band) for drawing. */
export const feetY = w => FLOORS[w.floor].bottom;
