import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SecurityProvider } from "@/contexts/SecurityContext";
import { TeamProvider } from "@/contexts/TeamContext";
import { CriticalErrorBoundary, PageErrorBoundary } from "@/components/shared/GlobalErrorBoundary";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import { queryClient } from "@/lib/queryClient";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Generate from "./pages/Generate";
import Content from "./pages/Content";
import Analytics from "./pages/Analytics";
import Billing from "./pages/Billing";
import Integrations from "./pages/Integrations";
import Teams from "./pages/Teams";
import Settings from "./pages/Settings";
import AdminSuspense from "./components/admin/AdminSuspense";
import Pricing from "./pages/Pricing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AcceptInvitation from "./pages/AcceptInvitation";
import UnsubscribePage from "./pages/UnsubscribePage";
import NotFound from "./pages/NotFound";

const App: React.FC = () => (
  <CriticalErrorBoundary context="app_root">
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="amap-ui-theme">
        <TooltipProvider>
          <SecurityProvider>
            <TeamProvider>
              <AuthProvider>
                <Toaster />
                <Sonner />
                <OnboardingFlow />
                <BrowserRouter>
                <PageErrorBoundary context="router">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/generate" element={<Generate />} />
                    <Route path="/content" element={<Content />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/billing" element={<Billing />} />
                    <Route path="/integrations" element={<Integrations />} />
                    <Route path="/teams" element={<Teams />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/admin" element={<AdminSuspense />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/accept-invitation" element={<AcceptInvitation />} />
                    <Route path="/unsubscribe" element={<UnsubscribePage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </PageErrorBoundary>
              </BrowserRouter>
                <ReactQueryDevtools initialIsOpen={false} />
              </AuthProvider>
            </TeamProvider>
          </SecurityProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </CriticalErrorBoundary>
);

export default App;
