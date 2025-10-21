'use client';
import { useUser } from '@/firebase';

export const useAuth = () => {
    const { user, isUserLoading } = useUser();
    return {
        user,
        userId: user?.uid,
        isAuthLoading: isUserLoading,
        isAuthReady: !isUserLoading,
    };
}
