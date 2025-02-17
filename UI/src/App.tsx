import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from '@/components/ui/sonner';
import { Suspense } from 'react';
import Loading from './components/Loading';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import ScanLabel from './pages/ScanLabel';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
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
