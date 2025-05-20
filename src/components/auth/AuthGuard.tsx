import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/types';

type AuthGuardProps = {
  children: React.ReactNode;
  requiredRole?: UserRole;
};

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    if (status !== 'loading') {
      // Not authenticated
      if (!session) {
        router.push(`/login?callbackUrl=${encodeURIComponent(router.asPath)}`);
      }
      // Role check if a specific role is required
      else if (requiredRole && session.user.role !== requiredRole) {
        router.push('/unauthorized');
      }
    }
  }, [session, status, router, requiredRole]);
  
  // Show loading state while checking auth
  if (status === 'loading') {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  // Not authenticated
  if (!session) {
    return null;
  }
  
  // Role check
  if (requiredRole && session.user.role !== requiredRole) {
    return null;
  }
  
  // Authenticated and has required role (if specified)
  return <>{children}</>;
}