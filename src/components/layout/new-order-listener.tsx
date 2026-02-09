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
  const { addPendingOrder, newOrdersBadgeCount } = useNotificationStore();
  const isInitialDataLoaded = useRef(false);

  useEffect(() => {
    // Pre-load the audio file
    if (typeof Audio !== 'undefined' && !audioRef.current) {
      audioRef.current = new Audio('/sounds/notification.mp3');
      audioRef.current.load();
    }
  }, []);

  // Effect to update the app badge
  useEffect(() => {
    if (typeof window !== 'undefined' && 'setAppBadge' in navigator) {
        if (newOrdersBadgeCount > 0) {
            (navigator as any).setAppBadge(newOrdersBadgeCount).catch((error: any) => {
              console.error('Failed to set app badge:', error);
            });
        } else {
            (navigator as any).clearAppBadge().catch((error: any) => {
              console.error('Failed to clear app badge:', error);
            });
        }
    }
  }, [newOrdersBadgeCount]);


  const showNotification = (order: Transaction) => {
    const title = 'Novo Pedido Recebido!';
    const body = `Pedido: ${order.description}\nValor: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.amount)}`;
    
    if (audioRef.current) {
      audioRef.current.play().catch(error => {
        console.log("Falha ao tocar áudio de notificação:", error.message);
      });
    }

    // Post message to service worker to show the notification from a more robust context
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        if(registration.active) {
            registration.active.postMessage({
              type: 'SHOW_NOTIFICATION',
              payload: {
                  title,
                  options: {
                      body,
                      icon: '/icons/icon-192x192.png',
                      tag: order.id,
                      badge: '/icons/icon-96x96.png' // Badge for Android notifications
                  }
              }
            });
          }
      });
    } else {
        // Fallback for when service worker isn't active/supported
        try {
            if ('Notification' in window && Notification.permission === 'granted') {
                const notification = new Notification(title, {
                    body,
                    icon: '/icons/icon-192x192.png',
                    tag: order.id,
                });
                notification.onclick = () => {
                    window.focus();
                };
            }
        } catch (error) {
            console.error("Falha ao exibir notificação do sistema (fallback):", error);
        }
    }

    // Always show toast as an in-app indicator when the app is active
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

      // After the initial data is loaded and processed, set the flag
      if (!isInitialDataLoaded.current) {
        isInitialDataLoaded.current = true;
      }

    }, (error) => {
      console.error("Erro ao escutar novos pedidos:", error);
    });

    return () => unsubscribe();
  }, [firestore, toast, addPendingOrder]);

  return null;
}
