import { CITIES, SEGMENTS, seasonLabel } from '../../sim/core.js';
import { N } from '../names.js';
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
            title={`${N.month(i)} ${N.season(lab)}`} />;
        })}
      </div>
      <div class="mlabels">{t('data.month').map(m => <span key={m}>{m}</span>)}</div>
      <p class="small muted"><SeasonChip lab="high" /><SeasonChip lab="shoulder" /><SeasonChip lab="low" /></p>
    </>
  );
}

export function CityCard({ id }) {
  const c = CITIES[id];
  const tot = SEGMENTS.reduce((a, s) => a + c.demand[s.id], 0);
  const top = SEGMENTS.slice().sort((a, b) => c.demand[b.id] - c.demand[a.id]).slice(0, 2)
    .map(s => `${N.seg(s.id)} ${Math.round(c.demand[s.id] / tot * 100)}%`).join(', ');
  return (
    <>
      <div class="citycard">
        <Landmark city={id} />
        <div>
          <h2 style="margin-bottom:2px">{N.city(id)}</h2>
          <p class="small muted" style="margin-bottom:6px">{t('city.subtitle', { map: N.map(c.map), lm: N.cityLm(id) })}</p>
          <p>{N.cityStory(id)}</p>
          <p class="small">{t('city.mix', { foreign: Math.round(c.foreign * 100), top })}</p>
        </div>
      </div>
      <h3>{t('city.seasonTitle', { city: N.city(id) })}</h3>
      <MonthBars city={id} />
    </>
  );
}
