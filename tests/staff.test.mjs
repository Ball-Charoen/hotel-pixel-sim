// Staff positions (P1 step 5): front office, housekeeping, F&B. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newGame, teamQuality, SEGMENTS, CAND_ROLES, LANG_RANGE, ROLES, HK_COVER, MAX_STAFF } from '../src/sim/core.js';

const person = (role, v = 70, lang = 70) => ({ role, app: v, serv: v, exp: v, prof: v, lang, sat: 70 });
const hotel = staff => ({ staff });

// The single-team rule before positions existed (core.js up to P1 step 4).
function oldQuality(staff, seg, fs, sold) {
  let base = 0, lang = 0, sat = 0;
  staff.forEach(s => { base += seg.w.app * s.app + seg.w.serv * s.serv + seg.w.exp * s.exp + seg.w.prof * s.prof; lang += s.lang; sat += s.sat; });
  base /= staff.length; lang /= staff.length; sat /= staff.length;
  const adequacy = Math.min(1, staff.length / (1 + sold / 7 / 3));
  let q = base * (0.55 + 0.45 * adequacy) * (0.85 + 0.15 * sat / 100); const qF = q - Math.max(0, 60 - lang) * 0.4;
  return q * (1 - fs) + qF * fs;
}

test('a team split evenly between front office and housekeeping matches the old single-team rule', () => {
  for (const seg of SEGMENTS) for (const sold of [0, 20, 40, 56]) for (const fs of [0, 0.5]) {
    for (const n of [1, 2]) {
      const team = [...Array(n)].flatMap(() => [person('fo'), person('hk')]);
      const now = teamQuality(hotel(team), seg, fs, sold).q;
      assert.ok(Math.abs(now - oldQuality(team, seg, fs, sold)) < 1e-9, `${seg.id} sold ${sold} team ${2 * n}`);
    }
  }
});

test('without a housekeeper, front office covers rooms at a lower quality', () => {
  const seg = SEGMENTS[0];
  const withHK = teamQuality(hotel([person('fo'), person('hk')]), seg, 0, 40);
  const noHK = teamQuality(hotel([person('fo'), person('fo')]), seg, 0, 40);
  assert.ok(noHK.q < withHK.q);
  assert.ok(Math.abs(noHK.qHK / noHK.qFO - HK_COVER) < 0.05 || noHK.qHK < withHK.qHK);
});

test('no front office means no service', () => {
  assert.equal(teamQuality(hotel([person('hk'), person('hk')]), SEGMENTS[0], 0, 20).q, 0);
});

test('language only counts at the front desk', () => {
  const seg = SEGMENTS[0];
  const good = teamQuality(hotel([person('fo', 70, 90), person('hk', 70, 10)]), seg, 0.8, 30).q;
  const bad = teamQuality(hotel([person('fo', 70, 10), person('hk', 70, 90)]), seg, 0.8, 30).q;
  assert.ok(good > bad);
});

test('applicants: 3 front office, 3 housekeeping, 2 F&B with their language ranges', () => {
  const g = newGame({ seed: 'roles', city: 'bkk', startMonth: 0, chaos: 'mid' });
  assert.deepEqual(g.candidates.map(c => c.role), CAND_ROLES);
  g.candidates.forEach(c => { const [lo, hi] = LANG_RANGE[c.role]; assert.ok(c.lang >= lo && c.lang <= hi, `${c.id} lang ${c.lang}`); });
  g.hotels.filter(h => !h.isPlayer).forEach(b => assert.ok(b.staff.some(s => s.role === 'fo') && b.staff.some(s => s.role === 'hk'), `${b.arch} has both positions`));
  assert.equal(MAX_STAFF, 4);
  assert.equal(ROLES.fo.q + ROLES.hk.q, 1);
});
