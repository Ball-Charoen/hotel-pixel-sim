/* Simple cross-section of the 8-room hostel; windows light up with occupancy.
   Placeholder until the pixel-art building scene (P1 step 4). */
import { clamp, ROOMS } from '../../sim/core.js';
import { t } from '../../i18n/index.js';

const STARS = [[14, 10], [40, 6], [118, 8], [140, 18], [96, 4], [24, 22]];

export function Building({ occ, closed }) {
  const lit = Math.round(clamp(occ || 0, 0, 1) * ROOMS);
  const wins = [];
  let k = 0;
  for (const y of [36, 70]) {
    for (const x of [20, 52, 84, 116]) {
      const isClosed = closed && k >= ROOMS - closed;
      const on = !isClosed && k < lit;
      wins.push(<rect key={`w${k}`} x={x} y={y} width="22" height="20" class={`win${on ? ' on' : ''}`} />);
      if (on) wins.push(<rect key={`g${k}`} x={x + 2} y={y + 2} width="5" height="5" class="glint" />);
      if (isClosed) wins.push(<rect key={`c${k}`} x={x} y={y + 8} width="22" height="4" fill="#C0473A" />);
      k++;
    }
  }
  return (
    <svg viewBox="0 0 154 150" class="bld" role="img" aria-label={t('report.bldAria', { lit, rooms: ROOMS })} shape-rendering="crispEdges">
      <rect x="0" y="0" width="154" height="150" class="sky" />
      {STARS.map(([x, y]) => <rect key={`s${x}`} x={x} y={y} width="2" height="2" class="star" />)}
      <rect x="0" y="138" width="154" height="12" class="ground" />
      <rect x="6" y="24" width="142" height="8" class="roof" />
      <rect x="18" y="16" width="118" height="8" class="roof" />
      <rect x="34" y="8" width="86" height="8" class="roof" />
      <rect x="10" y="32" width="134" height="106" class="wall" />
      <rect x="10" y="62" width="134" height="4" class="beam" />
      <rect x="10" y="96" width="134" height="4" class="beam" />
      {wins}
      <rect x="16" y="106" width="64" height="16" class="sign" />
      <text x="48" y="118" text-anchor="middle" class="signtxt">HOSTEL</text>
      <rect x="98" y="106" width="30" height="32" class="door" />
      <rect x="122" y="120" width="3" height="3" class="glint" />
    </svg>
  );
}
