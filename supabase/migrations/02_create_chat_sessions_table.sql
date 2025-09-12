create table chat_sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  messages jsonb not null,
  updated_at timestamptz default now()
);
