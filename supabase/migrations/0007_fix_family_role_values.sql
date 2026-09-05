-- CRITICAL FIX: create_family() and join_family_by_code() currently insert
-- role = '어른', but 0003_update_roles.sql changed the check constraint to
-- only allow ('가족대표', '구성원'). Whichever of 0002_backend_enhancements.sql
-- / 0003_update_roles.sql actually ran last on this database left the
-- functions pointing at the old role value, so every INSERT they do into
-- family_members now violates family_members_role_check — meaning creating a
-- new family AND joining one by invite code are both currently broken.
-- CREATE OR REPLACE is idempotent and safe to run any number of times.

create or replace function public.create_family(family_name text default '담아락')
returns public.families
language plpgsql
security definer set search_path = public
as $$
declare
  v_family public.families;
begin
  insert into public.families (name, invite_code, invite_code_expires_at, created_by)
  values (family_name, public.generate_invite_code(), now() + interval '1 day', auth.uid())
  returning * into v_family;

  insert into public.family_members (family_id, user_id, role)
  values (v_family.id, auth.uid(), '가족대표');

  return v_family;
end;
$$;

create or replace function public.join_family_by_code(code text)
returns public.families
language plpgsql
security definer set search_path = public
as $$
declare
  v_family public.families;
begin
  select * into v_family from public.families where invite_code = code and invite_code_expires_at > now();
  if not found then
    raise exception 'Invalid or expired invite code';
  end if;

  insert into public.family_members (family_id, user_id, role)
  values (v_family.id, auth.uid(), '구성원')
  on conflict (family_id, user_id) do nothing;

  update public.family_invites
    set status = 'accepted'
    where family_id = v_family.id
      and status = 'pending'
      and invited_email = (select email from auth.users where id = auth.uid());

  return v_family;
end;
$$;
