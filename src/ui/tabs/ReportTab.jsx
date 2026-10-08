import { Fragment } from 'preact';
import {
  CITIES, SEGMENTS, WEEKS, ROOMS, COST, CATS, SEASON_NAME, TMD_NAME, tmdSeason, seasonLabel,
} from '../../sim/core.js';
import { Building } from '../components/Building.jsx';
import { Quadrant, QuadLegend } from '../components/Quadrant.jsx';
import { LineChart, Src } from '../components/widgets.jsx';
import { SEG_COLOR } from '../theme.js';
import { effText, schedText, phaseName } from '../eventText.js';
import { fmt, pct, weekShort } from '../format.js';
import { t, tx } from '../../i18n/index.js';

const Arrow = ({ v, base }) => (base ? (v >= base ? <span class="up">▲</span> : <span class="down">▼</span>) : null);
const Calc = ({ children }) => <span class="calc">{children}</span>;

function KpiCard({ name, num, numClass, vs, meaning, calc, breakdown, why, caution, sources }) {
  return (
    <div class="kpi">
      <div class="name">{name}</div>
      <div class={`num${numClass ? ' ' + numClass : ''}`}>{num}</div>
      <div class="vs">{vs}</div>
      <details>
        <summary>{t('kpi.howToRead')}</summary>
        <p><b>{t('kpi.meaning')}</b> {meaning}</p>
        <p><b>{t('kpi.calc')}</b> {calc}</p>
        {breakdown && <p><b>{t('kpi.breakdown')}</b> {breakdown}</p>}
        <p><b>{t('kpi.why')}</b> {why}</p>
        <p><b>{t('kpi.caution')}</b> {caution}</p>
        <p class="small muted">{t('kpi.sources')} {sources.map(([k, label], i) => <Fragment key={k}>{i > 0 && ', '}<Src k={k}>{label}</Src></Fragment>)}</p>
      </details>
    </div>
  );
}

function KpiCards({ o }) {
  const y = o.hotels.you, c = o.comp, i = o.idx;
  const avail = ROOMS * 7;
  const adr = y.sold ? fmt(y.adr) : '–';
  return (
    <div class="kpis">
      <KpiCard name={t('kpi.occ.name')} num={pct(y.occ)}
        vs={<><Arrow v={y.occ} base={c.occ} /> {t('kpi.occ.vs', { c: pct(c.occ), wd: pct(y.occP.wd), we: pct(y.occP.we) })}</>}
        meaning={t('kpi.occ.meaning')}
        calc={<Calc>{y.sold} ÷ {avail} × 100 = {pct(y.occ)}</Calc>}
        why={t('kpi.occ.why')}
        caution={t('kpi.occ.caution') + (y.closed ? t('kpi.occ.closed', { n: y.closed }) : '')}
        sources={[['chekin', t('kpi.occ.srcChekin')], ['raft', 'RaftLabs'], ['rpgRev', 'RoomPriceGenie']]} />
      <KpiCard name={t('kpi.adr.name')} num={adr}
        vs={<><Arrow v={y.adr} base={c.adr} /> {t('kpi.adr.vs', { c: fmt(c.adr), wd: fmt(y.price.wd), we: fmt(y.price.we) })}</>}
        meaning={t('kpi.adr.meaning')}
        calc={<Calc>{fmt(y.revenue)} ÷ {y.sold} = {adr}</Calc>}
        why={t('kpi.adr.why')} caution={t('kpi.adr.caution')}
        sources={[['rpgAdr', t('kpi.adr.srcRpg')], ['axis', 'AxisRooms'], ['akia', 'Akia']]} />
      <KpiCard name={t('kpi.revpar.name')} num={fmt(y.revpar)}
        vs={<><Arrow v={y.revpar} base={c.revpar} /> {t('kpi.revpar.vs', { c: fmt(c.revpar) })}</>}
        meaning={t('kpi.revpar.meaning')}
        calc={<><Calc>{fmt(y.revenue)} ÷ {avail} = {fmt(y.revpar)}</Calc> {t('kpi.or')} <Calc>ADR {y.sold ? fmt(y.adr) : 0} × Occ {pct(y.occ)}</Calc></>}
        why={t('kpi.revpar.why')} caution={t('kpi.revpar.caution')}
        sources={[['rpgRev', t('kpi.revpar.srcRpg')], ['akia', 'Akia']]} />
      <KpiCard name={t('kpi.rgi.name')} num={Math.round(i.rgi)} numClass={i.rgi >= 100 ? 'up' : 'down'}
        vs={t('kpi.rgi.vs', { mpi: Math.round(i.mpi), ari: Math.round(i.ari) })}
        meaning={t('kpi.rgi.meaning')}
        calc={<Calc>{fmt(y.revpar)} ÷ {fmt(c.revpar)} × 100 = {Math.round(i.rgi)}</Calc>}
        breakdown={tx('kpi.rgi.breakdown', { calc: <Calc>{Math.round(i.mpi)} × {Math.round(i.ari)} ÷ 100 ≈ {Math.round(i.mpi * i.ari / 100)}</Calc> })}
        why={t('kpi.rgi.why')} caution={t('kpi.rgi.caution')}
        sources={[['str', 'STR Glossary'], ['ehl', 'EHL Insights'], ['chekin', 'Chekin'], ['ehl2', t('kpi.rgi.srcEhl2')]]} />
    </div>
  );
}

