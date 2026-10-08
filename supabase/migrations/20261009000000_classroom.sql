-- P2 classroom: rooms, players, weekly decisions and reports.
-- Security model (docs/spec-summary.md §13 P2):
--   * Instructors are an allowlist (public.instructors), added by the owner with one SQL line in the dashboard.
--   * Students sign in anonymously (no account) and join a room by code through join_room().
--   * The full game state (RNG, every hotel's private data) lives in room_state, readable by NO client:
--     only the server function (service role) reads it, computes the week and writes per-player reports.
--   * A student reads only their own decisions/reports plus the room's public market table.

-- ---------- instructors ----------
create table public.instructors (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.instructors enable row level security;
create policy "instructors: read own row" on public.instructors
  for select to authenticated using (user_id = (select auth.uid()));

create function public.is_instructor() returns boolean
  language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.instructors where user_id = (select auth.uid()));
$$;

-- ---------- rooms ----------
-- Room codes: 6 characters without look-alikes (no 0/O, 1/I/L).
create function public.new_room_code() returns text
  language plpgsql volatile set search_path = '' as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  c text;
begin
  loop
    c := '';
    for i in 1..6 loop
      c := c || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.rooms where code = c);
  end loop;
  return c;
end $$;

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique default public.new_room_code(),
  instructor_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null default '' check (char_length(title) <= 60),
  city text not null check (city in ('bkk','kkn','hkt','pty','pbi','rbr','rng','cnx','pnb')),
  start_month int not null check (start_month between 0 and 11),
  chaos text not null check (chaos in ('low','mid','high')),
  allow_fake boolean not null default true,
  seed text not null check (char_length(seed) between 1 and 24),
  bots int not null default 0 check (bots between 0 and 3),
  max_players int not null default 60 check (max_players between 1 and 200),
  timer_minutes int check (timer_minutes between 1 and 120),
  status text not null default 'lobby' check (status in ('lobby','running','finished')),
  week int not null default 0 check (week between 0 and 12),
  deadline timestamptz,
  created_at timestamptz not null default now()
);
alter table public.rooms enable row level security;
-- Status, week and deadline change only on the server together with the game state; instructors may edit these columns:
revoke update on public.rooms from authenticated, anon;
grant update (title, timer_minutes) on public.rooms to authenticated;

-- ---------- players ----------
create table public.players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  hotel_key text not null,                       -- id inside the game: p1, p2, ...
  name text not null check (char_length(btrim(name)) between 1 and 30),
  hotel_name text not null check (char_length(btrim(hotel_name)) between 1 and 30),
  owner_name text not null default '' check (char_length(owner_name) <= 30),
  joined_at timestamptz not null default now(),
  unique (room_id, user_id),
  unique (room_id, hotel_key)
);
alter table public.players enable row level security;

create function public.in_room(r uuid) returns boolean
  language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.players where room_id = r and user_id = (select auth.uid()));
$$;
create function public.owns_room(r uuid) returns boolean
  language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.rooms where id = r and instructor_id = (select auth.uid()));
$$;

create policy "rooms: instructor manages own" on public.rooms
  for all to authenticated
  using (instructor_id = (select auth.uid()))
  with check (instructor_id = (select auth.uid()) and public.is_instructor());
create policy "rooms: players read their room" on public.rooms
  for select to authenticated using (public.in_room(id));

create policy "players: classmates and instructor read" on public.players
  for select to authenticated using (public.in_room(room_id) or public.owns_room(room_id));
create policy "players: instructor removes" on public.players
  for delete to authenticated using (public.owns_room(room_id) and
    (select status from public.rooms where id = room_id) = 'lobby');

-- Students join by code (they cannot read rooms before joining). Only while the room is in the lobby.
create function public.join_room(p_code text, p_name text, p_hotel text, p_owner text default '')
  returns public.players
  language plpgsql volatile security definer set search_path = '' as $$
declare
  r public.rooms;
  p public.players;
  n int;
