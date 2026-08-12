// เฝ้าเดี่ยว reminder push notifications (grill-me follow-up, 2026-08-12).
//
// Loaded into the vite-plugin-pwa-generated service worker via Workbox's
// `importScripts` option (see vite.config.ts) — plain JS, copied verbatim
// from public/ into the build output, no bundling step involved. This
// deliberately avoids vite-plugin-pwa's injectManifest strategy, whose
// nested Vite/Rolldown build to bundle a custom TS service worker currently
// errors on this project's Vite 8 install (see vite.config.ts for the full
// explanation). Runs in the service worker global scope, same as the
// generated sw.js that imports it — `self`, `caches`, `clients`, etc. are
// all available here without any imports.

self.addEventListener("push", function (event) {
  var payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : undefined };
  }

  var title = payload.title || "เฝ้าเดี่ยว";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || "อย่าลืมส่งเฝ้าเดี่ยววันนี้นะ",
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      data: { url: payload.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var url =
    (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        for (var i = 0; i < clientList.length; i++) {
          if ("focus" in clientList[i]) {
            return clientList[i].focus();
          }
        }
        return self.clients.openWindow(url);
      }),
  );
});
