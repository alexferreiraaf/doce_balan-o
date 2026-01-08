'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import Loading from './loading-component';
import { Navbar } from '@/components/layout/navbar';
import { cn } from '@/lib/utils';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
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
  const [notifiedOrderIds, setNotifiedOrderIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isUserLoading) {
      return; // Aguarda o fim do carregamento
    }
    if (!user) {
      // Se não há usuário (nem anônimo, nem real), redireciona para o login.
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const pendingOrdersQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    // We only listen to orders for the logged-in user.
    // Storefront orders are created under a specific user ID,
    // so we need to be logged in as that user to get notifications.
    // Or adjust rules and query if that's not the desired behavior.
    return query(
      collection(firestore, `artifacts/${APP_ID}/users/${user.uid}/transactions`),
      where('status', '==', 'pending')
    );
  }, [firestore, user]);

  useEffect(() => {
    if (!pendingOrdersQuery) return;

    const unsubscribe = onSnapshot(pendingOrdersQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const newOrder = change.doc.data() as Transaction;
          const orderId = change.doc.id;

          // Only notify if we haven't seen this order ID before
          if (!notifiedOrderIds.has(orderId)) {
            
            // Show toast notification
            toast({
              title: '🎉 Novo Pedido Recebido!',
              description: `${newOrder.description}. Valor: ${formatCurrency(newOrder.amount)}`,
              duration: 10000, // 10 seconds
            });

            // Add to notified set to prevent re-notifying
            setNotifiedOrderIds(prev => new Set(prev).add(orderId));
          }
        }
      });
    });

    return () => unsubscribe();
  }, [pendingOrdersQuery, toast, notifiedOrderIds]);


  // Exibe o loading enquanto o estado de autenticação está sendo verificado.
  if (isUserLoading || !user) {
    return <Loading />;
  }

  const isPOSPage = pathname === '/pdv';

  // Se o usuário está autenticado (anônimo ou real), renderiza o layout principal.
  return (
    <div className={cn("min-h-screen flex flex-col bg-background", isPOSPage && "h-screen overflow-hidden")}>
      <Navbar />
      <main className="flex-grow pb-24 sm:pb-0 flex-1">
        {children}
      </main>
    </div>
  );
}
