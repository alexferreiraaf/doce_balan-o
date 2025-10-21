'use client';
import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { useAuth } from './use-auth';
import type { Transaction } from '@/app/lib/types';
import { APP_ID } from '../constants';
import { useToast } from '@/hooks/use-toast';

export function useTransactions() {
  const { userId, isAuthReady } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthReady) {
      // Still waiting for auth state to be ready
      return;
    }

    if (!userId) {
      setLoading(false);
      setTransactions([]);
      return;
    }

    setLoading(true);
    const collectionPath = `artifacts/${APP_ID}/users/${userId}/transactions`;
    const q = query(collection(db, collectionPath), orderBy('dateMs', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedTransactions = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Transaction[];
        setTransactions(fetchedTransactions);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching transactions: ", error);
        toast({
          variant: "destructive",
          title: "Erro ao carregar dados",
          description: "Não foi possível buscar seus lançamentos. Verifique sua conexão e tente recarregar a página.",
        })
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, isAuthReady, toast]);

  return { transactions, loading };
}
