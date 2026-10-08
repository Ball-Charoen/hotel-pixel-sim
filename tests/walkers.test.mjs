// Walking staff in the building scene stay inside the building. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeWalker, stepWalker, frameOf, feetY, FRAME } from '../src/scene/walkers.js';
import { WALK_MIN, WALK_MAX, FLOORS } from '../src/scene/layout.js';
import { mulberry32 } from '../src/sim/core.js';

test('walkers stay on a floor and inside the walls for 10 minutes of animation', () => {
  const rnd = mulberry32(7);
  const ws = [['c0', 'fo'], ['c1', 'fo'], ['c3', 'hk'], ['c4', 'hk']].map(([id, role], i) => makeWalker(id, i, rnd, role));
  const seen = { floors: new Set(), frames: new Set(), fo: new Set(), hk: new Set() };
  for (let i = 0; i < 600 * 30; i++) {
    ws.forEach(w => {
      stepWalker(w, 1 / 30, rnd);
      assert.ok(w.x >= WALK_MIN - 1e-9 && w.x <= WALK_MAX + 1e-9, `x ${w.x}`);
      assert.ok([0, 1, 2].includes(w.floor));
      assert.equal(feetY(w), FLOORS[w.floor].bottom);
      seen.floors.add(w.floor); seen.frames.add(frameOf(w)); seen[w.role].add(w.floor);
    });
  }
  assert.equal(seen.floors.size, 3, 'walkers visit every floor');
  assert.deepEqual([...seen.fo], [0], 'front office stays in the lobby');
  assert.deepEqual([...seen.hk].sort(), [1, 2], 'housekeeping works the guest floors');
  assert.deepEqual([...seen.frames].sort(), Object.values(FRAME).sort(), 'all 4 sprite frames are used');
});
