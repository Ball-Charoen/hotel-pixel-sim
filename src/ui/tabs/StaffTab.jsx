import { WEEKS, ROLES } from '../../sim/core.js';
import { player, toggleStaff, openCandidates, roleOpen, staffLimit } from '../session.js';
import { Avatar } from '../components/pixels.jsx';
import { N } from '../names.js';
import { HBar, RangeCtl, LineChart, Src } from '../components/widgets.jsx';
import { STATS } from '../theme.js';
import { fmt, pct, weekShort } from '../format.js';
import { t, tx } from '../../i18n/index.js';

const POSITIONS = ['fo', 'hk', 'fb'];
/* Skills each position actually uses in the quality formula (core.js teamQuality); shown in bold. */
const KEY_SKILLS = { fo: ['app', 'serv', 'prof', 'lang'], hk: ['exp', 'serv'], fb: ['serv', 'exp', 'app'] };

function StaffCard({ c, hired, canHire, locked, onToggle, playing }) {
  return (
    <div class={`card${hired ? ' hired' : ''}`}>
      <div class="head">
        <Avatar id={c.id} look={c.look} label={N.staff(c.name)} />
        <div class="nm">
          <span>{N.staff(c.name)}</span>
          <span class={`chip role ${c.role}`}>{t(`role.${c.role}`)}</span>
          <span class="small wage">{t('unit.perWeek', { amount: fmt(c.salary) })}</span>
        </div>
      </div>
      {STATS.map(k => (
        <div key={k} class={`bar${KEY_SKILLS[c.role].includes(k) ? ' key' : ''}`}>
          <span>{t(`stat.${k}`)}</span><i><b style={{ width: `${c[k]}%` }} /></i><span>{c[k]}</span>
        </div>
      ))}
      {hired && (
        <>
          <div class="small">{t('staff.sat')}</div>
          <div class="meter"><b style={{ width: `${Math.round(c.sat)}%`, background: c.sat < 40 ? 'var(--chili)' : 'var(--jade)' }} /></div>
        </>
      )}
      {playing && (
        <button type="button" class={`btn${hired ? ' ghost' : ''}`} disabled={!hired && (!canHire || locked)} onClick={onToggle}>
          {hired ? t('staff.fire') : locked ? t('staff.fbLocked') : t('staff.hire')}
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
  const max = staffLimit(G);
  const canHire = h.staff.length < max;
  const count = role => h.staff.filter(x => x.role === role).length;
  const open = openCandidates(G);
  const cap = ROLES.fo.cap;

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
            <HBar label={t('staff.loadFO')} v={last.loadFO || 0} mark={cap} max={cap * 2} right={Math.round(last.loadFO || 0)} />
            <HBar label={t('staff.loadHK')} v={last.loadHK || 0} mark={cap} max={cap * 2} right={Math.round(last.loadHK || 0)} />
            {h.restaurant && <HBar label={t('staff.loadFB')} v={last.loadFB || 0} mark={cap} max={cap * 2} right={Math.round(last.loadFB || 0)} />}
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
        <h2>{t('staff.team', { n: h.staff.length, max })}</h2>
        <p class="small">{t('staff.teamRoles', { fo: count('fo'), hk: count('hk') })}{count('fb') ? ` · ${t('role.fb')} ${count('fb')}` : ''}</p>
        {count('fo') > 0 && count('hk') === 0 && <div class="warn">{t('staff.noHK')}</div>}
        <div class="staff">
          {h.staff.length
            ? h.staff.map(c => <StaffCard key={c.id} c={c} hired playing={playing} onToggle={() => toggle(c.id)} />)
            : <p class="muted">{t('staff.none')}</p>}
        </div>
        <h3>{t('staff.candidates')}</h3>
        <p class="note">{t('staff.rolesIntro')}</p>
        {POSITIONS.map(role => {
          const list = open.filter(c => c.role === role);
          const locked = !roleOpen(G, role);
          return (
            <div key={role} class="rolegroup">
              <h3><span class={`chip role ${role}`}>{t(`role.${role}`)}</span></h3>
              <p class="small muted">{t(`staff.help_${role}`)}</p>
              <div class="staff">
                {list.map(c => (
                  <StaffCard key={c.id} c={c} canHire={canHire} locked={locked} playing={playing} onToggle={() => toggle(c.id)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
