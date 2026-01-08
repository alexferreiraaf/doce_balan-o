'use client';
import { useState, useEffect } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import type { DeliveryZone } from '@/app/lib/types';
import { APP_ID } from '../constants';
import { useToast } from '@/hooks/use-toast';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useFirestore, useMemoFirebase } from '@/firebase';

export function useDeliveryZones() {
  const firestore = useFirestore();
  const [loading, setLoading] = useState(true);

  const zonesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, `artifacts/${APP_ID}/delivery-zones`),
      orderBy('name', 'asc')
    );
  }, [firestore]);

  const { data: zones, isLoading: zonesLoading, error } = useCollection<DeliveryZone>(zonesQuery);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(zonesLoading);
  }, [zonesLoading]);
  
  useEffect(() => {
    if (error) {
      console.error("Error fetching delivery zones: ", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar zonas de entrega",
        description: "Não foi possível buscar os dados. Verifique suas permissões.",
      });
    }
  }, [error, toast]);

  return { deliveryZones: zones || [], loading };
}
