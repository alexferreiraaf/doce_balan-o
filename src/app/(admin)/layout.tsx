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
  const audioRef = useRef<HTMLAudioElement | null>(null);
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

          if (!notifiedOrderIds.has(orderId)) {
            // Play sound
            audioRef.current?.play().catch(e => console.error("Error playing audio:", e));
            
            // Show toast
            toast({
              title: '🎉 Novo Pedido Recebido!',
              description: `Pedido de ${newOrder.description}. Valor: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(newOrder.amount)}`,
              duration: 10000, // 10 seconds
            });

            // Add to notified set
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
      <audio ref={audioRef} src="https://cdn.freesound.org/previews/219/219244_4101325-lq.mp3" preload="auto" />
    </div>
  );
}
