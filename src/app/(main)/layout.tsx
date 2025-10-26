'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import Loading from './loading';
import { Navbar } from '@/components/layout/navbar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthLoading) return;
    
    // If not loading and no user, sign in anonymously
    if (!user) {
      signInAnonymously(auth).catch((error) => {
        console.error("Anonymous sign-in failed: ", error);
        // Optionally, redirect to an error page or show a message
      });
    }
  }, [user, isAuthLoading, auth, router]);

  // While checking auth or user is null (during anonymous sign-in), show a loading screen
  if (isAuthLoading || !user) {
    return <Loading />;
  }

  // If user is authenticated (anonymous or otherwise), render the main layout
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow pb-24 sm:pb-0">{children}</main>
    </div>
  );
}
