import { CITIES, MAPS, SEGMENTS, TH_MONTH, SEASON_NAME, seasonLabel } from '../../sim/core.js';
import { Landmark } from './pixels.jsx';
import { SeasonChip } from './widgets.jsx';
import { t } from '../../i18n/index.js';

const BAR_VAR = { high: 'hi', shoulder: 'sh', low: 'lo' };

function MonthBars({ city }) {
  const a = CITIES[city].monthly;
  const mx = Math.max(...a);
  return (
    <>
      <div class="mbars" aria-label={t('city.monthlyAria')}>
        {a.map((v, i) => {
          const lab = seasonLabel(v);
          return <span key={i} style={{ height: `${Math.round(v / mx * 100)}%`, background: `var(--${BAR_VAR[lab]})` }}
            title={`${TH_MONTH[i]} ${SEASON_NAME[lab]}`} />;
        })}
      </div>
      <div class="mlabels">{TH_MONTH.map(m => <span key={m}>{m}</span>)}</div>
      <p class="small muted"><SeasonChip lab="high" /><SeasonChip lab="shoulder" /><SeasonChip lab="low" /></p>
    </>
  );
}

export function CityCard({ id }) {
  const c = CITIES[id];
  const tot = SEGMENTS.reduce((a, s) => a + c.demand[s.id], 0);
  const top = SEGMENTS.slice().sort((a, b) => c.demand[b.id] - c.demand[a.id]).slice(0, 2)
    .map(s => `${s.name} ${Math.round(c.demand[s.id] / tot * 100)}%`).join(', ');
  return (
    <>
      <div class="citycard">
        <Landmark city={id} />
        <div>
          <h2 style="margin-bottom:2px">{c.name}</h2>
          <p class="small muted" style="margin-bottom:6px">{t('city.subtitle', { map: MAPS[c.map].name, lm: c.lm })}</p>
          <p>{c.story}</p>
          <p class="small">{t('city.mix', { foreign: Math.round(c.foreign * 100), top })}</p>
        </div>
      </div>
      <h3>{t('city.seasonTitle', { city: c.name })}</h3>
      <MonthBars city={id} />
    </>
  );
}
