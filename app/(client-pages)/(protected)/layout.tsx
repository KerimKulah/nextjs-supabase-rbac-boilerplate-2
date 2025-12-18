'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import LoadingSpinner from '@/components/ui/loading';
import { canAccessRoute } from '@/lib/rbac/helpers';


export default function ClientPagesProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isInitialized } = useAuth();
  const router = useRouter();
  const pathname = usePathname();


  useEffect(() => {
    if (!isInitialized) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (!canAccessRoute(user, pathname)) {
      router.push('/unauthorized');
    }
  }, [isInitialized, user, pathname]);

  if (!isInitialized) return <LoadingSpinner />;

  if (!user) return null;

  return <>{children}</>;
}
