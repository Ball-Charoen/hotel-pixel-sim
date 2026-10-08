import { useState } from 'preact/hooks';
import { CITIES, MAPS, CHAOS, WEEKS } from '../../sim/core.js';
import { N } from '../names.js';
import { ThaiMap } from '../components/pixels.jsx';
import { CityCard } from '../components/CityCard.jsx';
import { Src } from '../components/widgets.jsx';
import { t, tx, getLocale } from '../../i18n/index.js';

const SegButtons = ({ items, value, onPick }) => (
  <div class="seg">
    {items.map(([k, name]) => (
      <button key={k} type="button" aria-pressed={value === k} onClick={() => onPick(k)}>{name}</button>
    ))}
  </div>
);

/* Shown when this browser has an autosaved game. */
function ResumeCard({ resume, onContinue, onDelete }) {
  const G = resume.session.G;
  const vars = { hotel: N.hotel(G.hotels[0]), city: N.city(G.city), week: Math.min(G.week + 1, WEEKS), weeks: WEEKS };
  const time = new Date(resume.savedAt).toLocaleString(getLocale(), { dateStyle: 'medium', timeStyle: 'short' });
  return (
    <div class="panel resume">
      <h2>{t('save.resumeTitle')}</h2>
      <p><b>{resume.screen === 'final' ? t('save.resumeFinal', vars) : t('save.resumeLine', vars)}</b><br />
        <span class="small muted">{t('save.savedAt', { time })}</span></p>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn" type="button" onClick={onContinue}>{t('save.continue')}</button>
        <button class="btn ghost" type="button" onClick={onDelete}>{t('save.delete')}</button>
      </div>
      <p class="note" style="margin:10px 0 0">{t('save.note')}</p>
    </div>
  );
}

export function SetupScreen({ onStart, resume, onContinue, onDeleteSave }) {
  const [s, setS] = useState(() => ({
    map: 'town', city: 'pbi', chaos: 'mid', allowFake: true, startMonth: 10,
    hotelName: null, seed: 'class-' + Math.floor(Math.random() * 9000 + 1000),
  }));
  const set = patch => setS(prev => ({ ...prev, ...patch }));
  // Until the player types a name, show the default name in the current language.
  const hotelName = s.hotelName ?? t('setup.defaultHotelName');
  const pickCity = id => set({ city: id, map: CITIES[id].map });

  const start = () => onStart({
    seed: s.seed || 'class', city: s.city, startMonth: s.startMonth, chaos: s.chaos, allowFake: s.allowFake,
    hotelName: (hotelName || t('setup.defaultHotelName')).trim(),
  });

  return (
    <>
    {resume && <ResumeCard resume={resume} onContinue={onContinue} onDelete={onDeleteSave} />}
    <div class="panel">
      <h1>{t('app.title')} <span class="chip shoulder" style="vertical-align:middle">{t('app.phase')}</span></h1>
      <p class="muted">{t('setup.intro')}</p>
      <div class="setup2">
        <div>
          <ThaiMap selected={s.city} onSelect={pickCity} />
          <p class="note" style="text-align:center">{tx('setup.mapCredit', { src: <Src k="ne">Natural Earth</Src> })}</p>
        </div>
        <div>
          <fieldset>
            <legend>{t('setup.mapType')}</legend>
            <SegButtons items={Object.keys(MAPS).map(k => [k, N.map(k)])} value={s.map}
              onPick={k => set({ map: k, city: MAPS[k].cities[0] })} />
          </fieldset>
          <fieldset>
            <legend>{t('setup.city')}</legend>
            <SegButtons items={MAPS[s.map].cities.map(id => [id, N.city(id)])} value={s.city} onPick={pickCity} />
          </fieldset>
          <CityCard id={s.city} />
          <fieldset style="margin-top:12px">
            <legend>{t('setup.hotelName')}</legend>
            <input type="text" maxLength={30} value={hotelName} onInput={e => set({ hotelName: e.currentTarget.value })} />
          </fieldset>
          <h3>{t('setup.classroom')}</h3>
          <fieldset>
            <legend>{t('setup.startMonth')}</legend>
            <select value={s.startMonth} onChange={e => set({ startMonth: Number(e.currentTarget.value) })}>
              {t('data.monthFull').map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <p class="small muted">{t('setup.startMonthHint')}</p>
          </fieldset>
          <fieldset>
            <legend>{t('setup.chaos')}</legend>
            <SegButtons items={Object.keys(CHAOS).map(k => [k, N.chaos(k)])} value={s.chaos} onPick={k => set({ chaos: k })} />
          </fieldset>
          <fieldset>
            <label class="row" style="justify-content:flex-start">
              <input type="checkbox" checked={s.allowFake} onChange={e => set({ allowFake: e.currentTarget.checked })} />
              {' '}{t('setup.allowFake')}
            </label>
          </fieldset>
          <fieldset>
            <legend>{t('setup.seed')}</legend>
            <input type="text" maxLength={24} value={s.seed} onInput={e => set({ seed: e.currentTarget.value })} />
            <p class="small muted">{t('setup.seedHint')}</p>
          </fieldset>
          <button class="btn" type="button" onClick={start}>{t('setup.start')}</button>
        </div>
      </div>
    </div>
    </>
  );
}
