'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import Loading from './loading';
import { Navbar } from '@/components/layout/navbar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

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

  // Se o usuário está autenticado (anônimo ou real), renderiza o layout principal.
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow pb-24 sm:pb-0">{children}</main>
    </div>
  );
}
