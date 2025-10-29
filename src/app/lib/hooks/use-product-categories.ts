'use client';
import { useState, useEffect } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import type { ProductCategory } from '@/app/lib/types';
import { APP_ID } from '../constants';
import { useToast } from '@/hooks/use-toast';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useMemoFirebase } from '@/firebase';

export function useProductCategories() {
  const firestore = useFirestore();
  const [loading, setLoading] = useState(true);

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, `artifacts/${APP_ID}/product-categories`),
      orderBy('name', 'asc')
    );
  }, [firestore]);

  const { data: categories, isLoading: categoriesLoading, error } = useCollection<ProductCategory>(categoriesQuery);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(categoriesLoading);
  }, [categoriesLoading]);
  
  useEffect(() => {
    if (error) {
      console.error("Error fetching product categories: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar categorias",
        description: "Não foi possível buscar as categorias de produtos. Verifique suas permissões.",
      });
    }
  }, [error, toast]);

  return { categories: categories || [], loading };
}
