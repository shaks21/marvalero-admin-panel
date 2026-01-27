'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { token, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!token) {
        router.push('/admin/login');
      } else if (!isAdmin) {
        // You can redirect to an access denied page or show message
        router.push('/access-denied');
      }
    }
  }, [loading, token, isAdmin, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!token || !isAdmin) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}