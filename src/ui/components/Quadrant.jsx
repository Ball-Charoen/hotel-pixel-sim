/* MPI × ARI 2×2 chart with the player's weekly trail. */
import { clamp } from '../../sim/core.js';
import { Src } from './widgets.jsx';
import { t, tx } from '../../i18n/index.js';

export function Quadrant({ log }) {
  const W = 380, H = 300, pl = 58, pb = 58, pt = 12, pr = 12;
  const X = v => pl + (clamp(v, 40, 160) - 40) / 120 * (W - pl - pr);
  const Y = v => pt + (1 - (clamp(v, 40, 160) - 40) / 120) * (H - pt - pb);
  const pts = log.map(r => [X(r.mpi), Y(r.ari)]);
  const lastI = pts.length - 1;
  const axisTitle = { fontWeight: '700', fill: 'var(--ink)' };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('quad.aria')}>
      <rect x={pl} y={pt} width={W - pl - pr} height={H - pt - pb} fill="none" stroke="var(--soft)" />
      <line x1={X(100)} x2={X(100)} y1={pt} y2={H - pb} stroke="var(--line)" />
      <line x1={pl} x2={W - pr} y1={Y(100)} y2={Y(100)} stroke="var(--line)" />
      <text x={X(130)} y={Y(152)} text-anchor="middle" class="lbl">{t('quad.topRight')}</text>
      <text x={X(130)} y={Y(45)} text-anchor="middle" class="lbl">{t('quad.bottomRight')}</text>
      <text x={X(70)} y={Y(152)} text-anchor="middle" class="lbl">{t('quad.topLeft')}</text>
      <text x={X(70)} y={Y(45)} text-anchor="middle" class="lbl">{t('quad.bottomLeft')}</text>
      {[60, 100, 140].map(v => (
        <g key={v}>
          <text x={X(v)} y={H - pb + 14} text-anchor="middle" class="lbl">{v}</text>
          <text x={pl - 6} y={Y(v) + 4} text-anchor="end" class="lbl">{v}</text>
        </g>
      ))}
      <text x={(pl + W - pr) / 2} y={H - 26} text-anchor="middle" class="lbl" style={axisTitle}>{t('quad.xAxis')}</text>
      <text x={(pl + W - pr) / 2} y={H - 10} text-anchor="middle" class="lbl">{t('quad.xSub')}</text>
      <text transform={`translate(16 ${(pt + H - pb) / 2}) rotate(-90)`} text-anchor="middle" class="lbl" style={axisTitle}>{t('quad.yAxis')}</text>
      <text transform={`translate(30 ${(pt + H - pb) / 2}) rotate(-90)`} text-anchor="middle" class="lbl">{t('quad.ySub')}</text>
      {pts.length > 1 && (
        <polyline points={pts.map(p => p.join(',')).join(' ')} fill="none" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="3 3" />
      )}
      {pts.map((p, k) => (
        <circle key={k} cx={p[0]} cy={p[1]} r={k === lastI ? 7 : 3} fill={k === lastI ? 'var(--lamp)' : 'var(--muted)'}
          stroke="var(--line)" stroke-width={k === lastI ? 2 : 0} />
      ))}
    </svg>
  );
}

export function QuadLegend() {
  return (
    <div class="legendbox">
      <b>MPI</b>{t('quad.mpi')}<br />
      <b>ARI</b>{t('quad.ari')}<br />
      {t('quad.dots')}{' '}
      <span class="muted">{tx('quad.src', { a: <Src k="ehl">EHL Insights</Src>, b: <Src k="chekin">Chekin</Src> })}</span>
    </div>
  );
}
