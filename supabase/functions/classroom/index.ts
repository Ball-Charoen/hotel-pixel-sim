// Classroom server (Supabase Edge Function). The only place where a class game is computed.
//   POST { action: 'start',   roomId }  instructor: lobby -> week 1 (creates the game)
//   POST { action: 'advance', roomId }  instructor any time, or a student of the room once the deadline has passed
// Game rules live in ../_shared (copies of src/sim/*.js, see scripts/sync-server.mjs).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { startClassGame, runClassWeek, viewFor, publicFor, relinkClass } from '../_shared/classroom.js';
import { toSaveJSON, fromSaveJSON } from '../_shared/save.js';
import { WEEKS } from '../_shared/core.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const json = (x: unknown) => JSON.parse(toSaveJSON(x));          // markers for RNG / shock events
const STALE_MS = 90_000;                                           // a crashed run frees the room after 90 s

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return reply(405, { error: 'method' });

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: auth } = await db.auth.getUser(token);
  const user = auth?.user;
  if (!user) return reply(401, { error: 'not signed in' });

  let body: { action?: string; roomId?: string };
  try { body = await req.json(); } catch { return reply(400, { error: 'bad json' }); }
  const { data: room } = await db.from('rooms').select('*').eq('id', body.roomId ?? '').maybeSingle();
  if (!room) return reply(404, { error: 'room not found' });
  const isOwner = room.instructor_id === user.id;

  // Take the room's lock for this exact week (fails if another request is already computing it).
  const claim = async (status: string) => {
    const stale = new Date(Date.now() - STALE_MS).toISOString();
    const { data } = await db.from('rooms').update({ busy_since: new Date().toISOString() })
      .eq('id', room.id).eq('status', status).eq('week', room.week)
      .or(`busy_since.is.null,busy_since.lt.${stale}`).select('id');
    return !!data?.length;
  };
  const deadline = () => (room.timer_minutes ? new Date(Date.now() + room.timer_minutes * 60_000).toISOString() : null);

  // Order matters: reports + public table, then the game state, then the room's week (which also frees the lock).
  // If anything fails before the state is saved, a retry recomputes the same week from the old state: the game is
  // deterministic, so the reports come out identical.
  const publish = async (g: any, out: any, players: any[]) => {
    const rows = players.map((p) => ({ player_id: p.id, room_id: room.id, week: g.week, payload: json(viewFor(g, out, p.hotel_key)) }));
    let r = await db.from('reports').upsert(rows);
    if (r.error) throw r.error;
    r = await db.from('room_public').upsert({ room_id: room.id, week: g.week, payload: json(publicFor(g, out)) });
    if (r.error) throw r.error;
    r = await db.from('room_state').upsert({ room_id: room.id, state: json(g), updated_at: new Date().toISOString() });
    if (r.error) throw r.error;
    const over = g.week >= WEEKS;
    r = await db.from('rooms').update({
      status: over ? 'finished' : 'running', week: g.week, deadline: over ? null : deadline(), busy_since: null,
    }).eq('id', room.id);
    if (r.error) throw r.error;
  };
  const release = () => db.from('rooms').update({ busy_since: null }).eq('id', room.id);

  try {
    if (body.action === 'start') {
      if (!isOwner) return reply(403, { error: 'only the instructor can start' });
      if (room.status !== 'lobby') return reply(409, { error: 'already started' });
      const { data: players } = await db.from('players').select('*').eq('room_id', room.id);
      if (!players?.length) return reply(409, { error: 'no players yet' });
      if (players.length + room.bots < 2) return reply(409, { error: 'a market needs at least 2 hotels: add a bot' });
      if (!(await claim('lobby'))) return reply(409, { error: 'busy' });
      const g = startClassGame(room, players);
      await publish(g, null, players);
      return reply(200, { ok: true, week: g.week });
    }

    if (body.action === 'advance') {
      if (room.status !== 'running') return reply(409, { error: 'not running' });
      const { data: me } = await db.from('players').select('id').eq('room_id', room.id).eq('user_id', user.id).maybeSingle();
      const due = room.deadline && Date.now() > Date.parse(room.deadline);
      if (!isOwner && !(me && due)) return reply(403, { error: 'only the instructor can advance before the deadline' });
      if (!(await claim('running'))) return reply(409, { error: 'busy' });
      const [{ data: st }, { data: players }, { data: decs }] = await Promise.all([
        db.from('room_state').select('state').eq('room_id', room.id).single(),
        db.from('players').select('*').eq('room_id', room.id),
        db.from('decisions').select('player_id, payload').eq('room_id', room.id).eq('week', room.week),
      ]);
      const g = relinkClass(fromSaveJSON(JSON.stringify(st!.state)));
      if (g.week !== room.week) throw new Error(`state week ${g.week} != room week ${room.week}`);
      const keyOf = Object.fromEntries((players ?? []).map((p: any) => [p.id, p.hotel_key]));
      const decisions = Object.fromEntries((decs ?? []).map((d: any) => [keyOf[d.player_id], d.payload]));
      const out = runClassWeek(g, decisions);
      await publish(g, out, players ?? []);
      return reply(200, { ok: true, week: g.week, submitted: Object.keys(decisions).length });
    }

    return reply(400, { error: 'unknown action' });
  } catch (e) {
    await release();
    console.error(e);
    return reply(500, { error: String((e as Error)?.message ?? e) });
  }
});
