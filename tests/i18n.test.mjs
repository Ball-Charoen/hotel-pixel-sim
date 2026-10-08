// Text files: every language must have the same keys, list lengths and {placeholders}. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import th from '../src/i18n/th.json' with { type: 'json' };
import en from '../src/i18n/en.json' with { type: 'json' };
import zhTW from '../src/i18n/zh-TW.json' with { type: 'json' };

const OTHERS = { en, 'zh-TW': zhTW };
const holes = s => [...s.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(',');

function compare(ref, other, path, problems) {
  if (typeof ref === 'string') {
    if (typeof other !== 'string') return problems.push(`${path}: missing or not text`);
    if (other.trim() === '') problems.push(`${path}: empty`);
    if (holes(ref) !== holes(other)) problems.push(`${path}: placeholders {${holes(ref)}} vs {${holes(other)}}`);
    return;
  }
  if (Array.isArray(ref)) {
    if (!Array.isArray(other) || other.length !== ref.length) return problems.push(`${path}: list length differs`);
    ref.forEach((v, i) => compare(v, other[i], `${path}[${i}]`, problems));
    return;
  }
  if (!other || typeof other !== 'object') return problems.push(`${path}: missing section`);
  Object.keys(ref).forEach(k => compare(ref[k], other[k], path ? `${path}.${k}` : k, problems));
  Object.keys(other).forEach(k => { if (!(k in ref)) problems.push(`${path}.${k}: extra key not in th.json`); });
}

for (const [lang, dict] of Object.entries(OTHERS)) {
  test(`${lang}.json matches th.json (keys, list lengths, placeholders)`, () => {
    const problems = [];
    compare(th, dict, '', problems);
    assert.deepEqual(problems, []);
  });
}

test('every weekly question has hidden guidance (why + what to try)', () => {
  assert.ok(th.prompts.length >= 8);
  th.prompts.forEach((p, i) => {
    assert.ok(typeof p.q === 'string' && p.q.length > 0, `prompt ${i} question`);
    assert.ok(Array.isArray(p.why) && p.why.length > 0, `prompt ${i} why`);
    assert.ok(Array.isArray(p.todo) && p.todo.length > 0, `prompt ${i} todo`);
  });
});

test('the sim core contains no Thai display text (it lives in the language files)', async () => {
  const fs = await import('node:fs');
  const core = fs.readFileSync(new URL('../src/sim/core.js', import.meta.url), 'utf8');
  assert.equal(/[฀-๿]/.test(core), false);
});

test('the bundled Chinese font covers every Chinese character in zh-TW.json (else run npm run font:zh)', async () => {
  const fs = await import('node:fs');
  const have = new Set([...fs.readFileSync(new URL('../src/fonts/noto-sans-tc-subset.chars.txt', import.meta.url), 'utf8').trim()]);
  const CJK = /[⺀-鿿　-〿豈-﫿＀-￯]/u;
  const missing = [...new Set([...JSON.stringify(zhTW)].filter(c => CJK.test(c) && !have.has(c)))];
  assert.deepEqual(missing, []);
});
