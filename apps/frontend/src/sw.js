self.addEventListener('push', async (e) => {
  const { message, body, icon } = JSON.parse(e.data.text());

  e.waitUntil(
    self.registration.showNotification(message, {
      body,
      icon,
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    }),
  );
});
