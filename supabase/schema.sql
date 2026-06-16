-- ============================================================
-- Legal Contract Review App — Supabase schema
-- Run in: Supabase Dashboard → SQL Editor
-- Custom auth (no Supabase Auth); ownership enforced at API layer.
-- ============================================================

create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- ---------- updated_at trigger ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- users ----------
create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  password_hash text not null,                 -- bcryptjs, 10 rounds
  created_at    timestamptz not null default now()
);

create index if not exists idx_users_email on public.users (lower(email));

-- ---------- sessions ----------
create table if not exists public.sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users (id) on delete cascade,
  title      text not null default 'New session',
  status     text not null default 'idle'
             check (status in ('idle', 'processing', 'completed', 'error')),
  pinned     boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sessions_user_id    on public.sessions (user_id);
create index if not exists idx_sessions_updated_at on public.sessions (user_id, updated_at desc);
create index if not exists idx_sessions_pinned     on public.sessions (user_id, pinned);

drop trigger if exists trg_sessions_updated_at on public.sessions;
create trigger trg_sessions_updated_at
  before update on public.sessions
  for each row execute function public.set_updated_at();

-- ---------- messages ----------
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  role       text not null check (role in ('user', 'assistant')),
  content    text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_session_created
  on public.messages (session_id, created_at);

create or replace function public.touch_session_on_message()
returns trigger
language plpgsql
as $$
begin
  update public.sessions set updated_at = now() where id = new.session_id;
  return new;
end;
$$;

drop trigger if exists trg_messages_touch_session on public.messages;
create trigger trg_messages_touch_session
  after insert on public.messages
  for each row execute function public.touch_session_on_message();

-- ---------- feedback ----------
create table if not exists public.feedback (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users (id)    on delete cascade,
  session_id uuid not null references public.sessions (id) on delete cascade,
  message_id uuid not null references public.messages (id) on delete cascade,
  rating     integer not null check (rating between 1 and 5),
  comment    text,
  created_at timestamptz not null default now(),
  unique (user_id, message_id)
);

create index if not exists idx_feedback_session on public.feedback (session_id);
create index if not exists idx_feedback_user    on public.feedback (user_id);
