-- ============================================================
-- Flow — Supabase SQL Migration
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── profiles ─────────────────────────────────────────────────────────────────
-- Mirrors auth.users; populated via trigger on signup
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  display_name text not null default '',
  photo_url    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Auto-create profile on new user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, display_name, photo_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── projects ──────────────────────────────────────────────────────────────────
create table if not exists public.projects (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  description text not null default '',
  color       text not null default '#6366f1',
  cover_url   text,
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  member_ids  uuid[] not null default '{}',
  due_date    timestamptz,
  archived    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Index for member lookup
create index if not exists idx_projects_member_ids on public.projects using gin(member_ids);
create index if not exists idx_projects_owner_id  on public.projects(owner_id);

-- ── tasks ─────────────────────────────────────────────────────────────────────
create table if not exists public.tasks (
  id           uuid primary key default uuid_generate_v4(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  title        text not null,
  description  text not null default '',
  status       text not null default 'Todo'
                 check (status in ('Backlog','Todo','In Progress','Review','Done')),
  priority     text not null default 'medium'
                 check (priority in ('urgent','high','medium','low')),
  label        text not null default '',
  assignee_id  uuid references public.profiles(id) on delete set null,
  reporter_id  uuid not null references public.profiles(id) on delete cascade,
  due_date     timestamptz,
  completed_at timestamptz,
  "order"      bigint not null default extract(epoch from now()) * 1000,
  attachments  jsonb not null default '[]',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_tasks_project_id on public.tasks(project_id);
create index if not exists idx_tasks_status     on public.tasks(status);
create index if not exists idx_tasks_assignee   on public.tasks(assignee_id);

-- ── comments ──────────────────────────────────────────────────────────────────
create table if not exists public.comments (
  id         uuid primary key default uuid_generate_v4(),
  task_id    uuid not null references public.tasks(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  content    text not null,
  edited     boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_comments_task_id on public.comments(task_id);

-- ── notifications ─────────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       text not null,
  title      text not null,
  body       text not null default '',
  read       boolean not null default false,
  task_id    uuid references public.tasks(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  actor_id   uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_id on public.notifications(user_id, read);

-- ── updated_at trigger ────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_projects_updated_at  before update on public.projects  for each row execute function public.set_updated_at();
create trigger set_tasks_updated_at     before update on public.tasks      for each row execute function public.set_updated_at();
create trigger set_comments_updated_at  before update on public.comments   for each row execute function public.set_updated_at();
create trigger set_profiles_updated_at  before update on public.profiles   for each row execute function public.set_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table public.profiles      enable row level security;
alter table public.projects      enable row level security;
alter table public.tasks         enable row level security;
alter table public.comments      enable row level security;
alter table public.notifications enable row level security;

-- profiles: anyone authenticated can read; only self can write
create policy "profiles_select" on public.profiles for select to authenticated using (true);
create policy "profiles_update" on public.profiles for update to authenticated using (auth.uid() = id);

-- projects: members can read; authenticated can create; members can update; owner can delete
create policy "projects_select" on public.projects for select to authenticated
  using (auth.uid() = any(member_ids));
create policy "projects_insert" on public.projects for insert to authenticated
  with check (auth.uid() = owner_id);
create policy "projects_update" on public.projects for update to authenticated
  using (auth.uid() = any(member_ids));
create policy "projects_delete" on public.projects for delete to authenticated
  using (auth.uid() = owner_id);

-- tasks: project members can CRUD
create policy "tasks_select" on public.tasks for select to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and auth.uid() = any(p.member_ids)));
create policy "tasks_insert" on public.tasks for insert to authenticated
  with check (exists (select 1 from public.projects p where p.id = project_id and auth.uid() = any(p.member_ids)));
create policy "tasks_update" on public.tasks for update to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and auth.uid() = any(p.member_ids)));
create policy "tasks_delete" on public.tasks for delete to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and auth.uid() = any(p.member_ids)));

-- comments: project members can read/create; author can update/delete
create policy "comments_select" on public.comments for select to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and auth.uid() = any(p.member_ids)));
create policy "comments_insert" on public.comments for insert to authenticated
  with check (auth.uid() = author_id);
create policy "comments_update" on public.comments for update to authenticated
  using (auth.uid() = author_id);
create policy "comments_delete" on public.comments for delete to authenticated
  using (auth.uid() = author_id);

-- notifications: only the recipient
create policy "notifications_select" on public.notifications for select to authenticated
  using (auth.uid() = user_id);
create policy "notifications_update" on public.notifications for update to authenticated
  using (auth.uid() = user_id);
