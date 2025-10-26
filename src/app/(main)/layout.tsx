'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/lib/hooks/use-auth';
import Loading from './loading';
import { Navbar } from '@/components/layout/navbar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If auth is not loading and there's no user, redirect to login
    if (!isAuthLoading && !user) {
      router.push('/login');
    }
  }, [user, isAuthLoading, router]);

  // While checking auth, show a loading screen
  if (isAuthLoading) {
    return <Loading />;
  }

  // If user is authenticated, render the main layout
  if (user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-grow">{children}</main>
      </div>
    );
  }

  // If no user and not loading, we're likely in the process of redirecting, so show loading.
  return <Loading />;
}
