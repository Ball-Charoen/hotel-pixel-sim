/* One autosave slot in this browser's localStorage. Every call is wrapped: private windows or
   blocked storage just mean "no save", never a crash. */
import { toSaveJSON, fromSaveJSON, relinkGame } from '../sim/save.js';

const KEY = 'hotel-pixel-sim:save';
// Bump when the save format or game rules change in a way that makes old saves invalid.
export const SAVE_VERSION = 2;

export function writeSave(session, screen) {
  try {
    localStorage.setItem(KEY, toSaveJSON({ v: SAVE_VERSION, savedAt: Date.now(), screen, session }));
    return true;
  } catch {
    return false;
  }
}

export function readSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const d = fromSaveJSON(raw);
    if (d.v !== SAVE_VERSION || !d.session || !d.session.G) return null;
    relinkGame(d.session.G);
    return d;
  } catch {
    return null;
  }
}

export function clearSave() {
  try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
}