/* Automatic reading of the week's result. Rules ported unchanged from the prototype. */
function diagnose(G, o) {
  const y = o.hotels.you, i = o.idx, out = [];
  const mpi = Math.round(i.mpi), ari = Math.round(i.ari);
  const src = k => <Src k={k}>{t('diag.src')}</Src>;
  if (i.mpi >= 100 && i.ari >= 100) out.push(t('diag.both', { mpi, ari }));
  else if (i.mpi >= 100) out.push(tx('diag.volume', { mpi, ari, src: src('chekin') }));
  else if (i.ari >= 100) out.push(tx('diag.rate', { mpi, ari, src: src('rpgRev') }));
  else out.push(t('diag.behind', { mpi, ari }));
  if (y.occ > 0.9) out.push(tx('diag.full', { occ: pct(y.occ), src: src('rpgRev') }));
  if (y.occP.we > 0.93 && y.occP.wd < 0.6) out.push(t('diag.weekendGap', { we: pct(y.occP.we), wd: pct(y.occP.wd) }));
  const nx = G.week < WEEKS ? G.timeline[G.week].scheduled : [];
  if (nx.length) out.push(t('diag.nextEvent', { names: nx.map(e => e.name).join(', ') }));
  if (y.adequacy < 0.8 && y.sold > 0) out.push(t('diag.understaffed'));
  if (y.lang < 45 && CITIES[G.city].foreign > 0.3) out.push(t('diag.language', { lang: Math.round(y.lang) }));
  if (y.revenue > 0 && y.commission / y.revenue > 0.08) out.push(t('diag.commission', { p: pct(y.commission / y.revenue) }));
  if (y.teamSat < 50 && y.staffN) out.push(t('diag.lowSat', { sat: Math.round(y.teamSat) }));
  if (y.cash < 0) out.push(t('diag.negCash'));
  return out;
}

