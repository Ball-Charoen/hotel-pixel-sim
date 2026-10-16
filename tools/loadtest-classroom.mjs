#!/usr/bin/env node
/* Classroom load test: N simulated students (anonymous accounts, no passwords) join a room an instructor created,
   play a few weeks, and the script measures how fast the real server answers.

     node tools/loadtest-classroom.mjs ROOMCODE [--students 5] [--weeks 3]

   Before running (the instructor does this in the game, bots and a 1-minute timer make the test fully automatic):
     1. Create a room: bots = 2 (or any), timer = 1 minute. Note the room code.
     2. Run this script. It joins the students and waits.
     3. When it says "joined", press Start on the instructor page.
     4. The students submit a decision every week; after the deadline ALL students ask for the week at the same moment
        (this tests the week lock: exactly one request should compute it). Then delete the room on the instructor page.

   It creates N anonymous Supabase users (named "LoadTest n") and leaves them there: they are harmless and unreachable.
   Uses only the public project URL and publishable key (the same ones the web page ships with). Needs Node 22+. */
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY, sessionFromView } from '../src/net/classroom.js';
import { makeDecision, summarize, tallyAdvance } from './loadtest-lib.mjs';

const args = process.argv.slice(2);
const opt = (name, d) => { const i = args.indexOf('--' + name); return i >= 0 ? Number(args[i + 1]) : d; };
const CODE = (args.find(a => /^[A-Za-z0-9]{6}$/.test(a)) || '').toUpperCase();
const N = opt('students', 5), WEEKS_TO_PLAY = opt('weeks', 3);
if (!CODE) { console.error('Usage: node tools/loadtest-classroom.mjs ROOMCODE [--students 5] [--weeks 3]'); process.exit(2); }

const sleep = ms => new Promise(r => setTimeout(r, ms));
const now = () => performance.now();
const log = (...a) => console.log(new Date().toLocaleTimeString('en-GB'), ...a);
const times = {};
const errors = [];
const rec = (k, ms) => { (times[k] ||= []).push(ms); };
async function timed(k, fn) {
  const t = now();
  try { const r = await fn(); rec(k, now() - t); return r; } catch (e) { rec(k + ' (failed)', now() - t); errors.push(`${k}: ${e?.message || e}`); throw e; }
}
const must = r => { if (r.error) throw r.error; return r.data; };
const fnCall = async (c, roomId) => {
  const t = now();
  const { data, error } = await c.functions.invoke('classroom', { body: { action: 'advance', roomId } });
  if (!error) return { ok: true, status: 200, ms: now() - t, body: data };
  let status = error.context?.status, body = null;
  try { body = await error.context.json(); } catch { /* not json */ }
  return { ok: false, status, ms: now() - t, body };
};

const students = Array.from({ length: N }, (_, i) => ({ i, events: [] }));

async function join(s) {
  s.c = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  must(await timed('1 anonymous sign-in', () => s.c.auth.signInAnonymously()));
  s.player = must(await timed('2 join room', () => s.c.rpc('join_room', {
    p_code: CODE, p_name: `LoadTest ${s.i + 1}`, p_hotel: `Test Hotel ${s.i + 1}`, p_owner: 'auto test',
  })));
  s.roomId = s.player.room_id;
}

