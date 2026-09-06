// Fans a push notification out to every OTHER member of a family — invoked
// by DB triggers (see migration 0010) right after a new item or comment is
// inserted, so a closed app still gets notified instead of only whoever has
// the tab open right now (the realtime listener in useAppData.ts only fires
// for open tabs). Locked to service-role callers, same as send-push.
import { getSupabaseAdmin, requireServiceRole } from "../_shared/supabaseAdmin.ts";
import { sendPushToSubscription } from "../_shared/webpush.ts";
import { isQuietHoursNow } from "../_shared/quietHours.ts";

type SettingKey = "notify_new_item" | "notify_comments";

Deno.serve(async (req) => {
  const forbidden = requireServiceRole(req);
  if (forbidden) return forbidden;

  try {
    const { family_id, exclude_user_id, setting_key, title, body, url } = (await req.json()) as {
      family_id?: string;
      exclude_user_id?: string;
      setting_key?: SettingKey;
      title?: string;
      body?: string;
      url?: string;
    };
    if (!family_id || !setting_key || !title || !body) {
      return new Response(JSON.stringify({ error: "family_id, setting_key, title, body are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = getSupabaseAdmin();

    const { data: memberRows, error: memberErr } = await supabase
      .from("family_members")
      .select("user_id")
      .eq("family_id", family_id);
    if (memberErr) throw memberErr;

    const recipientIds = (memberRows ?? [])
      .map((r) => r.user_id as string)
      .filter((id) => id !== exclude_user_id);
    if (recipientIds.length === 0) {
      return new Response(JSON.stringify({ sent: [] }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    const { data: settingsRows } = await supabase
      .from("notification_settings")
      .select("user_id, notify_new_item, notify_comments, quiet_mode, quiet_start, quiet_end")
      .in("user_id", recipientIds);
    const settingsByUser = new Map((settingsRows ?? []).map((r) => [r.user_id as string, r]));

    const sent: Array<{ user_id: string; devices: number }> = [];

    for (const userId of recipientIds) {
      const settings = settingsByUser.get(userId);
      // No row yet = user never touched notification settings = defaults (all on).
      if (settings) {
        if (settings[setting_key] === false) continue;
        if (settings.quiet_mode && isQuietHoursNow(settings.quiet_start, settings.quiet_end)) continue;
      }

      const { data: subs } = await supabase
        .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth")
        .eq("user_id", userId);
      if (!subs || subs.length === 0) continue;

      let devices = 0;
      for (const sub of subs) {
        const result = await sendPushToSubscription(sub, { title, body, url });
        if (result.ok) devices++;
        else if (result.status === 404 || result.status === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
      if (devices > 0) sent.push({ user_id: userId, devices });
    }

    return new Response(JSON.stringify({ sent }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
