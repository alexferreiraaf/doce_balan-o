'use client';
import { useState, useEffect } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Optional } from '@/app/lib/types';
import { APP_ID } from '../constants';
import { useToast } from '@/hooks/use-toast';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useMemoFirebase } from '@/firebase';

export function useOptionals() {
  const firestore = useFirestore();
  const [loading, setLoading] = useState(true);

  const optionalsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, `artifacts/${APP_ID}/optionals`),
      orderBy('name', 'asc')
    );
  }, [firestore]);

  const { data: optionals, isLoading: optionalsLoading, error } = useCollection<Optional>(optionalsQuery);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(optionalsLoading);
  }, [optionalsLoading]);
  
  useEffect(() => {
    if (error) {
      console.error("Error fetching optionals: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar opcionais",
        description: "Não foi possível buscar os opcionais. Verifique suas permissões ou tente novamente.",
      });
    }
  }, [error, toast]);

  return { optionals: optionals || [], loading };
}
