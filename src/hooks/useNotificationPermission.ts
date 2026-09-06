import { useCallback, useState } from "react";
import { subscribeToPush } from "../lib/push";

export type NotifPermission = "default" | "granted" | "denied" | "unsupported";

function readPermission(): NotifPermission {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission;
}

// Centralizes permission state + the actual request call so it can be
// triggered from an explicit, guaranteed user tap (a banner or a Settings
// button) instead of an ambient document-wide click listener — on mobile,
// swipe/long-press handlers elsewhere in the app routinely call
// stopPropagation/preventDefault, which silently ate that listener's clicks
// often enough that the permission prompt just never appeared for most taps.
export function useNotificationPermission(userId: string | null) {
  const [permission, setPermission] = useState<NotifPermission>(readPermission);

  const request = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted" && userId) await subscribeToPush(userId);
  }, [userId]);

  return { permission, request };
}
