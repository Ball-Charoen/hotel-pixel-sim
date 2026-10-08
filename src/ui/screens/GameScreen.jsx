import { useState, useEffect, useRef } from 'preact/hooks';
import { CITIES, WEEKS } from '../../sim/core.js';
import { player, weekCtx, plannedSpend, endWeek, isOver } from '../session.js';
import { SeasonChip, TmdChip } from '../components/widgets.jsx';
import { MarketTab } from '../tabs/MarketTab.jsx';
import { DecideTab } from '../tabs/DecideTab.jsx';
import { StaffTab } from '../tabs/StaffTab.jsx';
import { CustomerTab } from '../tabs/CustomerTab.jsx';
import { ReportTab } from '../tabs/ReportTab.jsx';
import { EventsLibrary } from './EventsLibrary.jsx';
import { fmt, baht } from '../format.js';
import { t, tx } from '../../i18n/index.js';

const TABS = ['market', 'decide', 'staff', 'customer', 'report'];

function TopBar({ G, onInfo }) {
  const h = player(G);
  const x = weekCtx(G, G.week);
  const teamSat = h.staff.length ? h.staff.reduce((a, s) => a + s.sat, 0) / h.staff.length : 0;
  return (
    <div class="topbar">
      <div class="stat"><span class="k">{t('top.week')}</span><span class="v">{Math.min(G.week + 1, WEEKS)}/{WEEKS}</span></div>
      <div class="stat">
        <span class="k">{CITIES[G.city].name}</span><span style="font-size:.95rem">{x.wi.label}</span><br />
        <TmdChip tmd={x.tmd} /><SeasonChip lab={x.lab} />
      </div>
      <div class="stat"><span class="k">{t('top.cash')}</span><span class={`v${h.cash < 0 ? ' down' : ''}`}>{fmt(h.cash)}</span></div>
      <div class="stat"><span class="k">{t('top.rating')}</span><span class="v">{h.R.toFixed(2)}</span></div>
      <div class="stat"><span class="k">{t('top.staffSat')}</span><span class="v">{h.staff.length ? Math.round(teamSat) : '–'}</span></div>
      <button type="button" class="infobtn" aria-label={t('top.info')} title={t('top.info')} onClick={onInfo}>i</button>
    </div>
  );
}

function EndBar({ G, onEndWeek, onFinal }) {
  if (isOver(G)) {
    return <div class="endbar"><button class="btn" type="button" onClick={onFinal}>{t('end.final')}</button></div>;
  }
  const hasStaff = player(G).staff.length > 0;
  return (
    <div class="endbar">
      <p class="small" style="margin:0 0 6px">
        {tx('end.spend', { amount: <b>{baht(plannedSpend(G).total)}</b> })} <span class="muted">{t('end.spendNote')}</span>
      </p>
      <button class="btn" type="button" disabled={!hasStaff} onClick={onEndWeek}>
        {hasStaff ? t('end.endWeek', { n: G.week + 1 }) : t('end.needStaff')}
      </button>
    </div>
  );
}

function InfoModal({ onClose, children }) {
  const closeBtn = useRef(null);
  useEffect(() => {
    closeBtn.current?.focus();
    document.body.style.overflow = 'hidden';
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', onKey); };
  }, []);
  return (
    <div class="overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="infotitle">
        <div class="modal-head">
          <h2 id="infotitle">{t('info.title')}</h2>
          <button ref={closeBtn} type="button" class="btn ghost" aria-label={t('info.closeAria')} onClick={onClose}>{t('info.close')}</button>
        </div>
        <div class="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function GameScreen({ s, update, onFinal }) {
  const [tab, setTab] = useState('market');
  const [info, setInfo] = useState(false);
  const infoBtnFocus = () => document.querySelector('.infobtn')?.focus();

  const doEndWeek = () => {
    if (isOver(s.G)) return;
    update(endWeek);
    setTab('report');
    window.scrollTo(0, 0);
  };

  return (
    <>
      <TopBar G={s.G} onInfo={() => setInfo(true)} />
      <div class="tabs" role="tablist">
        {TABS.map(k => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{t(`tabs.${k}`)}</button>
        ))}
      </div>
      <div id="tabbody">
        {tab === 'market' && <MarketTab s={s} />}
        {tab === 'decide' && <DecideTab s={s} update={update} onGoStaff={() => setTab('staff')} />}
        {tab === 'staff' && <StaffTab s={s} update={update} />}
        {tab === 'customer' && <CustomerTab s={s} />}
        {tab === 'report' && <ReportTab s={s} />}
      </div>
      <EndBar G={s.G} onEndWeek={doEndWeek} onFinal={onFinal} />
      {info && (
        <InfoModal onClose={() => { setInfo(false); infoBtnFocus(); }}>
          <EventsLibrary s={s} update={update} />
        </InfoModal>
      )}
    </>
  );
}
