// Text files: structure checks for content the UI relies on. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import th from '../src/i18n/th.json' with { type: 'json' };

test('every weekly question has hidden guidance (why + what to try)', () => {
  assert.ok(th.prompts.length >= 8);
  th.prompts.forEach((p, i) => {
    assert.ok(typeof p.q === 'string' && p.q.length > 0, `prompt ${i} question`);
    assert.ok(Array.isArray(p.why) && p.why.length > 0, `prompt ${i} why`);
    assert.ok(Array.isArray(p.todo) && p.todo.length > 0, `prompt ${i} todo`);
  });
});
