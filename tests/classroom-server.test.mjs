// Classroom rules used by the server (src/sim/classroom.js): decisions are re-checked, students see only
// what they should, and a game saved between requests continues exactly. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startClassGame, decisionOf, applyDecision, runClassWeek, viewFor, publicFor, relinkClass } from '../src/sim/classroom.js';
import { toSaveJSON, fromSaveJSON } from '../src/sim/save.js';
import { WEEKS, TIERS } from '../src/sim/core.js';

const room = { seed: 'room-1', city: 'hkt', start_month: 10, chaos: 'high', allow_fake: false, bots: 1 };
const players = [
  { hotel_key: 'p2', hotel_name: 'Beta', owner_name: '' },
  { hotel_key: 'p1', hotel_name: 'Alpha', owner_name: 'Ann' },
  { hotel_key: 'p10', hotel_name: 'Kappa', owner_name: '' },
];
const hotel = (g, k) => g.hotels.find(h => h.id === k);

// p1 hires FO + HK and prices high; p2 never submits; p10 tries to cheat.
function decisionsFor(g) {
  const p1 = hotel(g, 'p1'), fo = p1.candidates.find(c => c.role === 'fo'), hk = p1.candidates.find(c => c.role === 'hk');
  return {
    p1: { ...decisionOf(p1), price: { wd: 1200, we: 1500 }, staff: [fo.id, hk.id] },
    p10: { price: { wd: 5, we: 999999 }, mk: { billboard: -50, online: 1e9 }, bonus: 'x', inf: 'hack', fake: true,
      staff: hotel(g, 'p10').candidates.map(c => c.id), start: ['restaurant', 'licence', 'licence'] },
  };
}

test('players are ordered p1, p2, ..., p10 and keep their names', () => {
  const g = startClassGame(room, players);
  assert.deepEqual(g.hotels.map(h => h.id), ['p1', 'p2', 'p10', 'bot0']);
  assert.equal(hotel(g, 'p1').owner, 'Ann');
});

test('every submitted value is re-checked on the server', () => {
  const g = startClassGame(room, players);
  const h = hotel(g, 'p10');
  applyDecision(g, h, decisionsFor(g).p10);
  assert.deepEqual(h.price, { wd: 200, we: 4000 }, 'prices clamped to the slider range');
  assert.deepEqual(h.mk, { billboard: 0, online: 4000 });
  assert.equal(h.inf, 'none', 'unknown influencer ignored');
  assert.equal(h.fake, false, 'fake reviews off when the instructor disabled them');
  assert.equal(h.staff.length, TIERS[0].maxStaff, 'no more staff than the tier allows');
  assert.ok(h.staff.every(s => s.role !== 'fb'), 'no F&B staff before a restaurant project');
  assert.ok(h.proj.licence && !h.proj.rest, 'licence starts once; restaurant needs a licensed hotel first');
});

test('a student view hides other hotels\' private data, the RNG and future shocks', () => {
  const g = startClassGame({ ...room, chaos: 'high' }, players);
  for (let w = 0; w < 3; w++) runClassWeek(g, decisionsFor(g));
  const out = runClassWeek(g, decisionsFor(g));
  const v = viewFor(g, out, 'p1');
  const text = toSaveJSON(v);
  assert.equal(v.G.hotels[0].id, 'you');
  assert.equal(v.G.hotels[0].name, 'Alpha');
  assert.ok(!/__rng/.test(text), 'no RNG state');
  assert.equal(v.G.seed, '', 'no seed (it would let a student replay the future)');
  for (const h of v.G.hotels.slice(1)) {
    assert.deepEqual(h.staff, []); assert.deepEqual(h.history, []);
    assert.equal(h.cash, undefined); assert.equal(h.profitCum, undefined); assert.equal(h.arch, undefined);
    const r = v.last.hotels[h.id];
    assert.equal(r.profit, undefined); assert.equal(r.costs, undefined); assert.equal(r.team, undefined);
  }
  for (let w = g.week; w < WEEKS; w++) {
    assert.deepEqual(v.G.timeline[w].shocks, [], `no shocks shown for future week ${w + 1}`);
    assert.ok(v.G.timeline[w].scheduled.every(e => !e.cancelled), 'no cancellations revealed early');
  }
  assert.deepEqual(v.last.comp, out.compBy.p1);
  assert.equal(v.log.length, 4);
  assert.equal(v.log[3].submitted, true);
  assert.equal(viewFor(g, out, 'p2').log[3].submitted, false);
});

test('a game saved between server requests continues exactly like one kept in memory', () => {
  const a = startClassGame(room, players);
  let b = startClassGame(room, players);
  for (let w = 0; w < WEEKS; w++) {
    const oa = runClassWeek(a, decisionsFor(a));
    b = relinkClass(fromSaveJSON(toSaveJSON(b)));
    const ob = runClassWeek(b, decisionsFor(b));
    assert.equal(toSaveJSON(ob), toSaveJSON(oa), `week ${w + 1}`);
  }
  const pa = publicFor(a, null), pb = publicFor(b, null);
  assert.deepEqual(pb.final, pa.final);
  assert.equal(pa.final.length, 4);
  assert.equal(pa.final.find(f => f.bot).arch !== undefined, true, 'bot personality revealed at the end');
});

test('what a student does on their screen reaches the server unchanged (hire, fire, licence, prices)', async () => {
  const { sessionFromView } = await import('../src/net/classroom.js');
  const { toggleStaff, openCandidates, grow, player } = await import('../src/ui/session.js');
  const g = startClassGame(room, players);
  runClassWeek(g, {});
  // Student screen: build the session from the server view, then play like in single player.
  const s = sessionFromView(JSON.parse(toSaveJSON(viewFor(g, null, 'p1'))));
  const fo = openCandidates(s.G).find(c => c.role === 'fo'), hk = openCandidates(s.G).find(c => c.role === 'hk');
  toggleStaff(s.G, fo.id); toggleStaff(s.G, hk.id); toggleStaff(s.G, hk.id); toggleStaff(s.G, hk.id);   // hire, fire, rehire
  grow(s.G, 'licence');
  player(s.G).price.wd = 1350; player(s.G).mk.online = 2500;
  const d = decisionOf(player(s.G), s.G.started);
  // Server applies it to the real hotel.
  const h = hotel(g, 'p1');
  applyDecision(g, h, JSON.parse(JSON.stringify(d)));
  assert.deepEqual(h.staff.map(x => x.id).sort(), [fo.id, hk.id].sort());
  assert.equal(h.proj.licence > 0, true);
  assert.equal(h.price.wd, 1350); assert.equal(h.mk.online, 2500);
  assert.deepEqual(d.start, ['licence']);
});

test('join links and QR codes never point to a local address (a phone cannot open "localhost")', async () => {
  const { joinLink, PUBLIC_URL } = await import('../src/net/classroom.js');
  for (const hostname of ['localhost', '127.0.0.1', '[::1]', '192.168.0.108', '10.1.2.3', '172.20.0.5', 'my-mac.local']) {
    assert.equal(joinLink('KX7P2M', { hostname, origin: 'http://' + hostname + ':5173', pathname: '/' }), PUBLIC_URL + '#join=KX7P2M', hostname);
  }
  assert.equal(joinLink('KX7P2M', { hostname: 'ball-charoen.github.io', origin: 'https://ball-charoen.github.io', pathname: '/hotel-pixel-sim/' }),
    'https://ball-charoen.github.io/hotel-pixel-sim/#join=KX7P2M');
});
