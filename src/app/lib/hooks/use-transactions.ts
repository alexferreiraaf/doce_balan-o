'use client';
import { useState, useEffect, useMemo } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { useAuth } from './use-auth';
import type { Transaction } from '@/app/lib/types';
import { APP_ID } from '../constants';
import { useFirestore, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';

interface UseTransactionsOptions {
  userIds?: (string | undefined)[]; // Allow undefined/null values
}

export function useTransactions(options: UseTransactionsOptions = {}) {
  const { userId, isAuthReady } = useAuth();
  const firestore = useFirestore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const targetUserIds = useMemo(() => {
    // Filter out any null/undefined ids and remove duplicates
    const allIds = (options.userIds && options.userIds.length > 0) ? options.userIds : [userId];
    return [...new Set(allIds.filter(id => !!id))] as string[];
  }, [options.userIds, userId]);


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

    const fetchTransactions = async () => {
      const allFetchedTransactions: Transaction[] = [];
      let hasError = false;

      for (const currentUserId of targetUserIds) {
        try {
          const transCollectionPath = `artifacts/${APP_ID}/users/${currentUserId}/transactions`;
          const transCollectionRef = collection(firestore, transCollectionPath);
          const q = query(transCollectionRef);
          
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((doc) => {
            allFetchedTransactions.push({ ...(doc.data() as Omit<Transaction, 'id'>), id: doc.id });
          });
        } catch (error) {
          hasError = true;
          console.error(`Caught error in useTransactions for userId ${currentUserId}:`, error);
          // Emit a specific, contextual error for this failed part of the fetch.
          errorEmitter.emit('permission-error', new FirestorePermissionError({
              path: `artifacts/${APP_ID}/users/${currentUserId}/transactions`,
              operation: 'list',
              requestResourceData: { queriedUserId: currentUserId }
          }));
          // We break the loop on the first error to avoid spamming errors.
          break;
        }
      }
      
      if (!hasError) {
        allFetchedTransactions.sort((a, b) => b.dateMs - a.dateMs);
        setTransactions(allFetchedTransactions);
      } else {
        setTransactions([]); // Clear data on error
      }
      
      setLoading(false);
    };

    fetchTransactions();

  }, [firestore, isAuthReady, targetUserIds]);


  return { transactions, loading };
}
