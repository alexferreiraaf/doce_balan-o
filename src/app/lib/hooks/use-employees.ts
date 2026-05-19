'use client';
import { useState, useEffect } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Employee } from '@/app/lib/types';
import { APP_ID } from '../constants';
import { useToast } from '@/hooks/use-toast';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useMemoFirebase } from '@/firebase';

export function useEmployees() {
  const firestore = useFirestore();
  const [loading, setLoading] = useState(true);

  const employeesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, `artifacts/${APP_ID}/employees`),
      orderBy('name', 'asc')
    );
  }, [firestore]);

  const { data: employees, isLoading: employeesLoading, error } = useCollection<Employee>(employeesQuery);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(employeesLoading);
  }, [employeesLoading]);
  
  useEffect(() => {
    if (error) {
      console.error("Error fetching employees: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar funcionários",
        description: "Não foi possível buscar os funcionários. Verifique suas permissões ou tente novamente.",
      });
    }
  }, [error, toast]);

  return { employees: employees || [], loading };
}
