'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import Loading from './loading-component';
import { Navbar } from '@/components/layout/navbar';
import { cn } from '@/lib/utils';
import { collection, query, where, onSnapshot }from 'firebase/firestore';
import { APP_ID } from '@/app/lib/constants';
import type { Transaction } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const firestore = useFirestore();
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [notifiedOrderIds] = useState(() => new Set<string>());


  useEffect(() => {
    if (isUserLoading) {
      return; 
    }
    if (!user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    const listener = () => setHasInteracted(true);
    window.addEventListener('click', listener, { once: true });
    return () => window.removeEventListener('click', listener);
  }, []);

  const pendingOrdersQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, `artifacts/${APP_ID}/users/${user.uid}/transactions`),
      where('status', '==', 'pending')
    );
  }, [firestore, user]);

  useEffect(() => {
    if (!pendingOrdersQuery) return;

    const unsubscribe = onSnapshot(pendingOrdersQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const orderId = change.doc.id;

        if (change.type === 'added' && !notifiedOrderIds.has(orderId)) {
            const newOrder = change.doc.data() as Transaction;
            toast({
              title: '🎉 Novo Pedido Recebido!',
              description: `${newOrder.description}. Valor: ${formatCurrency(newOrder.amount)}`,
              duration: 10000, 
            });

            notifiedOrderIds.add(orderId);

            if (hasInteracted) {
                audioRef.current?.play().catch(error => {
                    console.warn("Audio playback failed:", error);
                });
            }
        }
      });
    });

    return () => unsubscribe();
  }, [pendingOrdersQuery, toast, hasInteracted, notifiedOrderIds]);


  if (isUserLoading || !user) {
    return <Loading />;
  }

  const isPOSPage = pathname === '/pdv';

  return (
    <div className={cn("min-h-screen flex flex-col bg-background", isPOSPage && "h-screen overflow-hidden")}>
      <Navbar />
      <main className="flex-grow pb-24 sm:pb-0 flex-1">
        {children}
      </main>
      <audio ref={audioRef} src="https://cdn.freesound.org/previews/415/415763_6142149-lq.mp3" preload="auto" />
    </div>
  );
}
