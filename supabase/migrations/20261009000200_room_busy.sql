-- Lock while the server computes a week, so a double click or two students after the deadline
-- cannot run the same week twice. Set and cleared only by the server function (service role).
alter table public.rooms add column busy_since timestamptz;
