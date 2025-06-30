import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
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
import NotFound from "./pages/NotFound";

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="amap-ui-theme">
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <ReactQueryDevtools initialIsOpen={false} />
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;