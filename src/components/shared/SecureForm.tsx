
import { useState, FormEvent, ReactNode } from 'react';
import DOMPurify from 'dompurify';
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';

interface SecureFormProps {
  onSubmit: (data: Record<string, any>) => Promise<void>;
  children: ReactNode;
  submitText?: string;
  disabled?: boolean;
  className?: string;
}

const SecureForm = ({ 
  onSubmit, 
  children, 
  submitText = 'Submit',
  disabled = false,
  className = ''
}: SecureFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [csrfToken] = useState(() => crypto.randomUUID());

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isSubmitting || disabled) return;

    try {
      setIsSubmitting(true);
      
      const formData = new FormData(e.currentTarget);
      const data: Record<string, any> = {};
      
      // Convert FormData to object with validation
      for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') {
          // Basic XSS protection - strip HTML tags
          data[key] = DOMPurify.sanitize(value).trim();
        } else {
          data[key] = value;
        }
      }
      
      // Add CSRF token
      data._csrf = csrfToken;
      
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <input type="hidden" name="_csrf" value={csrfToken} />
      {children}
      <Button
        type="submit"
        disabled={isSubmitting || disabled}
        className="w-full mt-4"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          submitText
        )}
      </Button>
    </form>
  );
};

export default SecureForm;
