'use client';

import { useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { storefrontUserId } from '@/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { BellRing } from 'lucide-react';
import { useNotificationStore } from '@/stores/notification-store';
import type { Transaction } from '@/app/lib/types';


export function NewOrderListener() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { addPendingOrder } = useNotificationStore();
  const isInitialDataLoaded = useRef(false);

  useEffect(() => {
    // Pre-load the audio file
    if (typeof Audio !== 'undefined' && !audioRef.current) {
      audioRef.current = new Audio('/sounds/notification.mp3');
      audioRef.current.load();
    }
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
      snapshot.docChanges().forEach((change) => {
        // Only act on new documents added *after* the initial data is loaded.
        if (change.type === 'added' && isInitialDataLoaded.current) {
          const newOrder = change.doc.data() as Transaction;

          // Play sound
          if (audioRef.current) {
            audioRef.current.play().catch(error => {
              console.log("Falha ao tocar áudio de notificação (geralmente por falta de interação do usuário):", error.message);
            });
          }

          // Show toast notification
          toast({
            title: (
              <div className="flex items-center gap-2">
                <BellRing className="h-5 w-5 text-primary" />
                <span className="font-bold">Novo Pedido Recebido!</span>
              </div>
            ),
            description: `Novo pedido: ${newOrder.description}. Valor: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(newOrder.amount)}`,
            duration: 20000,
          });

          // Increment visual badge counter
          addPendingOrder();
        }
      });

      // After the first snapshot is processed (even if it's empty),
      // we can mark the initial data as loaded.
      isInitialDataLoaded.current = true;

    }, (error) => {
      console.error("Erro ao escutar novos pedidos:", error);
    });

    return () => unsubscribe();
  }, [firestore, toast, addPendingOrder]);

  return null;
}
