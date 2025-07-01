
import { useEffect, ReactNode } from 'react';
import { initializeSecurity } from '@/utils/securityHeaders';

interface SecurityProviderProps {
  children: ReactNode;
}

export const SecurityProvider = ({ children }: SecurityProviderProps) => {
  useEffect(() => {
    // Initialize security headers and protections
    initializeSecurity();
    
    // Log security initialization
    console.log('[Security] Security headers and protections initialized');
  }, []);

  return <>{children}</>;
};
