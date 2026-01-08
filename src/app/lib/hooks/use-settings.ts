'use client';

import { useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import type { AppSettings } from '@/app/lib/types';
import { APP_ID } from '../constants';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useFirestore, useMemoFirebase } from '@/firebase';

export function useSettings() {
  const firestore = useFirestore();
  const [isUpdating, setIsUpdating] = useState(false);

  const settingsDocRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, `artifacts/${APP_ID}/settings`, 'app');
  }, [firestore]);

  const { data: settings, isLoading, error } = useDoc<AppSettings>(settingsDocRef);

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    if (!settingsDocRef) return;
    setIsUpdating(true);
    try {
      await setDoc(settingsDocRef, newSettings, { merge: true });
    } catch (e) {
      console.error("Failed to update settings:", e);
      // You might want to throw the error or handle it with a toast
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    if (error) {
      console.error("Error fetching settings: ", error);
      // Handle error, e.g., show a toast
    }
  }, [error]);

  return { settings, loading: isLoading, error, updateSettings, isUpdating };
}
