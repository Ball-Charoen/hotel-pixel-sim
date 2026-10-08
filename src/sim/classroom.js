/* Classroom (P2) game rules shared by the server function and the tests. Pure: no DOM, no network.
   The server keeps the full game `g` (every hotel's private data + RNG). Each student only ever receives
   viewFor(g, ...): their own hotel in full, other hotels' public numbers, past events only. */
import {
  newGame, simulateWeek, finalScores, startProject, maxStaff, WEEKS, INFLUENCER, TIERS,
} from './core.js';

const r10 = x => Math.round(x / 10) * 10;
const r100 = x => Math.round(x / 100) * 100;
const num = (x, lo, hi, round) => (Number.isFinite(+x) ? Math.min(hi, Math.max(lo, round(+x))) : null);

/* Allowed ranges = the sliders in the single-player UI (DecideTab, StaffTab). */
export const LIMITS = { price: [200, 4000], mk: [0, 4000], bonus: [0, 4000] };

/* Fields of another hotel's weekly result that every student may see (like an STR comp-set report). */
export const PUBLIC_REC = ['price', 'occ', 'adr', 'revpar', 'R', 'rooms', 'tier', 'sold', 'awAvg', 'rating', 'newRev'];

/* room: row of public.rooms; players: rows of public.players. */
export function startClassGame(room, players) {
  const g = newGame({
    seed: room.seed, city: room.city, startMonth: room.start_month, chaos: room.chaos, allowFake: room.allow_fake,
    bots: room.bots,
    players: [...players].sort((a, b) => +a.hotel_key.slice(1) - +b.hotel_key.slice(1))
      .map(p => ({ id: p.hotel_key, hotelName: p.hotel_name, ownerName: p.owner_name })),
  });
  g.logs = {};
  g.hotels.filter(h => h.isPlayer).forEach(h => { g.logs[h.id] = []; });
  return g;
}

/* Client side: the decisions a student made on their own copy of the hotel, as a plain object to submit. */
export function decisionOf(h, started = []) {
  return {
    price: { wd: h.price.wd, we: h.price.we }, mk: { billboard: h.mk.billboard, online: h.mk.online },
    bonus: h.bonus, inf: h.inf, ota: !!h.ota, fake: !!h.fake,
    staff: h.staff.map(s => s.id), start: [...started],
  };
}

/* Server side: apply a submitted decision to the real hotel, re-checking every rule (never trust the client). */
export function applyDecision(g, h, d) {
  if (!d || typeof d !== 'object') return;
  const wd = num(d.price?.wd, ...LIMITS.price, r10), we = num(d.price?.we, ...LIMITS.price, r10);
  if (wd !== null) h.price.wd = wd;
  if (we !== null) h.price.we = we;
  const bb = num(d.mk?.billboard, ...LIMITS.mk, r100), on = num(d.mk?.online, ...LIMITS.mk, r100);
  if (bb !== null) h.mk.billboard = bb;
  if (on !== null) h.mk.online = on;
  const bonus = num(d.bonus, ...LIMITS.bonus, r100);
  if (bonus !== null) h.bonus = bonus;
  h.inf = d.inf === 'none' || Object.prototype.hasOwnProperty.call(INFLUENCER, d.inf) ? d.inf : 'none';
  h.ota = !!d.ota;
  h.fake = g.allowFake ? !!d.fake : false;
  // Growth first: an F&B hire needs the restaurant project to be under way.
  (Array.isArray(d.start) ? d.start : []).slice(0, 2).forEach(kind => {
    if (kind === 'licence' || kind === 'restaurant') startProject(h, kind);
  });
  if (Array.isArray(d.staff)) {
    const want = new Set(d.staff.map(String));
    h.staff = h.staff.filter(s => {
      if (want.has(s.id)) return true;
      h.severance = (h.severance || 0) + s.salary;   // fired: one week severance, as in single player
      return false;
    });
    const fbOpen = h.restaurant || !!h.proj.rest;
    [...want].forEach(id => {
      if (h.staff.some(s => s.id === id) || h.staff.length >= maxStaff(h)) return;
      const c = h.candidates.find(z => z.id === id && !z.gone);
      if (!c || (c.role === 'fb' && !fbOpen)) return;
      c.sat = 70;
      h.staff.push(c);
    });
  }
}

/* After loading g from JSON (save.js), a hired person and their applicant entry are two copies: point the
   applicant list back at the hired objects (same as relinkGame for single player). */
export function relinkClass(g) {
  g.hotels.filter(h => h.isPlayer).forEach(h => h.staff.forEach(st => {
    const i = h.candidates.findIndex(c => c.id === st.id);
    if (i >= 0) h.candidates[i] = st;
  }));
  return g;
}

