/// <reference lib="webworker" />

// This is needed to make TypeScript happy about the service worker context.
declare const self: ServiceWorkerGlobalScope;

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data.payload;
    
    // The event must be extended until the notification is shown.
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});

// This listener handles what happens when a user clicks the notification.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const targetUrl = '/store-orders';

  // This focuses the PWA if it's open, or opens it if it's closed.
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it.
      for (const client of clientList) {
        const url = new URL(client.url);
        if (url.pathname === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one to the store orders page.
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
