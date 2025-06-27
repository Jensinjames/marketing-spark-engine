
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield } from "lucide-react";

interface SecureFormProps {
  children: React.ReactNode;
  onSubmit: (data: FormData, csrfToken: string) => Promise<void> | void;
  className?: string;
  enableCSRF?: boolean;
}

// Simple CSRF token generation
const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

const SecureForm: React.FC<SecureFormProps> = ({ 
  children, 
  onSubmit, 
  className = "",
  enableCSRF = true 
}) => {
  const [csrfToken, setCSRFToken] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (enableCSRF) {
      setCSRFToken(generateCSRFToken());
    }
  }, [enableCSRF]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      
      // Security: Validate CSRF token if enabled
      if (enableCSRF) {
        const submittedToken = formData.get('csrf_token') as string;
        if (submittedToken !== csrfToken) {
          throw new Error('Security validation failed. Please refresh and try again.');
        }
      }
      
      // Security: Input sanitization - remove potential XSS
      const sanitizedData = new FormData();
      for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') {
          // Use DOMPurify for robust XSS prevention
          const DOMPurify = require('dompurify');
          const sanitized = DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
          sanitizedData.append(key, sanitized);
        } else {
          sanitizedData.append(key, value);
        }
      }
      
      await onSubmit(sanitizedData, csrfToken);
      
      // Regenerate CSRF token after successful submission
      if (enableCSRF) {
        setCSRFToken(generateCSRFToken());
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
      
      // Security: Log suspicious activity
      if (err.message?.includes('Security validation failed')) {
        console.warn('[Security] CSRF validation failed', {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={className}>
      <CardContent className="p-6">
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <Shield className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} noValidate>
          {enableCSRF && (
            <input 
              type="hidden" 
              name="csrf_token" 
              value={csrfToken}
              readOnly
            />
          )}
          
          {React.Children.map(children, child => {
            if (React.isValidElement(child)) {
              // Pass down form state to children
              return React.cloneElement(child, {
                disabled: child.props.disabled || isSubmitting,
                ...child.props
              } as any);
            }
            return child;
          })}
        </form>
      </CardContent>
    </Card>
  );
};

export default SecureForm;
