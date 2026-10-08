// UI session glue (hire/fire, end of week, decision log). Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startSession, player, toggleStaff, openCandidates, endWeek, plannedSpend, isOver, decisionCsv, eventFrequency, MAX_STAFF } from '../src/ui/session.js';
import { WEEKS, COST } from '../src/sim/core.js';

const opts = { seed: 'session-test', city: 'pbi', startMonth: 10, chaos: 'mid', allowFake: true, hotelName: 'Test' };

test('hiring stops at the staff limit and firing pays one week severance', () => {
  const s = startSession(opts);
  const h = player(s.G);
  s.G.candidates.slice(0, MAX_STAFF + 2).forEach(c => toggleStaff(s.G, c.id));
  assert.equal(h.staff.length, MAX_STAFF);
  const fired = h.staff[0];
  toggleStaff(s.G, fired.id);
  assert.equal(h.staff.length, MAX_STAFF - 1);
  assert.equal(h.severance, fired.salary);
  assert.ok(openCandidates(s.G).some(c => c.id === fired.id), 'fired staff can be hired again');
});

test('planned spend adds salaries, bonus, marketing and fixed cost', () => {
  const s = startSession(opts);
  const h = player(s.G);
  toggleStaff(s.G, s.G.candidates[0].id);
  const { sal, total } = plannedSpend(s.G);
  assert.equal(sal, s.G.candidates[0].salary);
  assert.equal(total, sal + h.bonus + h.mk.billboard + h.mk.online + COST.fixed);
});

test('a full game logs 12 weeks with valid KPIs and ends', () => {
  const s = startSession(opts);
  toggleStaff(s.G, s.G.candidates[0].id);
  toggleStaff(s.G, s.G.candidates[1].id);
  for (let w = 0; w < WEEKS; w++) {
    if (player(s.G).staff.length === 0) toggleStaff(s.G, openCandidates(s.G)[0].id);
    endWeek(s);
  }
  assert.equal(s.log.length, WEEKS);
  assert.ok(isOver(s.G));
  s.log.forEach((r, i) => {
    assert.equal(r.week, i + 1);
    assert.ok(r.occ >= 0 && r.occ <= 1, `week ${r.week} occupancy in range`);
    assert.ok(Number.isFinite(r.rgi) && Number.isFinite(r.profit));
  });
  assert.equal(s.last.week, WEEKS);
});

test('decision CSV has a header plus one row per week', () => {
  const s = startSession(opts);
  toggleStaff(s.G, s.G.candidates[0].id);
  endWeek(s); endWeek(s);
  const lines = decisionCsv(s.log, w => `week ${w}`).split('\n');
  assert.equal(lines.length, 3);
  assert.equal(lines[0].split(',').length, lines[1].split(',').length);
  assert.ok(lines[1].startsWith('1,"'));
});

test('event frequency simulation is deterministic and counts new events', () => {
  const { G } = startSession(opts);
  const a = eventFrequency(G, 50), b = eventFrequency(G, 50);
  assert.deepEqual(a.cat, b.cat);
  assert.equal(a.tot, a.pos + a.neg);
  assert.equal(a.tot, Object.values(a.cat).reduce((x, y) => x + y, 0));
});
