'use client';
import { useState, useEffect } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useAuth } from './use-auth';
import type { Product } from '@/app/lib/types';
import { APP_ID } from '../constants';
import { useToast } from '@/hooks/use-toast';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useMemoFirebase } from '@/firebase';

export function useProducts() {
  const { userId, isAuthReady } = useAuth();
  const firestore = useFirestore();
  const [loading, setLoading] = useState(true);

  const productsQuery = useMemoFirebase(() => {
    if (!userId) return null;
    return query(
      collection(firestore, `artifacts/${APP_ID}/users/${userId}/products`),
      orderBy('name', 'asc')
    );
  }, [firestore, userId]);

  const { data: products, isLoading: productsLoading, error } = useCollection<Product>(productsQuery);
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthReady) {
      setLoading(true);
      return;
    }
    setLoading(productsLoading);
  }, [isAuthReady, productsLoading]);
  
  useEffect(() => {
    if (error) {
      console.error("Error fetching products: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar produtos",
        description: "Não foi possível buscar seus produtos. Tente recarregar a página.",
      });
    }
  }, [error, toast]);

  return { products: products || [], loading };
}
