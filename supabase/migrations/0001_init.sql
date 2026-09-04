-- 담아락 (DamaRock) — initial schema
-- Run this once in the Supabase SQL Editor, or via `supabase db push`.

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────
-- profiles: one row per auth user, auto-created on signup.
-- Holds display info regardless of which OAuth provider was used
-- (Google gives full_name/avatar_url, Kakao gives nickname/profile_image —
-- both get normalized into these columns by handle_new_user()).
-- ─────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '가족',
  initial text not null default '나',
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- families: one "우리집" space. invite_code is the shareable code
-- shown on the FamilyInvite screen (format: "742-819").
-- ─────────────────────────────────────────────────────────────
create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null default '담아락',
  invite_code text not null unique,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- family_members: membership + role (어른/아이) shown in Settings
-- and the FamilyInvite member list.
-- ─────────────────────────────────────────────────────────────
create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default '어른' check (role in ('어른', '아이')),
  joined_at timestamptz not null default now(),
  unique (family_id, user_id)
);

-- ─────────────────────────────────────────────────────────────
-- family_invites: named pending invites (the "초대 대기 중" list).
-- Distinct from the generic invite_code — this tracks who you told
-- about it so you can see/cancel it before they join.
-- ─────────────────────────────────────────────────────────────
create table public.family_invites (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  invited_name text not null,
  invited_email text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'cancelled')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- items: the shared grocery/todo list (HomeList screen).
-- category 'inbox' = captured but not yet sorted into 장보기/할 일.
-- meta holds either a quantity ("2개") or a due chip ("이번 주말").
-- ─────────────────────────────────────────────────────────────
create table public.items (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  category text not null default 'inbox' check (category in ('inbox', 'grocery', 'todo')),
  done boolean not null default false,
  added_by uuid not null references auth.users(id),
  assignee uuid references auth.users(id),
  meta text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index items_family_id_idx on public.items (family_id);
create index items_family_category_idx on public.items (family_id, category, done);
create index family_members_user_id_idx on public.family_members (user_id);
create index family_members_family_id_idx on public.family_members (family_id);

-- ─────────────────────────────────────────────────────────────
-- updated_at trigger for items
-- ─────────────────────────────────────────────────────────────
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger items_set_updated_at
  before update on public.items
  for each row
  execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- auto-create a profile row from OAuth metadata on signup
-- (Google: full_name/name + avatar_url · Kakao: name/nickname + avatar_url,
-- both normalized by Supabase into user_metadata under similar keys).
-- ─────────────────────────────────────────────────────────────
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_name text;
begin
  v_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'nickname',
    '가족'
  );

  insert into public.profiles (id, display_name, initial, avatar_url)
  values (
    new.id,
    v_name,
    left(v_name, 1),
    new.raw_user_meta_data ->> 'avatar_url'
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- membership helper — SECURITY DEFINER so it can read family_members
-- from inside another table's RLS policy without recursion.
-- ─────────────────────────────────────────────────────────────
create function public.is_family_member(target_family_id uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.family_members
    where family_id = target_family_id
      and user_id = auth.uid()
  );
$$;

-- ─────────────────────────────────────────────────────────────
-- create_family / join_family_by_code — SECURITY DEFINER RPCs.
-- Direct inserts into families/family_members are intentionally not
-- exposed via RLS: creating a family and becoming its first member
-- (or joining an existing one) is a bootstrap step no policy can
-- authorize on its own, so it goes through controlled functions instead.
-- ─────────────────────────────────────────────────────────────
create function public.generate_invite_code()
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  loop
    candidate := lpad(floor(random() * 1000)::text, 3, '0') || '-' ||
                 lpad(floor(random() * 1000)::text, 3, '0');
    exit when not exists (select 1 from public.families where invite_code = candidate);
  end loop;
  return candidate;
end;
$$;

create function public.create_family(family_name text default '담아락')
returns public.families
language plpgsql
security definer set search_path = public
as $$
declare
  v_family public.families;
begin
  insert into public.families (name, invite_code, created_by)
  values (family_name, public.generate_invite_code(), auth.uid())
  returning * into v_family;

  insert into public.family_members (family_id, user_id, role)
  values (v_family.id, auth.uid(), '어른');

  return v_family;
end;
$$;

create function public.join_family_by_code(code text)
returns public.families
language plpgsql
security definer set search_path = public
as $$
declare
  v_family public.families;
begin
  select * into v_family from public.families where invite_code = code;

  if v_family.id is null then
    raise exception '초대 코드를 찾을 수 없어요';
  end if;

  insert into public.family_members (family_id, user_id, role)
  values (v_family.id, auth.uid(), '어른')
  on conflict (family_id, user_id) do nothing;

  update public.family_invites
    set status = 'accepted'
    where family_id = v_family.id
      and status = 'pending'
      and invited_email = (select email from auth.users where id = auth.uid());

  return v_family;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.family_invites enable row level security;
alter table public.items enable row level security;

-- profiles: readable by anyone who shares a family with you; editable by self.
create policy "profiles are visible to family members"
  on public.profiles for select
  using (
    id = auth.uid()
    or exists (
      select 1 from public.family_members mine
      join public.family_members theirs on theirs.family_id = mine.family_id
      where mine.user_id = auth.uid() and theirs.user_id = profiles.id
    )
  );

create policy "users can update their own profile"
  on public.profiles for update
  using (id = auth.uid());

-- families: readable by members only. No direct insert/update policy —
-- creation happens through create_family().
create policy "families are visible to their members"
  on public.families for select
  using (public.is_family_member(id));

-- family_members: readable by members of the same family.
create policy "family roster is visible to members"
  on public.family_members for select
  using (public.is_family_member(family_id));

-- family_invites: members can view, create, and cancel invites for their family.
create policy "invites are visible to family members"
  on public.family_invites for select
  using (public.is_family_member(family_id));

create policy "members can create invites"
  on public.family_invites for insert
  with check (public.is_family_member(family_id) and created_by = auth.uid());

create policy "members can cancel invites"
  on public.family_invites for update
  using (public.is_family_member(family_id));

create policy "members can delete invites"
  on public.family_invites for delete
  using (public.is_family_member(family_id));

-- items: full CRUD for members of the owning family.
create policy "items are visible to family members"
  on public.items for select
  using (public.is_family_member(family_id));

create policy "members can add items"
  on public.items for insert
  with check (public.is_family_member(family_id) and added_by = auth.uid());

create policy "members can update items"
  on public.items for update
  using (public.is_family_member(family_id));

create policy "members can delete items"
  on public.items for delete
  using (public.is_family_member(family_id));

-- ─────────────────────────────────────────────────────────────
-- Realtime: the family list is meant to update live on every device.
-- ─────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.items;
alter publication supabase_realtime add table public.family_members;
alter publication supabase_realtime add table public.family_invites;
