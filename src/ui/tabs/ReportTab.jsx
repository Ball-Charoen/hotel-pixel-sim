import { Fragment } from 'preact';
import {
  CITIES, SEGMENTS, WEEKS, ROOMS, COST, CANCEL_P, ROLES, tmdSeason, seasonLabel,
} from '../../sim/core.js';
import { Quadrant, QuadLegend } from '../components/Quadrant.jsx';
import { LineChart, Src, Chg } from '../components/widgets.jsx';
import { SEG_COLOR } from '../theme.js';
import { N, weekLabel, newsText, crisisDetail } from '../names.js';
import { effRich, schedRich, phaseName } from '../eventText.jsx';
import { fmt, pct, weekShort } from '../format.js';
import { t, tx, fill } from '../../i18n/index.js';

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

/* Automatic reading of the week's result. Rules ported unchanged from the prototype.
   Numbers are coloured: green = good for the player's hotel, red = bad (see Chg). */
function diagnose(G, o) {
  const y = o.hotels.you, i = o.idx, out = [];
  const idx = v => <Chg good={v >= 100}>{Math.round(v)}</Chg>;
  const mpi = idx(i.mpi), ari = idx(i.ari);
  const bad = v => <Chg good={false}>{v}</Chg>;
  const src = k => <Src k={k}>{t('diag.src')}</Src>;
  if (i.mpi >= 100 && i.ari >= 100) out.push(tx('diag.both', { mpi, ari }));
  else if (i.mpi >= 100) out.push(tx('diag.volume', { mpi, ari, src: src('chekin') }));
  else if (i.ari >= 100) out.push(tx('diag.rate', { mpi, ari, src: src('rpgRev') }));
  else out.push(tx('diag.behind', { mpi, ari }));
  if (y.occ > 0.9) out.push(tx('diag.full', { occ: <Chg good>{pct(y.occ)}</Chg>, src: src('rpgRev') }));
  if (y.occP.we > 0.93 && y.occP.wd < 0.6) out.push(tx('diag.weekendGap', { we: <Chg good>{pct(y.occP.we)}</Chg>, wd: bad(pct(y.occP.wd)) }));
  const nx = G.week < WEEKS ? G.timeline[G.week].scheduled : [];
  if (nx.length) out.push(t('diag.nextEvent', { names: nx.map(e => N.event(e.id)).join(', ') }));
  if (y.adequacy < 0.8 && y.sold > 0) out.push(t('diag.understaffed'));
  if (y.staffN && y.roles && y.roles.hk === 0) out.push(t('diag.noHK'));
  if (y.lang < 45 && CITIES[G.city].foreign > 0.3) out.push(tx('diag.language', { lang: bad(Math.round(y.lang)) }));
  if (y.revenue > 0 && y.commission / y.revenue > 0.08) out.push(tx('diag.commission', { p: bad(pct(y.commission / y.revenue)) }));
  if (y.teamSat < 50 && y.staffN) out.push(tx('diag.lowSat', { sat: bad(Math.round(y.teamSat)) }));
  if (y.cash < 0) out.push(t('diag.negCash'));
  return out;
}

