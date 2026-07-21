"use strict";

const WATER_ADMIN_URL = "/professional/infrastructure/water/admin/approvals";

function readPushPayload(event) {
  if (!event.data) return {};

  try {
    return event.data.json();
  } catch {
    return {
      body: event.data.text(),
    };
  }
}

self.addEventListener("push", (event) => {
  const payload = readPushPayload(event);
  const title = payload.title || "Pantavion — νέο αίτημα";
  const url = payload.url || WATER_ADMIN_URL;

  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || "Υπάρχει νέο αίτημα πρόσβασης για έγκριση.",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: payload.tag || "pantavion-water-admin-alert",
      data: {
        url,
      },
      actions: [
        {
          action: "open",
          title: "Άνοιγμα Administrator",
        },
      ],
      vibrate: [250, 120, 250, 120, 400],
      renotify: true,
      requireInteraction: true,
      silent: false,
      timestamp: Date.now(),
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const relativeUrl = event.notification.data?.url || WATER_ADMIN_URL;
  const targetUrl = new URL(relativeUrl, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then(async (windowClients) => {
        for (const client of windowClients) {
          if (new URL(client.url).origin === self.location.origin) {
            await client.navigate(targetUrl);
            return client.focus();
          }
        }

        return self.clients.openWindow(targetUrl);
      }),
  );
});
