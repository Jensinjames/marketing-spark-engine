
import { useState, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  autoComplete?: string;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  helperText?: string;
  className?: string;
}

const PasswordField = ({
  id,
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  error,
  autoComplete,
  showPassword = false,
  onTogglePassword,
  helperText,
  className,
}: PasswordFieldProps) => {
  const [internalShowPassword, setInternalShowPassword] = useState(false);
  
  const isPasswordVisible = onTogglePassword ? showPassword : internalShowPassword;
  
  const handleTogglePassword = useCallback(() => {
    if (onTogglePassword) {
      onTogglePassword();
    } else {
      setInternalShowPassword(prev => !prev);
    }
  }, [onTogglePassword]);

  const errorId = `${id}-error`;
  const helpId = `${id}-help`;
  
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type={isPasswordVisible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          className={cn(
            "pr-12",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500"
          )}
          aria-invalid={!!error}
          aria-describedby={cn(
            error ? errorId : undefined,
            helperText ? helpId : undefined
          )}
        />
        <button
          type="button"
          onClick={handleTogglePassword}
          disabled={disabled}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded-sm"
          aria-label={isPasswordVisible ? "Hide password" : "Show password"}
        >
          {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && (
        <p 
          id={errorId}
          className="text-sm text-red-600 mt-1"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
      {helperText && !error && (
        <p 
          id={helpId}
          className="text-sm text-gray-500 mt-1"
        >
          {helperText}
        </p>
      )}
    </div>
  );
};

export default PasswordField;
