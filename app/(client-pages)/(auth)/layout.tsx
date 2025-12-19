
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    const { user, isInitialized } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isInitialized && user) {
            router.replace('/');
        }
    }, [isInitialized, user, router]);

    if (!isInitialized) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-sm text-muted-foreground">Loading...</div>
            </div>
        );
    }

    if (user) {
        return null;
    }

    return <>{children}</>;
}