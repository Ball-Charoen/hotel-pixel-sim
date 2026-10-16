-- Instructors can register themselves (P2): sign up with email + password, confirm the email, and the
-- account is approved automatically. The approval is recorded in public.instructors.
--
-- Why a function the signed-in user calls (and not a trigger on auth.users): a trigger runs on every
-- sign-up, including the anonymous student sign-ins; a bug there would stop students from joining.
-- This function is only called from the instructor screen, so a mistake can never affect students.
--
-- Who gets approved: any signed-in, non-anonymous user whose email is confirmed (Supabase "Confirm email"
-- must stay ON in Authentication settings; that is the only check, by the owner's choice of automatic approval).

-- Safe to run twice (SQL Editor first, `supabase db push` later): every statement checks before it changes anything.
alter table public.instructors
  add column if not exists email text,
  add column if not exists display_name text not null default '' check (char_length(display_name) <= 60),
  add column if not exists institution text not null default '' check (char_length(institution) <= 80),
  add column if not exists approval text not null default 'owner' check (approval in ('owner', 'auto')),
  add column if not exists approved_at timestamptz not null default now();

-- Rows added by the owner by hand: keep their real date and fill in the email (rows approved automatically are left alone).
update public.instructors set approved_at = created_at where approval = 'owner';
update public.instructors i set email = u.email from auth.users u where u.id = i.user_id and i.email is null;

create or replace function public.register_instructor(p_name text, p_institution text default '')
  returns public.instructors
  language plpgsql volatile security definer set search_path = '' as $$
declare
  uid uuid := (select auth.uid());
  u auth.users;
  i public.instructors;
begin
  if uid is null then raise exception 'not signed in' using errcode = '28000'; end if;
  if coalesce((select auth.jwt()) ->> 'is_anonymous', 'false') = 'true' then
    raise exception 'anonymous users cannot become instructors' using errcode = '42501';
  end if;

  select * into i from public.instructors where user_id = uid;
  if found then return i; end if;                     -- already approved (second sign-in, other device)

  select * into u from auth.users where id = uid;
  if not found or u.email is null then raise exception 'no email account' using errcode = '42501'; end if;
  if u.email_confirmed_at is null then raise exception 'email not confirmed' using errcode = '42501'; end if;
  if not (char_length(btrim(coalesce(p_name, ''))) between 1 and 60) then
    raise exception 'name required' using errcode = '22023';
  end if;
  if char_length(btrim(coalesce(p_institution, ''))) > 80 then
    raise exception 'institution too long' using errcode = '22023';
  end if;

  insert into public.instructors (user_id, email, display_name, institution, approval)
  values (uid, u.email, btrim(p_name), btrim(coalesce(p_institution, '')), 'auto')
  on conflict (user_id) do nothing
  returning * into i;
  if not found then select * into i from public.instructors where user_id = uid; end if;
  return i;
end $$;
revoke all on function public.register_instructor(text, text) from public, anon;
grant execute on function public.register_instructor(text, text) to authenticated;
