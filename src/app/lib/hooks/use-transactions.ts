'use client';
import { useState, useEffect } from 'react';
import { collection, query, orderBy, where, documentId } from 'firebase/firestore';
import { useAuth } from './use-auth';
import type { Transaction } from '@/app/lib/types';
import { APP_ID } from '../constants';
import { useToast } from '@/hooks/use-toast';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useMemoFirebase } from '@/firebase';

interface UseTransactionsOptions {
  userIds?: string[]; // Optional array of user IDs
}

export function useTransactions(options: UseTransactionsOptions = {}) {
  const { userId, isAuthReady } = useAuth();
  const firestore = useFirestore();
  const [loading, setLoading] = useState(true);

  const targetUserIds = useMemoFirebase(() => {
    if (options.userIds && options.userIds.length > 0) {
      return [...new Set(options.userIds)]; // Use provided user IDs, ensure uniqueness
    }
    if (userId) {
      return [userId]; // Default to the logged-in user
    }
    return [];
  }, [options.userIds, userId]);


  const transactionsQuery = useMemoFirebase(() => {
    if (targetUserIds.length === 0) return null;
    
    // As we can't query subcollections across different documents directly,
    // this logic assumes all storefront transactions are under ONE specific storefront user ID.
    // If we need to fetch from multiple users' subcollections, we'd need multiple hooks.
    // This implementation now targets a single user's subcollection, determined by the logic above.
    const primaryUserId = targetUserIds[0];

    return query(
      collection(firestore, `artifacts/${APP_ID}/users/${primaryUserId}/transactions`),
      orderBy('dateMs', 'desc')
    );
  }, [firestore, targetUserIds]);

  const { data: transactions, isLoading: transactionsLoading, error } = useCollection<Transaction>(transactionsQuery);

  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthReady) {
      setLoading(true);
      return;
    }
    setLoading(transactionsLoading);
  }, [isAuthReady, transactionsLoading]);
  
  useEffect(() => {
    if (error) {
      console.error("Error fetching transactions: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados",
        description: "Não foi possível buscar seus lançamentos. Verifique sua conexão e tente recarregar a página.",
      });
    }
  }, [error, toast]);

  return { transactions: transactions || [], loading };
}
