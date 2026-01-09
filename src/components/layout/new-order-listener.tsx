'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { storefrontUserId } from '@/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { BellRing } from 'lucide-react';
import { useNotificationStore } from '@/stores/notification-store';
import { ToastAction } from "@/components/ui/toast"
import type { Transaction } from '@/app/lib/types';


export function NewOrderListener() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const setPendingOrdersCount = useNotificationStore((state) => state.setPendingOrdersCount);
  const addPendingOrder = useNotificationStore((state) => state.addPendingOrder);

  // Using a ref to track the initial load timestamp
  const initialLoadTimestamp = useRef<Timestamp | null>(null);

  useEffect(() => {
    // Set the timestamp only once on component mount
    if (!initialLoadTimestamp.current) {
        initialLoadTimestamp.current = Timestamp.now();
    }
    
    // Pre-load the audio file
    fetch('/sounds/notification.mp3')
      .then(response => {
        if (response.ok && typeof Audio !== 'undefined') {
          if (!audioRef.current) {
            audioRef.current = new Audio('/sounds/notification.mp3');
            audioRef.current.load();
          }
        } else if (response.status === 404) {
          console.warn("Arquivo de áudio '/sounds/notification.mp3' não encontrado. As notificações sonoras estão desativadas.");
        }
      })
      .catch(() => {
        console.warn("Não foi possível verificar o arquivo de áudio. As notificações sonoras podem estar desativadas.");
      });
  }, []);

  useEffect(() => {
    if (!firestore || !storefrontUserId) {
      return;
    }

    // Query for pending transactions from the storefront user
    const q = query(
      collection(firestore, `artifacts/docuras-da-fran-default/users/${storefrontUserId}/transactions`),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        // On initial load, or when there are no changes, just set the total count
        setPendingOrdersCount(snapshot.size);

        snapshot.docChanges().forEach((change) => {
            const newOrder = change.doc.data() as Transaction;
            const orderTimestamp = newOrder.timestamp as Timestamp;

            // Only act on newly added documents that are newer than the initial page load
            if (change.type === 'added' && initialLoadTimestamp.current && orderTimestamp > initialLoadTimestamp.current) {

                // Play sound
                audioRef.current?.play().catch(error => {
                    console.error("Falha ao tocar áudio:", error);
                });

                // Show toast notification
                toast({
                    title: (
                    <div className="flex items-center gap-2">
                        <BellRing className="h-5 w-5 text-primary" />
                        <span className="font-bold">Novo Pedido Recebido!</span>
                    </div>
                    ),
                    description: `Novo pedido: ${newOrder.description}. Valor: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(newOrder.amount)}`,
                    duration: 20000, // Increase duration to give time to click
                    action: newOrder.customerId ? (
                        <ToastAction altText="Ver Pedido" onClick={() => router.push(`/customers/${newOrder.customerId}`)}>
                            Ver Pedido
                        </ToastAction>
                    ) : undefined,
                });

                // Increment visual badge counter
                addPendingOrder();
            }
        });

    }, (error) => {
      console.error("Erro ao escutar novos pedidos:", error);
    });

    return () => unsubscribe();
  }, [firestore, toast, setPendingOrdersCount, addPendingOrder, router]);

  return null;
}
