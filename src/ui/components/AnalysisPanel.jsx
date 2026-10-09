/* End-of-game analysis (src/sim/analysis.js): why the winner won, Key Success Factors, the winner's weekly
   decisions (shown to everyone at the end, owner decision 9 Oct 2026) and debrief questions. */
import { FACTORS } from '../../sim/analysis.js';
import { fmt, pct } from '../format.js';
import { t } from '../../i18n/index.js';

const FMT = {
  idx: v => Math.round(v), corr: v => (Math.abs(v) < 0.005 ? 0 : v).toFixed(2), pct: v => pct(v), num: v => v.toFixed(1), stars: v => v.toFixed(2),
  ratio: v => v.toFixed(1), baht: v => t('unit.baht', { amount: fmt(v) }), rooms: v => Math.round(v), count: v => (Math.round(v * 10) / 10).toString(),
};
const show = (fid, v) => (v === null || v === undefined || !Number.isFinite(v) ? '–' : FMT[FACTORS.find(f => f.id === fid).fmt](v));

function KeyCards({ a, id, you, nameOf }) {
  const keys = a.keys[id] || [];
  if (!keys.length) return <p class="muted">{t('ana.noKeys')}</p>;
  return (
    <ol class="keylist">
      {keys.map(k => (
        <li key={k}>
          <b>{t(`ana.f_${k}`)}</b>
          <div>{t(`ana.x_${k}`, { v: show(k, a.values[id][k]), avg: show(k, a.market[k]) })}</div>
          {you && you !== id && a.values[you] && <div class="small muted">{t('ana.yourValue', { v: show(k, a.values[you][k]) })}</div>}
        </li>
      ))}
    </ol>
  );
}

function Weekly({ rows, name }) {
  return (
    <details>
      <summary>{t('ana.weeklyTitle', { hotel: name })}</summary>
      <div class="tablewrap"><table class="small">
        <thead><tr>
          <th>{t('ana.cWeek')}</th><th>{t('ana.cPrice')}</th><th>{t('ana.cStaff')}</th><th>{t('ana.cBonus')}</th><th>{t('ana.cMk')}</th>
          <th>Occ</th><th>ADR</th><th>RGI</th><th>{t('ana.cStars')}</th><th>{t('ana.cProfit')}</th>
        </tr></thead>
        <tbody>{rows.map(r => (
          <tr key={r.week}>
            <td>{r.week}</td><td>{fmt(r.pwd)} / {fmt(r.pwe)}</td>
            <td>{r.staff}{r.roles && <span class="muted"> ({r.roles.fo}/{r.roles.hk}{r.roles.fb ? '/' + r.roles.fb : ''})</span>}</td>
            <td>{fmt(r.bonus)}</td><td>{fmt(r.marketing)}{r.inf && r.inf !== 'none' ? ' +inf' : ''}{r.fake ? ' +fake' : ''}</td>
            <td>{pct(r.occ)}</td><td>{fmt(r.adr)}</td><td>{Math.round(r.rgi)}</td><td>{r.R.toFixed(2)}</td>
            <td class={r.profit >= 0 ? 'up' : 'down'}>{fmt(r.profit)}</td>
          </tr>
        ))}</tbody>
      </table></div>
      <p class="small muted">{t('ana.weeklyNote')}</p>
    </details>
  );
}

/* a: analysis; nameOf(id): hotel name; you: the viewer's hotel id (null for the instructor). */
export function AnalysisPanel({ a, nameOf, you = null }) {
  if (!a) return null;
  const w = a.winner, best = a.bestPlayer;
  const winnerIsYou = you && w === you;
  return (
    <div class="panel analysis">
      <h2>{winnerIsYou ? t('ana.titleYou') : t('ana.title', { hotel: nameOf(w) })}</h2>
      <p>{t(`ana.main_${a.mainPart}`)}</p>
      <div class="tablewrap"><table class="small">
        <thead><tr><th /><th>{t('ana.colWinner')}</th><th>{t('ana.colMarket')}</th></tr></thead>
        <tbody>{['fin', 'rep', 'staff'].map(k => (
          <tr key={k} class={k === a.mainPart ? 'you' : ''}>
            <td>{t(`ana.part_${k}`, { w: Math.round(a.parts[k].w * 100) })}</td>
            <td>{Math.round(a.parts[k].winner)}</td><td>{Math.round(a.parts[k].avg)}</td>
          </tr>
        ))}</tbody>
      </table></div>

      <h3>{t('ana.keysTitle')}</h3>
      <KeyCards a={a} id={w} you={you} nameOf={nameOf} />

      {best && best !== w && (
        <>
          <h3>{you === best ? t('ana.bestTitleYou') : t('ana.bestTitle', { hotel: nameOf(best) })}</h3>
          <KeyCards a={a} id={best} you={you} nameOf={nameOf} />
        </>
      )}

      {you && a.values[you] && (
        <details>
          <summary>{t('ana.compareTitle')}</summary>
          <div class="tablewrap"><table class="small">
            <thead><tr><th>{t('ana.colFactor')}</th><th>{t('ana.colYou')}</th><th>{t('ana.colWinner')}</th><th>{t('ana.colMarket')}</th></tr></thead>
            <tbody>{FACTORS.map(f => (
              <tr key={f.id}>
                <td>{t(`ana.f_${f.id}`)}</td><td>{show(f.id, a.values[you][f.id])}</td>
                <td>{show(f.id, a.values[w][f.id])}</td><td>{show(f.id, a.market[f.id])}</td>
              </tr>
            ))}</tbody>
          </table></div>
        </details>
      )}

      {Object.entries(a.weekly).map(([id, rows]) => <Weekly key={id} rows={rows} name={nameOf(id)} />)}

      <details>
        <summary>{t('ana.debriefTitle')}</summary>
        <ol class="small">
          {(a.keys[w] || []).map(k => <li key={k}>{t(`ana.q_${k}`)}</li>)}
          <li>{t('ana.qGeneral')}</li>
        </ol>
      </details>
      <p class="note">{t('ana.method')}</p>
    </div>
  );
}
