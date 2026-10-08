// Classroom mode (P2) in the sim core: several players + 0-3 bots in one market. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, simulateWeek, finalScores, WEEKS } from '../src/sim/core.js';

const base = { seed: 'class-1', city: 'cnx', startMonth: 10, chaos: 'mid', allowFake: true };
const players = n => Array.from({ length: n }, (_, i) => ({ id: 'p' + (i + 1), hotelName: 'H' + (i + 1), ownerName: i ? '' : 'Owner' }));

// Each player hires one front office and one housekeeper from their own pool, prices vary by player.
function play(g) {
  g.hotels.filter(h => h.isPlayer).forEach((h, i) => {
    if (!h.staff.length) h.staff = [h.candidates.find(c => c.role === 'fo'), h.candidates.find(c => c.role === 'hk')];
    h.price.wd = 800 + i * 150; h.price.we = 1000 + i * 150;
  });
  return simulateWeek(g);
}

test('players and bots: ids, names, owner, bot count 0-3, at least 2 hotels', () => {
  const g = newGame({ ...base, players: players(3), bots: 2 });
  assert.deepEqual(g.hotels.map(h => h.id), ['p1', 'p2', 'p3', 'bot0', 'bot1']);
  assert.equal(g.hotels[0].owner, 'Owner');
  assert.equal(g.hotels[1].name, 'H2');
  assert.equal(newGame({ ...base, players: players(2), bots: 0 }).hotels.length, 2);
  assert.equal(newGame({ ...base, players: players(1), bots: 9 }).hotels.length, 4, 'bots capped at 3');
  assert.throws(() => newGame({ ...base, players: players(1), bots: 0 }), /at least 2 hotels/);
});

test('each player has their own 8 applicants, the same whoever else joins', () => {
  const a = newGame({ ...base, players: players(2), bots: 1 });
  const b = newGame({ ...base, players: players(5), bots: 3 });
  assert.equal(a.hotels[0].candidates.length, 8);
  assert.deepEqual(a.hotels[0].candidates, b.hotels[0].candidates, 'p1 pool does not depend on the class size');
  assert.notDeepEqual(a.hotels[0].candidates, a.hotels[1].candidates, 'p1 and p2 get different people');
});

test('a 12-week class game: every player gets their own comp set and indices, no NaN, ranking includes everyone', () => {
  const g = newGame({ ...base, players: players(4), bots: 1 });
  for (let w = 0; w < WEEKS; w++) {
    const o = play(g);
    for (const id of ['p1', 'p2', 'p3', 'p4']) {
      const c = o.compBy[id], i = o.idxBy[id], me = o.hotels[id];
      const others = g.hotels.filter(h => h.id !== id).map(h => o.hotels[h.id]);
      const occ = others.reduce((a, r) => a + r.sold, 0) / others.reduce((a, r) => a + r.rooms * 7, 0);
      assert.ok(Math.abs(c.occ - occ) < 1e-12, 'comp set = all other hotels');
      assert.ok([c.occ, c.adr, c.revpar, i.mpi, i.ari, i.rgi, me.profit].every(Number.isFinite), `finite numbers for ${id} week ${w + 1}`);
    }
    assert.equal(o.comp, undefined, 'no single-player comp in class mode');
  }
  const fs = finalScores(g);
  assert.equal(fs.length, 5);
});

test('class games are deterministic: same seed and decisions give the same results', () => {
  const run = () => { const g = newGame({ ...base, players: players(3), bots: 1 }); const out = []; for (let w = 0; w < 4; w++) out.push(JSON.stringify(play(g))); return out; };
  assert.deepEqual(run(), run());
});
