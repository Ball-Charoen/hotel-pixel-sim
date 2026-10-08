/* Game session glue between the UI and the sim core: decision log, staff hiring, end of week.
   Pure (no DOM) so it can be tested with node. Logic ported unchanged from prototype/src/ui3b.js + ui3d.js. */
import { newGame, simulateWeek, weekInfo, seasonMult, seasonLabel, tmdSeason, WEEKS, INFLUENCER, COST } from '../sim/core.js';

// UI-enforced in P0; moves into the core with the 3 staff positions (P1 step 5).
export const MAX_STAFF = 4;

export function startSession(opts) {
  return { G: newGame(opts), log: [], last: null };
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
