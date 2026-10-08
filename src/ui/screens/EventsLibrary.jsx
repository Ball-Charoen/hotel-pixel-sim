/* Content of the "i" window: how events are drawn, frequencies, and the full event catalogue. */
import { CITIES, CHAOS, CATS, SEV, SHOCKS, NATIONAL, SEEDED, INTERNAL, CANCEL_P, COST, TH_MONTH, TH_MONTH_FULL } from '../../sim/core.js';
import { eventFrequency } from '../session.js';
import { HBar, Src } from '../components/widgets.jsx';
import { effText, schedText } from '../eventText.jsx';
import { fmt } from '../format.js';
import { t, tx } from '../../i18n/index.js';

function citiesFor(s) {
  const ids = Object.keys(CITIES).filter(id => s.where(CITIES[id]));
  return ids.length === Object.keys(CITIES).length ? t('lib.allCities') : ids.map(id => CITIES[id].name).join(', ');
}

function duration(s) {
  if (s.perm) return t('lib.perm');
  return s.dur[0] === s.dur[1] ? t('lib.weeks', { n: s.dur[0] }) : t('lib.weeksRange', { a: s.dur[0], b: s.dur[1] });
}

function ShockTable({ G, cat }) {
  const ch = CHAOS[G.chaos];
  const city = CITIES[G.city];
  return (
    <div class="tablewrap">
      <table>
        <thead><tr>
          <th>{t('lib.colShock')}</th><th>{t('lib.colSev')}</th><th>{t('lib.colWhere')}</th>
          <th>{t('lib.colDur')}</th><th>{t('lib.colFull')}</th><th>{t('lib.colWeight', { city: city.name })}</th>
        </tr></thead>
        <tbody>
          {SHOCKS.filter(s => s.cat === cat).map(s => {
            const wt = s.w * ch.sevW[s.sev] * (s.wf ? s.wf(city) : 1);
            const here = s.where(city);
            return (
              <tr key={s.id}>
                <td>{s.positive ? '▲' : '▼'} <b>{s.name}</b><br /><span class="small muted">{s.text}</span></td>
                <td>{SEV[s.sev]}</td>
                <td class="small">
                  {citiesFor(s)}
                  {s.months && <><br />{t('lib.onlyMonths', { months: s.months.map(m => TH_MONTH[m]).join(' ') })}</>}
                </td>
                <td>{duration(s)}{s.repeat && <><br /><span class="small muted">{t('lib.repeat')}</span></>}</td>
                <td class="small">{effText(s.eff)}</td>
                <td>{here && wt > 0 ? wt.toFixed(2) : <span class="muted">0</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Frequency({ G, f }) {
  const ch = CHAOS[G.chaos];
  const max = Math.max(...f.top.map(x => x.c / f.n * 100));
  return (
    <>
      <p>{tx('lib.freqSummary', {
        n: f.n, city: CITIES[G.city].name, month: TH_MONTH_FULL[G.startMonth], chaos: ch.name,
        avg: <b>{(f.tot / f.n).toFixed(1)}</b>, neg: (f.neg / f.n).toFixed(1), pos: (f.pos / f.n).toFixed(1),
      })}</p>
      <p class="small">{t('lib.freqCats', { cats: Object.entries(f.cat).map(([k, v]) => `${CATS[k]} ${(v / f.n).toFixed(2)}`).join(' · ') })}</p>
      {f.top.slice(0, 12).map(x => (
        <HBar key={x.s.id} label={x.s.name} v={x.c / f.n * 100} max={max} right={(x.c / f.n * 100).toFixed(0) + '%'} />
      ))}
      <p class="note">{t('lib.freqNote')}</p>
    </>
  );
}

const INTERNAL_KEYS = ['pr', 'overbook', 'repair', 'gouging'];

export function EventsLibrary({ s, update }) {
  const { G } = s;
  const ch = CHAOS[G.chaos];
  const city = CITIES[G.city];
  const cost = { overbook: COST.overbook, repair: COST.repair };
  return (
    <>
      <div class="panel">
        <h2>{t('lib.title')}</h2>
        <p>{tx('lib.intro', {
          disaster: <b>{t('lib.disaster')}</b>, crisis: <b>{t('lib.crisis')}</b>,
          src1: <Src k="faulkner">{t('lib.src')}</Src>, src2: <Src k="faulknerPhases">{t('lib.src')}</Src>,
        })}</p>
        <h3>{t('lib.howTitle', { chaos: ch.name })}</h3>
        <ul class="list">
          <li>{t('lib.how1')}</li>
          <li>{t('lib.how2', { p: Math.round(ch.p * 100), max: ch.max })}</li>
          <li>{t('lib.how3', { minor: ch.sevW.minor, major: ch.sevW.major, cat: ch.sevW.cat })}</li>
          <li>{t('lib.how4')}</li>
          <li>{t('lib.how5', { scale: ch.scale })}</li>
          <li>{t('lib.how6')}</li>
        </ul>
        <button class="btn ghost" type="button" onClick={() => update(x => { x.freq = eventFrequency(G); })}>{t('lib.freqBtn')}</button>
        {s.freq && <Frequency G={G} f={s.freq} />}
        <details style="margin-top:12px">
          <summary>{t('lib.revealSummary')}</summary>
          <label class="row" style="justify-content:flex-start">
            <input type="checkbox" checked={s.reveal} onChange={e => { const v = e.currentTarget.checked; update(x => { x.reveal = v; }); }} />
            {' '}{t('lib.revealLabel')}
          </label>
        </details>
      </div>
      <div class="panel">
        <h2>{t('lib.seasonSrcTitle')}</h2>
        <p class="small">{tx('lib.seasonSrc', {
          tmd: <Src k="tmd">{t('lib.srcTmd')}</Src>, phuket: <Src k="phuket">{t('lib.srcPhuket')}</Src>, ranong: <Src k="ranong">{t('lib.srcRanong')}</Src>,
        })}</p>
      </div>
      <div class="panel evcat">
        <h2>{t('lib.schedTitle')}</h2>
        <h3>{t('lib.nationalTitle')}</h3>
        <div class="tablewrap">
          <table>
            <thead><tr><th>{t('lib.colEvent')}</th><th>{t('lib.colDate')}</th><th>{t('lib.colEffect')}</th></tr></thead>
            <tbody>
              {NATIONAL.filter(e => !e.city || e.city === G.city).map(e => (
                <tr key={e.id}>
                  <td><b>{e.name}</b><br /><span class="small muted">{e.text}</span></td>
                  <td>{e.d} {TH_MONTH[e.m]}{e.id === 'loykrathong' || e.id === 'cny' ? t('lib.approx') : ''}</td>
                  <td class="small">{schedText(e)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p class="note">{tx('lib.festivalNote', { src: <Src k="festival">{t('lib.srcFestival')}</Src> })}</p>
        <h3>{t('lib.seededTitle', { p: Math.round(CANCEL_P * 100) })}</h3>
        <div class="tablewrap">
          <table>
            <thead><tr><th>{t('lib.colEvent')}</th><th>{t('lib.colEffect')}</th></tr></thead>
            <tbody>
              {SEEDED.map(e => (
                <tr key={e.name}><td><b>{e.name}</b><br /><span class="small muted">{e.text}</span></td><td class="small">{schedText(e)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {['macro', 'political', 'industry'].map(k => (
        <div key={k} class="panel evcat">
          <h2>{t('lib.shockTitle', { cat: CATS[k] })}</h2>
          <ShockTable G={G} cat={k} />
        </div>
      ))}
      <div class="panel evcat">
        <h2>{t('lib.internalTitle')}</h2>
        <div class="tablewrap">
          <table>
            <thead><tr><th>{t('lib.colShock')}</th><th>{t('lib.colChance')}</th><th>{t('lib.colResult')}</th></tr></thead>
            <tbody>
              {INTERNAL_KEYS.map((k, idx) => (
                <tr key={k}>
                  <td><b>{INTERNAL[idx].name}</b>{k === 'pr' && <><br /><span class="small muted">{INTERNAL[idx].variants.join(' / ')}</span></>}</td>
                  <td>{t(`lib.${k}.chance`)}</td>
                  <td>{t(`lib.${k}.result`, { c: fmt(cost[k] || 0) })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p class="note">{t('lib.internalNote')}</p>
      </div>
    </>
  );
}