async function subscribe(s) {
  const t = now();
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('realtime did not connect in 15 s')), 15000);
    s.c.channel('lt-' + s.i + '-' + Math.random().toString(36).slice(2))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${s.roomId}` },
        p => s.events.push({ week: p.new.week, status: p.new.status, at: now() }))
      .subscribe(st => { if (st === 'SUBSCRIBED') { clearTimeout(timer); resolve(); } });
  });
  rec('3 realtime connect', now() - t);
}

const getRoom = async s => must(await s.c.from('rooms').select('*').eq('id', s.roomId).single());

async function main() {
  log(`Joining room ${CODE} with ${N} simulated students...`);
  const t0 = now();
  const joined = await Promise.allSettled(students.map(join));
  joined.forEach((r, i) => { if (r.status === 'rejected') console.error(`  student ${i + 1} could not join:`, r.reason?.message || r.reason); });
  const ok = students.filter((_, i) => joined[i].status === 'fulfilled');
  if (!ok.length) throw new Error('nobody could join');
  log(`${ok.length}/${N} joined in ${((now() - t0) / 1000).toFixed(1)} s. Realtime subscribing...`);
  await Promise.allSettled(ok.map(subscribe));
  const bots = (await getRoom(ok[0])).bots;
  log(`Room has ${bots} bot hotel(s). >>> Press START on the instructor page now. <<<`);

  // wait for the instructor to start
  let room = await getRoom(ok[0]);
  const waitUntil = now() + 10 * 60000;
  while (room.status === 'lobby' && now() < waitUntil) { await sleep(2000); room = await getRoom(ok[0]); }
  if (room.status === 'lobby') throw new Error('the room was not started within 10 minutes');
  log('Started. Playing', WEEKS_TO_PLAY, 'week(s).');

  const weekRows = [];
  for (let w = 0; w < WEEKS_TO_PLAY && room.status === 'running'; w++) {
    room = await getRoom(ok[0]);
    const week = room.week;
    // 1. every student reads their report and submits a decision at the same time
    await Promise.allSettled(ok.map(async s => {
      const rep = must(await timed('4 read my report', async () => s.c.from('reports').select('payload, week').eq('player_id', s.player.id)
        .order('week', { ascending: false }).limit(1)));
      const session = sessionFromView(rep[0].payload);
      const payload = makeDecision(session.G, s.i);
      must(await timed('5 submit decision', async () => s.c.from('decisions').upsert(
        { player_id: s.player.id, room_id: s.roomId, week, payload }).select('submitted_at')));
    }));
    // 2. wait for the deadline, then everybody asks for the week at once
    if (!room.deadline) log('No timer on this room: press "calculate week" on the instructor page.');
    else {
      const wait = Date.parse(room.deadline) - Date.now() + 1500;
      log(`Week ${week + 1}: decisions in. Waiting ${Math.max(0, Math.round(wait / 1000))} s for the deadline...`);
      if (wait > 0) await sleep(wait);
    }
    const tAdvance = now();
    let results = [];
    if (room.deadline) {
      results = await Promise.all(ok.map(s => fnCall(s.c, s.roomId)));
      results.forEach(r => rec(r.ok ? '6 advance: computed the week' : '6 advance: lost the race', r.ms));
    }
    // 3. wait until the week moves, then every student sees their new report
    let after = await getRoom(ok[0]);
    const stop = now() + 5 * 60000;
    while (after.week === week && now() < stop) { await sleep(1500); after = await getRoom(ok[0]); }
    if (after.week === week) throw new Error(`week ${week + 1} was not computed`);
    const moved = now();
    await Promise.allSettled(ok.map(async s => {
      for (let k = 0; k < 40; k++) {
        const rep = must(await s.c.from('reports').select('week').eq('player_id', s.player.id).eq('week', after.week));
        if (rep.length) { rec('7 new report visible (after advance)', now() - tAdvance); return; }
        await sleep(500);
      }
      throw new Error('report never appeared');
    }));
    const pub = must(await ok[0].c.from('room_public').select('payload').eq('room_id', ok[0].roomId).eq('week', after.week).single());
    await sleep(1500);   // let late realtime events land
    const got = ok.filter(s => s.events.some(e => e.week === after.week));
    got.forEach(s => { const e = s.events.find(x => x.week === after.week); rec('8 realtime: week change reached the student', Math.max(0, e.at - tAdvance)); });
    const tally = tallyAdvance(results);
    weekRows.push({
      week: after.week, hotelsInMarket: pub.payload.hotels.length, expected: ok.length + bots,
      computedBy: room.deadline ? tally.computed : 'instructor', lostRace: room.deadline ? `${tally.busy} busy + ${tally.tooEarly} early` : '-',
      realtime: `${got.length}/${ok.length}`, sec: ((moved - tAdvance) / 1000).toFixed(1),
    });
    log(`Week ${after.week} done: market has ${pub.payload.hotels.length} hotels, realtime reached ${got.length}/${ok.length}.`);
    room = after;
  }

  console.log('\n=== Per week ===');
  console.table(weekRows);
  console.log('=== Timings (all students, all requests) ===');
  console.table(Object.fromEntries(Object.keys(times).sort().map(k => [k, summarize(times[k])])));
  if (errors.length) { console.log('=== Errors ==='); [...new Set(errors)].forEach(e => console.log(' -', e)); }
  const bad = weekRows.some(r => r.hotelsInMarket !== r.expected || (r.computedBy !== 'instructor' && r.computedBy !== 1));
  console.log(bad || errors.length ? '\nRESULT: problems found (see above)' : '\nRESULT: all good');
  await Promise.allSettled(ok.map(s => s.c.removeAllChannels()));
  process.exit(bad || errors.length ? 1 : 0);
}

main().catch(e => { console.error('\nFAILED:', e?.message || e); if (errors.length) console.error(errors.join('\n')); process.exit(1); });
