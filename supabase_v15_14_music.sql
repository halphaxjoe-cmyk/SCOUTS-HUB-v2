create table if not exists public.music_tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text default 'Scout Music',
  audio_url text not null,
  icon text default '🎵',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.music_tracks enable row level security;
drop policy if exists "authenticated can read active music" on public.music_tracks;
create policy "authenticated can read active music" on public.music_tracks for select to authenticated using (active = true or exists (select 1 from public.members m where m.user_id = auth.uid() and m.role in ('admin','leader')));
drop policy if exists "leaders manage music" on public.music_tracks;
create policy "leaders manage music" on public.music_tracks for all to authenticated using (exists (select 1 from public.members m where m.user_id = auth.uid() and m.role in ('admin','leader'))) with check (exists (select 1 from public.members m where m.user_id = auth.uid() and m.role in ('admin','leader')));
create index if not exists music_tracks_active_sort_idx on public.music_tracks(active, sort_order, created_at);
