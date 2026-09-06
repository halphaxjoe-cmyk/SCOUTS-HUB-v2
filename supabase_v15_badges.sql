-- SCOUT HUB V15 — REAL TASK -> BADGE AUTOMATION
-- Compatible with the live SCOUT HUB project schema (tasks.assigned_member_id -> members.id).
-- Run this migration in the existing Supabase project AFTER the existing V14 schema.

alter table public.tasks drop constraint if exists tasks_assigned_member_id_fkey;
alter table public.tasks add constraint tasks_assigned_member_id_fkey foreign key (assigned_member_id) references public.members(id) on delete set null;

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

drop trigger if exists task_done_award_badges on public.tasks;
drop trigger if exists trg_award_task_badges on public.tasks;
drop trigger if exists trg_award_task_badge_v15 on public.tasks;
create trigger trg_award_task_badge_v15
after insert or update of completed, assigned_to, title, description on public.tasks
for each row execute function public.award_task_badge_v15();

revoke execute on function public.award_task_badge_v15() from public, anon, authenticated;
revoke execute on function public.award_badges_for_completed_task() from public, anon, authenticated;
revoke execute on function public.deliver_announcement_to_all_members() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

grant select, insert, update, delete on public.badges to authenticated;
grant select, insert, update on public.tasks to authenticated;

-- Keep RLS enabled. Automatic badges are created by the trigger; manual badge management is restricted to leaders/admins.
alter table public.badges enable row level security;
drop policy if exists badges_select_v15 on public.badges;
create policy badges_select_v15 on public.badges for select to authenticated using (true);
drop policy if exists badges_insert_v15 on public.badges;
create policy badges_insert_v15 on public.badges for insert to authenticated
with check (exists (select 1 from public.members p where p.user_id=(select auth.uid()) and p.role in ('admin','leader')));
drop policy if exists badges_update_v15 on public.badges;
create policy badges_update_v15 on public.badges for update to authenticated
using (exists (select 1 from public.members p where p.user_id=(select auth.uid()) and p.role in ('admin','leader')))
with check (exists (select 1 from public.members p where p.user_id=(select auth.uid()) and p.role in ('admin','leader')));
drop policy if exists badges_delete_v15 on public.badges;
create policy badges_delete_v15 on public.badges for delete to authenticated
using (exists (select 1 from public.members p where p.user_id=(select auth.uid()) and p.role in ('admin','leader')));

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

-- V15.1 fix: tasks now persist their description and badge automation watches it.
alter table public.tasks add column if not exists description text;
create or replace function public.award_task_badge_v15()
returns trigger language plpgsql security definer set search_path = public as $$
declare badge_icon text := '🏅'; badge_title text := 'Misyon Akonpli'; task_text text := lower(coalesce(new.title,'') || ' ' || coalesce(new.description,'')); should_award boolean := false;
begin
  if new.completed = true and new.assigned_member_id is not null then
    if tg_op = 'INSERT' then should_award := true;
    elsif old.completed is distinct from true or old.assigned_member_id is distinct from new.assigned_member_id then should_award := true;
    end if;
  end if;
  if should_award then
    if task_text ~ '(morse|kòd|code|signal)' then badge_icon:='📡'; badge_title:='Mèt Morse';
    elsif task_text ~ '(camp|kan|camping|abri)' then badge_icon:='⛺'; badge_title:='Mèt Camping';
    elsif task_text ~ '(orient|boussol|kat|direksyon|orientation|boussole|carte)' then badge_icon:='🧭'; badge_title:='Eksploratè Orantasyon';
    elsif task_text ~ '(nœud|noeud|knot|mare|nœuds|noeuds)' then badge_icon:='🪢'; badge_title:='Mèt Nœuds';
    elsif task_text ~ '(nature|plant|anviwònman|environment|environnement)' then badge_icon:='🌿'; badge_title:='Gadyen Lanati';
    elsif task_text ~ '(premye swen|first aid|swen|secours|premiers soins|primeros auxilios)' then badge_icon:='🩹'; badge_title:='Scout Sekou';
    elsif task_text ~ '(leadership|lidè|dirije|leader|liderazgo)' then badge_icon:='🦅'; badge_title:='Lidè Scout';
    elsif task_text ~ '(ekip|team|kolabor|équipe|equipe|equipo)' then badge_icon:='🤝'; badge_title:='Ekip Scout';
    elsif task_text ~ '(jeu|game|jwèt|juego)' then badge_icon:='🎮'; badge_title:='Mèt Jwèt Scout';
    elsif task_text ~ '(lesson|leson|quiz|aprann|leçon|apprendre|lección|aprender)' then badge_icon:='📚'; badge_title:='Apranti Scout';
    elsif task_text ~ '(sport|marche|kouri|exercise|ejercicio)' then badge_icon:='🏃'; badge_title:='Scout Aktif';
    elsif task_text ~ '(feu|fire|boukan|fuego)' then badge_icon:='🔥'; badge_title:='Mèt Feu de Camp';
    elsif task_text ~ '(service|ede|help|volont|aide|ayuda)' then badge_icon:='❤️'; badge_title:='Scout Sèvis'; end if;
    insert into public.badges(member_id,title,name,description,icon,awarded_at,source_task_id,auto_awarded)
    values(new.assigned_member_id,badge_title,badge_title,'Badj otomatik pou tâche: '||new.title,badge_icon,current_date,new.id,true)
    on conflict (member_id,source_task_id) where source_task_id is not null do nothing;
  end if;
  return new;
end; $$;
drop trigger if exists trg_award_task_badge_v15 on public.tasks;
create trigger trg_award_task_badge_v15 after insert or update of completed,assigned_member_id,title,description on public.tasks for each row execute function public.award_task_badge_v15();
revoke execute on function public.award_task_badge_v15() from public,anon,authenticated;
