import { useState, useRef, useReducer, useEffect } from 'preact/hooks';
import { startSession } from './session.js';
import { writeSave, readSave, clearSave } from './saveStore.js';
import { SetupScreen } from './screens/SetupScreen.jsx';
import { GameScreen } from './screens/GameScreen.jsx';
import { FinalScreen } from './screens/FinalScreen.jsx';
import { t, getLang, setLang } from '../i18n/index.js';
import { LangSwitch } from './components/widgets.jsx';
import { ConfirmHost, confirmDialog } from './confirm.jsx';

/* The sim core mutates the game object in place, so the session lives in a ref
   and update(fn) runs the change then forces a re-render.
   Every change is autosaved to this browser (one slot); see saveStore.js. */
export function App() {
  const [screen, setScreen] = useState('setup');
  const [, setLangState] = useState(getLang()); // re-render everything when the language changes
  const changeLang = l => { setLang(l); setLangState(l); };
  const [resume, setResume] = useState(() => readSave());
  const [saveOk, setSaveOk] = useState(true);
  const session = useRef(null);
  const screenRef = useRef(screen);
  screenRef.current = screen;
  const timer = useRef(0);
  const [, rerender] = useReducer(x => x + 1, 0);

  const saveNow = (scr = screenRef.current) => {
    clearTimeout(timer.current);
    timer.current = 0;
    if (session.current && scr !== 'setup') setSaveOk(writeSave(session.current, scr));
  };
  // Sliders fire many events; save shortly after the last one.
  const saveSoon = () => { clearTimeout(timer.current); timer.current = setTimeout(() => saveNow(), 300); };
  const update = (fn, now) => { fn(session.current); rerender(); if (now) saveNow(); else saveSoon(); };

  const go = scr => { setScreen(scr); window.scrollTo(0, 0); };
  const start = async opts => {
    if (resume && !(await confirmDialog(t('save.overwriteConfirm')))) return;
    session.current = startSession(opts);
    saveNow('game');
    go('game');
  };
  const continueGame = () => {
    const d = readSave();
    if (!d) { setResume(null); return; }
    session.current = d.session;
    go(d.screen === 'final' ? 'final' : 'game');
  };
  const deleteSave = async () => {
    if (!(await confirmDialog(t('save.deleteConfirm')))) return;
    clearSave();
    setResume(null);
  };
  const restart = () => { clearSave(); setResume(null); session.current = null; go('setup'); };
  const showFinal = () => { saveNow('final'); go('final'); };

  // Write any pending save when the page is hidden or closed.
  useEffect(() => {
    const flush = () => { if (timer.current) saveNow(); };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', flush);
    return () => { window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', flush); };
  }, []);

  // Only if saving fails (e.g. private window): ask before the page is left, since the game would be lost.
  useEffect(() => {
    if (screen === 'setup' || saveOk) return undefined;
    const warn = e => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [screen, saveOk]);

  let body;
  if (screen === 'setup') body = <SetupScreen onStart={start} resume={resume} onContinue={continueGame} onDeleteSave={deleteSave} />;
  else if (screen === 'final') body = <FinalScreen s={session.current} onRestart={restart} />;
  else {
    body = (
      <GameScreen s={session.current} update={update} saveOk={saveOk} onFinal={showFinal} langSwitch={<LangSwitch onChange={changeLang} />}
        initialTab={session.current.last ? 'report' : 'market'} />
    );
  }
  // In the game the switcher sits inside the layout (sidebar on phones); elsewhere it is on top.
  return (
    <>
      <p class="rotate-hint">{t('app.rotate')}</p>
      {screen !== 'game' && <LangSwitch onChange={changeLang} />}
      {body}
      <ConfirmHost />
    </>
  );
}
