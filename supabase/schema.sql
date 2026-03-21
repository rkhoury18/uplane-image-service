--The commands I ran in the supabase sql editor to create the tables 
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

-- I then decided to add authentication so I ran the following commands:
ALTER TABLE public.images
ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL;

create index if not exists images_user_id_idx on public.images(user_id);

-- Row Level Security
alter table public.images enable row level security;

create policy "Users can view their own images"
  on public.images for select
  using (auth.uid() = user_id);

create policy "Users can insert their own images"
  on public.images for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own images"
  on public.images for update
  using (auth.uid() = user_id);

create policy "Users can delete their own images"
  on public.images for delete
  using (auth.uid() = user_id);
