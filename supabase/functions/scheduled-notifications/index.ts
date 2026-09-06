// Invoked on a schedule by pg_cron (see migration 0009). Checks whose
// morning-briefing time (or, on Sunday evening, weekly-summary) falls in the
// current run window and sends a push to each. Runs as service role — it
// has no signed-in user, so it reads notification_settings/push_subscriptions
// directly rather than going through RLS.
import { getSupabaseAdmin, requireServiceRole } from "../_shared/supabaseAdmin.ts";
import { sendPushToSubscription } from "../_shared/webpush.ts";

type SupabaseAdmin = ReturnType<typeof getSupabaseAdmin>;

const WEEKDAY_MAP: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function nowInSeoul(): { hhmm: string; weekday: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { hhmm: `${get("hour")}:${get("minute")}`, weekday: WEEKDAY_MAP[get("weekday")] ?? 0 };
}

// True when `targetHHMM` falls within [now, now + windowMinutes) — matches
// once per cron run as long as the cron interval <= windowMinutes.
function currentWindowMatches(targetHHMM: string, windowMinutes = 15): boolean {
  const { hhmm } = nowInSeoul();
  const [nh, nm] = hhmm.split(":").map(Number);
  const [th, tm] = targetHHMM.split(":").map(Number);
  const diff = nh * 60 + nm - (th * 60 + tm);
  return diff >= 0 && diff < windowMinutes;
}

async function sendToUser(supabase: SupabaseAdmin, userId: string, title: string, body: string) {
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);
  for (const sub of subs ?? []) {
    const result = await sendPushToSubscription(sub, { title, body });
    if (!result.ok && (result.status === 404 || result.status === 410)) {
      await supabase.from("push_subscriptions").delete().eq("id", sub.id);
    }
  }
  return subs?.length ?? 0;
}

async function userFamilyIds(supabase: SupabaseAdmin, userId: string): Promise<string[]> {
  const { data } = await supabase.from("family_members").select("family_id").eq("user_id", userId);
  return (data ?? []).map((r) => r.family_id as string);
}

async function buildBriefingSummary(supabase: SupabaseAdmin, userId: string): Promise<string | null> {
  const familyIds = await userFamilyIds(supabase, userId);
  if (familyIds.length === 0) return null;

  const { data: items } = await supabase
    .from("items")
    .select("category, done")
    .in("family_id", familyIds)
    .is("deleted_at", null);
  if (!items) return null;

  const groceryLeft = items.filter((i) => i.category === "grocery" && !i.done).length;
  const todoLeft = items.filter((i) => i.category === "todo" && !i.done).length;
  if (groceryLeft === 0 && todoLeft === 0) return null;
  return `오늘 장보기 ${groceryLeft}개, 할 일 ${todoLeft}개가 남아있어요.`;
}

async function buildWeeklySummary(supabase: SupabaseAdmin, userId: string): Promise<string | null> {
  const familyIds = await userFamilyIds(supabase, userId);
  if (familyIds.length === 0) return null;

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: items } = await supabase
    .from("items")
    .select("id")
    .in("family_id", familyIds)
    .eq("done", true)
    .gte("updated_at", weekAgo);

  const count = items?.length ?? 0;
  if (count === 0) return null;
  return `지난 한 주 동안 ${count}개의 항목을 완료했어요!`;
}

Deno.serve(async (req) => {
  const forbidden = requireServiceRole(req);
  if (forbidden) return forbidden;

  const supabase = getSupabaseAdmin();
  const { weekday } = nowInSeoul();
  const sent: Array<{ user_id: string; type: string; devices: number }> = [];

  const { data: briefingUsers } = await supabase
    .from("notification_settings")
    .select("user_id, briefing_time")
    .eq("notify_briefing", true);

  for (const row of briefingUsers ?? []) {
    if (!currentWindowMatches(row.briefing_time)) continue;
    const summary = await buildBriefingSummary(supabase, row.user_id);
    if (!summary) continue;
    const devices = await sendToUser(supabase, row.user_id, "담아락 모닝 브리핑", summary);
    if (devices > 0) sent.push({ user_id: row.user_id, type: "briefing", devices });
  }

  // Weekly summary: Sunday, 20:00 window.
  if (weekday === 0 && currentWindowMatches("20:00")) {
    const { data: summaryUsers } = await supabase
      .from("notification_settings")
      .select("user_id")
      .eq("notify_summary", true);

    for (const row of summaryUsers ?? []) {
      const summary = await buildWeeklySummary(supabase, row.user_id);
      if (!summary) continue;
      const devices = await sendToUser(supabase, row.user_id, "담아락 주간 요약", summary);
      if (devices > 0) sent.push({ user_id: row.user_id, type: "weekly_summary", devices });
    }
  }

  return new Response(JSON.stringify({ sent }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
