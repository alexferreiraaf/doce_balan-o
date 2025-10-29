'use client';
import { useState, useEffect } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Product } from '@/app/lib/types';
import { APP_ID } from '../constants';
import { useToast } from '@/hooks/use-toast';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useMemoFirebase } from '@/firebase';

export function useProducts() {
  const firestore = useFirestore();
  const [loading, setLoading] = useState(true);

  // Query the public collection
  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, `artifacts/${APP_ID}/products`),
      orderBy('name', 'asc')
    );
  }, [firestore]);

  const { data: products, isLoading: productsLoading, error } = useCollection<Product>(productsQuery);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(productsLoading);
  }, [productsLoading]);
  
  useEffect(() => {
    if (error) {
      console.error("Error fetching products: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar produtos",
        description: "Não foi possível buscar os produtos. Verifique suas permissões ou tente novamente.",
      });
    }
  }, [error, toast]);

  return { products: products || [], loading };
}
