'use client';
import { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, where, getDocs, collectionGroup } from 'firebase/firestore';
import { useAuth } from './use-auth';
import type { Transaction } from '@/app/lib/types';
import { APP_ID } from '../constants';
import { useToast } from '@/hooks/use-toast';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useMemoFirebase } from '@/firebase';

interface UseTransactionsOptions {
  userIds?: (string | undefined)[]; // Allow undefined/null values
}

export function useTransactions(options: UseTransactionsOptions = {}) {
  const { userId, isAuthReady } = useAuth();
  const firestore = useFirestore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
      try {
        const allFetchedTransactions: Transaction[] = [];
        // Firestore 'in' query is limited to 30 items. We fetch in chunks if needed.
        const chunkSize = 30;
        for (let i = 0; i < targetUserIds.length; i += chunkSize) {
            const chunkUserIds = targetUserIds.slice(i, i + chunkSize);
            
            const q = query(
              collectionGroup(firestore, 'transactions'),
              where('userId', 'in', chunkUserIds)
            );
            
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
              // Note: This fetches data once. For real-time, you'd need multiple onSnapshot listeners,
              // which is more complex to manage here. A single fetch is safer and often sufficient.
              allFetchedTransactions.push({ ...(doc.data() as Omit<Transaction, 'id'>), id: doc.id });
            });
        }
        
        allFetchedTransactions.sort((a, b) => b.dateMs - a.dateMs);
        setTransactions(allFetchedTransactions);

      } catch (error) {
        console.error("Error fetching transactions for multiple users: ", error);
        toast({
          variant: "destructive",
          title: "Erro ao carregar dados",
          description: "Não foi possível buscar os lançamentos. Verifique sua conexão e tente recarregar a página.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();

    // The dependency array should react to changes in the calculated user IDs.
  }, [firestore, isAuthReady, targetUserIds, toast]);


  return { transactions, loading };
}
