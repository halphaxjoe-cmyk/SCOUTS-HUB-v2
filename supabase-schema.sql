-- SCOUT HUB ONLINE — Supabase schema (final)
-- Safe frontend key only. Never put service_role/secret keys in this app.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default 'Scout', last_name text not null default 'Member',
  scout_name text default '', member_id text not null unique, unit text default '', patrol text default '',
  role text not null default 'member' check (role in ('member','leader','admin')),
  created_at timestamptz not null default now()
);
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete set null,
  first_name text not null, last_name text not null, scout_name text, member_code text unique,
  unit text, patrol text, created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  role text not null default 'member', photo_url text
);
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(), title text not null, activity_date date not null,
  activity_time time, location text, description text, created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(), title text not null, description text,
  due_date date, assigned_to uuid references public.members(id) on delete set null,
  status text not null default 'todo', priority text not null default 'normal',
  completed boolean not null default false, created_at timestamptz not null default now()
);
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(), member_id uuid references public.members(id) on delete cascade,
  title text not null, description text, icon text default '🏅', awarded_at date not null default current_date,
  created_at timestamptz not null default now()
);
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(), member_id uuid references public.members(id) on delete cascade,
  skill_name text not null, level text default 'débutant' check(level in ('débutant','intermédiaire','avancé')),
  achieved_at date, created_at timestamptz not null default now(), progress integer not null default 0 check(progress between 0 and 100)
);
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(), title text not null, body text not null,
  pinned boolean not null default false, created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(), sender_id uuid references public.members(id) on delete cascade,
  message_type text not null check(message_type in ('text','image','voice','audio')),
  content text, file_path text, duration_sec numeric, created_at timestamptz not null default now(),
  sender_member_id uuid references public.members(id) on delete cascade,
  receiver_member_id uuid references public.members(id) on delete cascade,
  sender_user_id uuid references auth.users(id) on delete cascade
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public
as $$
declare mid text;
begin
  mid := coalesce(nullif(new.raw_user_meta_data->>'member_id',''),'SCOUT-'||substr(new.id::text,1,8));
  insert into public.profiles(id,first_name,last_name,scout_name,member_id,unit,patrol)
  values(new.id,coalesce(nullif(new.raw_user_meta_data->>'first_name',''),'Scout'),coalesce(nullif(new.raw_user_meta_data->>'last_name',''),'Member'),coalesce(new.raw_user_meta_data->>'scout_name',''),mid,coalesce(new.raw_user_meta_data->>'unit',''),coalesce(new.raw_user_meta_data->>'patrol',''))
  on conflict(id) do nothing;
  insert into public.members(user_id,first_name,last_name,scout_name,member_code,unit,patrol,role,created_by)
  select id,first_name,last_name,scout_name,member_id,unit,patrol,role,id from public.profiles where id=new.id
  on conflict(member_code) do update set user_id=excluded.user_id;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
revoke execute on function public.handle_new_user() from public,anon,authenticated;

alter table public.profiles enable row level security;
alter table public.members enable row level security;
alter table public.activities enable row level security;
alter table public.tasks enable row level security;
alter table public.badges enable row level security;
alter table public.skills enable row level security;
alter table public.announcements enable row level security;
alter table public.messages enable row level security;

