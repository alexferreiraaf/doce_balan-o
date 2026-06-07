'use client';

import { useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { getFirebaseMessaging } from '@/firebase/messaging';
import { getToken } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { APP_ID } from '@/app/lib/constants';

export function PushNotificationSetup() {
  const { user } = useUser();
  const firestore = useFirestore();

  useEffect(() => {
    if (!user || !firestore) return;

    const setupNotifications = async () => {
      try {
        // Only request if not already denied
        if (Notification.permission === 'denied') return;

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const messaging = await getFirebaseMessaging();
          if (messaging) {
            const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
            if (!vapidKey) {
                console.warn('⚠️ NEXT_PUBLIC_FIREBASE_VAPID_KEY is missing. Cannot get push token.');
                return;
            }

            const registration = await navigator.serviceWorker.ready;
            const currentToken = await getToken(messaging, { 
                vapidKey,
                serviceWorkerRegistration: registration
            });

            if (currentToken) {
              const userRef = doc(firestore, `artifacts/${APP_ID}/users/${user.uid}`);
              await updateDoc(userRef, {
                fcmTokens: arrayUnion(currentToken)
              });
              console.log('✅ Push notifications configured for this device.');
            }
          }
        }
      } catch (error) {
        console.error('❌ Error setting up push notifications:', error);
      }
    };

    setupNotifications();
  }, [user, firestore]);

  return null;
}
