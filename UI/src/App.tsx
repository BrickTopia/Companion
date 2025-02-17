import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from '@/components/ui/sonner';
import { Suspense } from 'react';
import Loading from './components/Loading';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import ScanLabel from './pages/ScanLabel';
import './App.css';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

function App() {
  const { error } = useIndexedDB();

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Database Error</AlertTitle>
        <AlertDescription>
          Failed to initialize the application. Please refresh the page or check
          your browser settings.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<Loading fullScreen />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/scan" element={<ScanLabel />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster />
    </ErrorBoundary>
  );
}

export default App;
