-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/icyacjskfvupkbegnhxk/sql/new

create table if not exists public.transcriptions (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  filename text not null,
  date timestamptz not null default now(),
  file_size bigint not null default 0,
  result jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.transcriptions enable row level security;

create policy "select_own" on public.transcriptions
  for select using (auth.uid() = user_id);

create policy "insert_own" on public.transcriptions
  for insert with check (auth.uid() = user_id);

create policy "delete_own" on public.transcriptions
  for delete using (auth.uid() = user_id);
