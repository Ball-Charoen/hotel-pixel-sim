/* Human-readable descriptions of event effects and phases. */
import { SEGMENTS } from '../sim/core.js';
import { t } from '../i18n/index.js';

const pc = m => (m > 1 ? '+' : '−') + Math.round(Math.abs(m - 1) * 100) + '%';

export function effText(f) {
  const out = [];
  if (f.all) out.push(t('eff.all', { v: pc(f.all) }));
  SEGMENTS.forEach(s => { if (f[s.id]) out.push(`${s.name} ${pc(f[s.id])}`); });
  if (f.foreign) out.push(t('eff.foreign', { v: pc(f.foreign) }));
  if (f.domestic) out.push(t('eff.domestic', { v: pc(f.domestic) }));
  if (f.cost) out.push(t('eff.cost', { v: pc(f.cost) }));
  if (f.A0) out.push(t('eff.A0', { v: pc(f.A0) }));
  if (f.wtp) out.push(t('eff.wtp', { v: pc(f.wtp) }));
  if (f.staffHit) out.push(t('eff.staffHit', { v: f.staffHit }));
  return out.join(', ');
}

/* Scheduled events store segment multipliers in `mult` and a foreign-guest multiplier in `foreign`. */
export function schedText(e) {
  const f = {};
  if (e.mult) Object.assign(f, e.mult);
  if (e.foreign) f.foreign = e.foreign;
  return effText(f);
}

export function phaseName(k, d, perm) {
  if (perm) return t('phase.perm');
  if (d <= 1 || k === 0) return t('phase.emergency');
  return k === d - 1 ? t('phase.recovery') : t('phase.middle');
}
