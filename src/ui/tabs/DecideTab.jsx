import { CITIES, SEGMENTS, WEEKS, INFLUENCER, OTA_COMMISSION, COST, clamp } from '../../sim/core.js';
import { player, weekCtx, plannedSpend } from '../session.js';
import { RangeCtl, SeasonChip, TmdChip, Src } from '../components/widgets.jsx';
import { SEG_COLOR } from '../theme.js';
import { schedText } from '../eventText.js';
import { fmt } from '../format.js';
import { t, tx } from '../../i18n/index.js';

function WeekBox({ G }) {
  const x = weekCtx(G, G.week);
  const ev = G.timeline[G.week].scheduled;
  const next = G.week + 1 < WEEKS ? G.timeline[G.week + 1].scheduled : [];
  return (
    <div class="weekbox">
      <b>{t('decide.thisWeek', { label: x.wi.label })}</b> <TmdChip tmd={x.tmd} /><SeasonChip lab={x.lab} />
      {' '}{t('decide.seasonDemand', { s: x.s.toFixed(2) })}
      {ev.length || next.length
        ? (
          <ul class="list" style="margin-top:6px">
            {ev.map(e => <li key={e.name}><b>{e.name}</b>: {schedText(e)}</li>)}
            {next.map(e => <li key={'n' + e.name}>{t('decide.nextWeek', { name: e.name })}</li>)}
          </ul>
        )
        : <p class="small muted" style="margin:4px 0 0">{t('decide.noEvents')}</p>}
    </div>
  );
}

function SegmentTable({ G }) {
  const c = CITIES[G.city];
  const tot = SEGMENTS.reduce((a, s) => a + c.demand[s.id], 0);
  const days = s => (s.wdShare > 0.6 ? t('decide.weekday') : s.wdShare < 0.4 ? t('decide.weekend') : t('decide.both'));
  return (
    <>
      <div class="tablewrap">
        <table class="compact">
          <thead><tr>
            <th>{t('decide.segCol')}</th><th>{t('decide.wtpCol')}</th><th>{t('decide.shareCol')}</th>
            <th>{t('decide.foreignCol')}</th><th>{t('decide.daysCol')}</th>
          </tr></thead>
          <tbody>
            {SEGMENTS.map(s => (
              <tr key={s.id}>
                <td>
                  <span style={{ color: SEG_COLOR[s.id] }}>■</span> <b>{s.name}</b>
                  <span class="focus">{t('decide.focus', { f: t(`segFocus.${s.id}`) })}</span>
                </td>
                <td>{t('decide.about', { v: fmt(s.wtp) })}</td>
                <td>{Math.round(c.demand[s.id] / tot * 100)}%</td>
                <td>{Math.round(clamp(c.foreign * s.fb, 0, 0.95) * 100)}%</td>
                <td>{days(s)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p class="note">{t('decide.wtpNote')}</p>
    </>
  );
}

export function DecideTab({ s, update, onGoStaff }) {
  const { G } = s;
  const h = player(G);
  if (G.week >= WEEKS) {
    return <div class="panel"><h2>{t('decide.overTitle')}</h2><p>{t('decide.overText')}</p></div>;
  }
  const set = fn => v => update(() => fn(v));
  return (
    <>
      <div class="panel">
        <h2>{t('decide.title', { n: G.week + 1 })}</h2>
        <WeekBox G={G} />
        <h3>{t('decide.knowCustomers', { city: CITIES[G.city].name })}</h3>
        <SegmentTable G={G} />
      </div>
      <div class="two">
        <div class="panel">
          <h3 style="margin-top:0">{t('decide.priceTitle')}</h3>
          <RangeCtl label={t('decide.priceWd')} value={h.price.wd} min={200} max={4000} step={10} big={50} isPrice
            onChange={set(v => { h.price.wd = v; })} />
          <RangeCtl label={t('decide.priceWe')} value={h.price.we} min={200} max={4000} step={10} big={50} isPrice
            onChange={set(v => { h.price.we = v; })} />
          <p class="note">{t('decide.priceNote', { ref: fmt(G.refP) })}</p>
          <p class="small">
            {t('decide.team', { n: h.staff.length, sal: fmt(plannedSpend(G).sal) })}{' '}
            <button class="btn ghost" type="button" style="padding:2px 10px;box-shadow:none" onClick={onGoStaff}>{t('decide.goStaff')}</button>
          </p>
          {h.closed > 0 && <div class="warn">{t('decide.closed', { n: h.closed, w: h.closedWeeks })}</div>}
        </div>
        <div class="panel">
          <h3 style="margin-top:0">{t('decide.mkTitle')}</h3>
          <RangeCtl label={t('decide.billboard')} sub={t('decide.billboardSub')} value={h.mk.billboard} min={0} max={4000} step={100} big={100}
            onChange={set(v => { h.mk.billboard = v; })} />
          <RangeCtl label={t('decide.online')} sub={t('decide.onlineSub')} value={h.mk.online} min={0} max={4000} step={100} big={100}
            onChange={set(v => { h.mk.online = v; })} />
          <label class="row">
            <span>{t('decide.influencer')}</span>
            <select value={h.inf} onChange={e => { const v = e.currentTarget.value; update(() => { h.inf = v; }); }}>
              {Object.entries(INFLUENCER).map(([k, v]) => (
                <option key={k} value={k}>{v.cost ? t('decide.infOption', { name: v.name, cost: fmt(v.cost) }) : v.name}</option>
              ))}
            </select>
          </label>
          <p class="note">{t('decide.infNote')}</p>
          <label class="row" style="justify-content:flex-start">
            <input type="checkbox" checked={h.ota} disabled={h.otaBan > 0}
              onChange={e => { const v = e.currentTarget.checked; update(() => { h.ota = v; }); }} />
            {' '}{t('decide.ota', { p: Math.round(OTA_COMMISSION * 100) })}
          </label>
          {h.otaBan > 0 && <div class="warn">{t('decide.otaBan', { n: h.otaBan })}</div>}
          {G.allowFake && (
            <>
              <label class="row" style="justify-content:flex-start">
                <input type="checkbox" checked={h.fake} onChange={e => { const v = e.currentTarget.checked; update(() => { h.fake = v; }); }} />
                {' '}{t('decide.fake', { cost: fmt(COST.fake) })}
              </label>
              <p class="note">{tx('decide.fakeNote', { fine: fmt(COST.fine), src: <Src k="ftc">{t('decide.ftc')}</Src> })}</p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
