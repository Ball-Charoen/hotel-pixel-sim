import { WEEKS } from '../../sim/core.js';
import { player, toggleStaff, openCandidates, MAX_STAFF } from '../session.js';
import { Avatar } from '../components/pixels.jsx';
import { HBar, RangeCtl, LineChart, Src } from '../components/widgets.jsx';
import { STATS } from '../theme.js';
import { fmt, pct, weekShort } from '../format.js';
import { t, tx } from '../../i18n/index.js';

function StaffCard({ c, hired, canHire, onToggle, playing }) {
  return (
    <div class={`card${hired ? ' hired' : ''}`}>
      <div class="head">
        <Avatar look={c.look} label={c.name} />
        <div class="nm" style="flex:1"><span>{c.name}</span><span class="small">{t('unit.perWeek', { amount: fmt(c.salary) })}</span></div>
      </div>
      {STATS.map(k => (
        <div key={k} class="bar"><span>{t(`stat.${k}`)}</span><i><b style={{ width: `${c[k]}%` }} /></i><span>{c[k]}</span></div>
      ))}
      {hired && (
        <>
          <div class="small">{t('staff.sat')}</div>
          <div class="meter"><b style={{ width: `${Math.round(c.sat)}%`, background: c.sat < 40 ? 'var(--chili)' : 'var(--jade)' }} /></div>
        </>
      )}
      {playing && (
        <button type="button" class={`btn${hired ? ' ghost' : ''}`} disabled={!hired && !canHire} onClick={onToggle}>
          {hired ? t('staff.fire') : t('staff.hire')}
        </button>
      )}
    </div>
  );
}

const avg = (list, k) => (list.length ? list.reduce((a, s) => a + s[k], 0) / list.length : 0);

export function StaffTab({ s, update }) {
  const { G, log } = s;
  const h = player(G);
  const last = h.history[h.history.length - 1];
  const playing = G.week < WEEKS;
  const bots = G.hotels.filter(x => !x.isPlayer);
  const team = {}, comp = {};
  STATS.forEach(k => {
    team[k] = avg(h.staff, k);
    comp[k] = bots.reduce((a, b) => a + b.staff.reduce((x, st) => x + st[k], 0) / Math.max(1, b.staff.length), 0) / bots.length;
  });
  const toggle = id => update(() => toggleStaff(G, id));
  const canHire = h.staff.length < MAX_STAFF;

  return (
    <div class="two">
      <div class="panel">
        <h2>{t('staff.qualityTitle')}</h2>
        <p class="small">{tx('staff.qualityIntro', { src: <Src k="servqual">SERVQUAL</Src> })}</p>
        {STATS.map(k => (
          <HBar key={k} label={<>{t(`stat.${k}`)}<br /><span class="small muted">{t(`servqual.${k}`)}</span></>} v={team[k]} mark={comp[k]} />
        ))}
        {last && (
          <>
            <h3>{t('staff.lastWeek')}</h3>
            <HBar label={t('staff.delivered')} v={last.Q} mark={last.E} right={`${Math.round(last.Q)}`} />
            <p class="note">{t('staff.expectNote', { e: Math.round(last.E) })}</p>
            <HBar label={t('staff.adequacy')} v={last.adequacy * 100} right={pct(last.adequacy)} />
            <HBar label={t('staff.load')} v={last.load} mark={15} max={30} right={Math.round(last.load)} />
            <p class="note">{t('staff.loadNote')}</p>
          </>
        )}
        <h3>{t('staff.weeklyTitle')}</h3>
        <div class="chart">
          {log.length
            ? <LineChart aria={t('staff.weeklyTitle')} labels={log.map(r => weekShort(r.week))} series={[
                { name: t('staff.seriesDelivered'), color: 'var(--jade)', values: log.map(r => r.Q) },
                { name: t('staff.seriesExpect'), color: 'var(--chili)', values: log.map(r => r.E) },
                { name: t('staff.seriesComp'), color: 'var(--muted)', values: log.map(r => r.cQ) },
              ]} />
            : <p class="muted small">{t('staff.chartEmpty')}</p>}
        </div>
        {playing && (
          <RangeCtl label={t('staff.bonus')} value={h.bonus} min={0} max={4000} step={100} big={100}
            onChange={v => update(() => { h.bonus = v; })} />
        )}
      </div>
      <div class="panel">
        <h2>{t('staff.team', { n: h.staff.length, max: MAX_STAFF })}</h2>
        <div class="staff">
          {h.staff.length
            ? h.staff.map(c => <StaffCard key={c.id} c={c} hired playing={playing} onToggle={() => toggle(c.id)} />)
            : <p class="muted">{t('staff.none')}</p>}
        </div>
        <h3>{t('staff.candidates')}</h3>
        <div class="staff">
          {openCandidates(G).map(c => <StaffCard key={c.id} c={c} canHire={canHire} playing={playing} onToggle={() => toggle(c.id)} />)}
        </div>
        <p class="note">{t('staff.artNote')}</p>
      </div>
    </div>
  );
}
