// Whole-class market (P2): n hotels share one city like n/4 copies of the 4-hotel game. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, simulateWeek, marketScale, MARKET_UNIT, ARCH, CITIES, WEEKS } from '../src/sim/core.js';

// A game with n hotels: the usual player + 3 bots, plus extra bots cycling the personalities.
function market(seed, city, n) {
  const g = newGame({ seed, city, startMonth: 10, chaos: 'mid', allowFake: false, hotelName: 'P' });
  const archs = Object.keys(ARCH), proto = g.hotels[1];
  for (let i = g.hotels.length; i < n; i++) {
    const b = structuredClone({ ...proto, history: [] });
    b.id = 'bot' + i; b.arch = archs[i % 4]; b.skill = ['low', 'mid', 'high'][i % 3];
    b.staff = proto.staff.map((s, k) => ({ ...s, id: b.id + 's' + k }));
    g.hotels.push(b);
  }
  const you = g.hotels[0];
  you.staff = [g.candidates.find(c => c.role === 'fo'), g.candidates.find(c => c.role === 'hk')];
  for (let w = 0; w < WEEKS; w++) simulateWeek(g);
  return g.hotels.reduce((a, h) => a + h.history.reduce((x, r) => x + r.occ, 0) / WEEKS, 0) / g.hotels.length;
}

test('4 hotels = scale 1, so single-player games are unchanged', () => {
  assert.equal(MARKET_UNIT, 4);
  assert.equal(marketScale(newGame({ seed: 'x', city: 'bkk', startMonth: 0, chaos: 'low', allowFake: true })), 1);
});

test('a 16-hotel class market keeps average occupancy close to the 4-hotel game (within 3 points over 18 games)', () => {
  // One game is noisy (different bot mix), so compare the mean over 9 cities x 2 seeds, as in the design simulation.
  let four = 0, sixteen = 0, n = 0;
  for (const city of Object.keys(CITIES)) for (const seed of ['m1', 'm2']) {
    four += market(seed + city, city, 4); sixteen += market(seed + city, city, 16); n++;
  }
  four /= n; sixteen /= n;
  assert.ok(Math.abs(four - sixteen) < 0.03, `4 hotels ${four.toFixed(3)} vs 16 hotels ${sixteen.toFixed(3)}`);
});
