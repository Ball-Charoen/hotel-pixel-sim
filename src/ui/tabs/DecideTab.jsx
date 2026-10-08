import { CITIES, SEGMENTS, WEEKS, INFLUENCER, OTA_COMMISSION, COST, GROWTH, TIERS, clamp } from '../../sim/core.js';
import { player, weekCtx, plannedSpend, canGrow, grow } from '../session.js';
import { RangeCtl, SeasonChip, TmdChip, Src } from '../components/widgets.jsx';
import { SEG_COLOR } from '../theme.js';
import { N, weekLabel } from '../names.js';
import { schedText } from '../eventText.jsx';
import { fmt } from '../format.js';
import { t, tx } from '../../i18n/index.js';
import { confirmDialog } from '../confirm.jsx';

function WeekBox({ G }) {
  const x = weekCtx(G, G.week);
  const ev = G.timeline[G.week].scheduled;
  const next = G.week + 1 < WEEKS ? G.timeline[G.week + 1].scheduled : [];
  return (
    <div class="weekbox">
      <b>{t('decide.thisWeek', { label: weekLabel(x.wi) })}</b> <TmdChip tmd={x.tmd} /><SeasonChip lab={x.lab} />
      {' '}{t('decide.seasonDemand', { s: x.s.toFixed(2) })}
      {ev.length || next.length
        ? (
          <ul class="list" style="margin-top:6px">
            {ev.map(e => <li key={e.id}><b>{N.event(e.id)}</b>: {schedText(e)}</li>)}
            {next.map(e => <li key={'n' + e.id}>{t('decide.nextWeek', { name: N.event(e.id) })}</li>)}
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
                  <span style={{ color: SEG_COLOR[s.id] }}>■</span> <b>{N.seg(s.id)}</b>
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

/* Growth path T0 -> T1 (licence + 16 rooms) -> T2 (restaurant), with progress and costs. */
function GrowthPanel({ G, update, onGoStaff }) {
  const h = player(G);
  const p = h.proj || {};
  const tierText = t(`growth.tier${h.tier}`, { rooms: h.rooms });
  const step = (title, info, status, action) => (
    <div class="growstep">
      <div><b>{title}</b><br /><span class="small muted">{info}</span></div>
      <div class="growstatus">{action || <span class={status === t('growth.done') ? 'up' : 'muted'}>{status}</span>}</div>
    </div>
  );
  const ask = async (msg, kind) => { if (await confirmDialog(msg)) update(() => grow(G, kind)); };
  const licenceStatus = h.tier >= 1 ? t('growth.done') : p.licence ? t('growth.waiting', { n: p.licence }) : null;
  const buildStatus = h.rooms >= TIERS[1].rooms ? t('growth.done') : p.build ? t('growth.building', { n: p.build }) : t('growth.auto');
  const restStatus = h.restaurant ? t('growth.done') : p.rest ? t('growth.fitting', { n: p.rest }) : h.tier < 1 ? t('growth.needLicence') : null;
  return (
    <div class="panel">
      <h3 style="margin-top:0">{t('growth.title')}</h3>
      <p><b>{t('growth.now', { tier: tierText })}</b></p>
      {step(t('growth.step1'), t('growth.step1Info', { cost: fmt(GROWTH.licenceCost), w: GROWTH.licenceWeeks }), licenceStatus,
        !licenceStatus && canGrow(G, 'licence') && (
          <button class="btn" type="button" onClick={() => ask(t('growth.confirmLicence', { cost: fmt(GROWTH.licenceCost), build: fmt(GROWTH.buildCost) }), 'licence')}>{t('growth.apply')}</button>
        ))}
      {step(t('growth.step2', { rooms: TIERS[1].rooms }), t('growth.step2Info', {
        cost: fmt(GROWTH.buildCost), w: GROWTH.buildWeeks, fixed: fmt((TIERS[1].rooms - 8) * GROWTH.fixedPerExtraRoom), staff: TIERS[1].maxStaff,
      }), buildStatus)}
      {step(t('growth.step3'), t('growth.step3Info', { cost: fmt(GROWTH.restCost), w: GROWTH.restWeeks, fixed: fmt(GROWTH.restFixed), staff: TIERS[2].maxStaff }), restStatus,
        !restStatus && canGrow(G, 'restaurant') && (
          <button class="btn" type="button" onClick={() => ask(t('growth.confirmRest', { cost: fmt(GROWTH.restCost), fixed: fmt(GROWTH.restFixed) }), 'restaurant')}>{t('growth.openRest')}</button>
        ))}
      {h.restaurant && !h.staff.some(x => x.role === 'fb') && (
        <div class="warn">{t('growth.noFB')} <button class="btn ghost" type="button" style="padding:2px 10px;box-shadow:none" onClick={onGoStaff}>{t('decide.goStaff')}</button></div>
      )}
      <p class="note">{t('growth.cashNote')}</p>
      <p class="note">{tx('growth.law', { src: <Src k="hotelReg">{t('growth.srcLaw')}</Src> })}</p>
    </div>
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
        <h3>{t('decide.knowCustomers', { city: N.city(G.city) })}</h3>
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
                <option key={k} value={k}>{v.cost ? t('decide.infOption', { name: N.inf(k), cost: fmt(v.cost) }) : N.inf(k)}</option>
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
      <GrowthPanel G={G} update={update} onGoStaff={onGoStaff} />
    </>
  );
}