function causeEffect(G, o) {
  const y = o.hotels.you, out = [];
  const bots = G.hotels.filter(h => !h.isPlayer).map(h => o.hotels[h.id]);
  const tmd = tmdSeason(o.info.month, o.info.day), lab = seasonLabel(o.season);
  out.push(t('cause.season', { tmd: TMD_NAME[tmd], season: SEASON_NAME[lab], city: CITIES[G.city].name, s: o.season.toFixed(2) }));
  o.tl.scheduled.forEach(e => out.push(e.cancelled
    ? t('cause.cancelled', { name: e.name })
    : t('cause.scheduled', { name: e.name, eff: schedText(e) })));
  o.tl.shocks.forEach(s => out.push(t('cause.shock', {
    arrow: s.ev.positive ? '▲' : '▼', name: s.ev.name, cat: CATS[s.ev.cat], phase: phaseName(s.k, s.d, s.perm),
    week: s.perm ? '' : t('cause.shockWeek', { k: s.k + 1, d: s.d }), text: s.ev.text, eff: effText(s.ev.eff),
  })));
  if (!o.tl.shocks.length && !o.tl.scheduled.length) out.push(t('cause.quiet'));
  y.crises.forEach(c => out.push(t('cause.crisis', { name: c.name, detail: c.detail })));
  const cP = bots.reduce((a, b) => a + (b.price.wd * 5 + b.price.we * 2) / 7, 0) / bots.length;
  const yP = (y.price.wd * 5 + y.price.we * 2) / 7;
  out.push(t('cause.price', {
    y: fmt(yP), c: fmt(cP), dir: yP >= cP ? t('cause.higher') : t('cause.lower'), d: Math.abs(Math.round((yP / cP - 1) * 100)),
  }));
  const cAw = bots.reduce((a, b) => a + b.awAvg, 0) / bots.length;
  out.push(t('cause.awareness', { y: Math.round(y.awAvg * 100), c: Math.round(cAw * 100) }));
  if (y.sold > 0) out.push(t('cause.service', { q: Math.round(y.Q), e: Math.round(y.E), r: y.rating.toFixed(1), R: y.R.toFixed(2) }));
  if (y.inf !== 'none') out.push(t('cause.influencer', { c: y.infCred.toFixed(2) }) + (y.notes.includes('infBad') ? t('cause.infBad') : ''));
  if (y.fake) out.push(y.caught ? t('cause.fakeCaught', { fine: fmt(COST.fine) }) : t('cause.fakeSafe'));
  out.push(t('cause.staff', { n: y.staffN, load: y.staffN ? Math.round(y.load) : 0, sat: Math.round(y.teamSat) })
    + (y.quits.length ? t('cause.quits', { names: y.quits.join(', ') }) : ''));
  o.news.forEach(n => out.push(t('cause.news', { text: n })));
  return out;
}

