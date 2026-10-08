// Balance + invariant tests for the economy core. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, simulateWeek, finalScores, buildTimeline, mulberry32, hashSeed, CITIES, WEEKS } from '../src/sim/core.js';

const cities = Object.keys(CITIES);
function play(city, month, chaos, seed, staffN = 3, priceF = 1) {
  const g = newGame({ seed, city, startMonth: month, chaos, allowFake: true });
  const p = g.hotels[0];
  const best = g.candidates.slice().sort((a, b) => ((b.app + b.serv + b.exp + b.prof) / b.salary) - ((a.app + a.serv + a.exp + a.prof) / a.salary));
  p.staff = best.slice(0, staffN); p.bonus = 600;
  p.price.wd = Math.round(g.refP * priceF); p.price.we = Math.round(g.refP * priceF * 1.15);
  const weeks = []; for (let w = 0; w < WEEKS; w++) weeks.push(simulateWeek(g));
  return { g, weeks };
}

test('same seed gives the same game (deterministic)', () => {
  const a = play('pbi', 10, 'mid', 'det-1'), b = play('pbi', 10, 'mid', 'det-1');
  assert.deepEqual(a.weeks.map(o => o.hotels.you.revenue), b.weeks.map(o => o.hotels.you.revenue));
});

test('KPIs stay in valid ranges in every city', () => {
  for (const c of cities) for (const m of [0, 6, 10]) {
    const { weeks } = play(c, m, 'high', `rng-${c}-${m}`);
    for (const o of weeks) {
      for (const h of Object.values(o.hotels)) {
        assert.ok(h.occ >= 0 && h.occ <= 1, `${c} occ ${h.occ}`);
        assert.ok(h.R >= 1 && h.R <= 5, `${c} stars ${h.R}`);
        assert.ok(Number.isFinite(h.profit));
      }
      assert.ok(o.idx.rgi >= 0 && Number.isFinite(o.idx.rgi));
    }
  }
});

test('market occupancy averages land near the design target', () => {
  for (const c of cities) {
    let sum = 0, n = 0;
    for (const m of [0, 4, 8]) { const { weeks } = play(c, m, 'mid', `occ-${c}-${m}`); for (const o of weeks) { sum += o.marketOcc; n++; } }
    const avg = sum / n;
    assert.ok(avg > 0.35 && avg < 0.85, `${c} market occupancy ${avg.toFixed(2)}`);
  }
});

test('a loss-making hotel never ranks above a profitable one', () => {
  for (let i = 0; i < 120; i++) {
    const { g } = play(cities[i % 9], i % 12, ['low', 'mid', 'high'][i % 3], `rank-${i}`, 1 + (i % 4), [0.6, 1, 1.4][i % 3]);
    const fs = finalScores(g);
    for (let a = 0; a < fs.length; a++) for (let b = a + 1; b < fs.length; b++)
      assert.ok(!(fs[a].profit <= 0 && fs[b].profit > 0), `game ${i}`);
  }
});

test('random events vary and scale with the chaos level', () => {
  const avg = {};
  for (const chaos of ['low', 'mid', 'high']) {
    let starts = 0; const distinct = new Set();
    for (let i = 0; i < 200; i++) {
      const g = { city: cities[i % 9], startMonth: i % 12, chaos };
      buildTimeline(g, mulberry32(hashSeed(`ev-${chaos}-${i}`))).forEach(t => t.shocks.filter(s => s.k === 0).forEach(s => { starts++; distinct.add(s.ev.id); }));
    }
    avg[chaos] = starts / 200;
    assert.ok(distinct.size >= 15, `${chaos}: only ${distinct.size} distinct events`);
  }
  assert.ok(avg.low < avg.mid && avg.mid < avg.high, JSON.stringify(avg));
});
