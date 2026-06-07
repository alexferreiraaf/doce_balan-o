'use client';

import { initializeFirebase } from './index';
import { getMessaging, Messaging, isSupported } from 'firebase/messaging';

let messaging: Messaging | null = null;

export const getFirebaseMessaging = async (): Promise<Messaging | null> => {
  if (messaging) return messaging;
  try {
    const isSupportedBrowser = await isSupported();
    if (isSupportedBrowser) {
        const { firebaseApp } = initializeFirebase();
        messaging = getMessaging(firebaseApp);
        return messaging;
    }
    return null;
  } catch (error) {
    console.error("Firebase Messaging not supported", error);
    return null;
  }
};
