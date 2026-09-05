-- Update role check constraint and default value
ALTER TABLE public.family_members DROP CONSTRAINT family_members_role_check;
ALTER TABLE public.family_members ALTER COLUMN role DROP DEFAULT;

UPDATE public.family_members
SET role = CASE 
  WHEN role = '어른' THEN '가족대표'
  WHEN role = '아이' THEN '구성원'
  ELSE role
END;

ALTER TABLE public.family_members ADD CONSTRAINT family_members_role_check CHECK (role in ('가족대표', '구성원'));
ALTER TABLE public.family_members ALTER COLUMN role SET DEFAULT '구성원';

-- Update create_family function to assign '가족대표'
CREATE OR REPLACE FUNCTION public.create_family(family_name text default '담아락')
RETURNS public.families
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_family public.families;
BEGIN
  INSERT INTO public.families (name, invite_code, created_by)
  VALUES (family_name, public.generate_invite_code(), auth.uid())
  RETURNING * INTO v_family;

  INSERT INTO public.family_members (family_id, user_id, role)
  VALUES (v_family.id, auth.uid(), '가족대표');

  RETURN v_family;
END;
$$;

-- Update join_family_by_code function to assign '구성원'
CREATE OR REPLACE FUNCTION public.join_family_by_code(code text)
RETURNS public.families
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_family public.families;
BEGIN
  SELECT * INTO v_family FROM public.families WHERE invite_code = code;

  IF v_family.id IS NULL THEN
    RAISE EXCEPTION '초대 코드를 찾을 수 없어요';
  END IF;

  INSERT INTO public.family_members (family_id, user_id, role)
  VALUES (v_family.id, auth.uid(), '구성원')
  ON CONFLICT (family_id, user_id) DO NOTHING;

  UPDATE public.family_invites
    SET status = 'accepted'
    WHERE family_id = v_family.id
      AND status = 'pending'
      AND invited_email = (SELECT email FROM auth.users WHERE id = auth.uid());

  RETURN v_family;
END;
$$;
