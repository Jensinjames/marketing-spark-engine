
import { ReactNode } from "react";
import AuthGuard from "@/components/AuthGuard";
import Layout from "@/components/layout/Layout";
import { SettingsHeader } from "./SettingsHeader";
import { SettingsErrorBoundary } from "./SettingsErrorBoundary";

interface SettingsLayoutProps {
  children: ReactNode;
}

export const SettingsLayout = ({ children }: SettingsLayoutProps) => {
  return (
    <AuthGuard requireAuth={true}>
      <Layout>
        <div className="max-w-4xl mx-auto">
          <SettingsHeader 
            title="Settings"
            description="Manage your account preferences and security settings"
          />
          <SettingsErrorBoundary>
            {children}
          </SettingsErrorBoundary>
        </div>
      </Layout>
    </AuthGuard>
  );
};
