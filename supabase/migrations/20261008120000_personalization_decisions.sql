-- Personalization apply and dismiss decisions for the signed-in student.
-- Apply after 20261007213000_tutor_conversations.sql.
-- Analysis itself is computed from existing study rows. This table only stores
-- explicit user decisions so recommendations are not silently applied twice.

create table public.personalization_decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  fingerprint text not null constraint personalization_decisions_fingerprint_not_blank check (
    char_length(btrim(fingerprint)) > 0 and char_length(fingerprint) <= 160
  ),
  status text not null constraint personalization_decisions_status_check check (
    status in ('applied', 'dismissed')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint personalization_decisions_user_fingerprint_key unique (user_id, fingerprint)
);

create index personalization_decisions_user_updated_idx
  on public.personalization_decisions (user_id, updated_at desc);

create trigger personalization_decisions_set_updated_at
  before update on public.personalization_decisions
  for each row execute function public.set_updated_at();

alter table public.personalization_decisions enable row level security;
alter table public.personalization_decisions force row level security;

create policy personalization_decisions_select on public.personalization_decisions
  for select to authenticated using (user_id = (select auth.uid()));
create policy personalization_decisions_insert on public.personalization_decisions
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy personalization_decisions_update on public.personalization_decisions
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy personalization_decisions_delete on public.personalization_decisions
  for delete to authenticated using (user_id = (select auth.uid()));

revoke all on table public.personalization_decisions from anon, public;
grant select, insert, update, delete on table public.personalization_decisions to authenticated;
