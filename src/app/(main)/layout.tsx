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
  const { user, isUserLoading: isAuthLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isAuthLoading) return;
    // If auth is not loading and there's no user, redirect to login
    if (!user) {
      router.push('/login');
    }
  }, [user, isAuthLoading, router]);

  // While checking auth, show a loading screen
  if (isAuthLoading || !user) {
    return <Loading />;
  }

  // If user is authenticated, render the main layout
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow pb-24 sm:pb-0">{children}</main>
    </div>
  );
}
