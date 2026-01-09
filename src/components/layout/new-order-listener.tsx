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
  const { addPendingOrder } = useNotificationStore();

  // Using a ref to track the initial load timestamp
  const initialLoadTimestamp = useRef<Timestamp | null>(null);

  useEffect(() => {
    // Set the timestamp only once on component mount
    if (!initialLoadTimestamp.current) {
        initialLoadTimestamp.current = Timestamp.now();
    }
    
    // Pre-load the audio file
    if (typeof Audio !== 'undefined' && !audioRef.current) {
      audioRef.current = new Audio('/sounds/notification.mp3');
      audioRef.current.load(); // Pre-loads the audio
      // We don't try to play it here, just get it ready.
    }
  }, []);

  useEffect(() => {
    if (!firestore || !storefrontUserId) {
      return;
    }

    // Query for transactions from the storefront user that are newer than the component mount time.
    // We will filter for 'pending' status on the client side to avoid needing a composite index.
    const q = query(
      collection(firestore, `artifacts/docuras-da-fran-default/users/${storefrontUserId}/transactions`),
      where('timestamp', '>', initialLoadTimestamp.current || Timestamp.now())
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            const newOrder = change.doc.data() as Transaction;
            // Client-side filtering for status
            if (change.type === 'added' && newOrder.status === 'pending') {

                // Play sound
                if (audioRef.current) {
                  audioRef.current.play().catch(error => {
                    // This error is common if the user hasn't interacted with the page yet.
                    // We can safely ignore it. The visual notification will still appear.
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

    }, (error) => {
      console.error("Erro ao escutar novos pedidos:", error);
    });

    return () => unsubscribe();
  }, [firestore, toast, addPendingOrder, router]);

  return null;
}
