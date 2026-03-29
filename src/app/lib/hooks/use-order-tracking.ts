'use client';
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import type { Transaction } from '@/app/lib/types';
import { APP_ID } from '../constants';
import { useFirestore } from '@/firebase';

export function useOrderTracking(transactionId: string | null, userId: string | null) {
  const firestore = useFirestore();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!firestore || !transactionId || !userId) {
      setLoading(false);
      setTransaction(null);
      return;
    }

    setLoading(true);
    const docPath = `artifacts/${APP_ID}/users/${userId}/transactions/${transactionId}`;
    const docRef = doc(firestore, docPath);

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setTransaction({ ...docSnap.data() as Omit<Transaction, 'id'>, id: docSnap.id });
        } else {
          setTransaction(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error tracking order:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, transactionId, userId]);

  return { transaction, loading, error };
}
