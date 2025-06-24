
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { useSignupForm } from "@/hooks/useSignupForm";
import AuthGuard from "@/components/AuthGuard";
import FormField from "@/components/auth/FormField";
import PasswordField from "@/components/auth/PasswordField";
import SuccessMessage from "@/components/auth/SuccessMessage";

const Signup = () => {
  const {
    state,
    updateField,
    validateFieldOnBlur,
    togglePasswordVisibility,
    handleSubmit,
    isPending,
  } = useSignupForm();

  if (state.showSuccess) {
    return <SuccessMessage />;
  }

  return (
    <AuthGuard requireAuth={false} redirectTo="/dashboard">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200/50">
            <div className="text-center mb-8">
              <Link to="/" className="inline-flex items-center space-x-2 mb-6">
                <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  AMAP
                </span>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Create your account
              </h1>
              <p className="text-gray-600">
                Start building high-converting marketing assets with AI
              </p>
            </div>

            {state.errors.general && (
              <div 
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
                role="alert"
                aria-live="polite"
              >
                <p className="text-sm text-red-800">{state.errors.general}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <FormField
                id="fullName"
                label="Full Name"
                value={state.formData.fullName}
                onChange={(value) => updateField('fullName', value)}
                onBlur={() => validateFieldOnBlur('fullName', state.formData.fullName)}
                placeholder="Enter your full name"
                required
                disabled={state.isSubmitting || isPending}
                error={state.errors.fullName}
                autoComplete="name"
              />

              <FormField
                id="email"
                label="Email"
                type="email"
                value={state.formData.email}
                onChange={(value) => updateField('email', value)}
                onBlur={() => validateFieldOnBlur('email', state.formData.email)}
                placeholder="Enter your email"
                required
                disabled={state.isSubmitting || isPending}
                error={state.errors.email}
                autoComplete="email"
              />

              <PasswordField
                id="password"
                label="Password"
                value={state.formData.password}
                onChange={(value) => updateField('password', value)}
                onBlur={() => validateFieldOnBlur('password', state.formData.password)}
                placeholder="Create a password (min. 8 characters)"
                required
                disabled={state.isSubmitting || isPending}
                error={state.errors.password}
                autoComplete="new-password"
                showPassword={state.showPassword}
                onTogglePassword={togglePasswordVisibility}
                helperText="Must be at least 8 characters long"
              />

              <Button
                type="submit"
                disabled={state.isSubmitting || isPending}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
                aria-describedby="submit-help"
              >
                {state.isSubmitting || isPending ? "Creating account..." : "Create Account"}
              </Button>
              <div id="submit-help" className="sr-only">
                Click to create your account with the provided information
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link 
                  to="/login" 
                  className="text-purple-600 hover:text-purple-700 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded-sm"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default Signup;