function causeEffect(G, o) {
  const y = o.hotels.you, out = [];
  const bots = G.hotels.filter(h => !h.isPlayer).map(h => o.hotels[h.id]);
  const tmd = tmdSeason(o.info.month, o.info.day), lab = seasonLabel(o.season);
  const s = o.season.toFixed(2);
  out.push(tx('cause.season', {
    tmd: N.tmd(tmd), season: N.season(lab), city: N.city(G.city),
    s: <Chg good={s === '1.00' ? null : o.season > 1}>{s}</Chg>,
  }));
  o.tl.scheduled.forEach(e => out.push(e.cancelled
    ? t('cause.cancelled', { name: N.event(e.id) })
    : tx('cause.scheduled', { name: N.event(e.id), eff: schedRich(e) })));
  o.tl.shocks.forEach(sh => out.push(tx('cause.shock', {
    arrow: <Chg good={!!sh.ev.positive}>{sh.ev.positive ? '▲' : '▼'}</Chg>, name: N.shock(sh.ev.id), cat: N.cat(sh.ev.cat),
    phase: phaseName(sh.k, sh.d, sh.perm), week: sh.perm ? '' : t('cause.shockWeek', { k: sh.k + 1, d: sh.d }),
    text: N.shockText(sh.ev.id), eff: effRich(sh.ev.eff),
  })));
  if (!o.tl.shocks.length && !o.tl.scheduled.length) out.push(t('cause.quiet'));
  y.crises.forEach(c => out.push(t('cause.crisis', { name: N.internal(c.id), detail: crisisDetail(c) })));
  const cP = bots.reduce((a, b) => a + (b.price.wd * 5 + b.price.we * 2) / 7, 0) / bots.length;
  const yP = (y.price.wd * 5 + y.price.we * 2) / 7;
  // Price vs competitors is a strategy choice, not good or bad, so it stays uncoloured.
  out.push(t('cause.price', {
    y: fmt(yP), c: fmt(cP), dir: yP >= cP ? t('cause.higher') : t('cause.lower'), d: Math.abs(Math.round((yP / cP - 1) * 100)),
  }));
  const cAw = bots.reduce((a, b) => a + b.awAvg, 0) / bots.length;
  const yAw = Math.round(y.awAvg * 100), cAwR = Math.round(cAw * 100);
  out.push(tx('cause.awareness', { y: <Chg good={yAw >= cAwR}>{yAw}</Chg>, c: cAwR }));
  if (y.sold > 0) {
    out.push(tx('cause.service', {
      q: <Chg good={y.Q >= y.E}>{Math.round(y.Q)}</Chg>, e: Math.round(y.E), r: y.rating.toFixed(1), R: y.R.toFixed(2),
    }));
  }
  if (y.inf !== 'none') {
    out.push(<>{tx('cause.influencer', { c: <Chg good={y.infCred >= 1}>{y.infCred.toFixed(2)}</Chg> })}{y.notes.includes('infBad') ? t('cause.infBad') : ''}</>);
  }
  if (y.fake) out.push(y.caught ? tx('cause.fakeCaught', { fine: <Chg good={false}>{fmt(COST.fine)}</Chg> }) : t('cause.fakeSafe'));
  const me = G.hotels.find(h => h.isPlayer);
  const nRole = r => (y.roles ? y.roles[r] : me.staff.filter(s => s.role === r).length);
  const loadChg = v => <Chg good={v > ROLES.fo.cap ? false : null}>{Math.round(v || 0)}</Chg>;
  out.push(<>{tx('cause.staff', {
    nFO: nRole('fo'), lFO: loadChg(y.loadFO), nHK: nRole('hk'), lHK: loadChg(y.loadHK),
    sat: <Chg good={y.teamSat < 50 ? false : null}>{Math.round(y.teamSat)}</Chg>,
  })}{y.quits.length ? t('cause.quits', { names: y.quits.map(N.staff).join(', ') }) : ''}</>);
  o.news.forEach(n => out.push(t('cause.news', { text: newsText(G, n) })));
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
                <td>{N.hotel(h)}{h.isPlayer && t('unit.you')}</td>
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
      <div class="legend">{SEGMENTS.map(s => <span key={s.id} style={{ '--c': SEG_COLOR[s.id] }}>{N.seg(s.id)} {Math.round(share(s))}%</span>)}</div>
    </>
  );
}

/* Weekly reflection question with guidance hidden until the player clicks (keyed by week so it starts closed). */
function PromptGuide({ prompt }) {
  const vars = { cancel: Math.round(CANCEL_P * 100) };
  return (
    <>
      <p>{prompt.q}</p>
      <details>
        <summary>{t('report.guideSummary')}</summary>
        <p><b>{t('report.guideWhy')}</b></p>
        <ul>{prompt.why.map((x, i) => <li key={i}>{fill(x, vars)}</li>)}</ul>
        <p><b>{t('report.guideTodo')}</b></p>
        <ul>{prompt.todo.map((x, i) => <li key={i}>{fill(x, vars)}</li>)}</ul>
        <p class="small muted">{t('report.guideNote')}</p>
      </details>
    </>
  );
}

const COST_ROWS =['fixed', 'variable', 'salaries', 'bonus', 'severance', 'marketing', 'commission', 'fake', 'fine', 'crisis', 'interest'];

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
          week: o.week, date: weekLabel(o.info), rgi: Math.round(i.rgi),
          dir: i.rgi >= 100 ? t('report.more') : t('report.less'), diff: Math.abs(Math.round(i.rgi - 100)),
        })}</div>
        <div style="margin-bottom:10px"><SegMix y={y} /><p class="note">{t('report.bldNote')}</p></div>
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
          <PromptGuide key={o.week} prompt={prompts[(o.week - 1) % prompts.length]} />
          <p class="note">{tx('report.debriefNote', { src: <Src k="crookall">Crookall, 2010</Src> })}</p>
        </div>
      </div>
    </>
  );
}
