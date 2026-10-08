import { useState, useEffect, useRef } from 'preact/hooks';
import { WEEKS } from '../../sim/core.js';
import { N, weekLabel } from '../names.js';
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
      <div class="stat"><span class="k" title={t('top.week')}>{t('top.week')}</span><span class="v">{Math.min(G.week + 1, WEEKS)}/{WEEKS}</span></div>
      <div class="stat where">
        <span class="k">{N.city(G.city)}</span><span style="font-size:.95rem">{weekLabel(x.wi)}</span><br />
        <TmdChip tmd={x.tmd} /><SeasonChip lab={x.lab} />
      </div>
      <div class="stat"><span class="k" title={t('top.cash')}>{t('top.cash')}</span><span class={`v${h.cash < 0 ? ' down' : ''}`}>{fmt(h.cash)}</span></div>
      <div class="stat"><span class="k" title={t('top.rating')}>{t('top.rating')}</span><span class="v">{h.R.toFixed(2)}</span></div>
      <div class="stat"><span class="k" title={t('top.staffSat')}>{t('top.staffSat')}</span><span class="v">{h.staff.length ? Math.round(teamSat) : '–'}</span></div>
      <button type="button" class="infobtn" aria-label={t('top.info')} title={t('top.info')} onClick={onInfo}>i</button>
    </div>
  );
}

function EndBar({ G, saveOk, onEndWeek, onFinal }) {
  if (isOver(G)) {
    return <div class="endbar"><button class="btn" type="button" onClick={onFinal}>{t('end.final')}</button></div>;
  }
  const hasStaff = player(G).staff.length > 0;
  return (
    <div class="endbar">
      <p class="small" style="margin:0 0 6px">
        {tx('end.spend', { amount: <b>{baht(plannedSpend(G).total)}</b> })} <span class="muted spendnote">{t('end.spendNote')}</span>
      </p>
      {!saveOk && <div class="warn" style="margin:0 0 6px">{t('save.failed')}</div>}
      <button class="btn" type="button" disabled={!hasStaff} onClick={onEndWeek}>
        {hasStaff ? t('end.endWeek', { n: G.week + 1 }) : t('end.needStaff')}
      </button>
      {saveOk && <p class="small muted savestatus">{t('save.status')}</p>}
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

/* Desktop: everything stacked (as in the prototype). Phone landscape: CSS turns .game into a
   left sidebar (language, stats, tabs, end button) and a scrolling content panel (#tabbody). */
export function GameScreen({ s, update, saveOk, onFinal, langSwitch, initialTab = 'market' }) {
  const [tab, setTab] = useState(initialTab);
  const body = useRef(null);
  // New tab or new week: start the content panel at the top (only matters when it scrolls on its own).
  useEffect(() => { if (body.current) body.current.scrollTop = 0; }, [tab, s.G.week]);
  const [info, setInfo] = useState(false);
  const infoBtnFocus = () => document.querySelector('.infobtn')?.focus();

  const doEndWeek = () => {
    if (isOver(s.G)) return;
    update(endWeek, true);
    setTab('report');
    window.scrollTo(0, 0);
  };

  return (
    <div class="game">
      {langSwitch}
      <TopBar G={s.G} onInfo={() => setInfo(true)} />
      <div class="tabs" role="tablist">
        {TABS.map(k => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{t(`tabs.${k}`)}</button>
        ))}
      </div>
      <div id="tabbody" ref={body}>
        {tab === 'market' && <MarketTab s={s} />}
        {tab === 'decide' && <DecideTab s={s} update={update} onGoStaff={() => setTab('staff')} />}
        {tab === 'staff' && <StaffTab s={s} update={update} />}
        {tab === 'customer' && <CustomerTab s={s} />}
        {tab === 'report' && <ReportTab s={s} />}
      </div>
      <EndBar G={s.G} saveOk={saveOk} onEndWeek={doEndWeek} onFinal={onFinal} />
      {info && (
        <InfoModal onClose={() => { setInfo(false); infoBtnFocus(); }}>
          <EventsLibrary s={s} update={update} />
        </InfoModal>
      )}
    </div>
  );
}