function CompTable({ G, o }) {
  return (
    <div class="tablewrap">
      <table>
        <thead><tr>
          <th>{t('comp.hotel')}</th><th>{t('comp.price')}</th><th>{t('comp.occ')}</th>
          <th>{t('comp.adr')}</th><th>{t('comp.revpar')}</th><th>{t('comp.stars')}</th>
        </tr></thead>
        <tbody>
          {G.hotels.map(h => {
            const r = o.hotels[h.id];
            return (
              <tr key={h.id} class={h.isPlayer ? 'you' : ''}>
                <td>{h.name}{h.isPlayer && t('unit.you')}</td>
                <td>{fmt(r.price.wd)} / {fmt(r.price.we)}</td>
                <td>{pct(r.occ)}</td>
                <td>{r.sold ? fmt(r.adr) : '–'}</td>
                <td>{fmt(r.revpar)}</td>
                <td>{r.R.toFixed(2)}</td>
              </tr>
            );
          })}
          <tr>
            <td class="muted">{t('comp.avg')}</td><td />
            <td>{pct(o.comp.occ)}</td><td>{fmt(o.comp.adr)}</td><td>{fmt(o.comp.revpar)}</td><td />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function SegMix({ y }) {
  const tot = SEGMENTS.reduce((a, s) => a + (y.seg[s.id] || 0), 0) || 1;
  const share = s => (y.seg[s.id] || 0) / tot * 100;
  return (
    <>
      <div class="segbar">{SEGMENTS.map(s => <span key={s.id} style={{ width: `${share(s)}%`, background: SEG_COLOR[s.id] }} />)}</div>
      <div class="legend">{SEGMENTS.map(s => <span key={s.id} style={{ '--c': SEG_COLOR[s.id] }}>{s.name} {Math.round(share(s))}%</span>)}</div>
    </>
  );
}

const COST_ROWS = ['fixed', 'variable', 'salaries', 'bonus', 'severance', 'marketing', 'commission', 'fake', 'fine', 'crisis', 'interest'];

export function ReportTab({ s }) {
  const { G, last: o, log } = s;
  if (!o) {
    return <div class="panel"><h2>{t('report.emptyTitle')}</h2><p>{t('report.emptyText')}</p></div>;
  }
  const y = o.hotels.you, i = o.idx;
  const labels = log.map(r => weekShort(r.week));
  const prompts = t('prompts');
  return (
    <>
      <div class="panel">
        <div class="headline">{t('report.headline', {
          week: o.week, date: o.info.label, rgi: Math.round(i.rgi),
          dir: i.rgi >= 100 ? t('report.more') : t('report.less'), diff: Math.abs(Math.round(i.rgi - 100)),
        })}</div>
        <div style="display:grid;grid-template-columns:minmax(120px,200px) 1fr;gap:14px;align-items:center;margin-bottom:10px">
          <Building occ={y.occ} closed={y.closed} />
          <div><SegMix y={y} /><p class="note">{t('report.bldNote')}</p></div>
        </div>
        <KpiCards o={o} />
      </div>
      <div class="two">
        <div class="panel">
          <h2>{t('report.quadTitle')}</h2>
          <div class="chart" style="max-width:460px"><Quadrant log={log} /></div>
          <QuadLegend />
        </div>
        <div class="panel">
          <h2>{t('report.diagTitle')}</h2>
          <ul class="list">{diagnose(G, o).map((x, k) => <li key={k}>{x}</li>)}</ul>
          <h2 style="margin-top:14px">{t('report.causeTitle')}</h2>
          <ul class="list">{causeEffect(G, o).map((x, k) => <li key={k}>{x}</li>)}</ul>
        </div>
      </div>
      <div class="two">
        <div class="panel">
          <h2>{t('report.compTitle')}</h2>
          <CompTable G={G} o={o} />
          <h3>{t('report.revparTitle')}</h3>
          <div class="chart">
            <LineChart aria={t('report.revparTitle')} labels={labels} series={[
              { name: t('report.seriesYou'), color: 'var(--jade)', values: log.map(r => r.revpar) },
              { name: t('report.seriesComp'), color: 'var(--muted)', values: log.map(r => r.cRevpar) },
            ]} />
          </div>
          <h3>{t('report.rgiTitle')}</h3>
          <div class="chart">
            <LineChart aria={t('report.rgiTitle')} labels={labels} refLine={100} refLabel={t('report.rgiRef')}
              series={[{ name: t('report.seriesRgi'), color: 'var(--lamp)', values: log.map(r => r.rgi) }]} />
          </div>
        </div>
        <div class="panel">
          <h2>{t('report.finTitle')}</h2>
          <div class="tablewrap">
            <table><tbody>
              <tr><td><b>{t('report.revenue')}</b></td><td><b>{fmt(y.revenue)}</b></td></tr>
              {COST_ROWS.filter(k => y.costs[k] > 0).map(k => <tr key={k}><td>{t(`cost.${k}`)}</td><td>{fmt(y.costs[k])}</td></tr>)}
              <tr><td><b>{t('report.profit')}</b></td><td class={y.profit >= 0 ? 'up' : 'down'}><b>{fmt(y.profit)}</b></td></tr>
              <tr><td>{t('report.cash')}</td><td>{fmt(y.cash)}</td></tr>
            </tbody></table>
          </div>
          <p class="note">{t('report.finNote')}</p>
          <h2 style="margin-top:14px">{t('report.promptTitle')}</h2>
          <p>{prompts[(o.week - 1) % prompts.length]}</p>
          <p class="note">{tx('report.debriefNote', { src: <Src k="crookall">Crookall, 2010</Src> })}</p>
        </div>
      </div>
    </>
  );
}
