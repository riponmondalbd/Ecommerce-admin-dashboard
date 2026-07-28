'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export const AuthGuard: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Redirect to login if not loading and no user
  useEffect(() => {
    if (!isLoading && !user) {
      const redirect = searchParams.get('redirect') || '/';
      router.push(`/auth/login?redirect=${encodeURIComponent(redirect)}`);
    }
  }, [user, isLoading, router, searchParams]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  // Render children if user is loaded and exists
  return children;
};
