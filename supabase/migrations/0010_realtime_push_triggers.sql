-- Until now, push notifications only went out from the 15-minute
-- scheduled-notifications cron job (morning briefing / weekly summary).
-- A new grocery/todo item or comment never reached anyone whose app wasn't
-- open, because the only code reacting to those events lived in the
-- browser (useAppData.ts's realtime subscription), which can't run with the
-- app closed. These triggers call the notify-family-event edge function
-- right after the insert so other family members get a real push.
--
-- Same pattern as 0009: no secret is committed here, the service-role key
-- is looked up from Vault at call time, and everything no-ops if
-- pg_net/vault aren't available on this project tier.

create extension if not exists pg_net with schema extensions;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_net')
     and exists (select 1 from vault.decrypted_secrets where name = 'service_role_key')
  then

    create or replace function public.notify_family_on_item_insert()
    returns trigger
    language plpgsql
    security definer
    set search_path = public
    as $fn$
    declare
      category_label text;
    begin
      if new.title = '__SYSTEM_FOLDERS__' then
        return new;
      end if;

      category_label := case new.category
        when 'todo' then '할 일'
        when 'grocery' then '장보기'
        else '항목'
      end;

      perform net.http_post(
        url := 'https://tnaxljcvgyqgoqfdwxcr.supabase.co/functions/v1/notify-family-event',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
        ),
        body := jsonb_build_object(
          'family_id', new.family_id,
          'exclude_user_id', new.added_by,
          'setting_key', 'notify_new_item',
          'title', '담아락',
          'body', category_label || ' 항목이 추가됐어요: ' || new.title,
          'url', './'
        )
      );
      return new;
    end;
    $fn$;

    drop trigger if exists items_notify_family_on_insert on public.items;
    create trigger items_notify_family_on_insert
      after insert on public.items
      for each row execute function public.notify_family_on_item_insert();

    create or replace function public.notify_family_on_comment_insert()
    returns trigger
    language plpgsql
    security definer
    set search_path = public
    as $fn$
    declare
      item_title text;
      preview text;
    begin
      select title into item_title from public.items where id = new.item_id;
      preview := case
        when char_length(new.content) > 40 then left(new.content, 40) || '…'
        else new.content
      end;

      perform net.http_post(
        url := 'https://tnaxljcvgyqgoqfdwxcr.supabase.co/functions/v1/notify-family-event',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
        ),
        body := jsonb_build_object(
          'family_id', new.family_id,
          'exclude_user_id', new.author_id,
          'setting_key', 'notify_comments',
          'title', coalesce(item_title, '담아락'),
          'body', preview,
          'url', './'
        )
      );
      return new;
    end;
    $fn$;

    drop trigger if exists comments_notify_family_on_insert on public.comments;
    create trigger comments_notify_family_on_insert
      after insert on public.comments
      for each row execute function public.notify_family_on_comment_insert();

  end if;
end $$;
