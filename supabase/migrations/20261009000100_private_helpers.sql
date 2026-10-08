-- Move the RLS helper functions out of the API-exposed public schema (Supabase advisor 0028/0029):
-- policies can still call them, but nobody can call them directly through /rest/v1/rpc.
create schema if not exists private;
grant usage on schema private to authenticated;

create function private.is_instructor() returns boolean
  language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.instructors where user_id = (select auth.uid()));
$$;
create function private.in_room(r uuid) returns boolean
  language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.players where room_id = r and user_id = (select auth.uid()));
$$;
create function private.owns_room(r uuid) returns boolean
  language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.rooms where id = r and instructor_id = (select auth.uid()));
$$;
create function private.can_submit(p uuid, r uuid, w int) returns boolean
  language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.players pl join public.rooms rm on rm.id = pl.room_id
    where pl.id = p and pl.room_id = r and pl.user_id = (select auth.uid())
      and rm.status = 'running' and rm.week = w
      and (rm.deadline is null or now() <= rm.deadline));
$$;
revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated;

-- Re-point every policy to the private helpers.
drop policy "rooms: instructor manages own" on public.rooms;
create policy "rooms: instructor manages own" on public.rooms
  for all to authenticated
  using (instructor_id = (select auth.uid()))
  with check (instructor_id = (select auth.uid()) and private.is_instructor());
drop policy "rooms: players read their room" on public.rooms;
create policy "rooms: players read their room" on public.rooms
  for select to authenticated using (private.in_room(id));

drop policy "players: classmates and instructor read" on public.players;
create policy "players: classmates and instructor read" on public.players
  for select to authenticated using (private.in_room(room_id) or private.owns_room(room_id));
drop policy "players: instructor removes" on public.players;
create policy "players: instructor removes" on public.players
  for delete to authenticated using (private.owns_room(room_id) and
    (select status from public.rooms where id = room_id) = 'lobby');

drop policy "decisions: instructor reads room" on public.decisions;
create policy "decisions: instructor reads room" on public.decisions
  for select to authenticated using (private.owns_room(room_id));
drop policy "decisions: player submits this week" on public.decisions;
create policy "decisions: player submits this week" on public.decisions
  for insert to authenticated with check (private.can_submit(player_id, room_id, week));
drop policy "decisions: player changes this week" on public.decisions;
create policy "decisions: player changes this week" on public.decisions
  for update to authenticated
  using (private.can_submit(player_id, room_id, week))
  with check (private.can_submit(player_id, room_id, week));

drop policy "reports: instructor reads room" on public.reports;
create policy "reports: instructor reads room" on public.reports
  for select to authenticated using (private.owns_room(room_id));

drop policy "room_public: players and instructor read" on public.room_public;
create policy "room_public: players and instructor read" on public.room_public
  for select to authenticated using (private.in_room(room_id) or private.owns_room(room_id));

drop function public.is_instructor();
drop function public.in_room(uuid);
drop function public.owns_room(uuid);
drop function public.can_submit(uuid, uuid, int);

-- The room-code generator is only used as a column default.
revoke all on function public.new_room_code() from public, anon, authenticated;
