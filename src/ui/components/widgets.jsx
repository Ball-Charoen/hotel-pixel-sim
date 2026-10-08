/* Shared building blocks: source link, season chips, bars, slider with −/+ steppers, line chart. */
import { Fragment } from 'preact';
import { useState } from 'preact/hooks';
import { clamp, SEASON_NAME, TMD_NAME } from '../../sim/core.js';
import { SRC } from '../sources.js';
import { fmt, baht } from '../format.js';
import { t } from '../../i18n/index.js';

/* Join a list of nodes with <br/> between them. */
export const lines = items => items.map((x, i) => <Fragment key={i}>{i > 0 && <br />}{x}</Fragment>);

export const Src = ({ k, children }) => <a href={SRC[k]} target="_blank" rel="noopener">{children}</a>;

export const SeasonChip = ({ lab }) => <span class={`chip ${lab}`}>{SEASON_NAME[lab]}</span>;
export const TmdChip = ({ tmd }) => <span class={`chip ${tmd}`}>{TMD_NAME[tmd]}</span>;

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
