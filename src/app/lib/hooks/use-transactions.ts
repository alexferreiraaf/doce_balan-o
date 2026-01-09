'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { collection, query, onSnapshot, Unsubscribe, DocumentData } from 'firebase/firestore';
import { useAuth } from './use-auth';
import type { Transaction } from '@/app/lib/types';
import { APP_ID } from '../constants';
import { useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';

interface UseTransactionsOptions {
  userIds?: (string | undefined)[]; // Allow undefined/null values
}

export function useTransactions(options: UseTransactionsOptions = {}) {
  const { userId: authUserId, isAuthReady } = useAuth();
  const firestore = useFirestore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const targetUserIds = useMemo(() => {
    const allIds = (options.userIds && options.userIds.length > 0) ? options.userIds : [authUserId];
    return [...new Set(allIds.filter(id => !!id))] as string[];
  }, [options.userIds, authUserId]);

  // Ref to hold all transactions from all listeners
  const allTransactionsRef = useRef<Record<string, Transaction[]>>({});

  useEffect(() => {
    if (!firestore || !isAuthReady) {
      setLoading(true);
      return;
    }
    
    if (targetUserIds.length === 0) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    allTransactionsRef.current = {}; // Reset on user change

    const unsubscribes: Unsubscribe[] = targetUserIds.map((userId) => {
      const transCollectionPath = `artifacts/${APP_ID}/users/${userId}/transactions`;
      const q = query(collection(firestore, transCollectionPath));

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const userTransactions: Transaction[] = [];
          querySnapshot.forEach((doc) => {
            userTransactions.push({ ...(doc.data() as Omit<Transaction, 'id'>), id: doc.id });
          });

          // Update the part of the state for this user
          allTransactionsRef.current[userId] = userTransactions;

          // Combine all transactions from all listeners
          const combined = Object.values(allTransactionsRef.current).flat();
          combined.sort((a, b) => b.dateMs - a.dateMs);
          
          setTransactions(combined);
          setError(null); // Clear previous errors on successful fetch
          setLoading(false); // We have data, so not loading anymore
        },
        (err) => {
          console.error(`Error listening to transactions for userId ${userId}:`, err);
          const permissionError = new FirestorePermissionError({
            path: transCollectionPath,
            operation: 'list',
            requestResourceData: { queriedUserId: userId },
          });
          errorEmitter.emit('permission-error', permissionError);
          setError(permissionError);
          setLoading(false);
        }
      );
      return unsubscribe;
    });

    // Cleanup function to unsubscribe from all listeners
    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [firestore, isAuthReady, JSON.stringify(targetUserIds)]);

  return { transactions, loading, error };
}
