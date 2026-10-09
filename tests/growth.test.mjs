// Growth path T0 -> T1 (licence + 16 rooms) -> T2 (restaurant). Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, simulateWeek, startProject, canStart, maxStaff, GROWTH, FNB, TIERS } from '../src/sim/core.js';

const game = (seed = 'grow') => newGame({ seed, city: 'kkn', startMonth: 10, chaos: 'low' });
const staff = (g, roles) => {
  const p = g.hotels[0];
  roles.forEach(r => { const c = g.candidates.find(x => x.role === r && !p.staff.includes(x)); c.sat = 70; p.staff.push(c); });
  return p;
};

test('a hotel that never grows stays at 8 rooms with no investment or food costs', () => {
  const g = game(); const p = staff(g, ['fo', 'hk']);
  for (let w = 0; w < 12; w++) {
    const y = simulateWeek(g).hotels.you;
    assert.equal(y.rooms, 8); assert.equal(y.tier, 0);
    assert.equal(y.costs.invest, 0); assert.equal(y.costs.food, 0); assert.equal(y.fnb.revenue, 0);
  }
  assert.equal(maxStaff(p), 4);
});

test('licence takes 2 weeks, then 2 weeks of building, and the costs land in the right weeks', () => {
  const g = game(); const p = staff(g, ['fo', 'hk']);
  assert.ok(canStart(p, 'licence')); assert.equal(canStart(p, 'restaurant'), false);
  startProject(p, 'licence');
  assert.equal(canStart(p, 'licence'), false, 'cannot apply twice');
  const weeks = [...Array(5)].map(() => simulateWeek(g).hotels.you);
  assert.equal(weeks[0].costs.invest, GROWTH.licenceCost);
  assert.equal(p.tier >= 1, true);
  assert.equal(weeks[1].tier, 0, 'still waiting during week 2');
  assert.equal(weeks[2].costs.invest, GROWTH.buildCost, 'building is paid when the licence arrives');
  assert.equal(weeks[3].rooms, 8, 'building during weeks 3-4');
  assert.equal(weeks[4].rooms, TIERS[1].rooms, '16 rooms from week 5');
  assert.equal(maxStaff(p), 6);
});

test('restaurant opens 2 weeks after starting, needs F&B staff, and books 35% food cost', () => {
  const g = game(); const p = staff(g, ['fo', 'fo', 'hk']);
  startProject(p, 'licence'); simulateWeek(g); simulateWeek(g);
  assert.ok(canStart(p, 'restaurant'));
  startProject(p, 'restaurant');
  const a = simulateWeek(g).hotels.you; simulateWeek(g);
  assert.equal(a.costs.invest, GROWTH.buildCost + GROWTH.restCost);
  assert.equal(p.restaurant, true); assert.equal(p.tier, 2); assert.equal(maxStaff(p), 8);
  const closed = simulateWeek(g).hotels.you;
  assert.equal(closed.fnb.revenue, 0, 'no F&B staff, no meals');
  staff(g, ['fb']);
  const open = simulateWeek(g).hotels.you;
  assert.ok(open.fnb.revenue > 0 && open.fnb.walkIns > 0 && open.fnb.guests > 0);
  assert.ok(Math.abs(open.costs.food - open.fnb.revenue * FNB.foodCost) < 1e-6);
});

test('with equal prices, a 16-room hotel sells more room-nights than an 8-room one (fair share)', () => {
  const small = game('fair'); staff(small, ['fo', 'fo', 'hk', 'hk']);
  const big = game('fair'); const p = staff(big, ['fo', 'fo', 'hk', 'hk']); p.rooms = 16;
  let s = 0, b = 0;
  for (let w = 0; w < 6; w++) { s += simulateWeek(small).hotels.you.sold; b += simulateWeek(big).hotels.you.sold; }
  assert.ok(b > s * 1.3, `16 rooms sold ${b} vs 8 rooms ${s}`);
});

test('growth costs B1 (owner approved 9 Oct 2026) and the payback warning weeks', async () => {
  const { usableWeeks, newGame } = await import('../src/sim/core.js');
  assert.deepEqual([GROWTH.licenceCost, GROWTH.buildCost, GROWTH.restCost], [15000, 40000, 20000]);
  assert.deepEqual(GROWTH.paybackWeeks, { licence: 5, restaurant: 4 });
  const g = newGame({ seed: 'pay', city: 'bkk', startMonth: 0, chaos: 'low', allowFake: true });
  const at = (week, kind) => { g.week = week - 1; return usableWeeks(g, kind); };
  // Simulation (docs/spec-summary.md): licence by week 4 = 5 weeks of 16 rooms (pays back); week 5 = 4 weeks (warning).
  assert.equal(at(4, 'licence'), 5);
  assert.equal(at(5, 'licence'), 4);
  assert.equal(at(7, 'restaurant'), 4);
  assert.equal(at(8, 'restaurant'), 3);
  assert.equal(at(12, 'licence'), 0);
});
