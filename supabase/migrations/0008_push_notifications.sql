-- Web Push infrastructure: a device's push subscription, and the
-- notification preferences that used to live only in localStorage (a
-- scheduled job has no browser tab to read localStorage from, so these
-- need a server-side home to actually drive morning-briefing/weekly-summary
-- sends).

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

do $$ begin
  create policy "users manage their own push subscriptions"
    on public.push_subscriptions for all
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

create table if not exists public.notification_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  notify_new_item boolean not null default true,
  notify_comments boolean not null default true,
  notify_briefing boolean not null default true,
  briefing_time text not null default '08:00',
  notify_summary boolean not null default true,
  quiet_mode boolean not null default false,
  quiet_start text not null default '23:00',
  quiet_end text not null default '07:00',
  updated_at timestamptz not null default now()
);

alter table public.notification_settings enable row level security;

do $$ begin
  create policy "users manage their own notification settings"
    on public.notification_settings for all
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

-- service_role (used by the scheduled edge functions) needs to read across
-- all users to decide who to notify — RLS above only covers the
-- authenticated end-user path, service_role bypasses RLS by default.
