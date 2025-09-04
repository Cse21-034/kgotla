import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../../hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireVerification?: boolean;
}

export function ProtectedRoute({ children, requireVerification = false }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to auth page with current path as redirect parameter
      const currentPath = window.location.pathname + window.location.search;
      setLocation(`/auth?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [isAuthenticated, isLoading, setLocation]);

  useEffect(() => {
    if (requireVerification && user && !user.emailVerified) {
      // Redirect to email verification page
      setLocation("/verify-email");
    }
  }, [requireVerification, user, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  if (requireVerification && user && !user.emailVerified) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}