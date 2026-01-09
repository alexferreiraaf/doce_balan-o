'use client';

import { useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { storefrontUserId } from '@/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { BellRing } from 'lucide-react';
import { useNotificationStore } from '@/stores/notification-store';

export function NewOrderListener() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const setPendingOrdersCount = useNotificationStore((state) => state.setPendingOrdersCount);
  
  useEffect(() => {
    fetch('/sounds/notification.mp3')
      .then(response => {
        if (response.ok && typeof Audio !== 'undefined') {
          audioRef.current = new Audio('/sounds/notification.mp3');
          audioRef.current.load();
        } else {
            console.warn("Audio file /sounds/notification.mp3 not found. Sound notifications will be disabled.");
        }
      })
      .catch(() => {
        console.warn("Could not check for audio file. Sound notifications might be disabled.");
      });
  }, []);

  useEffect(() => {
    if (!firestore || !storefrontUserId) {
      return;
    }

    const q = query(
      collection(firestore, `artifacts/docuras-da-fran-default/users/${storefrontUserId}/transactions`),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingOrdersCount(snapshot.size);

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const newOrder = change.doc.data();
          
          audioRef.current?.play().catch(error => {
            console.error("Audio play failed:", error);
          });
          
          toast({
            title: (
              <div className="flex items-center gap-2">
                <BellRing className="h-5 w-5 text-primary" />
                <span className="font-bold">Novo Pedido Recebido!</span>
              </div>
            ),
            description: `Novo pedido: ${newOrder.description}. Valor: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(newOrder.amount)}`,
            duration: 10000,
          });
        }
      });
    }, (error) => {
      console.error("Error listening for new orders:", error);
    });

    return () => unsubscribe();
  }, [firestore, toast, setPendingOrdersCount]);

  return null;
}
