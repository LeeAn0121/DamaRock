-- Add comments table to realtime publication
BEGIN;
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'comments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
  END IF;
END $$;
COMMIT;
