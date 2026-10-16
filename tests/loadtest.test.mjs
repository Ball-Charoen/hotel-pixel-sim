// The load-test script (tools/loadtest-classroom.mjs) must send decisions the real server accepts. Checked offline:
// 5 simulated students + 2 bots play 3 weeks through the server's own rules. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startClassGame, runClassWeek, viewFor, relinkClass } from '../src/sim/classroom.js';
import { toSaveJSON } from '../src/sim/save.js';
import { sessionFromView } from '../src/net/classroom.js';
import { makeDecision, summarize, tallyAdvance } from '../tools/loadtest-lib.mjs';

const room = { seed: 'lt-1', city: 'pbi', start_month: 10, chaos: 'mid', allow_fake: true, bots: 2 };
const players = Array.from({ length: 5 }, (_, i) => ({ hotel_key: 'p' + (i + 1), hotel_name: 'Test Hotel ' + (i + 1), owner_name: 'auto test' }));

test('5 simulated students + 2 bots: every decision is accepted, staff are hired, the market has 7 hotels', () => {
  const g = relinkClass(startClassGame(room, players));
  let out = null;
  for (let w = 0; w < 3; w++) {
    const decisions = {};
    players.forEach((p, i) => {
      // exactly what the script does: the server's view -> JSON -> the student's copy -> a decision
      const view = JSON.parse(toSaveJSON(viewFor(g, out, p.hotel_key)));
      const s = sessionFromView(view);
      decisions[p.hotel_key] = makeDecision(s.G, i);
    });
    out = runClassWeek(g, decisions);
    players.forEach(p => {
      const rec = g.logs[p.hotel_key].at(-1);
      assert.equal(rec.submitted, true);
      assert.equal(rec.staff, 3, `${p.hotel_key} week ${w + 1}: 2 front office + 1 housekeeper`);
    });
    assert.equal(g.hotels.length, 7);
  }
  assert.equal(g.week, 3);
});

test('students price differently from each other', () => {
  const g = startClassGame(room, players);
  const prices = players.map((p, i) => makeDecision(sessionFromView(JSON.parse(toSaveJSON(viewFor(g, null, p.hotel_key)))).G, i).price.wd);
  assert.ok(new Set(prices).size >= 4, prices.join(','));
});

test('summary and race tally helpers', () => {
  assert.deepEqual(summarize([1000, 2000, 3000, 4000, 20000]), { n: 5, min: '1.00 s', median: '3.00 s', p95: '20.00 s', max: '20.00 s' });
  assert.deepEqual(tallyAdvance([{ ok: true, status: 200 }, { ok: false, status: 409 }, { ok: false, status: 403 }, { ok: false, status: 500 }]),
    { computed: 1, busy: 1, tooEarly: 1, other: 1 });
});
