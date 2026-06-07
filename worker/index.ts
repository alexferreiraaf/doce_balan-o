/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// @ts-ignore
firebase.initializeApp(firebaseConfig);
// @ts-ignore
const messaging = firebase.messaging();

// Firebase will automatically display background notifications if "notification" is in the payload.
// We optionally catch it just to log, but we don't manually call showNotification to avoid duplicates.
messaging.onBackgroundMessage((payload: any) => {
  console.log('[worker/index.ts] Received background message ', payload);
});
