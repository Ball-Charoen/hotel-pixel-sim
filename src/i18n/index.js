/* Tiny translation helper. All UI text lives in <lang>.json; code only uses keys.
   t('a.b', {n: 3}) -> string with {n} filled in.
   tx('a.b', {src: <a/>}) -> array of strings and JSX nodes, for text that contains links or markup. */
import th from './th.json';
import en from './en.json';
import zhTW from './zh-TW.json';

const DICTS = { th, en, 'zh-TW': zhTW };
/* Shown in the switcher in each language's own name. */
export const LANGS = [['th', 'ไทย'], ['en', 'English'], ['zh-TW', '繁體中文']];
const LOCALE = { th: 'th-TH', en: 'en-GB', 'zh-TW': 'zh-TW' };
const KEY = 'hotel-pixel-sim:lang';

let lang = 'th';
try { const saved = localStorage.getItem(KEY); if (DICTS[saved]) lang = saved; } catch { /* storage unavailable */ }

export function setLang(l) {
  if (!DICTS[l]) return;
  lang = l;
  try { localStorage.setItem(KEY, l); } catch { /* storage unavailable */ }
  if (typeof document !== 'undefined') document.documentElement.lang = l;
}
export const getLang = () => lang;
/* BCP-47 locale for dates. */
export const getLocale = () => LOCALE[lang];

function lookup(key) {
  const get = d => key.split('.').reduce((o, k) => (o == null ? o : o[k]), d);
  const v = get(DICTS[lang]);
  return v != null ? v : (get(DICTS.th) ?? key);
}

/* Fill {name} placeholders in an already-looked-up string (e.g. an item of a list from t()). */
export const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));

export function t(key, vars) {
  const s = lookup(key);
  if (!vars || typeof s !== 'string') return s;
  return fill(s, vars);
}

export function tx(key, vars = {}) {
  return String(lookup(key))
    .split(/(\{\w+\})/)
    .filter(p => p !== '')
    .map(p => {
      const m = p.match(/^\{(\w+)\}$/);
      return m && m[1] in vars ? vars[m[1]] : p;
    });
}
