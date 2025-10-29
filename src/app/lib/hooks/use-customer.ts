'use client';
import { useState, useEffect } from 'react';
import { doc } from 'firebase/firestore';
import type { Customer } from '@/app/lib/types';
import { APP_ID } from '../constants';
import { useToast } from '@/hooks/use-toast';
import { useDoc } from '@/firebase/firestore/use-doc';
import { useFirestore, useMemoFirebase } from '@/firebase';

export function useCustomer(customerId: string) {
  const firestore = useFirestore();
  const [loading, setLoading] = useState(true);

  const customerQuery = useMemoFirebase(() => {
    if (!firestore || !customerId) return null;
    return doc(firestore, `artifacts/${APP_ID}/customers`, customerId);
  }, [firestore, customerId]);

  const { data: customer, isLoading: customerLoading, error } = useDoc<Customer>(customerQuery);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(customerLoading);
  }, [customerLoading]);
  
  useEffect(() => {
    if (error) {
      console.error("Error fetching customer: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar cliente",
        description: "Não foi possível buscar os dados do cliente. Tente recarregar a página.",
      });
    }
  }, [error, toast]);

  return { customer, loading };
}
