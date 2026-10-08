/* Small pixel drawings made from character grids: Thailand map, city vignettes, staff avatars. */
import M from '../../data/thmap.json';
import LANDMARKS from '../../data/landmarks.json';
import { CITIES, mulberry32 } from '../../sim/core.js';
import { PAL } from '../theme.js';
import { t } from '../../i18n/index.js';
import { spriteUrl, staffRow } from '../../scene/sprites.js';
import { N } from '../names.js';

/* One <rect> per horizontal run of the same character; colorOf(ch) returns a fill or null to skip. */
function pixelRuns(rows, colorOf) {
  const out = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let n = 1;
      while (x + n < row.length && row[x + n] === ch) n++;
      const fill = colorOf(ch);
      if (fill) out.push(<rect key={`${x},${y}`} x={x} y={y} width={n} height={1} fill={fill} />);
      x += n;
    }
  });
  return out;
}

export function Landmark({ city }) {
  const png = spriteUrl(`city-${city}.png`);
  if (png) return <img class="lm" src={png} alt={N.cityLm(city)} width="160" height="96" />;
  return (
    <svg viewBox="0 0 20 16" class="lm" role="img" aria-label={N.cityLm(city)} shape-rendering="crispEdges">
      <rect width="20" height="16" fill="#BFE0EA" />
      {pixelRuns(LANDMARKS[city], ch => (ch === '.' ? null : PAL[ch]))}
    </svg>
  );
}

export function ThaiMap({ selected, onSelect }) {
  const land = pixelRuns(M.rows, ch => (ch === '.' ? null : ch === 'T' ? 'var(--land)' : 'var(--nb)'));
  const pins = Object.entries(CITIES).map(([id, c]) => {
    const x = (c.lon - M.lon0) / M.step, y = (M.lat1 - c.lat) / M.step;
    const on = id === selected;
    const pick = () => onSelect(id);
    return (
      <g key={id} data-city={id} tabindex="0" role="button" aria-label={N.city(id)} aria-pressed={on} onClick={pick}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } }}>
        <rect class="pin" x={(x - 1).toFixed(1)} y={(y - 1).toFixed(1)} width="2" height="2"
          fill={on ? 'var(--lamp)' : 'var(--pin)'} stroke="var(--line)" stroke-width=".4" />
        {on && (
          <text x={(x + 1.8).toFixed(1)} y={(y + 0.9).toFixed(1)} font-size="2.6" font-weight="700" fill="var(--ink)"
            stroke="var(--surface)" stroke-width=".5" paint-order="stroke">{N.city(id)}</text>
        )}
      </g>
    );
  });
  return (
    <svg viewBox={`0 0 ${M.W} ${M.H}`} class="thmap" role="img" aria-label={t('setup.mapAria')} shape-rendering="crispEdges">
      <rect width={M.W} height={M.H} fill="var(--sea)" />
      {land}
      {pins}
    </svg>
  );
}

/* Placeholder staff face generated from a seed; replaced by the owner's 48×48 portraits later. */
export function Avatar({ id, look, label }) {
  // Owner's portraits: 8 faces of 48×48 in one strip, same order as the staff sprites (c0..c7).
  const png = id != null && spriteUrl('staff-portraits.png');
  if (png) return <span class="avatar portrait" role="img" aria-label={label} style={{ backgroundImage: `url(${png})`, backgroundPosition: `${-staffRow(id) * 36}px 0` }} />;
  const rng = mulberry32(look || 1);
  const skins = ['#F1C9A5', '#E0AC82', '#C68B5E', '#9A6644'];
  const hairs = ['#2B2222', '#4A3426', '#7A4E2D', '#1E2430', '#B6542F'];
  const unis = ['#1F7A65', '#4F6FB0', '#C8577A', '#B5643C', '#3E8E7E'];
  const sk = skins[Math.floor(rng() * 4)], hr = hairs[Math.floor(rng() * 5)], un = unis[Math.floor(rng() * 5)];
  const style = Math.floor(rng() * 3);
  const r = [];
  const px = (x, y, c, w = 1, h = 1) => r.push(<rect key={r.length} x={x} y={y} width={w} height={h} fill={c} />);
  px(3, 2, hr, 6, 2); px(2, 3, hr, 1, style === 1 ? 6 : 3); px(9, 3, hr, 1, style === 1 ? 6 : 3); if (style === 2) px(5, 0, hr, 2, 2);
  px(3, 4, sk, 6, 4); px(4, 5, '#1D2B34'); px(7, 5, '#1D2B34'); px(5, 7, '#B05A4A', 2, 1); px(3, 8, sk, 6, 1);
  px(2, 9, un, 8, 3); px(5, 9, '#F4EFE2', 2, 1); px(5, 10, '#F2B33D', 2, 1);
  return <svg viewBox="0 0 12 12" class="avatar" role="img" aria-label={label} shape-rendering="crispEdges">{r}</svg>;
}
