-- Tutor conversations for the signed-in student.
-- Apply after 20261007120000_profile_account_fields.sql.
-- Messages belong to the same student as the conversation.

create table public.tutor_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null constraint tutor_conversations_title_not_blank check (
    char_length(btrim(title)) > 0 and char_length(title) <= 120
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tutor_conversations_id_user_key unique (id, user_id)
);

create table public.tutor_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  conversation_id uuid not null,
  role text not null constraint tutor_messages_role_check check (role in ('user', 'assistant')),
  content text not null constraint tutor_messages_content_not_blank check (
    char_length(btrim(content)) > 0 and char_length(content) <= 4000
  ),
  created_at timestamptz not null default now(),
  constraint tutor_messages_conversation_user_fkey
    foreign key (conversation_id, user_id)
    references public.tutor_conversations (id, user_id)
    on delete cascade
);

create index tutor_conversations_user_updated_idx
  on public.tutor_conversations (user_id, updated_at desc);

create index tutor_messages_conversation_created_idx
  on public.tutor_messages (conversation_id, created_at);

create trigger tutor_conversations_set_updated_at
  before update on public.tutor_conversations
  for each row execute function public.set_updated_at();

alter table public.tutor_conversations enable row level security;
alter table public.tutor_messages enable row level security;

alter table public.tutor_conversations force row level security;
alter table public.tutor_messages force row level security;

create policy tutor_conversations_select on public.tutor_conversations
  for select to authenticated using (user_id = (select auth.uid()));
create policy tutor_conversations_insert on public.tutor_conversations
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy tutor_conversations_update on public.tutor_conversations
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy tutor_conversations_delete on public.tutor_conversations
  for delete to authenticated using (user_id = (select auth.uid()));

create policy tutor_messages_select on public.tutor_messages
  for select to authenticated using (user_id = (select auth.uid()));
create policy tutor_messages_insert on public.tutor_messages
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy tutor_messages_update on public.tutor_messages
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy tutor_messages_delete on public.tutor_messages
  for delete to authenticated using (user_id = (select auth.uid()));

revoke all on table public.tutor_conversations from anon, public;
revoke all on table public.tutor_messages from anon, public;

grant select, insert, update, delete on table public.tutor_conversations to authenticated;
grant select, insert, update, delete on table public.tutor_messages to authenticated;
