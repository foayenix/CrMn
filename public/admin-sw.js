// Service worker for the admin app only.
//
// It exists for one reason: to show the boss a notification when the floor
// flags something low. It caches nothing and has no fetch handler, so even
// though it registers at the origin root (a worker can't take a scope above
// its own path), it changes nothing about any page — and it only ever exists
// in the browser of someone who turned notifications on from /admin.
// The staff app is untouched by any of this.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Crescent Moon", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Crescent Moon";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      // A tag means a second alert replaces the first rather than stacking:
      // the boss gets the current state, not a pile.
      tag: data.tag || "crescent-moon",
      data: { url: data.url || "/admin/stock" },
      badge: "/icon-192.png",
      icon: "/icon-192.png",
      renotify: false,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/admin/stock";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Reuse a tab that's already open rather than piling up windows.
      for (const client of clients) {
        if (client.url.includes("/admin") && "focus" in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
