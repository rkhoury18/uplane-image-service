--The commands I ran un supabase to create the tables
create extension if not exists "pgcrypto";

create table if not exists public.images (
  id uuid primary key default gen_random_uuid(),
  original_filename text not null,
  status text not null check (status in ('processing', 'ready', 'failed')),
  processed_url text,
  storage_path text,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists images_created_at_idx on public.images (created_at desc);