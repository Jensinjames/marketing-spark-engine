
import React from 'react';
import Sidebar from "./Sidebar";
import { SkipLink } from '@/hooks/useKeyboardNavigation';
import { ErrorBoundaryProvider } from '@/components/shared/ErrorBoundaryProvider';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <ErrorBoundaryProvider>
      <div className="min-h-screen flex bg-background">
        {/* Skip links for accessibility */}
        <SkipLink href="#main-content">Skip to main content</SkipLink>
        <SkipLink href="#sidebar-nav">Skip to navigation</SkipLink>
        
        <Sidebar />
        
        <div className="flex-1 lg:ml-64">
          <main 
            id="main-content"
            className="p-6 lg:p-8 focus-visible"
            tabIndex={-1}
            role="main"
            aria-label="Main content"
          >
            {children}
          </main>
        </div>
      </div>
    </ErrorBoundaryProvider>
  );
};

export default Layout;
