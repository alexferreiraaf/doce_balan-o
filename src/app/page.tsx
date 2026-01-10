'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useUser } from '@/firebase';
import Loading from './loading';

export default function HomePage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (isUserLoading) {
      return; // Aguarde o carregamento do usuário
    }
    
    if (user) {
      router.replace('/pdv'); // Se logado, vai para o PDV
    } else {
      router.replace('/login'); // Se não, vai para o login
    }
  }, [user, isUserLoading, router]);

  return <Loading />;
}
