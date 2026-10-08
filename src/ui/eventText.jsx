/* Human-readable descriptions of event effects and phases. */
import { Fragment } from 'preact';
import { SEGMENTS } from '../sim/core.js';
import { Chg } from './components/widgets.jsx';
import { t, tx } from '../i18n/index.js';

const pc = m => (m > 1 ? '+' : '−') + Math.round(Math.abs(m - 1) * 100) + '%';

/* Each effect as {key or segment name, value text, good-for-the-hotel?}.
   More demand / guests / budget is good; higher fixed cost or more outside competition (A0) is bad. */
function effItems(f) {
  const out = [];
  const add = (key, m, opts = {}) => out.push({ key, name: opts.name, v: pc(m), good: opts.invert ? m < 1 : m > 1 });
  if (f.all) add('eff.all', f.all);
  SEGMENTS.forEach(s => { if (f[s.id]) add(null, f[s.id], { name: s.name }); });
  if (f.foreign) add('eff.foreign', f.foreign);
  if (f.domestic) add('eff.domestic', f.domestic);
  if (f.cost) add('eff.cost', f.cost, { invert: true });
  if (f.A0) add('eff.A0', f.A0, { invert: true });
  if (f.wtp) add('eff.wtp', f.wtp);
  if (f.staffHit) out.push({ key: 'eff.staffHit', v: '−' + f.staffHit, good: false });
  return out;
}

const render = (it, v) => (it.key ? tx(it.key, { v }) : [`${it.name} `, v]);

export const effText = f => effItems(f).map(it => render(it, it.v).join('')).join(', ');

/* Same text with each change coloured: green = good for the hotel, red = bad. */
export const effRich = f => effItems(f).map((it, i) => (
  <Fragment key={i}>{i > 0 && ', '}{render(it, <Chg good={it.good}>{it.v}</Chg>)}</Fragment>
));

/* Scheduled events store segment multipliers in `mult` and a foreign-guest multiplier in `foreign`. */
const schedEff = e => {
  const f = {};
  if (e.mult) Object.assign(f, e.mult);
  if (e.foreign) f.foreign = e.foreign;
  return f;
};
export const schedText = e => effText(schedEff(e));
export const schedRich = e => effRich(schedEff(e));

export function phaseName(k, d, perm) {
  if (perm) return t('phase.perm');
  if (d <= 1 || k === 0) return t('phase.emergency');
  return k === d - 1 ? t('phase.recovery') : t('phase.middle');
}
