/* In-game yes/no dialog. Replaces window.confirm, which some embedded browsers (e.g. the app's
   Preview pane) answer "no" instantly without showing anything. Usage: if (await confirmDialog(msg)) ... */
import { useState, useEffect, useRef } from 'preact/hooks';
import { t } from '../i18n/index.js';

let show = null;

export function confirmDialog(message) {
  if (!show) return Promise.resolve(false);
  return new Promise(resolve => show({ message, resolve }));
}

export function ConfirmHost() {
  const [ask, setAsk] = useState(null);
  const ok = useRef(null);
  useEffect(() => { show = setAsk; return () => { show = null; }; }, []);
  useEffect(() => {
    if (!ask) return undefined;
    ok.current?.focus();
    const onKey = e => { if (e.key === 'Escape') answer(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [ask]);
  if (!ask) return null;
  function answer(v) { ask.resolve(v); setAsk(null); }
  return (
    <div class="overlay" onClick={e => { if (e.target === e.currentTarget) answer(false); }}>
      <div class="modal confirm" role="alertdialog" aria-modal="true" aria-labelledby="confirmmsg">
        <div class="modal-body">
          <p id="confirmmsg">{ask.message}</p>
          <div class="confirm-actions">
            <button type="button" class="btn ghost" onClick={() => answer(false)}>{t('common.cancel')}</button>
            <button ref={ok} type="button" class="btn" onClick={() => answer(true)}>{t('common.ok')}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
