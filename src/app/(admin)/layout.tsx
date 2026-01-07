'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import Loading from './loading';
import { Navbar } from '@/components/layout/navbar';
import { cn } from '@/lib/utils';

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
      return; // Aguarda o fim do carregamento
    }
    if (!user) {
      // Se não há usuário (nem anônimo, nem real), redireciona para o login.
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

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
