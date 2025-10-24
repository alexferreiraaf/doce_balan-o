'use client';
import { useState, useEffect } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useAuth } from './use-auth';
import type { Customer } from '@/app/lib/types';
import { APP_ID } from '../constants';
import { useToast } from '@/hooks/use-toast';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useMemoFirebase } from '@/firebase';

export function useCustomers() {
  const { userId, isAuthReady } = useAuth();
  const firestore = useFirestore();
  const [loading, setLoading] = useState(true);

  const customersQuery = useMemoFirebase(() => {
    if (!userId) return null;
    return query(
      collection(firestore, `artifacts/${APP_ID}/users/${userId}/customers`),
      orderBy('name', 'asc')
    );
  }, [firestore, userId]);

  const { data: customers, isLoading: customersLoading, error } = useCollection<Customer>(customersQuery);
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthReady) {
      setLoading(true);
      return;
    }
    setLoading(customersLoading);
  }, [isAuthReady, customersLoading]);
  
  useEffect(() => {
    if (error) {
      console.error("Error fetching customers: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar clientes",
        description: "Não foi possível buscar seus clientes. Tente recarregar a página.",
      });
    }
  }, [error, toast]);

  return { customers: customers || [], loading };
}

    