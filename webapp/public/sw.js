// Service Worker for Push Notifications

self.addEventListener("push", (event) => {
  if (!event.data) {
    console.log("Push event but no data");
    return;
  }

  const data = event.data.json();

  const options = {
    body: data.body || "Nouveaux items disponibles",
    icon: data.icon || "/favicon.ico",
    badge: "/favicon.ico",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/",
    },
    actions: [
      {
        action: "open",
        title: "Voir",
      },
      {
        action: "close",
        title: "Fermer",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Everything Tierlist", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") {
    return;
  }

  const url = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Si une fenêtre est déjà ouverte, la focus
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Sinon ouvrir une nouvelle fenêtre
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Installation du Service Worker
self.addEventListener("install", (event) => {
  console.log("Service Worker installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activated");
  event.waitUntil(clients.claim());
});
