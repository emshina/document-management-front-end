
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [checking, setChecking] = useState(true);

  // const isPublicPage =
  //   pathname === '/' ||
  //   pathname === '/login' ||
  //   pathname === '/signup' ||
  //   pathname === '/verify-email';
  const isPublicPage =
      pathname === '/' ||
      pathname === '/login' ||
      pathname === '/signup' ||
      pathname === '/verify-email' ||
      pathname === '/forgot-password' ||
      pathname === '/reset-password'||
      pathname === '/accept-invitation';
      
      
  useEffect(() => {
    // Public pages do not need authentication.
    if (isPublicPage) {
      setChecking(false);
      return;
    }

    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('access') ||
      localStorage.getItem('token');

    // No token -> login.
    if (!token) {
      router.replace('/login');
      return;
    }

    // Check JWT expiration.
    try {
      const parts = token.split('.');

      if (parts.length !== 3) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('access');
        localStorage.removeItem('token');

        router.replace('/login');
        return;
      }

      const payload = JSON.parse(atob(parts[1]));

      if (payload.exp && payload.exp * 1000 <= Date.now()) {
        // Token expired.
        localStorage.removeItem('access_token');
        localStorage.removeItem('access');
        localStorage.removeItem('token');

        localStorage.removeItem('refresh_token');
        localStorage.removeItem('refresh');

        localStorage.removeItem('active_company_id');
        localStorage.removeItem('tenant_id');

        router.replace('/login?session_expired=true');
        return;
      }

      // Token is valid.
      setChecking(false);
    } catch (error) {
      console.error('Invalid authentication token:', error);

      localStorage.removeItem('access_token');
      localStorage.removeItem('access');
      localStorage.removeItem('token');

      router.replace('/login');
    }
  }, [pathname, router, isPublicPage]);

  // Public pages should NEVER be blocked by the auth check.
  if (isPublicPage) {
    return <>{children}</>;
  }

  // While checking authentication, show a simple loading screen.
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-[#ef7632] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">
            Checking your session...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
