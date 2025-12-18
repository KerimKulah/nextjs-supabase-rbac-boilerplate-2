'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import LoadingSpinner from '@/components/ui/loading';


export default function ClientPagesProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !user) router.push('/login');
  }, [isInitialized, user, router]);

  if (!isInitialized) return <LoadingSpinner />;

  if (!user) return null;

  return <>{children}</>;
}
