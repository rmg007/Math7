import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/ui/toast';
import { Toaster } from './components/ui/toaster';
import { AppProvider } from './contexts/AppContext';
import { BulkImportProvider } from './contexts/BulkImportContext';
import { router } from './router';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AppProvider>
          <BulkImportProvider>
            <ErrorBoundary>
              <RouterProvider router={router} />
            </ErrorBoundary>
          </BulkImportProvider>
        </AppProvider>
      </ToastProvider>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
