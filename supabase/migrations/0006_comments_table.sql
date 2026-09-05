-- The `comments` table has been referenced by the app and by
-- 0004_realtime_comments.sql (guarded with an IF EXISTS check) since it was
-- created out-of-band, but it was never captured in a migration — so a fresh
-- environment (or one where RLS was never granted on it) has comment
-- insert/update/delete silently fail. This migration is idempotent and safe
-- to run against a database that already has the table.

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  content text not null check (char_length(trim(content)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists comments_item_id_idx on public.comments (item_id);
create index if not exists comments_family_id_idx on public.comments (family_id);

alter table public.comments enable row level security;

do $$ begin
  create policy "comments are visible to family members"
    on public.comments for select
    using (public.is_family_member(family_id));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "members can add comments"
    on public.comments for insert
    with check (public.is_family_member(family_id) and author_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "authors can update their own comments"
    on public.comments for update
    using (author_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "authors can delete their own comments"
    on public.comments for delete
    using (author_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'comments'
  ) then
    alter publication supabase_realtime add table public.comments;
  end if;
end $$;
