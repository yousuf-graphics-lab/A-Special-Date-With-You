-- ============================================================================
--  For Samee, My Love — database schema
--  Runs unchanged on Supabase Postgres and on local PGlite.
--  All data is private: RLS is enabled with no public policies, and every
--  request is authorised server-side by the Next.js app using a privileged
--  connection. No table is readable with a publishable/anon key.
-- ============================================================================

create table if not exists admin_users (
  id              uuid primary key default gen_random_uuid(),
  username        text not null unique,
  password_hash   text not null,
  display_name    text not null default 'Yousuf',
  failed_attempts integer not null default 0,
  locked_until    timestamptz,
  last_login_at   timestamptz,
  created_at      timestamptz not null default now()
);

create table if not exists admin_sessions (
  id           uuid primary key default gen_random_uuid(),
  admin_id     uuid not null references admin_users(id) on delete cascade,
  token_hash   text not null unique,
  user_agent   text,
  created_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at   timestamptz not null,
  revoked_at   timestamptz
);
create index if not exists admin_sessions_expires_idx on admin_sessions (expires_at);

create table if not exists login_attempts (
  id         bigserial primary key,
  identifier text not null,
  ip         text,
  success    boolean not null,
  created_at timestamptz not null default now()
);
create index if not exists login_attempts_lookup_idx
  on login_attempts (identifier, created_at desc);

-- One row per person who opens the experience. The browser holds an opaque
-- random token, never any personal data.
create table if not exists visitors (
  id               uuid primary key default gen_random_uuid(),
  token            text not null unique,
  visits           integer not null default 1,
  first_seen_at    timestamptz not null default now(),
  last_seen_at     timestamptz not null default now(),
  unlocked_at      timestamptz,
  letter_opened_at timestamptz,
  accepted_at      timestamptz,
  thinking_at      timestamptz,
  submitted_at     timestamptz
);

create table if not exists proposal_events (
  id         bigserial primary key,
  visitor_id uuid references visitors(id) on delete set null,
  type       text not null check (type in (
               'visit', 'unlock', 'unlock_failed', 'letter_opened',
               'accepted', 'thinking', 'submitted', 'updated',
               'bouquet_opened', 'final_opened'
             )),
  metadata   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists proposal_events_created_idx
  on proposal_events (created_at desc);
create index if not exists proposal_events_type_idx
  on proposal_events (type, created_at desc);

-- The date plan. A visitor has at most one current response; every change
-- stores the previous snapshot in proposal_response_history instead of
-- creating confusing duplicates.
create table if not exists proposal_responses (
  id              uuid primary key default gen_random_uuid(),
  visitor_id      uuid not null references visitors(id) on delete cascade,
  version         integer not null default 1,
  is_current      boolean not null default true,
  selected_date   date not null,
  selected_time   text not null,
  time_is_custom  boolean not null default false,
  location_label  text,
  location_custom text,
  activities      jsonb not null default '[]'::jsonb,
  activity_custom text,
  message         text,
  time_zone       text not null default 'Asia/Dhaka',
  status          text not null default 'new'
                  check (status in ('new', 'reviewed', 'planning', 'confirmed', 'completed')),
  admin_notes     text,
  reviewed_at     timestamptz,
  submitted_at    timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create unique index if not exists proposal_responses_current_uniq
  on proposal_responses (visitor_id) where is_current;
create index if not exists proposal_responses_submitted_idx
  on proposal_responses (submitted_at desc);

create table if not exists proposal_response_history (
  id          bigserial primary key,
  response_id uuid not null references proposal_responses(id) on delete cascade,
  version     integer not null,
  snapshot    jsonb not null,
  replaced_at timestamptz not null default now()
);
create index if not exists response_history_response_idx
  on proposal_response_history (response_id, version desc);

-- Server-side activity the owner may want to see next to a response.
create table if not exists admin_notes_log (
  id         bigserial primary key,
  response_id uuid references proposal_responses(id) on delete cascade,
  actor      text not null default 'yousuf',
  action     text not null,
  detail     jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Lock everything down. With RLS on and no policies, anon/authenticated keys
-- can read nothing at all; only the server's privileged connection is allowed.
-- ---------------------------------------------------------------------------
alter table admin_users              enable row level security;
alter table admin_sessions           enable row level security;
alter table login_attempts           enable row level security;
alter table visitors                 enable row level security;
alter table proposal_events          enable row level security;
alter table proposal_responses       enable row level security;
alter table proposal_response_history enable row level security;
alter table admin_notes_log          enable row level security;
