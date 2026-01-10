'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Loading from './loading';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login');
  }, [router]);

  return <Loading />;
}