begin
  if (select auth.uid()) is null then raise exception 'not signed in'; end if;
  select * into r from public.rooms where code = upper(btrim(p_code));
  if not found then raise exception 'room not found' using errcode = 'P0002'; end if;
  select * into p from public.players where room_id = r.id and user_id = (select auth.uid());
  if found then return p; end if;                  -- same device again: keep the same hotel
  if r.status <> 'lobby' then raise exception 'room already started' using errcode = 'P0001'; end if;
  perform pg_advisory_xact_lock(hashtext(r.id::text));   -- one join at a time per room: hotel numbers never clash
  select count(*) into n from public.players where room_id = r.id;
  if n >= r.max_players then raise exception 'room is full' using errcode = 'P0001'; end if;
  insert into public.players (room_id, user_id, hotel_key, name, hotel_name, owner_name)
  values (r.id, (select auth.uid()),
          'p' || (coalesce((select max(substr(hotel_key, 2)::int) from public.players where room_id = r.id), 0) + 1),
          btrim(p_name), btrim(p_hotel), btrim(coalesce(p_owner, '')))
  returning * into p;
  return p;
end $$;
revoke all on function public.join_room(text, text, text, text) from public, anon;
grant execute on function public.join_room(text, text, text, text) to authenticated;

-- ---------- decisions (one row per player per week) ----------
create table public.decisions (
  player_id uuid not null references public.players (id) on delete cascade,
  room_id uuid not null references public.rooms (id) on delete cascade,
  week int not null check (week between 0 and 11),
  payload jsonb not null,
  submitted_at timestamptz not null default now(),
  primary key (player_id, week)
);
alter table public.decisions enable row level security;

create function public.can_submit(p uuid, r uuid, w int) returns boolean
  language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.players pl join public.rooms rm on rm.id = pl.room_id
    where pl.id = p and pl.room_id = r and pl.user_id = (select auth.uid())
      and rm.status = 'running' and rm.week = w
      and (rm.deadline is null or now() <= rm.deadline));
$$;

create policy "decisions: player reads own" on public.decisions
  for select to authenticated
  using (exists (select 1 from public.players pl where pl.id = player_id and pl.user_id = (select auth.uid())));
create policy "decisions: instructor reads room" on public.decisions
  for select to authenticated using (public.owns_room(room_id));
create policy "decisions: player submits this week" on public.decisions
  for insert to authenticated with check (public.can_submit(player_id, room_id, week));
create policy "decisions: player changes this week" on public.decisions
  for update to authenticated
  using (public.can_submit(player_id, room_id, week))
  with check (public.can_submit(player_id, room_id, week));

-- ---------- server-only game state ----------
create table public.room_state (
  room_id uuid primary key references public.rooms (id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.room_state enable row level security;   -- no policies: clients can never read it

-- ---------- results ----------
-- Private weekly report of one player (their full numbers).
create table public.reports (
  player_id uuid not null references public.players (id) on delete cascade,
  room_id uuid not null references public.rooms (id) on delete cascade,
  week int not null check (week between 0 and 12),          -- 0 = starting state before week 1
  payload jsonb not null,
  primary key (player_id, week)
);
alter table public.reports enable row level security;
create policy "reports: player reads own" on public.reports
  for select to authenticated
  using (exists (select 1 from public.players pl where pl.id = player_id and pl.user_id = (select auth.uid())));
create policy "reports: instructor reads room" on public.reports
  for select to authenticated using (public.owns_room(room_id));

-- Public market table of the week (names, prices, Occ, ADR, RevPAR, stars) and the final ranking.
create table public.room_public (
  room_id uuid not null references public.rooms (id) on delete cascade,
  week int not null check (week between 0 and 12),
  payload jsonb not null,
  primary key (room_id, week)
);
alter table public.room_public enable row level security;
create policy "room_public: players and instructor read" on public.room_public
  for select to authenticated using (public.in_room(room_id) or public.owns_room(room_id));

-- ---------- live updates (lobby list, week changes, who has submitted) ----------
alter publication supabase_realtime add table public.rooms, public.players, public.decisions, public.room_public;
