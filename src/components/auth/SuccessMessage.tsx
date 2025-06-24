
import { CheckCircle } from "lucide-react";

interface SuccessMessageProps {
  title?: string;
  message?: string;
  className?: string;
}

const SuccessMessage = ({
  title = "Account Created!",
  message = "Please check your email to confirm your account before signing in.",
  className = "",
}: SuccessMessageProps) => {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4 ${className}`}>
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200/50 text-center">
          <div className="mb-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" aria-hidden="true" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {title}
            </h1>
            <p className="text-gray-600">
              {message}
            </p>
          </div>
          <div className="text-sm text-gray-500" aria-live="polite">
            Redirecting to login page...
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessMessage;