drop policy if exists profiles_select_auth on public.profiles;
create policy profiles_select_auth on public.profiles for select to authenticated using (true);
drop policy if exists profiles_update_self_or_admin on public.profiles;
create policy profiles_update_self_or_admin on public.profiles for update to authenticated using(id=auth.uid() or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')) with check(id=auth.uid() or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));

drop policy if exists members_select_authenticated on public.members;
create policy members_select_authenticated on public.members for select to authenticated using(true);
drop policy if exists members_insert_authenticated on public.members;
create policy members_insert_authenticated on public.members for insert to authenticated with check(created_by=auth.uid() or user_id=auth.uid());
drop policy if exists members_update_self_or_admin on public.members;
create policy members_update_self_or_admin on public.members for update to authenticated using(user_id=auth.uid() or created_by=auth.uid() or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')) with check(user_id=auth.uid() or created_by=auth.uid() or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
drop policy if exists members_delete_creator on public.members;
create policy members_delete_creator on public.members for delete to authenticated using(created_by=auth.uid() or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));

do $$ declare t text; begin foreach t in array array['activities','tasks','badges','skills','announcements'] loop
  execute format('drop policy if exists %I on public.%I',t||'_select_authenticated',t);
  execute format('create policy %I on public.%I for select to authenticated using(true)',t||'_select_authenticated',t);
  execute format('drop policy if exists %I on public.%I',t||'_insert_authenticated',t);
  execute format('create policy %I on public.%I for insert to authenticated with check(true)',t||'_insert_authenticated',t);
  execute format('drop policy if exists %I on public.%I',t||'_update_authenticated',t);
  execute format('create policy %I on public.%I for update to authenticated using(true) with check(true)',t||'_update_authenticated',t);
  execute format('drop policy if exists %I on public.%I',t||'_delete_authenticated',t);
  execute format('create policy %I on public.%I for delete to authenticated using(true)',t||'_delete_authenticated',t);
end loop; end $$;

drop policy if exists messages_select_participants_final on public.messages;
create policy messages_select_participants_final on public.messages for select to authenticated using(sender_user_id=auth.uid() or exists(select 1 from public.members m where m.id=messages.sender_member_id and m.user_id=auth.uid()) or exists(select 1 from public.members m where m.id=messages.receiver_member_id and m.user_id=auth.uid()));
drop policy if exists messages_insert_sender_final on public.messages;
create policy messages_insert_sender_final on public.messages for insert to authenticated with check(sender_user_id=auth.uid() and sender_member_id is not null and exists(select 1 from public.members m where m.id=messages.sender_member_id and m.user_id=auth.uid()));
drop policy if exists messages_update_sender_final on public.messages;
create policy messages_update_sender_final on public.messages for update to authenticated using(sender_user_id=auth.uid()) with check(sender_user_id=auth.uid());
drop policy if exists messages_delete_sender_final on public.messages;
create policy messages_delete_sender_final on public.messages for delete to authenticated using(sender_user_id=auth.uid());

insert into storage.buckets(id,name,public) values('scout-media','scout-media',false) on conflict(id) do nothing;
drop policy if exists scout_media_insert_auth on storage.objects;
create policy scout_media_insert_auth on storage.objects for insert to authenticated with check(bucket_id='scout-media' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists scout_media_select_auth on storage.objects;
create policy scout_media_select_auth on storage.objects for select to authenticated using(bucket_id='scout-media');
drop policy if exists scout_media_update_auth on storage.objects;
create policy scout_media_update_auth on storage.objects for update to authenticated using(bucket_id='scout-media' and owner_id=auth.uid()::text) with check(bucket_id='scout-media' and owner_id=auth.uid()::text);
drop policy if exists scout_media_delete_owner on storage.objects;
create policy scout_media_delete_owner on storage.objects for delete to authenticated using(bucket_id='scout-media' and owner_id=auth.uid()::text);

-- After creating the first account, make it admin if needed:
-- update public.profiles set role='admin' where id='AUTH_USER_UUID';
-- update public.members set role='admin' where user_id='AUTH_USER_UUID';


-- V14 COMPLETE: additional Scout modules.
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  date date not null,
  present boolean not null default false,
  created_at timestamptz not null default now(),
  unique(member_id,date)
);
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists public.patrols (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  leader text default '',
  created_at timestamptz not null default now()
);
alter table public.attendance enable row level security;
alter table public.notes enable row level security;
alter table public.patrols enable row level security;

drop policy if exists attendance_authenticated on public.attendance;
create policy attendance_authenticated on public.attendance for all to authenticated using(true) with check(true);
drop policy if exists notes_authenticated on public.notes;
create policy notes_authenticated on public.notes for all to authenticated using(true) with check(true);
drop policy if exists patrols_authenticated on public.patrols;
create policy patrols_authenticated on public.patrols for all to authenticated using(true) with check(true);

-- Newer Supabase projects may not auto-expose new public tables through the Data API.
grant select, insert, update, delete on public.attendance to authenticated;
grant select, insert, update, delete on public.notes to authenticated;
grant select, insert, update, delete on public.patrols to authenticated;
-- SCOUT HUB V15 — REAL TASK -> BADGE AUTOMATION
-- Run this migration in the existing Supabase project AFTER the existing V14 schema.

alter table public.badges
  add column if not exists source_task_id uuid references public.tasks(id) on delete set null,
  add column if not exists auto_awarded boolean not null default false;

create unique index if not exists badges_member_source_task_uidx
  on public.badges(member_id, source_task_id)
  where source_task_id is not null;

create index if not exists badges_source_task_idx on public.badges(source_task_id);

create or replace function public.award_task_badge_v15()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  badge_icon text := '🏅';
  badge_title text := 'Misyon Akonpli';
  task_text text := lower(coalesce(new.title,'') || ' ' || coalesce(new.description,''));
begin
  if new.completed = true
     and new.assigned_to is not null
     and (tg_op = 'INSERT' or old.completed is distinct from true or old.assigned_to is distinct from new.assigned_to)
  then
    if task_text ~ '(morse|kòd|code|signal)' then badge_icon := '📡'; badge_title := 'Mèt Morse';
    elsif task_text ~ '(camp|kan|camping|abri)' then badge_icon := '⛺'; badge_title := 'Mèt Camping';
    elsif task_text ~ '(orient|boussol|kat|direksyon)' then badge_icon := '🧭'; badge_title := 'Eksploratè Orantasyon';
    elsif task_text ~ '(nœud|noeud|knot|mare)' then badge_icon := '🪢'; badge_title := 'Mèt Nœuds';
    elsif task_text ~ '(nature|plant|anviwònman|environment)' then badge_icon := '🌿'; badge_title := 'Gadyen Lanati';
    elsif task_text ~ '(premye swen|first aid|swen)' then badge_icon := '🩹'; badge_title := 'Scout Sekou';
    elsif task_text ~ '(leadership|lidè|dirije)' then badge_icon := '🦅'; badge_title := 'Lidè Scout';
    elsif task_text ~ '(ekip|team|kolabor)' then badge_icon := '🤝'; badge_title := 'Ekip Scout';
    elsif task_text ~ '(jeu|game|jwèt)' then badge_icon := '🎮'; badge_title := 'Mèt Jwèt Scout';
    elsif task_text ~ '(lesson|leson|quiz|aprann)' then badge_icon := '📚'; badge_title := 'Apranti Scout';
    elsif task_text ~ '(sport|marche|kouri|exercise)' then badge_icon := '🏃'; badge_title := 'Scout Aktif';
    elsif task_text ~ '(feu|fire|boukan)' then badge_icon := '🔥'; badge_title := 'Mèt Feu de Camp';
    elsif task_text ~ '(service|ede|help|volont)' then badge_icon := '❤️'; badge_title := 'Scout Sèvis';
    end if;

    insert into public.badges(member_id,title,description,icon,awarded_at,source_task_id,auto_awarded)
    values(new.assigned_to,badge_title,'Badj otomatik pou tâche: ' || new.title,badge_icon,current_date,new.id,true)
    on conflict (member_id, source_task_id) where source_task_id is not null do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_award_task_badge_v15 on public.tasks;
create trigger trg_award_task_badge_v15
after insert or update of completed, assigned_to, title, description on public.tasks
for each row execute function public.award_task_badge_v15();

revoke execute on function public.award_task_badge_v15() from public, anon, authenticated;

grant select, insert, update, delete on public.badges to authenticated;
grant select, insert, update on public.tasks to authenticated;

-- Keep RLS enabled. Automatic badges are created by the trigger; manual badge management is restricted to leaders/admins.
alter table public.badges enable row level security;
drop policy if exists badges_select_v15 on public.badges;
create policy badges_select_v15 on public.badges for select to authenticated using (true);
drop policy if exists badges_insert_v15 on public.badges;
create policy badges_insert_v15 on public.badges for insert to authenticated
with check (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','leader')));
drop policy if exists badges_update_v15 on public.badges;
create policy badges_update_v15 on public.badges for update to authenticated
using (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','leader')))
with check (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','leader')));
drop policy if exists badges_delete_v15 on public.badges;
create policy badges_delete_v15 on public.badges for delete to authenticated
using (exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','leader')));

-- Backfill badges for tasks already completed before V15, without duplicates.
insert into public.badges(member_id,title,description,icon,awarded_at,source_task_id,auto_awarded)
select
  t.assigned_to,
  case
    when lower(coalesce(t.title,'') || ' ' || coalesce(t.description,'')) ~ '(morse|kòd|code|signal)' then 'Mèt Morse'
    when lower(coalesce(t.title,'') || ' ' || coalesce(t.description,'')) ~ '(camp|kan|camping|abri)' then 'Mèt Camping'
    when lower(coalesce(t.title,'') || ' ' || coalesce(t.description,'')) ~ '(orient|boussol|kat|direksyon)' then 'Eksploratè Orantasyon'
    when lower(coalesce(t.title,'') || ' ' || coalesce(t.description,'')) ~ '(nœud|noeud|knot|mare)' then 'Mèt Nœuds'
    when lower(coalesce(t.title,'') || ' ' || coalesce(t.description,'')) ~ '(nature|plant|anviwònman|environment)' then 'Gadyen Lanati'
    when lower(coalesce(t.title,'') || ' ' || coalesce(t.description,'')) ~ '(premye swen|first aid|swen)' then 'Scout Sekou'
    when lower(coalesce(t.title,'') || ' ' || coalesce(t.description,'')) ~ '(leadership|lidè|dirije)' then 'Lidè Scout'
    when lower(coalesce(t.title,'') || ' ' || coalesce(t.description,'')) ~ '(ekip|team|kolabor)' then 'Ekip Scout'
    when lower(coalesce(t.title,'') || ' ' || coalesce(t.description,'')) ~ '(jeu|game|jwèt)' then 'Mèt Jwèt Scout'
    when lower(coalesce(t.title,'') || ' ' || coalesce(t.description,'')) ~ '(lesson|leson|quiz|aprann)' then 'Apranti Scout'
    when lower(coalesce(t.title,'') || ' ' || coalesce(t.description,'')) ~ '(sport|marche|kouri|exercise)' then 'Scout Aktif'
    when lower(coalesce(t.title,'') || ' ' || coalesce(t.description,'')) ~ '(feu|fire|boukan)' then 'Mèt Feu de Camp'
    when lower(coalesce(t.title,'') || ' ' || coalesce(t.description,'')) ~ '(service|ede|help|volont)' then 'Scout Sèvis'
    else 'Misyon Akonpli'
  end,
  'Badj otomatik pou tâche: ' || t.title,
  case
    when lower(coalesce(t.title,'') || ' ' || coalesce(t.description,'')) ~ '(morse|kòd|code|signal)' then '📡'
    when lower(coalesce(t.title,'') || ' ' || coalesce(t.description,'')) ~ '(camp|kan|camping|abri)' then '⛺'
    when lower(coalesce(t.title,'') || ' ' || coalesce(t.description,'')) ~ '(orient|boussol|kat|direksyon)' then '🧭'
    when lower(coalesce(t.title,'') || ' ' || coalesce(t.description,'')) ~ '(nœud|noeud|knot|mare)' then '🪢'
    when lower(coalesce(t.title,'') || ' ' || coalesce(t.description,'')) ~ '(nature|plant|anviwònman|environment)' then '🌿'
    when lower(coalesce(t.title,'') || ' ' || coalesce(t.description,'')) ~ '(premye swen|first aid|swen)' then '🩹'
    when lower(coalesce(t.title,'') || ' ' || coalesce(t.description,'')) ~ '(leadership|lidè|dirije)' then '🦅'
    when lower(coalesce(t.title,'') || ' ' || coalesce(t.description,'')) ~ '(ekip|team|kolabor)' then '🤝'
    when lower(coalesce(t.title,'') || ' ' || coalesce(t.description,'')) ~ '(jeu|game|jwèt)' then '🎮'
    when lower(coalesce(t.title,'') || ' ' || coalesce(t.description,'')) ~ '(lesson|leson|quiz|aprann)' then '📚'
    when lower(coalesce(t.title,'') || ' ' || coalesce(t.description,'')) ~ '(sport|marche|kouri|exercise)' then '🏃'
    when lower(coalesce(t.title,'') || ' ' || coalesce(t.description,'')) ~ '(feu|fire|boukan)' then '🔥'
    when lower(coalesce(t.title,'') || ' ' || coalesce(t.description,'')) ~ '(service|ede|help|volont)' then '❤️'
    else '🏅'
  end,
  current_date,t.id,true
from public.tasks t
where t.completed = true and t.assigned_to is not null
on conflict (member_id, source_task_id) where source_task_id is not null do nothing;
