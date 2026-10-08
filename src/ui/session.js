/* Game session glue between the UI and the sim core: decision log, staff hiring, end of week.
   Pure (no DOM) so it can be tested with node. Logic ported unchanged from prototype/src/ui3b.js + ui3d.js. */
import {
  newGame, simulateWeek, weekInfo, seasonMult, seasonLabel, tmdSeason, buildTimeline, mulberry32, hashSeed,
  WEEKS, INFLUENCER, COST, SHOCKS,
} from '../sim/core.js';

// UI-enforced in P0; moves into the core with the 3 staff positions (P1 step 5).
export const MAX_STAFF = 4;

/* reveal: instructor option to show upcoming shocks in the calendar. freq: cached event-frequency simulation. */
export function startSession(opts) {
  return { G: newGame(opts), log: [], last: null, reveal: false, freq: null };
}

export const player = G => G.hotels[0];

export function weekCtx(G, w) {
  const wk = Math.min(w, WEEKS - 1);
  const wi = weekInfo(G, wk);
  const s = seasonMult(G, wk);
  return { wi, tmd: tmdSeason(wi.month, wi.day), lab: seasonLabel(s), s };
}

export function plannedSpend(G) {
  const h = player(G);
  const sal = h.staff.reduce((a, s) => a + s.salary, 0);
  const total = sal + h.bonus + h.mk.billboard + h.mk.online
    + (h.inf !== 'none' ? INFLUENCER[h.inf].cost : 0) + (h.fake ? COST.fake : 0) + COST.fixed;
  return { sal, total };
}

/* Hire a candidate, or fire them if already on the team (pays 1 week severance). */
export function toggleStaff(G, id) {
  const h = player(G);
  const idx = h.staff.findIndex(s => s.id === id);
  if (idx >= 0) {
    h.severance = (h.severance || 0) + h.staff[idx].salary;
    h.staff.splice(idx, 1);
  } else if (h.staff.length < MAX_STAFF) {
    const c = G.candidates.find(z => z.id === id);
    c.sat = 70;
    h.staff.push(c);
  }
}

export function openCandidates(G) {
  const hired = new Set(player(G).staff.map(s => s.id));
  return G.candidates.filter(c => !c.gone && !hired.has(c.id));
}

/* Simulate one week, record the player's decisions + results in the log. */
export function endWeek(session) {
  const { G } = session;
  const h = player(G);
  const x = weekCtx(G, G.week);
  const dec = {
    week: G.week + 1, date: x.wi.label, pwd: h.price.wd, pwe: h.price.we, staff: h.staff.length, bonus: h.bonus,
    bill: h.mk.billboard, online: h.mk.online, inf: h.inf, ota: h.ota && h.otaBan === 0, fake: h.fake,
  };
  const o = simulateWeek(G);
  // Staff who quit leave the candidate pool for good.
  o.hotels.you.quits.forEach(n => { const c = G.candidates.find(z => z.name === n); if (c) c.gone = true; });
  const y = o.hotels.you;
  session.log.push(Object.assign(dec, {
    occ: y.occ, adr: y.adr, revpar: y.revpar, cRevpar: o.comp.revpar, mpi: o.idx.mpi, ari: o.idx.ari, rgi: o.idx.rgi,
    rating: y.rating, R: y.R, profit: y.profit, Q: y.Q, E: y.E, cQ: o.comp.Q,
  }));
  session.last = o;
  return o;
}

export const isOver = G => G.week >= WEEKS;

/* Simulate n event timelines for this city/month/chaos level (events library). */
export function eventFrequency(G, n = 300) {
  const cnt = {}, cat = { macro: 0, political: 0, industry: 0 };
  let tot = 0, neg = 0, pos = 0;
  for (let i = 0; i < n; i++) {
    const g = { city: G.city, startMonth: G.startMonth, chaos: G.chaos };
    const tl = buildTimeline(g, mulberry32(hashSeed('freq' + i)));
    tl.forEach(t => t.shocks.filter(x => x.k === 0).forEach(x => {
      cnt[x.ev.id] = (cnt[x.ev.id] || 0) + 1; cat[x.ev.cat]++; tot++;
      if (x.ev.positive) pos++; else neg++;
    }));
  }
  const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]).map(([id, c]) => ({ s: SHOCKS.find(x => x.id === id), c }));
  return { n, tot, cat, pos, neg, top };
}

/* Decision log as CSV for debriefing in Excel / Google Sheets. */
export function decisionCsv(log) {
  const head = 'week,date,price_wd,price_we,staff,bonus,billboard,online,influencer,ota,fake,occ,adr,revpar,mpi,ari,rgi,rating,profit';
  const rows = log.map(r => [
    r.week, '"' + r.date + '"', r.pwd, r.pwe, r.staff, r.bonus, r.bill, r.online, r.inf, r.ota ? 1 : 0, r.fake ? 1 : 0,
    (r.occ * 100).toFixed(1), Math.round(r.adr), Math.round(r.revpar), Math.round(r.mpi), Math.round(r.ari), Math.round(r.rgi),
    r.rating.toFixed(2), Math.round(r.profit),
  ].join(','));
  return [head].concat(rows).join('\n');
}
