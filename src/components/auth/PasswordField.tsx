
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';

interface PasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  showStrengthIndicator?: boolean;
  onValidationChange?: (isValid: boolean) => void;
  required?: boolean;
}

export const PasswordField = ({ 
  value, 
  onChange, 
  placeholder = "Enter your password",
  label = "Password",
  showStrengthIndicator = false,
  onValidationChange,
  required = false
}: PasswordFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor="password">{label}</Label>
      <div className="relative">
        <Input
          id="password"
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="pr-12"
          autoComplete="current-password"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
          onClick={() => setShowPassword(!showPassword)}
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4 text-gray-500" />
          ) : (
            <Eye className="h-4 w-4 text-gray-500" />
          )}
        </Button>
      </div>
      
      {showStrengthIndicator && (
        <PasswordStrengthIndicator 
          password={value} 
          onValidationChange={onValidationChange}
        />
      )}
    </div>
  );
};
