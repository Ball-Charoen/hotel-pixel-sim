/* Network side of the classroom (P2): Supabase auth, rooms, decisions, reports, live updates.
   The Supabase library is loaded only when classroom mode is used, so single player stays light.
   The project URL and publishable key are public by design (access is limited by row-level security). */
import { fromSaveJSON, relinkGame } from '../sim/save.js';
import { applyDecision, decisionOf } from '../sim/classroom.js';

export const SUPABASE_URL = 'https://hyxrvdnijzyymlerspah.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_fAoTsDCozBfOv8GRpRhfgA_F97Ij5sL';

let clientP = null;
export function sb() {
  clientP ||= import('@supabase/supabase-js').then(({ createClient }) => createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: 'hotel-pixel-sim:auth' },
  }));
  return clientP;
}
const must = r => { if (r.error) throw r.error; return r.data; };

/* Link for students: opens the game with the room code filled in. On a local/dev address (localhost, 127.x, LAN)
   the link points to the public site instead: "localhost" on a student's phone would be the phone itself. */
export const PUBLIC_URL = 'https://ball-charoen.github.io/hotel-pixel-sim/';
const LOCAL_HOST = /^(localhost|127\.|\[::1\]|0\.0\.0\.0|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)|\.local$/;
export const joinLink = (code, loc = location) => (LOCAL_HOST.test(loc.hostname)
  ? `${PUBLIC_URL}#join=${code}` : `${loc.origin}${loc.pathname}#join=${code}`);
