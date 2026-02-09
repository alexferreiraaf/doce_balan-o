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

  const showNotification = (order: Transaction) => {
    const title = 'Novo Pedido Recebido!';
    const body = `Pedido: ${order.description}\nValor: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.amount)}`;
    
    // Play sound regardless of notification type
    if (audioRef.current) {
      audioRef.current.play().catch(error => {
        console.log("Falha ao tocar áudio de notificação:", error.message);
      });
    }

    // Use system notification if permission is granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/icons/icon-192x192.png',
        tag: order.id, // Use a tag to prevent multiple notifications for the same order
      });

      notification.onclick = () => {
        window.focus();
        // You could also navigate: router.push('/store-orders');
      };
    }

    // Always show toast as an in-app indicator
    toast({
      title: (
        <div className="flex items-center gap-2">
          <BellRing className="h-5 w-5 text-primary" />
          <span className="font-bold">{title}</span>
        </div>
      ),
      description: `Novo pedido: ${order.description}. Valor: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.amount)}`,
      duration: 20000,
    });
  };

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
        if (change.type === 'added' && isInitialDataLoaded.current) {
          const newOrder = { id: change.doc.id, ...change.doc.data() } as Transaction;
          
          showNotification(newOrder);

          addPendingOrder();
        }
      });

      isInitialDataLoaded.current = true;

    }, (error) => {
      console.error("Erro ao escutar novos pedidos:", error);
    });

    return () => unsubscribe();
  }, [firestore, toast, addPendingOrder]);

  return null;
}
