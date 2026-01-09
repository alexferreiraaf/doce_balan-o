'use client';

import { useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { storefrontUserId } from '@/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { BellRing } from 'lucide-react';

// This component will listen for new orders and show a notification.
// It doesn't render anything visible in the layout itself.
export function NewOrderListener() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // A ref to store the timestamp of the last seen order to avoid showing old orders on page load.
  const lastSeenTimestamp = useRef<Timestamp | null>(null);

  useEffect(() => {
    // Check if audio file exists before creating the Audio object
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

    // Query for new transactions from the storefront user, ordered by timestamp.
    // We start listening from the current time to avoid fetching all past orders.
    const q = query(
      collection(firestore, `artifacts/docuras-da-fran-default/users/${storefrontUserId}/transactions`),
      where('timestamp', '>', Timestamp.now()),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // We only care about new documents added since the listener was attached.
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const newOrder = change.doc.data();
          
          // Play sound if audio is available
          audioRef.current?.play().catch(error => {
            console.error("Audio play failed:", error);
            // This can happen if the user hasn't interacted with the page yet.
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
            duration: 10000, // Show for 10 seconds
          });
        }
      });
    }, (error) => {
      console.error("Error listening for new orders:", error);
      // Don't show toast for permission errors, as they can be noisy.
    });

    return () => unsubscribe(); // Cleanup listener on component unmount
  }, [firestore, toast]);

  return null; // This component does not render anything
}