/* Run one class week. decisions: {hotel_key: decision}; missing players keep last week's choices. */
export function runClassWeek(g, decisions) {
  const players = g.hotels.filter(h => h.isPlayer);
  const before = {};
  players.forEach(h => {
    applyDecision(g, h, decisions[h.id]);
    before[h.id] = {
      week: g.week + 1, pwd: h.price.wd, pwe: h.price.we, staff: h.staff.length, bonus: h.bonus,
      bill: h.mk.billboard, online: h.mk.online, inf: h.inf, ota: h.ota && h.otaBan === 0, fake: h.fake,
      submitted: !!decisions[h.id],
    };
  });
  const out = simulateWeek(g);
  players.forEach(h => {
    const y = out.hotels[h.id], c = out.compBy[h.id], i = out.idxBy[h.id];
    y.quits.forEach(n => { const q = h.candidates.find(z => z.name === n); if (q) q.gone = true; });
    g.logs[h.id].push(Object.assign(before[h.id], {
      occ: y.occ, adr: y.adr, revpar: y.revpar, cRevpar: c.revpar, mpi: i.mpi, ari: i.ari, rgi: i.rgi,
      rating: y.rating, R: y.R, profit: y.profit, Q: y.Q, E: y.E, cQ: c.Q, rooms: y.rooms, fnbRev: y.fnb.revenue,
    }));
  });
  return out;
}

const pick = (o, keys) => Object.fromEntries(keys.filter(k => k in o).map(k => [k, o[k]]));
const deep = x => JSON.parse(JSON.stringify(x, (k, v) => (typeof v === 'function' ? undefined : v)));
const STATS = ['app', 'serv', 'exp', 'prof', 'lang'];

/* What one student may see. The student's own hotel is renamed 'you' so the single-player screens work unchanged.
   out = this week's result (null before week 1). Shock event objects are kept by reference for save.js markers. */
export function viewFor(g, out, key) {
  const over = g.week >= WEEKS;
  const me = g.hotels.find(h => h.id === key);
  const others = g.hotels.filter(h => h !== me);
  const idOf = h => (h === me ? 'you' : h.id);
  const mine = Object.assign(deep({ ...me, candidates: undefined }), { id: 'you', isPlayer: true });
  const hotels = [mine].concat(others.map(h => Object.assign(
    { id: h.id, name: h.isPlayer ? h.name : '', owner: h.owner || '', isPlayer: false, rooms: h.rooms, tier: h.tier,
      restaurant: h.restaurant, R: h.R, price: { ...h.price }, staff: [], history: [] },
    over && h.arch ? { arch: h.arch, skill: h.skill } : {})));
  // Competitors' team quality as a market average only (no individual staff data).
  const compStaff = Object.fromEntries(STATS.map(k => [k, others.reduce((a, b) =>
    a + b.staff.reduce((x, s) => x + s[k], 0) / Math.max(1, b.staff.length), 0) / Math.max(1, others.length)]));
  // Calendar: future weeks show announced events only (no shocks, no cancellations yet).
  const timeline = g.timeline.map((t, w) => (w < g.week ? t
    : { scheduled: t.scheduled.map(e => ({ ...e, cancelled: false })), shocks: [] }));
  const G = {
    multi: true, classroom: true, seed: '', city: g.city, startMonth: g.startMonth, chaos: g.chaos, allowFake: g.allowFake,
    week: g.week, refP: g.refP, timeline, news: g.news, hotels, compStaff,
    candidates: deep(me.candidates),
  };
  let last = null;
  if (out) {
    const hotelsOut = Object.fromEntries(g.hotels.map(h => [idOf(h), h === me ? out.hotels[h.id] : pick(out.hotels[h.id], PUBLIC_REC)]));
    last = {
      week: out.week, info: out.info, season: out.season, tl: out.tl, E: out.E, news: out.news, marketOcc: out.marketOcc,
      hotels: hotelsOut, comp: out.compBy[key], idx: out.idxBy[key],
    };
  }
  return { G, last, log: g.logs[key] || [], over };
}

/* Market table + final ranking (for room_public: every student and the instructor). */
export function publicFor(g, out) {
  const rows = g.hotels.map(h => {
    const r = out ? out.hotels[h.id] : null;
    return Object.assign({ id: h.id, name: h.isPlayer ? h.name : '', owner: h.owner || '', bot: !h.isPlayer },
      r ? pick(r, PUBLIC_REC) : { price: { ...h.price }, R: h.R, rooms: h.rooms });
  });
  const res = { week: g.week, hotels: rows };
  if (g.week >= WEEKS) {
    res.final = finalScores(g).map(f => {
      const h = g.hotels.find(x => x.id === f.id);
      return { id: f.id, name: h.isPlayer ? h.name : '', owner: h.owner || '', bot: !h.isPlayer,
        arch: h.arch, skill: h.skill, score: f.score, fin: f.fin, rep: f.rep, staff: f.staff, profit: f.profit, R: f.R };
    });
  }
  return res;
}

export { WEEKS, TIERS };
