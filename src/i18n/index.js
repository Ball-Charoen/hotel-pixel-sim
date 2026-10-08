/* Tiny translation helper. All UI text lives in <lang>.json; code only uses keys.
   t('a.b', {n: 3}) -> string with {n} filled in.
   tx('a.b', {src: <a/>}) -> array of strings and JSX nodes, for text that contains links or markup. */
import th from './th.json';

const DICTS = { th };
let lang = 'th';

export function setLang(l) { if (DICTS[l]) lang = l; }
export function getLang() { return lang; }

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
