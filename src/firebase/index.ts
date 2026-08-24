'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, memoryLocalCache } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';


function getFirebaseServices(firebaseApp: FirebaseApp): {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
} {
  let firestore: Firestore;
  if (typeof window !== 'undefined') {
    try {
      const cache = process.env.NODE_ENV === 'development' 
        ? memoryLocalCache() 
        : persistentLocalCache({ tabManager: persistentMultipleTabManager() });
        
      firestore = initializeFirestore(firebaseApp, {
        localCache: cache
      });
    } catch (e) {
      // Falha se getFirestore/initializeFirestore já foi chamado (ex: hot reload)
      firestore = getFirestore(firebaseApp);
    }
  } else {
    firestore = getFirestore(firebaseApp);
  }

  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore,
    storage: getStorage(firebaseApp),
  };
}

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    // Always initialize with the config to ensure it works in all environments.
    const firebaseApp = initializeApp(firebaseConfig);
    return getFirebaseServices(firebaseApp);
  }

  // If already initialized, return the SDKs with the already initialized App
  return getFirebaseServices(getApp());
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
