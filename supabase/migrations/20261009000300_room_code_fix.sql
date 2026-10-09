-- Fix: creating a room failed with "permission denied for function new_room_code".
-- A column default runs with the inserting user's rights, and 20261009000100 had revoked EXECUTE from them.
-- Move the generator to the private schema (not callable through the API), run it as its owner so it sees every
-- room code (no clash with other instructors' rooms), and let signed-in users execute it as a default.
create function private.new_room_code() returns text
  language plpgsql volatile security definer set search_path = '' as $$
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
revoke all on function private.new_room_code() from public, anon;
grant execute on function private.new_room_code() to authenticated;

alter table public.rooms alter column code set default private.new_room_code();
drop function public.new_room_code();
