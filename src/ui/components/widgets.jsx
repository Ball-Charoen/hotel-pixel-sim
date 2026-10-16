/* Shared building blocks: source link, season chips, bars, slider with −/+ steppers, line chart. */
import { Fragment } from 'preact';
import { useState } from 'preact/hooks';
import { clamp } from '../../sim/core.js';
import { N } from '../names.js';
import { SRC } from '../sources.js';
import { fmt, baht } from '../format.js';
import { PixelIcon, TMD_ICON } from './PixelIcon.jsx';
import { t, LANGS, getLang } from '../../i18n/index.js';

/* Join a list of nodes with <br/> between them. */
export const lines = items => items.map((x, i) => <Fragment key={i}>{i > 0 && <br />}{x}</Fragment>);

/* Language buttons, each shown in its own language. */
/* onHome: shows a Home button (every screen except the start screen). */
export function LangSwitch({ onChange, onHome = null }) {
  const cur = getLang();
  return (
    <div class="langbar" role="group" aria-label="Language · ภาษา · 語言">
      {onHome && <button type="button" class="homebtn" onClick={onHome}>⌂ {t('class.home')}</button>}
      {LANGS.map(([k, name]) => (
        <button key={k} type="button" lang={k} aria-pressed={cur === k} onClick={() => onChange(k)}>{name}</button>
      ))}
    </div>
  );
}

export const Src = ({ k, children }) => <a href={SRC[k]} target="_blank" rel="noopener noreferrer">{children}</a>;

/* A changed value: green when good for the player's hotel, red when bad, plain when neutral (good == null). */
export const Chg = ({ good, children }) => (good == null ? <>{children}</> : <b class={good ? 'up' : 'down'}>{children}</b>);

export const SeasonChip = ({ lab }) => <span class={`chip ${lab}`}>{N.season(lab)}</span>;
export const TmdChip = ({ tmd }) => <span class={`chip ${tmd}`}><PixelIcon k={TMD_ICON[tmd]} />{N.tmd(tmd)}</span>;

/* Horizontal bar with an optional black marker (e.g. competitor average or guest expectation). */
export function HBar({ label, v, mark, max = 100, right }) {
  return (
    <div class="hbar">
      <span>{label}</span>
      <span class="track">
        <b style={{ width: `${clamp(v / max * 100, 0, 100)}%` }} />
        {mark != null && <i style={{ left: `${clamp(mark / max * 100, 0, 100)}%` }} />}
      </span>
      <span>{right != null ? right : Math.round(v)}</span>
    </div>
  );
}

/* Slider with −/+ buttons. Prices also get a number box (rounded to 10 baht). */
export function RangeCtl({ label, sub, value, min, max, step, big, isPrice, onChange }) {
  const [draft, setDraft] = useState(null);
  const set = v => onChange(isPrice ? clamp(Math.round(v / 10) * 10, min, max) : clamp(v, min, max));
  const p = ((value - min) / (max - min) * 100).toFixed(1);
  return (
    <div class="ctl">
      <label class="row">
        <span>{label}{sub && <><br /><span class="small muted">{sub}</span></>}</span>
        {isPrice
          ? <input type="number" class="num" min={min} max={max} step={step} value={draft ?? value} aria-label={label}
              onInput={e => { const s = e.currentTarget.value; setDraft(s); const v = Number(s); if (s !== '' && isFinite(v)) set(v); }}
              onBlur={() => setDraft(null)} />
          : <b data-show>{baht(value)}</b>}
      </label>
      <div class="rangerow">
        <button type="button" class="stepbtn" aria-label={t('ctl.dec', { n: big })} onClick={() => set(value - big)}>−</button>
        <input type="range" min={min} max={max} step={step} value={value} aria-label={label} style={{ '--p': `${p}%` }}
          onInput={e => set(Number(e.currentTarget.value))} />
        <button type="button" class="stepbtn" aria-label={t('ctl.inc', { n: big })} onClick={() => set(value + big)}>+</button>
      </div>
    </div>
  );
}

/* Simple multi-series line chart. series: [{name, color, values}], labels: x-axis labels. */
export function LineChart({ series, labels, min = 0, refLine, refLabel, aria, h }) {
  const W = 600, H = h || 190, pl = 48, pr = 12, pt = 12, pb = 26;
  const all = series.flatMap(s => s.values).concat(refLine != null ? [refLine] : []);
  const mx = Math.max(...all, 1) * 1.12;
  const X = i => pl + (labels.length <= 1 ? (W - pl - pr) / 2 : i / (labels.length - 1) * (W - pl - pr));
  const Y = v => pt + (1 - (v - min) / (mx - min)) * (H - pt - pb);
  const grid = [0, 1, 2, 3, 4].map(k => {
    const v = min + (mx - min) * k / 4;
    return (
      <g key={`g${k}`}>
        <line x1={pl} x2={W - pr} y1={Y(v)} y2={Y(v)} class="ax" />
        <text x={pl - 6} y={Y(v) + 4} text-anchor="end" class="lbl">{mx < 10 ? v.toFixed(1) : fmt(v)}</text>
      </g>
    );
  });
  return (
    <>
      <div class="legend">{series.map(s => <span key={s.name} style={{ '--c': s.color }}>{s.name}</span>)}</div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria || ''}>
        {grid}
        {labels.map((l, i) => <text key={`x${i}`} x={X(i)} y={H - 8} text-anchor="middle" class="lbl">{l}</text>)}
        {refLine != null && (
          <>
            <line x1={pl} x2={W - pr} y1={Y(refLine)} y2={Y(refLine)} stroke="var(--line)" stroke-dasharray="5 4" />
            <text x={W - pr} y={Y(refLine) - 5} text-anchor="end" class="lbl">{refLabel || ''}</text>
          </>
        )}
        {series.map(s => (
          <g key={s.name}>
            <polyline points={s.values.map((v, i) => `${X(i)},${Y(v)}`).join(' ')} fill="none" stroke={s.color} stroke-width="2.5" />
            {s.values.map((v, i) => <circle key={i} cx={X(i)} cy={Y(v)} r="3.5" fill={s.color} />)}
          </g>
        ))}
      </svg>
    </>
  );
}

