// Weekly timer of a classroom: off, or any whole minute from 1 to 20. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { timerOptions, cleanTimer, TIMER_MAX } from '../src/net/classroom.js';

test('the timer menu offers every minute from 1 to 20 and keeps an older value such as 30', () => {
  assert.equal(TIMER_MAX, 20);
  assert.deepEqual(timerOptions(0), Array.from({ length: 20 }, (_, i) => i + 1));
  assert.deepEqual(timerOptions(7), timerOptions(0));
  assert.deepEqual(timerOptions(30).slice(-2), [20, 30]);
});

test('timer values: off = null, 1..20 whole minutes accepted, anything else refused', () => {
  assert.equal(cleanTimer(0), null);
  assert.equal(cleanTimer(null), null);
  assert.equal(cleanTimer('7'), 7);
  assert.equal(cleanTimer(1), 1);
  assert.equal(cleanTimer(20), 20);
  for (const bad of [21, 30, -1, 2.5, 'x']) assert.throws(() => cleanTimer(bad), /whole number from 1 to 20/, String(bad));
});
