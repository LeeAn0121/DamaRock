// Sends a push notification to every device a single user has subscribed
// from. Locked to service-role callers only (via requireServiceRole) —
// otherwise any authenticated user could spam an arbitrary user_id.
import { getSupabaseAdmin, requireServiceRole } from "../_shared/supabaseAdmin.ts";
import { sendPushToSubscription } from "../_shared/webpush.ts";

Deno.serve(async (req) => {
  const forbidden = requireServiceRole(req);
  if (forbidden) return forbidden;

  try {
    const { user_id, title, body, url } = await req.json();
    if (!user_id || !title || !body) {
      return new Response(JSON.stringify({ error: "user_id, title, body are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = getSupabaseAdmin();
    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", user_id);

    if (error) throw error;
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ sent: 0, total: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    for (const sub of subs) {
      const result = await sendPushToSubscription(sub, { title, body, url });
      if (result.ok) {
        sent++;
      } else if (result.status === 404 || result.status === 410) {
        await supabase.from("push_subscriptions").delete().eq("id", sub.id);
      }
    }

    return new Response(JSON.stringify({ sent, total: subs.length }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
