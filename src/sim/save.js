/* Save / load a game as JSON. Pure (no DOM, no storage) so it can be tested with node.
   The game object holds two things JSON cannot store, replaced by markers:
   - the seeded RNG function   -> {"__rng": state}
   - shock events from SHOCKS  -> {"__shock": id}  (they contain functions such as `where`) */
import { mulberry32, SHOCKS } from './core.js';

const SHOCK_SET = new Set(SHOCKS);
const SHOCK_BY_ID = Object.fromEntries(SHOCKS.map(s => [s.id, s]));

export function toSaveJSON(obj) {
  return JSON.stringify(obj, (key, v) => {
    if (typeof v === 'function') {
      if (typeof v.state === 'function') return { __rng: v.state() };
      return undefined;
    }
    if (v && typeof v === 'object' && SHOCK_SET.has(v)) return { __shock: v.id };
    return v;
  });
}

export function fromSaveJSON(text) {
  const data = JSON.parse(text, (key, v) => {
    if (v && typeof v === 'object') {
      if ('__rng' in v) return mulberry32(v.__rng);
      if ('__shock' in v) return SHOCK_BY_ID[v.__shock];
    }
    // Week dates (result.info.start/end) were Date objects.
    if ((key === 'start' || key === 'end') && typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) return new Date(v);
    return v;
  });
  return data;
}

/* A hired staff member is the same object as their entry in G.candidates. JSON makes two copies,
   so point the candidate list back at the hired objects. */
export function relinkGame(G) {
  G.hotels.forEach(h => h.staff.forEach(st => {
    const i = G.candidates.findIndex(c => c.id === st.id);
    if (i >= 0) G.candidates[i] = st;
  }));
  return G;
}
