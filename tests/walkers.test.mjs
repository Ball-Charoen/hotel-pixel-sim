// Walking staff in the building scene stay inside the building. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeWalker, stepWalker, frameOf, feetY, FRAME } from '../src/scene/walkers.js';
import { LAYOUT_T0, LAYOUT_T1, LAYOUT_T2, layoutFor } from '../src/scene/layout.js';

const [WALK_MIN, WALK_MAX] = LAYOUT_T0.walk, FLOORS = LAYOUT_T0.floors;
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

test('after growing to 4 guest floors, housekeeping uses all of them and nobody leaves the layout', () => {
  const rnd = mulberry32(11);
  const ws = [['c0', 'fo'], ['c3', 'hk'], ['c4', 'hk'], ['c6', 'fb']].map(([id, role], i) => makeWalker(id, i, rnd, role));
  const seen = { hk: new Set(), fb: new Set(), fo: new Set() };
  for (let i = 0; i < 600 * 30; i++) ws.forEach(w => {
    stepWalker(w, 1 / 30, rnd, LAYOUT_T1);
    assert.ok(w.floor >= 0 && w.floor < LAYOUT_T1.floors.length);
    assert.equal(feetY(w), LAYOUT_T1.floors[w.floor].bottom);
    seen[w.role].add(w.floor);
  });
  assert.deepEqual([...seen.hk].sort(), [1, 2, 3, 4]);
  assert.deepEqual([...seen.fb], [0], 'F&B stays in the lobby restaurant');
  assert.deepEqual([...seen.fo], [0]);
});

test('every layout: windows sit inside their floor and the wall, stairs are reachable', () => {
  for (const L of [LAYOUT_T0, LAYOUT_T1, LAYOUT_T2]) {
    assert.equal(L.rooms.length, (L.floors.length - 1) * 4);
    for (const r of L.rooms) {
      const f = L.floors[r.floor];
      assert.ok(r.y >= f.top && r.y + r.h <= f.bottom, `room y ${r.y} in floor ${r.floor}`);
      assert.ok(r.x >= L.wall.x && r.x + r.w <= L.wall.x + L.wall.w, `room x ${r.x}`);
    }
    assert.ok(L.stairsX >= L.walk[0] && L.stairsX <= L.walk[1]);
    assert.ok(L.deskX >= L.walk[0] && L.deskX <= L.walk[1]);
    assert.ok(L.restX[0] >= L.walk[0] && L.restX[1] <= L.walk[1]);
  }
  assert.equal(layoutFor(8), LAYOUT_T0);
  assert.equal(layoutFor(16), LAYOUT_T1);
  assert.equal(layoutFor(16, true), LAYOUT_T2);
});
