'use client';
import { useState, useEffect, useMemo } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
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


  useEffect(() => {
    // Don't run if the auth state isn't ready or firestore is not available.
    if (!firestore || !isAuthReady) {
      setLoading(true);
      return;
    }

    // If there are no valid user IDs to fetch for, we can stop loading and show empty.
    if (targetUserIds.length === 0) {
      setTransactions([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);

    const fetchAllTransactions = async () => {
      const allFetchedTransactions: Transaction[] = [];
      let fetchError: Error | null = null;

      // Create a promise for each user ID's transaction fetch
      const fetchPromises = targetUserIds.map(async (currentUserId) => {
        try {
          const transCollectionPath = `artifacts/${APP_ID}/users/${currentUserId}/transactions`;
          const transCollectionRef = collection(firestore, transCollectionPath);
          const q = query(transCollectionRef);
          
          const querySnapshot = await getDocs(q);
          const userTransactions: Transaction[] = [];
          querySnapshot.forEach((doc) => {
            userTransactions.push({ ...(doc.data() as Omit<Transaction, 'id'>), id: doc.id });
          });
          return userTransactions;

        } catch (err: any) {
          console.error(`Error fetching transactions for userId ${currentUserId}:`, err);
          // Create and emit a contextual error for debugging security rules.
          const permissionError = new FirestorePermissionError({
              path: `artifacts/${APP_ID}/users/${currentUserId}/transactions`,
              operation: 'list',
              requestResourceData: { queriedUserId: currentUserId }
          });
          errorEmitter.emit('permission-error', permissionError);
          // Set the error state and throw it to stop Promise.all
          fetchError = permissionError;
          throw permissionError;
        }
      });
      
      try {
        // Wait for all fetches to complete
        const results = await Promise.all(fetchPromises);
        
        // Flatten the array of arrays into a single array
        const combinedTransactions = results.flat();
        
        // Sort all transactions together by date
        combinedTransactions.sort((a, b) => b.dateMs - a.dateMs);
        
        setTransactions(combinedTransactions);

      } catch (err: any) {
        // This will catch the first error thrown from any of the promises
        setError(err);
        setTransactions([]); // Clear data on error
      } finally {
        setLoading(false);
      }
    };

    fetchAllTransactions();

  // Use a stringified version of targetUserIds for stable dependency checking.
  }, [firestore, isAuthReady, JSON.stringify(targetUserIds)]);


  return { transactions, loading, error };
}
