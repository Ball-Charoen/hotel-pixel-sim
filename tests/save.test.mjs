// Save / load: a game resumed from a save must play out exactly like one that never stopped. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startSession, player, toggleStaff, openCandidates, endWeek } from '../src/ui/session.js';
import { toSaveJSON, fromSaveJSON, relinkGame } from '../src/sim/save.js';
import { finalScores, mulberry32, WEEKS } from '../src/sim/core.js';

const opts = { seed: 'save-test', city: 'hkt', startMonth: 9, chaos: 'high', allowFake: true, hotelName: 'Save' };

// Same decisions every run: vary prices by week, keep at least two staff.
function playWeek(s) {
  const h = player(s.G);
  while (h.staff.length < 2 && openCandidates(s.G).length) toggleStaff(s.G, openCandidates(s.G)[0].id);
  h.price.wd = 600 + s.G.week * 20; h.price.we = 800 + s.G.week * 10;
  h.mk.online = 1000; h.ota = true; h.fake = s.G.week === 3;
  endWeek(s);
}

function roundTrip(s) {
  const back = fromSaveJSON(toSaveJSON(s));
  relinkGame(back.G);
  return back;
}

test('RNG state survives a save: same next numbers', () => {
  const a = mulberry32(12345);
  for (let i = 0; i < 7; i++) a();
  const b = mulberry32(a.state());
  for (let i = 0; i < 5; i++) assert.equal(a(), b());
});

for (const stopAt of [0, 1, 5, 11]) {
  test(`resume after week ${stopAt} gives the same 12-week result as an uninterrupted game`, () => {
    const ref = startSession(opts);
    for (let w = 0; w < WEEKS; w++) playWeek(ref);

    let s = startSession(opts);
    for (let w = 0; w < stopAt; w++) playWeek(s);
    s = roundTrip(s);
    for (let w = stopAt; w < WEEKS; w++) playWeek(s);

    assert.deepEqual(s.log, ref.log);
    assert.deepEqual(finalScores(s.G), finalScores(ref.G));
    assert.equal(player(s.G).cash, player(ref.G).cash);
  });
}

test('after loading, a hired staff member is the same object as their candidate entry', () => {
  const s = startSession(opts);
  playWeek(s);
  const back = roundTrip(s);
  const st = player(back.G).staff[0];
  assert.equal(back.G.candidates.find(c => c.id === st.id), st);
});

test('shock events come back with their functions', () => {
  const s = startSession(opts);
  const back = roundTrip(s);
  back.G.timeline.forEach(tl => tl.shocks.forEach(sh => assert.equal(typeof sh.ev.where, 'function')));
});

test('optional owner name is kept on the player hotel and survives a save; blank stays blank', () => {
  const s = startSession({ ...opts, ownerName: '  Charoen ' });
  assert.equal(player(s.G).owner, 'Charoen');
  assert.equal(player(roundTrip(s).G).owner, 'Charoen');
  assert.equal(player(startSession(opts).G).owner, '');
});
