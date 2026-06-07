import { NextResponse } from 'next/server';
import { firebaseConfig } from '@/firebase/config';

export async function GET() {
  const script = `
    importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js');

    const firebaseConfig = ${JSON.stringify(firebaseConfig)};

    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    // The FCM SDK automatically displays background notifications if the payload contains a "notification" object.
    // We only listen to onBackgroundMessage for logging or custom data-only payloads.
    messaging.onBackgroundMessage((payload) => {
      console.log('[firebase-messaging-sw.js] Received background message', payload);
      // We DO NOT call self.registration.showNotification here because FCM SDK already does it for us.
    });
  `;

  return new NextResponse(script, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
