import webpush from "npm:web-push@3.6.7";

const publicKey = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const privateKey = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const subject = Deno.env.get("VAPID_SUBJECT") || "mailto:support@damarock.app";

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export type PushSubscriptionRow = {
  id?: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type PushResult = { ok: true } | { ok: false; status?: number; message: string };

export async function sendPushToSubscription(
  sub: PushSubscriptionRow,
  payload: { title: string; body: string; url?: string }
): Promise<PushResult> {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload)
    );
    return { ok: true };
  } catch (err) {
    const statusCode = (err as { statusCode?: number })?.statusCode;
    return { ok: false, status: statusCode, message: String(err) };
  }
}
