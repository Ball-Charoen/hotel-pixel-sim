/* Classroom mode (P2): student join / lobby / game, instructor login / rooms / dashboard.
   Students play with the single-player screens; only the bottom bar changes (submit instead of end week).
   All game results come from the server (supabase/functions/classroom); see src/net/classroom.js. */
import { useState, useEffect, useRef, useReducer } from 'preact/hooks';
import { CITIES, MAPS, CHAOS, WEEKS, weekInfo } from '../../sim/core.js';
import { decisionOf, startClassGame, runClassWeek, viewFor } from '../../sim/classroom.js';
import { toSaveJSON } from '../../sim/save.js';
import { decisionCsv, plannedSpend, hasFrontOffice } from '../session.js';
import {
  joinRoom, myPlayers, loadStudent, submitDecision, advanceRoom, startRoom, watchRoom, joinLink, codeFromHash,
  instructorSignIn, amInstructor, currentUser, signOut, changePassword, listRooms, createRoom, setTimer, deleteRoom, removePlayer,
  roomDetail, roomLogs, sessionFromView,
} from '../../net/classroom.js';
import { GameScreen } from './GameScreen.jsx';
import { AnalysisPanel } from '../components/AnalysisPanel.jsx';
import { QrCode } from '../components/QrCode.jsx';
import { FinalScreen } from './FinalScreen.jsx';
import { N, weekLabel } from '../names.js';
import { MonthBars } from '../components/CityCard.jsx';
import { fmt, pct, baht } from '../format.js';
import { confirmDialog } from '../confirm.jsx';
import { t, tx, getLocale } from '../../i18n/index.js';

