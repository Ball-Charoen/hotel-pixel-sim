/* Helpers for tools/loadtest-classroom.mjs. Pure (no network) so tests/loadtest.test.mjs can check them offline. */

const r10 = x => Math.round(x / 10) * 10;

/* The weekly decision of simulated student number i (0-based), from that student's own copy of the game G
   (G.hotels[0] is their hotel, as in the real student screen). Each student prices a little differently so the
   market is not 5 identical hotels. Hires 2 front office + 1 housekeeper once, then keeps the team. */
export function makeDecision(G, i) {
  const h = G.hotels[0];
  const staff = h.staff.map(s => s.id);
  const have = role => h.staff.filter(s => s.role === role).length;
  const need = { fo: 2 - have('fo'), hk: 1 - have('hk') };
  for (const role of ['fo', 'hk']) {
    G.candidates.filter(c => c.role === role && !c.gone && !staff.includes(c.id)).slice(0, Math.max(0, need[role]))
      .forEach(c => staff.push(c.id));
  }
  const k = 0.85 + 0.07 * (i % 6);
  return {
    price: { wd: r10(G.refP * k), we: r10(G.refP * 1.15 * k) },
    mk: { billboard: i % 2 ? 500 : 0, online: 1000 }, bonus: 0, inf: 'none', ota: true, fake: false,
    staff, start: [],
  };
}

/* count / min / median / 95th percentile / max of a list of milliseconds. */
export function summarize(list) {
  const a = [...list].sort((x, y) => x - y);
  const at = q => a[Math.min(a.length - 1, Math.floor(q * a.length))];
  const f = x => (x === undefined ? '-' : (x / 1000).toFixed(2) + ' s');
  return { n: a.length, min: f(a[0]), median: f(at(0.5)), p95: f(at(0.95)), max: f(a[a.length - 1]) };
}

/* Which of the (up to N) simultaneous "advance" calls did what: 1 should compute the week, the others lose the race. */
export function tallyAdvance(results) {
  const t = { computed: 0, busy: 0, tooEarly: 0, other: 0 };
  results.forEach(r => {
    if (r.ok) t.computed++;
    else if (r.status === 409) t.busy++;
    else if (r.status === 403) t.tooEarly++;
    else t.other++;
  });
  return t;
}
