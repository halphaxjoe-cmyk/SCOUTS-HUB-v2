
create table if not exists public.lesson_catalog (
 id uuid primary key default gen_random_uuid(),
 slug text unique not null,
 title text not null,
 content text not null,
 created_at timestamptz not null default now()
);
create table if not exists public.lesson_quizzes (
 id uuid primary key default gen_random_uuid(),
 lesson_id uuid not null references public.lesson_catalog(id) on delete cascade,
 question text not null,
 options jsonb not null,
 correct_index integer not null check(correct_index>=0),
 created_at timestamptz not null default now()
);
create table if not exists public.scout_progress (
 id uuid primary key default gen_random_uuid(),
 member_id uuid references public.members(id) on delete cascade,
 lesson_id uuid references public.lesson_catalog(id) on delete cascade,
 score integer not null default 0,
 total integer not null default 0,
 completed boolean not null default false,
 updated_at timestamptz not null default now(),
 unique(member_id,lesson_id)
);
create table if not exists public.task_badges (
 id uuid primary key default gen_random_uuid(),
 task_id uuid not null references public.tasks(id) on delete cascade,
 badge_id uuid not null references public.badges(id) on delete cascade,
 unique(task_id,badge_id)
);
create table if not exists public.member_badges (
 id uuid primary key default gen_random_uuid(),
 member_id uuid not null references public.members(id) on delete cascade,
 badge_id uuid not null references public.badges(id) on delete cascade,
 awarded_at timestamptz not null default now(),
 source_task_id uuid references public.tasks(id) on delete set null,
 unique(member_id,badge_id)
);
create table if not exists public.skill_progress (
 id uuid primary key default gen_random_uuid(),
 member_id uuid not null references public.members(id) on delete cascade,
 skill_id uuid not null references public.skills(id) on delete cascade,
 progress integer not null default 0 check(progress between 0 and 100),
 updated_at timestamptz not null default now(),
 unique(member_id,skill_id)
);
create table if not exists public.announcement_recipients (
 id uuid primary key default gen_random_uuid(),
 announcement_id uuid not null references public.announcements(id) on delete cascade,
 member_id uuid not null references public.members(id) on delete cascade,
 delivered_at timestamptz not null default now(),
 read_at timestamptz,
 unique(announcement_id,member_id)
);
create table if not exists public.calendar_items (
 id uuid primary key default gen_random_uuid(),
 title text not null,
 starts_at timestamptz not null,
 ends_at timestamptz,
 location text,
 created_at timestamptz not null default now()
);
alter table public.lesson_catalog enable row level security;
alter table public.lesson_quizzes enable row level security;
alter table public.scout_progress enable row level security;
alter table public.task_badges enable row level security;
alter table public.member_badges enable row level security;
alter table public.skill_progress enable row level security;
alter table public.announcement_recipients enable row level security;
alter table public.calendar_items enable row level security;

do $$ declare t text; begin
 foreach t in array array['lesson_catalog','lesson_quizzes','scout_progress','task_badges','member_badges','skill_progress','announcement_recipients','calendar_items'] loop
  execute format('drop policy if exists %I on public.%I',t||'_authenticated',t);
  execute format('create policy %I on public.%I for all to authenticated using (true) with check (true)',t||'_authenticated',t);
 end loop;
end $$;

insert into public.lesson_catalog(slug,title,content) values
('morse-1','Morse — Debaz','Pwen, tirè, espas, epi koute son Morse.'),
('first-aid-1','Premye swen — Debaz','Rete kalm epi chèche èd yon moun ki fòme.'),
('navigation-1','Orantasyon','Kat, pwen kadinal ak direksyon.'),
('scout-code-1','Kòd Scout','Respè, sèvis, disiplin ak travay ann ekip.')
on conflict(slug) do nothing;

do $$ begin
 alter publication supabase_realtime add table public.announcements;
exception when duplicate_object then null; end $$;

-- V14 Data API exposure for newly created public tables.
grant select, insert, update, delete on public.lesson_catalog to authenticated;
grant select, insert, update, delete on public.lesson_quizzes to authenticated;
grant select, insert, update, delete on public.scout_progress to authenticated;
grant select, insert, update, delete on public.task_badges to authenticated;
grant select, insert, update, delete on public.member_badges to authenticated;
grant select, insert, update, delete on public.skill_progress to authenticated;
grant select, insert, update, delete on public.announcement_recipients to authenticated;
grant select, insert, update, delete on public.calendar_items to authenticated;
