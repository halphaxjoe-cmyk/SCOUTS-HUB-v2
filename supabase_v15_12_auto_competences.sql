-- SCOUT HUB V15.12 — automatic competence reconciliation
-- Supabase project: qcgbrusawqxjfvrngrub
-- No service_role key is required in the frontend.

create or replace function public.award_task_skill_v15_9()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta record;
  current_id uuid;
  current_progress integer;
  next_progress integer;
begin
  if new.completed is true
     and new.assigned_member_id is not null
     and new.skill_awarded_at is null then
    select * into meta
      from public.scout_task_indicator(new.title, new.description, new.badge_hint);

    select id, progress into current_id, current_progress
      from public.skills
     where member_id = new.assigned_member_id
       and coalesce(skill_name, name) = meta.skill_name
     order by id desc limit 1;

    next_progress := least(100, coalesce(current_progress, 0) + 25);

    if current_id is null then
      insert into public.skills(member_id,name,skill_name,level,progress,max_progress)
      values(new.assigned_member_id,meta.skill_name,meta.skill_name,
        case when next_progress>=100 then 'avancé' when next_progress>=60 then 'intermédiaire' else 'débutant' end,
        next_progress,100);
    else
      update public.skills set progress=next_progress,
        level=case when next_progress>=100 then 'avancé' when next_progress>=60 then 'intermédiaire' else 'débutant' end
      where id=current_id;
    end if;

    update public.tasks set skill_name=meta.skill_name, skill_awarded_at=now()
      where id=new.id and skill_awarded_at is null;
  end if;
  return new;
end;
$$;

-- Reconcile tasks completed before this automation existed.
update public.tasks
set completed=true
where completed=true and assigned_member_id is not null and skill_awarded_at is null;
