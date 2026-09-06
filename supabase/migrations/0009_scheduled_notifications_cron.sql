-- Schedules the scheduled-notifications edge function to run every 15
-- minutes so morning-briefing/weekly-summary pushes actually go out on
-- time. The service-role key used to authenticate the call is intentionally
-- NOT in this file — it's stored once via Supabase Vault (see project notes)
-- and looked up by name at call time, so nothing sensitive is committed to
-- version control. If pg_cron/pg_net/vault aren't available on this project
-- tier, this migration no-ops instead of failing.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron')
     and exists (select 1 from pg_extension where extname = 'pg_net')
     and exists (select 1 from vault.decrypted_secrets where name = 'service_role_key')
  then
    perform cron.schedule(
      'scheduled-notifications-job',
      '*/15 * * * *',
      $cron$
      select net.http_post(
        url := 'https://tnaxljcvgyqgoqfdwxcr.supabase.co/functions/v1/scheduled-notifications',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
        ),
        body := '{}'::jsonb
      );
      $cron$
    );
  end if;
end $$;
