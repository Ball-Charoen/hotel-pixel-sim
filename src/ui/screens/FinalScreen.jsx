import { SCORE_W, finalScores, weekInfo } from '../../sim/core.js';
import { N, weekLabel } from '../names.js';
import { decisionCsv } from '../session.js';
import { Quadrant, QuadLegend } from '../components/Quadrant.jsx';
import { LineChart, Src } from '../components/widgets.jsx';
import { fmt, pct, weekShort } from '../format.js';
import { t, tx } from '../../i18n/index.js';

export function FinalScreen({ s, onRestart }) {
  const { G, log } = s;
  const fs = G.final || finalScores(G);   // classroom: ranking computed on the server
  const rank = fs.findIndex(f => f.id === 'you') + 1;
  const avg = k => log.reduce((a, r) => a + r[k], 0) / log.length;
  return (
    <>
      <div class="panel">
        <h1>{t('final.title', { city: N.city(G.city), rank, n: fs.length })}</h1>
        <p>{t('final.averages', { occ: pct(avg('occ')), adr: fmt(avg('adr')), revpar: fmt(avg('revpar')), rgi: Math.round(avg('rgi')) })}</p>
        <div class="tablewrap">
          <table>
            <thead><tr>
              <th>{t('final.colRank')}</th><th>{t('final.colScore')}</th>
              <th>{t('final.colFin', { w: Math.round(SCORE_W.fin * 100) })}</th>
              <th>{t('final.colRep', { w: Math.round(SCORE_W.rep * 100) })}</th>
              <th>{t('final.colStaff', { w: Math.round(SCORE_W.staff * 100) })}</th>
              <th>{t('final.colProfit')}</th><th>{t('final.colBot')}</th>
            </tr></thead>
            <tbody>
              {fs.map((f, k) => {
                const h = G.hotels.find(x => x.id === f.id);
                return (
                  <tr key={f.id} class={f.id === 'you' ? 'you' : ''}>
                    <td>{k + 1}. {N.hotel(h)}{f.id === 'you' && t('unit.you')}{h.owner && <div class="small muted">{N.owner(h)}</div>}</td>
                    <td>{Math.round(f.score)}</td>
                    <td>{Math.round(f.fin)}</td>
                    <td>{Math.round(f.rep)}</td>
                    <td>{Math.round(f.staff)}</td>
                    <td class={f.profit > 0 ? 'up' : 'down'}>{fmt(f.profit)}</td>
                    <td>{h.arch ? t('final.botReveal', { arch: N.arch(h.arch), skill: N.skill(h.skill) }) : '–'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p class="note">{t('final.rules')}</p>
      </div>
      <div class="two">
        <div class="panel">
          <h2>{t('final.pathTitle')}</h2>
          <div class="chart" style="max-width:460px"><Quadrant log={log} /></div>
          <QuadLegend />
        </div>
        <div class="panel">
          <h2>{t('final.debriefTitle')}</h2>
          <ul class="list">{t('final.debrief').map((q, i) => <li key={i}>{q}</li>)}</ul>
          <p class="note">{tx('final.debriefNote', { src: <Src k="crookall">Crookall, 2010</Src> })}</p>
          <div class="chart">
            <LineChart aria={t('final.rgiAria')} labels={log.map(r => weekShort(r.week))} refLine={100} refLabel={t('report.rgiRef')}
              series={[{ name: t('report.seriesRgi'), color: 'var(--lamp)', values: log.map(r => r.rgi) }]} />
          </div>
        </div>
      </div>
      <div class="panel">
        <h2>{t('final.csvTitle')}</h2>
        <p class="note">{t('final.csvNote')}</p>
        <textarea readonly aria-label={t('final.csvAria')} value={decisionCsv(log, w => weekLabel(weekInfo(G, w - 1)))} />
        <p style="margin-top:12px"><button class="btn" type="button" onClick={onRestart}>{t('end.restart')}</button></p>
      </div>
    </>
  );
}
