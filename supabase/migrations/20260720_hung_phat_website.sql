create extension if not exists vault;

create table if not exists public.hung_phat_integration_settings (
  key text primary key,
  provider text not null,
  environment text not null default 'production',
  enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hung_phat_playbooks (
  slug text primary key,
  title text not null,
  description text not null default '',
  config jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hung_phat_chat_sessions (
  session_id text primary key,
  source text not null default 'chatbot',
  pathname text not null default '/',
  website text not null default '',
  request_callback boolean not null default false,
  agent_status text not null default 'queued',
  playbook_key text not null default 'freeform-chat',
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hung_phat_chat_messages (
  id bigserial primary key,
  session_id text not null references public.hung_phat_chat_sessions(session_id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system', 'agent')),
  content text not null,
  telegram_chat_id text,
  telegram_message_id bigint,
  created_at timestamptz not null default now()
);

create table if not exists public.hung_phat_quote_leads (
  lead_id text primary key,
  name text not null,
  phone text not null,
  company text not null default '',
  email text not null default '',
  product text not null default '',
  quantity text not null default '',
  area text not null default '',
  usage text not null default '',
  note text not null default '',
  source text not null default 'quote-form',
  pathname text not null default '/',
  website text not null default '',
  status text not null default 'new',
  telegram_chat_id text,
  telegram_message_id bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_last_message_at()
returns trigger
language plpgsql
as $$
begin
  new.last_message_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_hung_phat_integration_settings_updated_at'
  ) then
    create trigger trg_hung_phat_integration_settings_updated_at
    before update on public.hung_phat_integration_settings
    for each row
    execute function public.set_updated_at();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_hung_phat_playbooks_updated_at'
  ) then
    create trigger trg_hung_phat_playbooks_updated_at
    before update on public.hung_phat_playbooks
    for each row
    execute function public.set_updated_at();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_hung_phat_chat_sessions_updated_at'
  ) then
    create trigger trg_hung_phat_chat_sessions_updated_at
    before update on public.hung_phat_chat_sessions
    for each row
    execute function public.set_updated_at();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_hung_phat_chat_sessions_last_message_at'
  ) then
    create trigger trg_hung_phat_chat_sessions_last_message_at
    before update on public.hung_phat_chat_sessions
    for each row
    execute function public.set_last_message_at();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_hung_phat_quote_leads_updated_at'
  ) then
    create trigger trg_hung_phat_quote_leads_updated_at
    before update on public.hung_phat_quote_leads
    for each row
    execute function public.set_updated_at();
  end if;
end;
$$;

alter table public.hung_phat_integration_settings enable row level security;
alter table public.hung_phat_playbooks enable row level security;
alter table public.hung_phat_chat_sessions enable row level security;
alter table public.hung_phat_chat_messages enable row level security;
alter table public.hung_phat_quote_leads enable row level security;

revoke all on table public.hung_phat_integration_settings from anon, authenticated, public;
revoke all on table public.hung_phat_playbooks from anon, authenticated, public;
revoke all on table public.hung_phat_chat_sessions from anon, authenticated, public;
revoke all on table public.hung_phat_chat_messages from anon, authenticated, public;
revoke all on table public.hung_phat_quote_leads from anon, authenticated, public;

grant select, insert, update, delete on table public.hung_phat_integration_settings to service_role;
grant select, insert, update, delete on table public.hung_phat_playbooks to service_role;
grant select, insert, update, delete on table public.hung_phat_chat_sessions to service_role;
grant select, insert, update, delete on table public.hung_phat_chat_messages to service_role;
grant select, insert, update, delete on table public.hung_phat_quote_leads to service_role;
