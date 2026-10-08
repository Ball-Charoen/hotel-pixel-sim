// The server function runs copies of src/sim/*.js. They must match the source (npm run sync:server).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SHARED } from '../scripts/sync-server.mjs';

test('supabase/functions/_shared has up-to-date copies of the game modules', () => {
  for (const f of SHARED) {
    const src = fs.readFileSync(new URL(`../src/sim/${f}`, import.meta.url), 'utf8');
    const copy = fs.readFileSync(new URL(`../supabase/functions/_shared/${f}`, import.meta.url), 'utf8');
    assert.ok(copy.endsWith(src) && copy.length - src.length < 120, `${f} is stale: run npm run sync:server`);
  }
});
