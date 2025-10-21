'use client';
import { useState, useEffect } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useAuth } from './use-auth';
import type { Transaction } from '@/app/lib/types';
import { APP_ID } from '../constants';
import { useToast } from '@/hooks/use-toast';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useMemoFirebase } from '@/firebase';

export function useTransactions() {
  const { userId, isAuthReady } = useAuth();
  const firestore = useFirestore();
  const [loading, setLoading] = useState(true);

  const transactionsQuery = useMemoFirebase(() => {
    if (!userId) return null;
    return query(
      collection(firestore, `artifacts/${APP_ID}/users/${userId}/transactions`),
      orderBy('dateMs', 'desc')
    );
  }, [firestore, userId]);

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
