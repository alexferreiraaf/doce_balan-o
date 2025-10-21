'use client';
import { useState, useEffect, createContext, type ReactNode } from 'react';
import { onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth';
import { auth } from '@/app/lib/firebase';
import Loading from '@/app/loading';

export interface AuthContextType {
  user: User | null;
  userId: string | null;
  isAuthReady: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        signInAnonymously(auth).catch((error) => {
          console.error('Anonymous sign-in failed', error);
        });
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    user,
    userId: user?.uid ?? null,
    isAuthReady,
  };

  if (!isAuthReady) {
    return <Loading />;
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
