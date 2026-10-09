// End-of-game analysis (src/sim/analysis.js): winner, score parts, key success factors. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, simulateWeek, finalScores, WEEKS } from '../src/sim/core.js';
import { analyseGame, renameAnalysis, FACTORS } from '../src/sim/analysis.js';

function play(seed, city, price) {
  const g = newGame({ seed, city, startMonth: 10, chaos: 'mid', allowFake: false, hotelName: 'Me' });
  const you = g.hotels[0];
  you.staff = [g.candidates.find(c => c.role === 'fo'), g.candidates.find(c => c.role === 'hk')];
  for (let w = 0; w < WEEKS; w++) { you.price.wd = price; you.price.we = Math.round(price * 1.2); simulateWeek(g); }
  return g;
}

test('the analysis names the real winner, has numbers for every hotel and every factor', () => {
  for (const [seed, city, price] of [['a1', 'bkk', 1300], ['a2', 'pnb', 700], ['a3', 'hkt', 1800]]) {
    const g = play(seed, city, price);
    const a = analyseGame(g);
    assert.equal(a.winner, finalScores(g)[0].id);
    assert.deepEqual(Object.keys(a.values).sort(), g.hotels.map(h => h.id).sort());
    FACTORS.forEach(f => assert.ok(f.id in a.values.you, f.id));
    assert.equal(a.weekly[a.winner].length, WEEKS);
    assert.ok(['fin', 'rep', 'staff'].includes(a.mainPart));
  }
});

test('every key success factor really is better than the market average', () => {
  for (const seed of ['k1', 'k2', 'k3', 'k4']) {
    const a = analyseGame(play(seed, 'cnx', 1100));
    Object.entries(a.keys).forEach(([id, keys]) => {
      assert.ok(keys.length <= 3);
      keys.forEach(k => {
        const f = FACTORS.find(x => x.id === k);
        assert.ok(f.dir * (a.values[id][k] - a.market[k]) > 0, `${id} ${k}`);
      });
    });
  }
});

test('renaming for a classroom view moves every reference to the student\'s hotel', () => {
  const a = analyseGame(play('r1', 'pty', 1200));
  const b = renameAnalysis(a, 'bot0', 'me');
  assert.ok(b.values.me && !b.values.bot0);
  if (a.winner === 'bot0') assert.equal(b.winner, 'me');
});