const errText = e => {
  const m = String(e?.message || e || '');
  if (/room not found/.test(m)) return t('class.errNoRoom');
  if (/already started/.test(m)) return t('class.errStarted');
  if (/full/.test(m)) return t('class.errFull');
  if (/not-instructor/.test(m)) return t('class.errNotInstructor');
  if (/Invalid login/i.test(m)) return t('class.errLogin');
  if (/at least 2 hotels/.test(m)) return t('class.errTwoHotels');
  if (/no players/.test(m)) return t('class.errNoPlayers');
  if (/rate limit|429/i.test(m)) return t('class.errRate');
  if (/fetch|network/i.test(m)) return t('class.errNet');
  return t('class.errOther', { msg: m });
};
const timeLeft = (deadline, now) => {
  if (!deadline) return null;
  const s = Math.max(0, Math.round((Date.parse(deadline) - now) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
function useNow(ms = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(id); }, [ms]);
  return now;
}
const Seg = ({ items, value, onPick }) => (
  <div class="seg">{items.map(([k, label]) => <button key={k} type="button" aria-pressed={value === k} onClick={() => onPick(k)}>{label}</button>)}</div>
);

/* Two entry buttons on the start screen. */
export function ClassEntry({ onJoin, onTeacher }) {
  return (
    <div class="panel classentry">
      <h2>{t('class.entryTitle')}</h2>
      <p class="small muted">{t('class.entryIntro')}</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn" type="button" onClick={onJoin}>{t('class.joinBtn')}</button>
        <button class="btn ghost" type="button" onClick={onTeacher}>{t('class.teacherBtn')}</button>
      </div>
    </div>
  );
}

/* ---------------- students ---------------- */

export function JoinScreen({ onBack, onEnter }) {
  const [f, setF] = useState({ code: codeFromHash(), name: '', hotel: '', owner: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [mine, setMine] = useState([]);
  useEffect(() => { currentUser().then(u => (u ? myPlayers() : [])).then(setMine).catch(() => {}); }, []);
  const set = p => setF(x => ({ ...x, ...p }));
  const ok = f.code.trim().length === 6 && f.name.trim() && f.hotel.trim();
  const join = async e => {
    e.preventDefault();
    if (!ok || busy) return;
    setBusy(true); setErr('');
    try { const p = await joinRoom(f); onEnter(p.id); } catch (x) { setErr(errText(x)); setBusy(false); }
  };
  return (
    <div class="panel classform">
      <h1>{t('class.joinTitle')}</h1>
      {mine.length > 0 && (
        <div class="note-box">
          <h3>{t('class.continueTitle')}</h3>
          {mine.map(p => (
            <p key={p.id}><button class="btn ghost" type="button" onClick={() => onEnter(p.id)}>
              {p.rooms?.code} · {p.hotel_name} · {N.city(p.rooms?.city)} · {t(`class.status_${p.rooms?.status}`, { w: p.rooms?.week })}
            </button></p>
          ))}
        </div>
      )}
      <form onSubmit={join}>
        <fieldset><legend>{t('class.code')}</legend>
          <input type="text" inputMode="text" autoCapitalize="characters" maxLength={6} value={f.code} placeholder="KX7P2M"
            style="text-transform:uppercase;letter-spacing:.2em;font-size:1.4rem;max-width:12rem" onInput={e => set({ code: e.currentTarget.value })} /></fieldset>
        <fieldset><legend>{t('class.name')}</legend>
          <input type="text" maxLength={30} value={f.name} placeholder={t('class.nameHint')} onInput={e => set({ name: e.currentTarget.value })} /></fieldset>
        <fieldset><legend>{t('setup.hotelName')}</legend>
          <input type="text" maxLength={30} value={f.hotel} onInput={e => set({ hotel: e.currentTarget.value })} /></fieldset>
        <fieldset><legend>{t('setup.ownerName')}</legend>
          <input type="text" maxLength={30} value={f.owner} placeholder={t('setup.ownerHint')} onInput={e => set({ owner: e.currentTarget.value })} /></fieldset>
        <p class="note">{t('class.privacy')}</p>
        {err && <div class="warn">{err}</div>}
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn" type="submit" disabled={!ok || busy}>{busy ? t('class.wait') : t('class.join')}</button>
          <button class="btn ghost" type="button" onClick={onBack}>{t('class.back')}</button>
        </div>
      </form>
    </div>
  );
}

function SubmitBar({ s, room, submitted, dirty, busy, err, onSubmit, now }) {
  const G = s.G;
  const left = timeLeft(room.deadline, now);
  const hasStaff = hasFrontOffice(G);
  return (
    <div class="endbar">
      <p class="small" style="margin:0 0 6px">
        {tx('end.spend', { amount: <b>{baht(plannedSpend(G).total)}</b> })}
        {left && <> · <b class={left === '0:00' ? 'down' : ''}>{t('class.timeLeft', { t: left })}</b></>}
      </p>
      {err && <div class="warn" style="margin:0 0 6px">{err}</div>}
      <button class="btn" type="button" disabled={!hasStaff || busy || left === '0:00'} onClick={onSubmit}>
        {!hasStaff ? t('end.needStaff') : busy ? t('class.wait') : submitted && !dirty ? t('class.resubmit', { n: room.week + 1 }) : t('class.submit', { n: room.week + 1 })}
      </button>
      <p class="small muted savestatus">
        {submitted ? (dirty ? t('class.dirty') : t('class.submitted', { time: new Date(submitted).toLocaleTimeString(getLocale(), { timeStyle: 'short' }) })) : t('class.notSubmitted')}
      </p>
    </div>
  );
}

export function StudentRoom({ playerId, onExit, langSwitch }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(null);          // { at, json } of the last submitted decision
  const [, rerender] = useReducer(x => x + 1, 0);
  const now = useNow();
  const asked = useRef(-1);

  const load = async () => {
    try {
      const x = await loadStudent(playerId);
      setD(x);
      setSent(x.decision ? { at: Date.now(), json: JSON.stringify(x.decision) } : null);
      setErr('');
    } catch (e) { setErr(errText(e)); }
  };
  useEffect(() => { load(); }, [playerId]);
  // Reload when the room moves on (new week, start, finish) or classmates join the lobby.
  useEffect(() => {
    if (!d) return undefined;
    let stop = () => {};
    let timer = 0;
    watchRoom(d.room.id, table => {
      if (table === 'decisions') return;
      clearTimeout(timer);
      timer = setTimeout(load, table === 'rooms' ? 600 : 300);
    }).then(fn => { stop = fn; });
    return () => { clearTimeout(timer); stop(); };
  }, [d?.room.id]);
  // After the deadline, any student's page asks the server to run the week (the server lock keeps it to one run).
  useEffect(() => {
    const r = d?.room;
    if (!r || r.status !== 'running' || !r.deadline || now < Date.parse(r.deadline) + 1500 || asked.current === r.week) return;
    asked.current = r.week;
    setTimeout(() => advanceRoom(r.id).catch(() => {}), Math.random() * 3000);
  }, [now, d]);

  if (!d) return <div class="panel"><p>{err || t('class.loading')}</p>{err && <button class="btn ghost" type="button" onClick={onExit}>{t('class.back')}</button>}</div>;
  const { room, player, others, session } = d;

  if (room.status === 'lobby' || !session) {
    return (
      <div class="panel classform">
        <h1>{t('class.lobbyTitle', { code: room.code })}</h1>
        <p>{t('class.lobbyLine', { hotel: player.hotel_name, city: N.city(room.city) })}</p>
        <p class="muted">{t('class.lobbyWait')}</p>
        <h3>{t('class.inRoom', { n: others.length })}</h3>
        <ul class="small">{others.map(o => <li key={o.id}>{o.hotel_name} <span class="muted">({o.name})</span></li>)}</ul>
        <button class="btn ghost" type="button" onClick={onExit}>{t('class.back')}</button>
      </div>
    );
  }
  if (session.over) return <FinalScreen s={session} onRestart={onExit} />;

  const dirty = !!sent && JSON.stringify(decisionOf(session.G.hotels[0], session.G.started || [])) !== sent.json;
  const submit = async () => {
    setBusy(true);
    try {
      await submitDecision(player, room, session.G);
      setSent({ at: Date.now(), json: JSON.stringify(decisionOf(session.G.hotels[0], session.G.started || [])) });
      setErr('');
    } catch (e) { setErr(errText(e)); }
    setBusy(false);
  };
  const update = fn => { fn(session); rerender(); };
  return (
    <GameScreen key={room.week} s={session} update={update} saveOk langSwitch={langSwitch}
      initialTab={session.last ? 'report' : 'market'}
      classBar={<SubmitBar s={session} room={room} submitted={sent?.at} dirty={dirty} busy={busy} err={err} onSubmit={submit} now={now} />} />
  );
}

/* Dev only (#classdemo on the local dev server): a student's game screen built from a server-style view,
   without any network or accounts. Lets every tab be checked against classroom data. */
export function ClassDemo({ langSwitch }) {
  const final = location.hash === '#classdemo-final';     // the whole 12 weeks, then the final screen
  const [s] = useState(() => {
    const room = { seed: 'demo', city: 'pbi', start_month: 10, chaos: 'high', allow_fake: true, bots: 1 };
    const g = startClassGame(room, [1, 2, 3].map(i => ({ hotel_key: 'p' + i, hotel_name: 'Hotel ' + i, owner_name: i === 2 ? 'Somchai' : '' })));
    // Demo players: different prices, team sizes and marketing so the analysis has something to explain.
    const plan = () => Object.fromEntries(g.hotels.filter(h => h.isPlayer).map((h, i) => {
      const fo = h.candidates.filter(c => c.role === 'fo'), hk = h.candidates.filter(c => c.role === 'hk');
      return [h.id, { price: { wd: 700 + i * 300, we: 900 + i * 380 }, mk: { billboard: i * 300, online: 800 + i * 500 }, bonus: i * 500,
        inf: 'none', ota: true, fake: false, staff: i ? [fo[0].id, hk[0].id] : [fo[0].id], start: [] }];
    }));
    let out = null;
    for (let w = 0; w < (final ? 12 : 3); w++) out = runClassWeek(g, plan());
    return sessionFromView(JSON.parse(toSaveJSON(viewFor(g, out, 'p1'))));
  });
  if (final) return <FinalScreen s={s} onRestart={() => {}} />;
  const [, rerender] = useReducer(x => x + 1, 0);
  const [sent, setSent] = useState(null);
  const now = useNow();
  const room = { week: s.G.week, deadline: new Date(Date.now() + 300000).toISOString() };
  const dirty = !!sent && JSON.stringify(decisionOf(s.G.hotels[0], s.G.started || [])) !== sent;
  return (
    <GameScreen s={s} update={fn => { fn(s); rerender(); }} saveOk langSwitch={langSwitch} initialTab="report"
      classBar={<SubmitBar s={s} room={room} submitted={sent ? Date.now() : null} dirty={dirty} busy={false} err=""
        onSubmit={() => setSent(JSON.stringify(decisionOf(s.G.hotels[0], s.G.started || [])))} now={now} />} />
  );
}

/* ---------------- instructors ---------------- */

export function InstructorScreen({ onBack }) {
  const [phase, setPhase] = useState('check');      // check | login | home | room
  const [roomId, setRoomId] = useState(null);
  useEffect(() => { amInstructor().then(ok => setPhase(ok ? 'home' : 'login')).catch(() => setPhase('login')); }, []);
  const logout = async () => { await signOut(); setPhase('login'); };
  if (phase === 'check') return <div class="panel"><p>{t('class.loading')}</p></div>;
  if (phase === 'login') return <TeacherLogin onDone={() => setPhase('home')} onBack={onBack} />;
  if (phase === 'room') return <RoomDashboard roomId={roomId} onBack={() => setPhase('home')} />;
  return <TeacherHome onOpen={id => { setRoomId(id); setPhase('room'); }} onLogout={logout} onBack={onBack} />;
}

function TeacherLogin({ onDone, onBack }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const go = async e => {
    e.preventDefault();
    setBusy(true); setErr('');
    try { await instructorSignIn(email, pw); onDone(); } catch (x) { setErr(errText(x)); setBusy(false); }
  };
  return (
    <form class="panel classform" onSubmit={go}>
      <h1>{t('class.teacherTitle')}</h1>
      <fieldset><legend>{t('class.email')}</legend><input type="email" autoComplete="username" value={email} onInput={e => setEmail(e.currentTarget.value)} /></fieldset>
      <fieldset><legend>{t('class.password')}</legend><input type="password" autoComplete="current-password" value={pw} onInput={e => setPw(e.currentTarget.value)} /></fieldset>
      {err && <div class="warn">{err}</div>}
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn" type="submit" disabled={busy || !email || !pw}>{busy ? t('class.wait') : t('class.login')}</button>
        <button class="btn ghost" type="button" onClick={onBack}>{t('class.back')}</button>
      </div>
      <p class="note">{t('class.teacherNote')}</p>
    </form>
  );
}

const PW_MIN = 8;   // [proposal] stricter than Supabase's default minimum of 6

function PasswordForm({ onClose }) {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const save = async e => {
    e.preventDefault();
    if (a.length < PW_MIN) return setMsg({ bad: true, text: t('class.pwRule', { n: PW_MIN }) });
    if (a !== b) return setMsg({ bad: true, text: t('class.pwMismatch') });
    setBusy(true);
    try { await changePassword(a); setMsg({ bad: false, text: t('class.pwSaved') }); setA(''); setB(''); }
    catch (x) { setMsg({ bad: true, text: errText(x) }); }
    setBusy(false);
  };
  return (
    <form class="note-box" onSubmit={save}>
      <h3 style="margin-top:0">{t('class.changePw')}</h3>
      <fieldset><legend>{t('class.newPw')}</legend>
        <input type="password" autoComplete="new-password" value={a} onInput={e => setA(e.currentTarget.value)} /></fieldset>
      <fieldset><legend>{t('class.newPw2')}</legend>
        <input type="password" autoComplete="new-password" value={b} onInput={e => setB(e.currentTarget.value)} /></fieldset>
      <p class="small muted">{t('class.pwRule', { n: PW_MIN })}</p>
      {msg && <div class={msg.bad ? 'warn' : 'small up'}>{msg.text}</div>}
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px">
        <button class="btn" type="submit" disabled={busy || !a || !b}>{busy ? t('class.wait') : t('class.pwSave')}</button>
        <button class="btn ghost" type="button" onClick={onClose}>{t('class.close')}</button>
      </div>
    </form>
  );
}

function TeacherHome({ onOpen, onLogout, onBack }) {
  const [pw, setPw] = useState(false);
  const [rooms, setRooms] = useState(null);
  const [err, setErr] = useState('');
  const [f, setF] = useState({ title: '', map: 'town', city: 'pbi', startMonth: 10, chaos: 'mid', allowFake: true, bots: 1, timer: 0 });
  const [busy, setBusy] = useState(false);
  const set = p => setF(x => ({ ...x, ...p }));
  const load = () => listRooms().then(setRooms).catch(e => setErr(errText(e)));
  useEffect(() => { load(); }, []);
  const create = async () => {
    setBusy(true); setErr('');
    try { const r = await createRoom(f); onOpen(r.id); } catch (e) { setErr(errText(e)); setBusy(false); }
  };
  return (
    <>
      <div class="panel classform">
        <div class="row" style="justify-content:space-between;display:flex;gap:8px;flex-wrap:wrap">
          <h1 style="margin:0">{t('class.roomsTitle')}</h1>
          <span><button class="btn ghost" type="button" onClick={() => setPw(x => !x)}>{t('class.changePw')}</button>{' '}
            <button class="btn ghost" type="button" onClick={onLogout}>{t('class.logout')}</button></span>
        </div>
        {pw && <PasswordForm onClose={() => setPw(false)} />}
        {err && <div class="warn">{err}</div>}
        {!rooms ? <p>{t('class.loading')}</p> : rooms.length === 0 ? <p class="muted">{t('class.noRooms')}</p> : (
          <div class="tablewrap"><table>
            <thead><tr><th>{t('class.code')}</th><th>{t('class.roomTitle')}</th><th>{t('setup.city')}</th><th>{t('class.players')}</th><th>{t('class.status')}</th><th /></tr></thead>
            <tbody>{rooms.map(r => (
              <tr key={r.id}>
                <td><b style="letter-spacing:.1em">{r.code}</b></td><td>{r.title}</td><td>{N.city(r.city)}</td>
                <td>{r.players?.[0]?.count ?? 0}</td><td>{t(`class.status_${r.status}`, { w: r.week })}</td>
                <td><button class="btn" type="button" onClick={() => onOpen(r.id)}>{t('class.open')}</button></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>
      <div class="panel classform">
        <h2>{t('class.newRoom')}</h2>
        <fieldset><legend>{t('class.roomTitle')}</legend>
          <input type="text" maxLength={60} value={f.title} placeholder={t('class.roomTitleHint')} onInput={e => set({ title: e.currentTarget.value })} /></fieldset>
        <fieldset><legend>{t('setup.mapType')}</legend>
          <Seg items={Object.keys(MAPS).map(k => [k, N.map(k)])} value={f.map} onPick={k => set({ map: k, city: MAPS[k].cities[0] })} /></fieldset>
        <fieldset><legend>{t('setup.city')}</legend>
          <Seg items={MAPS[f.map].cities.map(id => [id, N.city(id)])} value={f.city} onPick={id => set({ city: id })} /></fieldset>
        <fieldset><legend>{t('setup.startMonth')}</legend>
          <select value={f.startMonth} onChange={e => set({ startMonth: Number(e.currentTarget.value) })}>
            {t('data.monthFull').map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select></fieldset>
        <h3 style="margin-top:0">{t('city.seasonTitle', { city: N.city(f.city) })}</h3>
        <MonthBars city={f.city} start={f.startMonth} onPick={m => set({ startMonth: m })} />
        <fieldset><legend>{t('setup.chaos')}</legend>
          <Seg items={Object.keys(CHAOS).map(k => [k, N.chaos(k)])} value={f.chaos} onPick={k => set({ chaos: k })} /></fieldset>
        <fieldset><label class="row" style="justify-content:flex-start">
          <input type="checkbox" checked={f.allowFake} onChange={e => set({ allowFake: e.currentTarget.checked })} /> {t('setup.allowFake')}</label></fieldset>
        <fieldset><legend>{t('class.bots')}</legend>
          <Seg items={[0, 1, 2, 3].map(n => [n, String(n)])} value={f.bots} onPick={n => set({ bots: n })} />
          <p class="small muted">{t('class.botsHint')}</p></fieldset>
        <fieldset><legend>{t('class.timer')}</legend>
          <Seg items={[[0, t('class.timerOff')], [5, '5'], [10, '10'], [15, '15'], [20, '20']]} value={f.timer} onPick={n => set({ timer: n })} />
          <p class="small muted">{t('class.timerHint')}</p></fieldset>
        <button class="btn" type="button" disabled={busy} onClick={create}>{busy ? t('class.wait') : t('class.create')}</button>
      </div>
    </>
  );
}

function MarketTable({ pub }) {
  if (!pub) return null;
  const rows = [...pub.hotels].sort((a, b) => (b.revpar || 0) - (a.revpar || 0));
  const name = h => (h.bot ? N.hotel({ id: h.id }) : h.name);
  return (
    <div class="tablewrap"><table>
      <thead><tr><th>{t('comp.hotel')}</th><th>{t('comp.price')}</th><th>{t('comp.occ')}</th><th>{t('comp.adr')}</th><th>{t('comp.revpar')}</th><th>{t('comp.stars')}</th></tr></thead>
      <tbody>{rows.map(h => (
        <tr key={h.id}>
          <td>{name(h)}{h.owner && <div class="small muted">{t('unit.owner', { name: h.owner })}</div>}</td>
          <td>{fmt(h.price.wd)} / {fmt(h.price.we)}</td>
          <td>{h.occ !== undefined ? pct(h.occ) : '–'}</td><td>{h.sold ? fmt(h.adr) : '–'}</td>
          <td>{h.revpar !== undefined ? fmt(h.revpar) : '–'}</td><td>{h.R.toFixed(2)}</td>
        </tr>
      ))}</tbody>
    </table></div>
  );
}

function FinalTable({ pub }) {
  return (
    <div class="tablewrap"><table>
      <thead><tr><th>{t('final.colRank')}</th><th>{t('final.colScore')}</th><th>{t('final.colProfit')}</th><th>{t('comp.stars')}</th><th>{t('final.colBot')}</th></tr></thead>
      <tbody>{pub.final.map((f, k) => (
        <tr key={f.id}>
          <td>{k + 1}. {f.bot ? N.hotel({ id: f.id }) : f.name}{f.owner && <div class="small muted">{t('unit.owner', { name: f.owner })}</div>}</td>
          <td>{Math.round(f.score)}</td><td class={f.profit > 0 ? 'up' : 'down'}>{fmt(f.profit)}</td><td>{f.R.toFixed(2)}</td>
          <td>{f.bot ? t('final.botReveal', { arch: N.arch(f.arch), skill: N.skill(f.skill) }) : '–'}</td>
        </tr>
      ))}</tbody>
    </table></div>
  );
}

function RoomDashboard({ roomId, onBack }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [csv, setCsv] = useState('');
  const [bigQr, setBigQr] = useState(false);
  const now = useNow();
  useEffect(() => {
    if (!bigQr) return undefined;
    const onKey = e => { if (e.key === 'Escape') setBigQr(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [bigQr]);
  const load = () => roomDetail(roomId).then(x => { setD(x); setErr(''); }).catch(e => setErr(errText(e)));
  useEffect(() => {
    load();
    let stop = () => {}, timer = 0;
    watchRoom(roomId, () => { clearTimeout(timer); timer = setTimeout(load, 300); }).then(fn => { stop = fn; });
    return () => { clearTimeout(timer); stop(); };
  }, [roomId]);
  if (!d) return <div class="panel"><p>{err || t('class.loading')}</p><button class="btn ghost" type="button" onClick={onBack}>{t('class.back')}</button></div>;
  const { room, players, submitted, pub } = d;
  const act = async (fn, confirmMsg) => {
    if (confirmMsg && !(await confirmDialog(confirmMsg))) return;
    setBusy(true); setErr('');
    try { await fn(); await load(); } catch (e) { setErr(errText(e)); }
    setBusy(false);
  };
  const left = timeLeft(room.deadline, now);
  const nSub = players.filter(p => submitted.has(p.id)).length;
  const makeCsv = async () => {
    const all = await roomLogs(roomId);
    const head = 'player,hotel,owner,';
    const lines = [];
    all.forEach(({ player, log }) => {
      const rows = decisionCsv(log, w => weekLabel(weekInfo({ startMonth: room.start_month }, w - 1))).split('\n');
      if (!lines.length) lines.push(head + rows[0]);
      rows.slice(1).forEach(r => lines.push([player.name, player.hotel_name, player.owner_name].map(x => `"${String(x).replace(/"/g, '""')}"`).join(',') + ',' + r));
    });
    setCsv(lines.join('\n'));
  };
  return (
    <>
      <div class="panel classform">
        <div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center">
          <h1 style="margin:0">{room.title || t('class.room')} · {N.city(room.city)}</h1>
          <button class="btn ghost" type="button" onClick={onBack}>{t('class.back')}</button>
        </div>
        <div class="roomjoin">
          <div>
            <p class="roomcode" aria-label={t('class.code')}>{room.code}</p>
            <p class="small">{t('class.shareLink')} <a href={joinLink(room.code)}>{joinLink(room.code)}</a></p>
          </div>
          {room.status !== 'finished' && (
            <div class="qrbox">
              <QrCode text={joinLink(room.code)} size={150} label={t('class.qrAria', { code: room.code })} />
              <button class="btn ghost" type="button" onClick={() => setBigQr(true)}>{t('class.qrBig')}</button>
            </div>
          )}
        </div>
        {bigQr && (
          <div class="overlay qrfull" role="dialog" aria-modal="true" aria-label={t('class.qrAria', { code: room.code })} onClick={() => setBigQr(false)}>
            <QrCode text={joinLink(room.code)} size={Math.min(innerWidth, innerHeight) * 0.7} label={t('class.qrAria', { code: room.code })} />
            <p class="roomcode">{room.code}</p>
            <p>{t('class.qrScan')}</p>
            <p class="small">{t('class.qrClose')}</p>
          </div>
        )}
        <p><b>{t(`class.status_${room.status}`, { w: room.week })}</b>
          {room.status === 'running' && <> · {t('class.submittedCount', { n: nSub, total: players.length })}{left && <> · {t('class.timeLeft', { t: left })}</>}</>}</p>
        {err && <div class="warn">{err}</div>}
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          {room.status === 'lobby' && <button class="btn" type="button" disabled={busy} onClick={() => act(() => startRoom(room.id), t('class.startConfirm', { n: players.length, bots: room.bots }))}>{t('class.start')}</button>}
          {room.status === 'running' && <button class="btn" type="button" disabled={busy} onClick={() => act(() => advanceRoom(room.id), nSub < players.length ? t('class.advanceConfirm', { n: players.length - nSub }) : null)}>{busy ? t('class.wait') : t('class.advance', { n: room.week + 1 })}</button>}
          {room.status !== 'finished' && (
            <label class="small" style="display:flex;gap:6px;align-items:center">{t('class.timer')}
              <select value={room.timer_minutes || 0} onChange={e => { const v = Number(e.currentTarget.value); act(() => setTimer(room.id, v)); }}>
                {[0, 5, 10, 15, 20, 30].map(n => <option key={n} value={n}>{n ? t('class.minutes', { n }) : t('class.timerOff')}</option>)}
              </select></label>
          )}
        </div>
        <p class="note">{t(room.status === 'lobby' ? 'class.lobbyNote' : 'class.runNote')}</p>
      </div>

      <div class="panel classform">
        <h2>{t('class.players')} ({players.length})</h2>
        {players.length === 0 ? <p class="muted">{t('class.noPlayers')}</p> : (
          <div class="tablewrap"><table>
            <thead><tr><th>#</th><th>{t('class.name')}</th><th>{t('setup.hotelName')}</th><th>{t('setup.ownerName')}</th>{room.status === 'running' && <th>{t('class.thisWeek')}</th>}{room.status === 'lobby' && <th />}</tr></thead>
            <tbody>{players.map(p => (
              <tr key={p.id}>
                <td>{p.hotel_key}</td><td>{p.name}</td><td>{p.hotel_name}</td><td>{p.owner_name}</td>
                {room.status === 'running' && <td class={submitted.has(p.id) ? 'up' : 'muted'}>{submitted.has(p.id) ? t('class.sent') : t('class.notSent')}</td>}
                {room.status === 'lobby' && <td><button class="btn ghost" type="button" disabled={busy} onClick={() => act(() => removePlayer(p.id), t('class.removeConfirm', { name: p.name }))}>{t('class.remove')}</button></td>}
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>

      {pub && room.status !== 'lobby' && (
        <div class="panel classform">
          <h2>{room.status === 'finished' ? t('class.finalTitle') : t('class.marketTitle', { w: pub.week })}</h2>
          {pub.final ? <FinalTable pub={pub} /> : <MarketTable pub={pub} />}
        </div>
      )}
      {pub?.analysis && (
        <AnalysisPanel a={pub.analysis} nameOf={id => { const f = pub.final.find(x => x.id === id); return f.bot ? N.hotel({ id }) : f.name; }} />
      )}

      <div class="panel classform">
        <h2>{t('class.dataTitle')}</h2>
        <button class="btn ghost" type="button" onClick={makeCsv}>{t('class.csv')}</button>
        {csv && <textarea readonly aria-label={t('final.csvAria')} value={csv} style="width:100%;min-height:8rem;margin-top:8px" />}
        <p style="margin-top:16px"><button class="btn ghost" type="button" disabled={busy}
          onClick={async () => {
            if (!(await confirmDialog(t('class.deleteConfirm', { code: room.code })))) return;
            setBusy(true);
            try { await deleteRoom(room.id); onBack(); } catch (e) { setErr(errText(e)); setBusy(false); }
          }}>{t('class.delete')}</button></p>
        <p class="note">{t('class.deleteNote')}</p>
      </div>
    </>
  );
}
