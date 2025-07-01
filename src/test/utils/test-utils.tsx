
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { ErrorBoundaryProvider } from '@/components/shared/ErrorBoundaryProvider';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="test-theme">
        <ErrorBoundaryProvider>
          {children}
        </ErrorBoundaryProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Export everything from @testing-library/react
export * from '@testing-library/react';
// Explicitly export screen and our custom render
export { screen, customRender as render };