export const codeFromHash = () => (/#join=([A-Za-z0-9]{6})/.exec(location.hash) || [])[1]?.toUpperCase() || '';

export async function currentUser() {
  const c = await sb();
  const { data } = await c.auth.getSession();
  return data.session?.user || null;
}
export async function signOut() { const c = await sb(); await c.auth.signOut(); }

/* ---------- students (anonymous, no account) ---------- */
export async function studentSignIn() {
  const c = await sb();
  const u = await currentUser();
  if (u) return u;
  return must(await c.auth.signInAnonymously()).user;
}

export async function joinRoom({ code, name, hotel, owner }) {
  const c = await sb();
  await studentSignIn();
  return must(await c.rpc('join_room', { p_code: code.trim().toUpperCase(), p_name: name, p_hotel: hotel, p_owner: owner || '' }));
}

/* Rooms this browser has joined (to continue after closing the page). */
export async function myPlayers() {
  const c = await sb();
  const u = await currentUser();
  if (!u) return [];
  return must(await c.from('players').select('id, hotel_name, name, rooms(id, code, title, city, status, week)')
    .eq('user_id', u.id).order('joined_at', { ascending: false }));
}

/* Everything a student screen needs: room, own player row, latest report as a game session, this week's decision. */
export async function loadStudent(playerId) {
  const c = await sb();
  const player = must(await c.from('players').select('*').eq('id', playerId).single());
  const room = must(await c.from('rooms').select('*').eq('id', player.room_id).single());
  const others = must(await c.from('players').select('id, name, hotel_name').eq('room_id', room.id).order('joined_at'));
  let session = null, decision = null;
  if (room.status !== 'lobby') {
    const rep = must(await c.from('reports').select('payload, week').eq('player_id', playerId).order('week', { ascending: false }).limit(1));
    if (rep.length) session = sessionFromView(rep[0].payload);
    if (session && room.status === 'running') {
      const d = must(await c.from('decisions').select('payload').eq('player_id', playerId).eq('week', room.week).maybeSingle());
      if (d) { decision = d.payload; showDecision(session.G, d.payload); }
    }
  }
  return { player, room, others, session, decision };
}

/* A report payload (server view) -> the same session shape single player uses ({G, log, last}). */
export function sessionFromView(payload) {
  const v = fromSaveJSON(JSON.stringify(payload));
  relinkGame(v.G);
  return { G: v.G, log: v.log, last: v.last, reveal: false, freq: null, over: v.over };
}

/* Show an already-submitted decision on the student's copy of their hotel (same rules as the server). */
function showDecision(G, d) {
  const h = G.hotels[0];
  h.candidates = G.candidates;
  applyDecision(G, h, d);
  delete h.candidates;
  G.started = Array.isArray(d.start) ? [...d.start] : [];
}

export async function submitDecision(player, room, G) {
  const c = await sb();
  const payload = decisionOf(G.hotels[0], G.started || []);
  return must(await c.from('decisions').upsert({ player_id: player.id, room_id: room.id, week: room.week, payload }).select('submitted_at'));
}

/* Ask the server to run the week (works for a student only after the deadline). */
export async function advanceRoom(roomId) {
  const c = await sb();
  const { data, error } = await c.functions.invoke('classroom', { body: { action: 'advance', roomId } });
  if (error) throw await fnError(error);
  return data;
}
export async function startRoom(roomId) {
  const c = await sb();
  const { data, error } = await c.functions.invoke('classroom', { body: { action: 'start', roomId } });
  if (error) throw await fnError(error);
  return data;
}
async function fnError(error) {
  try { const b = await error.context.json(); return new Error(b.error || error.message); } catch { return error; }
}

/* Live updates: calls onChange() when the room, its players, decisions or market table change. */
export async function watchRoom(roomId, onChange) {
  const c = await sb();
  const ch = c.channel('room-' + roomId + '-' + Math.random().toString(36).slice(2));
  ['rooms', 'players', 'decisions', 'room_public'].forEach(table => ch.on('postgres_changes',
    { event: '*', schema: 'public', table, filter: table === 'rooms' ? `id=eq.${roomId}` : `room_id=eq.${roomId}` },
    () => onChange(table)));
  ch.subscribe();
  return () => c.removeChannel(ch);
}

/* ---------- instructors (email + password, allowlisted) ---------- */
export async function instructorSignIn(email, password) {
  const c = await sb();
  const u = await currentUser();
  if (u?.is_anonymous) await c.auth.signOut();          // this browser was a student before
  must(await c.auth.signInWithPassword({ email: email.trim(), password }));
  if (!(await amInstructor())) { await c.auth.signOut(); throw new Error('not-instructor'); }
}
/* Signed-in instructor sets a new password (e.g. replacing the temporary one the admin gave them). */
export async function changePassword(password) {
  const c = await sb();
  must(await c.auth.updateUser({ password }));
}
export async function amInstructor() {
  const c = await sb();
  const u = await currentUser();
  if (!u || u.is_anonymous) return false;
  const rows = must(await c.from('instructors').select('user_id').eq('user_id', u.id));
  return rows.length > 0;
}

export async function listRooms() {
  const c = await sb();
  return must(await c.from('rooms').select('*, players(count)').order('created_at', { ascending: false }));
}
export async function createRoom(f) {
  const c = await sb();
  const seed = 'class-' + Math.floor(Math.random() * 9000 + 1000);
  return must(await c.from('rooms').insert({
    title: f.title || '', city: f.city, start_month: f.startMonth, chaos: f.chaos, allow_fake: f.allowFake,
    bots: f.bots, timer_minutes: f.timer || null, seed,
  }).select().single());
}
export async function setTimer(roomId, minutes) {
  const c = await sb();
  return must(await c.from('rooms').update({ timer_minutes: minutes || null }).eq('id', roomId).select().single());
}
export async function deleteRoom(roomId) {
  const c = await sb();
  must(await c.from('rooms').delete().eq('id', roomId));
}
export async function removePlayer(playerId) {
  const c = await sb();
  must(await c.from('players').delete().eq('id', playerId));
}

/* Instructor dashboard data: room, players, who submitted this week, latest market table. */
export async function roomDetail(roomId) {
  const c = await sb();
  const room = must(await c.from('rooms').select('*').eq('id', roomId).single());
  const players = must(await c.from('players').select('*').eq('room_id', roomId).order('joined_at'));
  const decided = must(await c.from('decisions').select('player_id').eq('room_id', roomId).eq('week', room.week));
  const pub = must(await c.from('room_public').select('payload, week').eq('room_id', roomId).order('week', { ascending: false }).limit(1));
  return { room, players, submitted: new Set(decided.map(d => d.player_id)), pub: pub[0]?.payload || null };
}

/* Every player's decision log (latest report) for the class CSV. */
export async function roomLogs(roomId) {
  const c = await sb();
  const players = must(await c.from('players').select('id, name, hotel_name, owner_name, hotel_key').eq('room_id', roomId));
  const reps = must(await c.from('reports').select('player_id, week, payload').eq('room_id', roomId).order('week', { ascending: false }));
  const latest = {};
  reps.forEach(r => { if (!latest[r.player_id]) latest[r.player_id] = r.payload; });
  return players.map(p => ({ player: p, log: latest[p.id]?.log || [] }));
}
