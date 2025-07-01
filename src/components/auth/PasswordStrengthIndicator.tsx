
import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { validatePasswordStrength, getPasswordStrengthColor, getPasswordStrengthText, PasswordStrength } from '@/utils/passwordValidation';
import { CheckCircle, XCircle } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  onValidationChange?: (isValid: boolean) => void;
}

export const PasswordStrengthIndicator = ({ password, onValidationChange }: PasswordStrengthIndicatorProps) => {
  const [strength, setStrength] = useState<PasswordStrength>({ score: 0, feedback: [], isValid: false });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!password) {
      setStrength({ score: 0, feedback: [], isValid: false });
      onValidationChange?.(false);
      return;
    }

    const validatePassword = async () => {
      setIsLoading(true);
      try {
        const result = await validatePasswordStrength(password);
        setStrength(result);
        onValidationChange?.(result.isValid);
      } catch (error) {
        console.error('Password validation error:', error);
        setStrength({ score: 0, feedback: ['Password validation failed'], isValid: false });
        onValidationChange?.(false);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(validatePassword, 300);
    return () => clearTimeout(debounceTimer);
  }, [password, onValidationChange]);

  if (!password) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Password Strength</span>
        <Badge variant={strength.isValid ? 'default' : 'secondary'}>
          {isLoading ? 'Checking...' : getPasswordStrengthText(strength.score)}
        </Badge>
      </div>
      
      <Progress 
        value={(strength.score / 5) * 100} 
        className="h-2"
        style={{
          '--progress-background': getPasswordStrengthColor(strength.score)
        } as React.CSSProperties}
      />
      
      {strength.feedback.length > 0 && (
        <div className="space-y-1">
          {strength.feedback.map((message, index) => (
            <div key={index} className="flex items-center text-sm text-red-600">
              <XCircle className="h-3 w-3 mr-2 flex-shrink-0" />
              {message}
            </div>
          ))}
        </div>
      )}
      
      {strength.isValid && (
        <div className="flex items-center text-sm text-green-600">
          <CheckCircle className="h-3 w-3 mr-2" />
          Password meets all security requirements
        </div>
      )}
    </div>
  );
};
