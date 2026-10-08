import { WEEKS, CANCEL_P, SEASON_NAME, TMD_NAME } from '../../sim/core.js';
import { weekCtx } from '../session.js';
import { CityCard } from '../components/CityCard.jsx';
import { SeasonChip, TmdChip, lines } from '../components/widgets.jsx';
import { schedText, phaseName } from '../eventText.js';
import { weekShort } from '../format.js';
import { t } from '../../i18n/index.js';

function SeasonBand({ G }) {
  const wk = [], tour = [], tmd = [], ev = [];
  for (let w = 0; w < WEEKS; w++) {
    const x = weekCtx(G, w);
    const cur = w === G.week ? ' cur' : '';
    const sch = G.timeline[w].scheduled;
    wk.push(<div key={w} class={`cell ev${cur}`}><b>{weekShort(w + 1)}</b><br />{x.wi.label}</div>);
    tour.push(<div key={w} class={`cell ${x.lab}${cur}`}>{SEASON_NAME[x.lab]}</div>);
    tmd.push(<div key={w} class={`cell ${x.tmd}${cur}`}>{TMD_NAME[x.tmd]}</div>);
    ev.push(<div key={w} class={`cell ev${cur}`}>{sch.length ? lines(sch.map(e => '★ ' + e.name)) : '–'}</div>);
  }
  return (
    <>
      <div class="bandwrap">
        <div class="band2">
          <div class="lab">{t('market.bandWeek')}</div>{wk}
          <div class="lab">{t('market.bandTour')}</div>{tour}
          <div class="lab">{t('market.bandTmd')}</div>{tmd}
          <div class="lab">{t('market.bandEvent')}</div>{ev}
        </div>
      </div>
      <div class="bandlegend">
        <SeasonChip lab="high" /><SeasonChip lab="shoulder" /><SeasonChip lab="low" />
        <TmdChip tmd="summer" /><TmdChip tmd="rainy" /><TmdChip tmd="winter" />
      </div>
    </>
  );
}

function CalendarTable({ G, reveal }) {
  const rows = [];
  for (let w = 0; w < WEEKS; w++) {
    const x = weekCtx(G, w);
    const tl = G.timeline[w];
    const past = w < G.week;
    const sch = tl.scheduled.length
      ? lines(tl.scheduled.map(e => (
          <>
            <b>{e.name}</b>{e.kind === 'national' ? t('market.national') : t('market.announced')}<br />
            <span class="small muted">{schedText(e)}</span>
            {past && e.cancelled && <><br /><span class="down">{t('market.cancelled')}</span></>}
          </>
        )))
      : <span class="muted">–</span>;
    let sh;
    if (past) {
      sh = tl.shocks.length
        ? lines(tl.shocks.map(s => <>{s.ev.positive ? '▲' : '▼'} {s.ev.name} <span class="small muted">({phaseName(s.k, s.d, s.perm)})</span></>))
        : <span class="muted">{t('market.none')}</span>;
    } else if (reveal) {
      sh = tl.shocks.length ? lines(tl.shocks.map(s => <span class="muted">{s.ev.name}</span>)) : '–';
    } else {
      sh = <span class="muted">?</span>;
    }
    rows.push(
      <tr key={w} class={w === G.week ? 'now' : ''}>
        <td>{weekShort(w + 1)}<br /><span class="small muted">{x.wi.label}</span></td>
        <td><SeasonChip lab={x.lab} /><br /><TmdChip tmd={x.tmd} /></td>
        <td>{sch}</td>
        <td>{sh}</td>
      </tr>,
    );
  }
  return (
    <div class="tablewrap">
      <table class="cal">
        <thead><tr>
          <th>{t('market.colWeek')}</th><th>{t('market.colSeason')}</th><th>{t('market.colScheduled')}</th><th>{t('market.colShocks')}</th>
        </tr></thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}

export function MarketTab({ s }) {
  const { G } = s;
  const news = G.news.slice(-8).reverse();
  return (
    <>
      <div class="two">
        <div class="panel"><CityCard id={G.city} /></div>
        <div class="panel">
          <h2>{t('market.news')}</h2>
          {news.length
            ? <ul class="list">{news.map((n, i) => <li key={i}>{t('market.newsItem', { week: weekShort(n.week), text: n.text })}</li>)}</ul>
            : <p class="muted small">{t('market.noNews')}</p>}
        </div>
      </div>
      <div class="panel"><h2>{t('market.seasonsTitle')}</h2><SeasonBand G={G} /></div>
      <div class="panel">
        <h2>{t('market.calTitle')}</h2>
        <p class="small">{t('market.calIntro', { p: Math.round(CANCEL_P * 100) })}</p>
        <CalendarTable G={G} reveal={s.reveal} />
      </div>
    </>
  );
}
