-- 담아락 — PostgREST embed relationship fix
--
-- family_members.user_id, items.added_by/assignee, families.created_by, and
-- family_invites.created_by all reference auth.users. PostgREST can't embed
-- through auth.users (it isn't an exposed schema), so `profiles(display_name,
-- initial)` embeds fail with a 400 "no relationship found" error.
--
-- Adding a direct FK to public.profiles(id) fixes this. It's purely additive
-- and safe on existing data: profiles.id is already 1:1 with auth.users.id
-- via the handle_new_user() trigger, so every existing value still satisfies
-- the new constraint.

do $$
begin
  alter table public.family_members
    add constraint family_members_user_id_profiles_fkey
    foreign key (user_id) references public.profiles(id) on delete cascade;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.items
    add constraint items_added_by_profiles_fkey
    foreign key (added_by) references public.profiles(id);
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.items
    add constraint items_assignee_profiles_fkey
    foreign key (assignee) references public.profiles(id);
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.families
    add constraint families_created_by_profiles_fkey
    foreign key (created_by) references public.profiles(id);
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.family_invites
    add constraint family_invites_created_by_profiles_fkey
    foreign key (created_by) references public.profiles(id);
exception when duplicate_object then null;
end $$;

notify pgrst, 'reload schema';
