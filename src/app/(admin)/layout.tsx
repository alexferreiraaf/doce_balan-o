'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import Loading from './loading-component';
import { Navbar } from '@/components/layout/navbar';
import { cn } from '@/lib/utils';
import { NewOrderListener } from '@/components/layout/new-order-listener';


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isUserLoading) {
      return; 
    }
    // Se não estiver carregando e o usuário não existir OU for anônimo, redireciona para o login.
    if (!user || user.isAnonymous) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  // Mostra a tela de carregamento enquanto verifica o usuário ou se o usuário não for válido.
  // Isso previne que o conteúdo protegido seja exibido rapidamente antes do redirecionamento.
  if (isUserLoading || !user || user.isAnonymous) {
    return <Loading />;
  }

  const isPOSPage = pathname === '/pdv';

  return (
    <div className={cn("min-h-screen flex flex-col bg-background", isPOSPage && "h-screen overflow-hidden")}>
      <NewOrderListener />
      <Navbar />
      <main className="flex-grow pb-24 sm:pb-0 flex-1">
        {children}
      </main>
    </div>
  );
}
