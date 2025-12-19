'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/auth-context';
import LoadingSpinner from '@/components/ui/loading';
import { canAccessRoute } from '@/lib/rbac/shared';


export default function ClientPagesProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isInitialized } = useAuth();
  const router = useRouter();
  const pathname = usePathname();


  useEffect(() => {
    if (!isInitialized) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!canAccessRoute(user, pathname)) {
      router.replace('/unauthorized');
    }
  }, [isInitialized, user, pathname, router]);

  if (!isInitialized) return <LoadingSpinner />;

  if (!user) return null;

  return <>{children}</>;
}
