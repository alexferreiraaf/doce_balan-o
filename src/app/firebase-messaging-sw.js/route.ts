import { NextResponse } from 'next/server';
import { firebaseConfig } from '@/firebase/config';

export async function GET() {
  const script = `
    importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js');

    const firebaseConfig = ${JSON.stringify(firebaseConfig)};

    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message ', payload);
      const notificationTitle = payload.notification?.title || 'Nova Notificação';
      const notificationOptions = {
        body: payload.notification?.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png'
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  `;

  return new NextResponse(script, {
    headers: {
      'Content-Type': 'application/javascript',
    },
  });
}
