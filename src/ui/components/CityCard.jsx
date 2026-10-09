import { CITIES, SEGMENTS, WEEKS, seasonLabel, weekInfo } from '../../sim/core.js';
import { N } from '../names.js';
import { Landmark } from './pixels.jsx';
import { SeasonChip } from './widgets.jsx';
import { t } from '../../i18n/index.js';

const BAR_VAR = { high: 'hi', shoulder: 'sh', low: 'lo' };

/* Months a 12-week game starting on the 1st of `start` runs through (usually 3). */
export function gameMonths(start) {
  const m = new Set();
  for (let w = 0; w < WEEKS; w++) { const wi = weekInfo({ startMonth: start }, w); m.add(wi.start.getUTCMonth()); m.add(wi.end.getUTCMonth()); }
  return [...m];
}

/* Monthly demand index of a city (1.00 = yearly average; game estimate, see docs/spec-summary.md §5).
   start: highlight the months the game covers. onPick(month): click a bar to choose the start month. */
export function MonthBars({ city, start = null, onPick = null }) {
  const a = CITIES[city].monthly;
  const mx = Math.max(...a);
  const inGame = start === null ? [] : gameMonths(start);
  const names = t('data.month');
  return (
    <>
      <div class={`mbars${onPick ? ' pick' : ''}`} aria-label={t('city.monthlyAria')}>
        {a.map((v, i) => {
          const lab = seasonLabel(v);
          const tip = `${N.month(i)} · ${N.season(lab)} · ${v.toFixed(2)}`;
          const style = { height: `${Math.round(v / mx * 100)}%`, background: `var(--${BAR_VAR[lab]})` };
          const cls = inGame.includes(i) ? 'in' : '';
          return onPick
            ? <button key={i} type="button" class={cls} style={style} title={tip} aria-label={tip} aria-pressed={i === start} onClick={() => onPick(i)} />
            : <span key={i} class={cls} style={style} title={tip} />;
        })}
      </div>
      <div class="mlabels">{names.map((m, i) => <span key={m} class={inGame.includes(i) ? 'in' : ''}>{m}</span>)}</div>
      <p class="small muted"><SeasonChip lab="high" /><SeasonChip lab="shoulder" /><SeasonChip lab="low" />
        {start !== null && <> · <b>{t('city.gameSpan', { from: names[inGame[0]], to: names[inGame[inGame.length - 1]] })}</b></>}</p>
      <p class="small muted">{t(onPick ? 'city.indexNotePick' : 'city.indexNote')}</p>
    </>
  );
}

export function CityCard({ id, start = null, onPick = null }) {
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
      <MonthBars city={id} start={start} onPick={onPick} />
    </>
  );
}
