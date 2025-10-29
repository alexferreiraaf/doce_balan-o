'use client';
import { useState, useEffect } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Customer } from '@/app/lib/types';
import { APP_ID } from '../constants';
import { useToast } from '@/hooks/use-toast';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useMemoFirebase } from '@/firebase';

export function useCustomers() {
  const firestore = useFirestore();
  const [loading, setLoading] = useState(true);

  // Query the public collection
  const customersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, `artifacts/${APP_ID}/customers`),
      orderBy('name', 'asc')
    );
  }, [firestore]);

  const { data: customers, isLoading: customersLoading, error } = useCollection<Customer>(customersQuery);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(customersLoading);
  }, [customersLoading]);
  
  useEffect(() => {
    if (error) {
      console.error("Error fetching customers: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar clientes",
        description: "Não foi possível buscar os clientes. Verifique suas permissões ou tente novamente.",
      });
    }
  }, [error, toast]);

  return { customers: customers || [], loading };
}
