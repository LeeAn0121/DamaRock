/// <reference lib="webworker" />
import { precacheAndRoute } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

// "prompt" update mode: a newly installed worker stays waiting until the
// page (via updateSW(true), after the user taps the update banner) tells it
// to take over. Skipping waiting unconditionally here would activate every
// new deploy immediately and force a surprise reload on anyone with the app
// already open.
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

type PushPayload = {
  title?: string;
  body?: string;
  url?: string;
};

self.addEventListener("push", (event) => {
  let payload: PushPayload = {};
  try {
    payload = event.data?.json() ?? {};
  } catch {
    payload = { body: event.data?.text() };
  }

  const title = payload.title || "담아락";
  const url = payload.url || "./";

  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || "",
      icon: "icon-192.png",
      badge: "icon-192.png",
      data: { url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string } | undefined)?.url || "./";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client && client.url.includes(new URL(url, self.location.href).pathname)) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
