-- SCOUT HUB V15.13 notification center
create index if not exists notifications_user_created_idx on public.notifications(user_id, created_at desc);

create or replace function public.notify_all_members_announcement_v15_13()
returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  insert into public.notifications(user_id,title,body,kind,data)
  select u.id, coalesce(nullif(new.title,''),'📢 Nouvel anons'),
         coalesce(nullif(coalesce(new.content,new.body),''),'Yon nouvo anons disponib.'),
         'announcement', jsonb_build_object('announcement_id',new.id)
  from auth.users u;
  return new;
end; $$;
revoke all on function public.notify_all_members_announcement_v15_13() from public, anon, authenticated;
drop trigger if exists announcement_notify_all_v15_13 on public.announcements;
create trigger announcement_notify_all_v15_13 after insert on public.announcements for each row execute function public.notify_all_members_announcement_v15_13();

create or replace function public.notify_task_assignee_v15_13()
returns trigger language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if new.assigned_member_id is not null and (tg_op='INSERT' or old.assigned_member_id is distinct from new.assigned_member_id or old.title is distinct from new.title) then
    select user_id into uid from public.members where id=new.assigned_member_id;
    if uid is not null then insert into public.notifications(user_id,title,body,kind,data)
      values(uid,'📋 Nouvo tâche',coalesce(new.title,'Yon tâche te asiyen pou ou.'),'task',jsonb_build_object('task_id',new.id)); end if;
  end if; return new;
end; $$;
revoke all on function public.notify_task_assignee_v15_13() from public, anon, authenticated;
drop trigger if exists task_notify_assignee_v15_13 on public.tasks;
create trigger task_notify_assignee_v15_13 after insert or update of assigned_member_id,title on public.tasks for each row execute function public.notify_task_assignee_v15_13();

create or replace function public.notify_all_members_activity_v15_13()
returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  insert into public.notifications(user_id,title,body,kind,data)
  select u.id,'📅 Nouvo aktivite',coalesce(new.title,'Yon nouvo aktivite disponib.'),'activity',jsonb_build_object('activity_id',new.id,'date',new.activity_date,'time',new.activity_time)
  from auth.users u; return new;
end; $$;
revoke all on function public.notify_all_members_activity_v15_13() from public, anon, authenticated;
drop trigger if exists activity_notify_all_v15_13 on public.activities;
create trigger activity_notify_all_v15_13 after insert on public.activities for each row execute function public.notify_all_members_activity_v15_13();

create or replace function public.notify_badge_owner_v15_13()
returns trigger language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if new.member_id is not null then select user_id into uid from public.members where id=new.member_id;
    if uid is not null then insert into public.notifications(user_id,title,body,kind,data)
      values(uid,'🏅 Nouvo badge!',coalesce(new.title,new.name,'Felisitasyon! Ou resevwa yon nouvo badge.'),'badge',jsonb_build_object('badge_id',new.id,'icon',new.icon)); end if;
  end if; return new;
end; $$;
revoke all on function public.notify_badge_owner_v15_13() from public, anon, authenticated;
drop trigger if exists badge_notify_owner_v15_13 on public.badges;
create trigger badge_notify_owner_v15_13 after insert on public.badges for each row execute function public.notify_badge_owner_v15_13();

create or replace function public.notify_skill_owner_v15_13()
returns trigger language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if new.member_id is not null and (tg_op='INSERT' or old.progress is distinct from new.progress or old.level is distinct from new.level) then
    select user_id into uid from public.members where id=new.member_id;
    if uid is not null then insert into public.notifications(user_id,title,body,kind,data)
      values(uid,'🎯 Compétence mise à jour',coalesce(new.name,new.skill_name,'Compétence')||' • '||coalesce(new.progress,0)||'%','skill',jsonb_build_object('skill_id',new.id,'skill_name',coalesce(new.skill_name,new.name),'progress',new.progress,'level',new.level)); end if;
  end if; return new;
end; $$;
revoke all on function public.notify_skill_owner_v15_13() from public, anon, authenticated;
drop trigger if exists skill_notify_owner_v15_13 on public.skills;
create trigger skill_notify_owner_v15_13 after insert or update of progress,level,skill_name,name on public.skills for each row execute function public.notify_skill_owner_v15_13();

alter table public.notifications enable row level security;