/* Donut chart with each slice's label placed around it, next to its own slice (no separate legend).
   slices: [{ v, color, name, value }]; centre: big number in the hole; centreSub: one line or a list of lines under it. Slices start at 12 o'clock, clockwise.
   Labels on the same side are pushed apart so small neighbouring slices do not overlap. */
const PIE = { W: 350, H: 262, r: 78, r0: 48, lh: 16 };
const twoLines = name => {
  if (name.length <= 11 || !name.includes(' ')) return [name];
  const mid = name.length / 2;
  const cut = [...name.matchAll(/ /g)].map(m => m.index).sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid))[0];
  return [name.slice(0, cut), name.slice(cut + 1)];
};
export function DonutChart({ slices, centre, centreSub, aria }) {
  const { W, H, r, r0, lh } = PIE;
  const cx = W / 2, cy = H / 2;
  const tot = slices.reduce((a, x) => a + x.v, 0) || 1;
  const P = (rad, a) => `${(cx + rad * Math.cos(a)).toFixed(2)} ${(cy + rad * Math.sin(a)).toFixed(2)}`;
  let a0 = -Math.PI / 2;
  const items = slices.filter(x => x.v > 0).map(x => {
    const frac = x.v / tot, a1 = a0 + frac * 2 * Math.PI, am = (a0 + a1) / 2;
    const lines = twoLines(x.name);
    const it = { ...x, frac, a0, a1, am, lines, h: lines.length * lh + 20, right: Math.cos(am) >= 0 };
    it.y = cy + (r + 16) * Math.sin(am);
    a0 = a1;
    return it;
  });
  // Push labels on one side apart (top to bottom), then back inside the picture.
  for (const side of [true, false]) {
    const g = items.filter(x => x.right === side).sort((a, b) => a.y - b.y);
    g.forEach((x, k) => { if (k) x.y = Math.max(x.y, g[k - 1].y + (g[k - 1].h + x.h) / 2 + 2); });
    const over = g.length ? g[g.length - 1].y + g[g.length - 1].h / 2 - (H - 4) : 0;
    if (over > 0) g.forEach(x => { x.y -= over; });
  }
  return (
    <svg class="pie" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria}>
      {items.map((x, i) => {
        const big = x.frac > 0.5 ? 1 : 0;
        const d = x.frac >= 0.9999
          ? `M${cx - r} ${cy} A${r} ${r} 0 1 1 ${cx + r} ${cy} A${r} ${r} 0 1 1 ${cx - r} ${cy} Z M${cx - r0} ${cy} A${r0} ${r0} 0 1 0 ${cx + r0} ${cy} A${r0} ${r0} 0 1 0 ${cx - r0} ${cy} Z`
          : `M${P(r, x.a0)} A${r} ${r} 0 ${big} 1 ${P(r, x.a1)} L${P(r0, x.a1)} A${r0} ${r0} 0 ${big} 0 ${P(r0, x.a0)} Z`;
        return <path key={i} d={d} fill={x.color} fill-rule="evenodd" />;
      })}
      <circle cx={cx} cy={cy} r={r} fill="none" class="pie-rim" />
      <circle cx={cx} cy={cy} r={r0} fill="none" class="pie-rim" />
      {centre != null && (
        <>
          <text x={cx} y={cy + (centreSub ? -4 : 9)} text-anchor="middle" class="pie-centre">{centre}</text>
          {[].concat(centreSub || []).map((ln, k) => <text key={k} x={cx} y={cy + 12 + k * 13} text-anchor="middle" class="pie-sub">{ln}</text>)}
        </>
      )}
      {items.map((x, i) => {
        const ex = cx + (r + 2) * Math.cos(x.am), ey = cy + (r + 2) * Math.sin(x.am);
        const ax = cx + (r + 16) * Math.cos(x.am) * (Math.abs(Math.cos(x.am)) < 0.2 ? 1.6 : 1) + (x.right ? 4 : -4);
        const tx = x.right ? ax + 4 : ax - 4, top = x.y - x.h / 2;
        return (
          <g key={i}>
            <polyline points={`${ex.toFixed(1)},${ey.toFixed(1)} ${ax.toFixed(1)},${x.y.toFixed(1)}`} class="pie-lead" />
            <rect x={ax - 3} y={x.y - 3} width="6" height="6" fill={x.color} class="pie-dot" />
            {x.lines.map((ln, k) => (
              <text key={k} x={tx} y={top + 12 + k * lh} text-anchor={x.right ? 'start' : 'end'} class="pie-name">{ln}</text>
            ))}
            <text x={tx} y={top + 12 + x.lines.length * lh + 8} text-anchor={x.right ? 'start' : 'end'} class="pie-val">{x.value}</text>
          </g>
        );
      })}
    </svg>
  );
}
