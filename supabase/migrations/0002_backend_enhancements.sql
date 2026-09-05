-- 1. Soft Delete for Items (30-day retention)
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Function to hard delete items that have been in the trash for > 30 days
CREATE OR REPLACE FUNCTION public.purge_deleted_items()
RETURNS void AS $$
BEGIN
  DELETE FROM public.items
  WHERE deleted_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Expiring Invite Codes (1 day)
ALTER TABLE public.families ADD COLUMN IF NOT EXISTS invite_code_expires_at timestamptz;

-- Refresh existing family invite codes
UPDATE public.families SET invite_code_expires_at = now() + interval '1 day' WHERE invite_code_expires_at IS NULL;

-- Update create_family to set expiration
CREATE OR REPLACE FUNCTION public.create_family(family_name text default '담아락')
RETURNS public.families
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_family public.families;
BEGIN
  INSERT INTO public.families (name, invite_code, invite_code_expires_at, created_by)
  VALUES (family_name, public.generate_invite_code(), now() + interval '1 day', auth.uid())
  RETURNING * INTO v_family;

  INSERT INTO public.family_members (family_id, user_id, role)
  VALUES (v_family.id, auth.uid(), '어른');

  RETURN v_family;
END;
$$;

-- Create function to explicitly refresh the code
CREATE OR REPLACE FUNCTION public.refresh_invite_code(p_family_id uuid)
RETURNS public.families
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_family public.families;
BEGIN
  IF NOT public.is_family_member(p_family_id) THEN
    RAISE EXCEPTION 'Not a member of this family';
  END IF;

  UPDATE public.families
  SET invite_code = public.generate_invite_code(),
      invite_code_expires_at = now() + interval '1 day'
  WHERE id = p_family_id
  RETURNING * INTO v_family;
  
  RETURN v_family;
END;
$$;

-- Update join_family_by_code to check expiry
CREATE OR REPLACE FUNCTION public.join_family_by_code(code text)
RETURNS public.families
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_family public.families;
BEGIN
  SELECT * INTO v_family FROM public.families WHERE invite_code = code AND invite_code_expires_at > now();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invite code';
  END IF;

  INSERT INTO public.family_members (family_id, user_id, role)
  VALUES (v_family.id, auth.uid(), '어른')
  ON CONFLICT (family_id, user_id) DO NOTHING;

  RETURN v_family;
END;
$$;

-- 3. (Optional) pg_cron scheduling if the extension is available in Supabase
-- Note: users must manually enable pg_cron in Supabase dashboard to use this
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Schedule purge everyday at midnight
    PERFORM cron.schedule('purge_deleted_items_daily', '0 0 * * *', 'SELECT public.purge_deleted_items()');
  END IF;
END $$;
