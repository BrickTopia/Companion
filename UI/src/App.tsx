import { BrowserRouter, Routes, Route, useLocation, useNavigationType, createRoutesFromChildren, matchRoutes } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from '@/components/ui/sonner';
import { Suspense, useEffect } from 'react';
import Loading from './components/Loading';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import ScanLabel from './pages/ScanLabel';
import './App.css';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { initializeIngredientMatchers } from '@/utils/textProcessing';
import { useIngredients } from '@/services/ingredientService';
import * as Sentry from "@sentry/react";
import React from 'react';

function App() {
  
  Sentry.init({
    dsn: "https://033069042874cb0c66a082acc26953c1@o4508967113326592.ingest.us.sentry.io/4508967120011264",
    // This enables automatic instrumentation (highly recommended)
    // If you only want to use custom instrumentation:
    // * Remove the `BrowserTracing` integration
    // * add `Sentry.addTracingExtensions()` above your Sentry.init() call
    integrations: [
      Sentry.browserTracingIntegration(),
      // Or, if you are using react router, use the appropriate integration
      // See docs for support for different versions of react router
      // https://docs.sentry.io/platforms/javascript/guides/react/configuration/integrations/react-router/
      Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect: React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
    ],
    // For finer control of sent transactions you can adjust this value, or
    // use tracesSampler
    tracesSampleRate: 0.5,
    // Set `tracePropagationTargets` to control for which URLs trace propagation should be enabled
    tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
  });

  const { error } = useIndexedDB();
  const ingredients = useIngredients();

  useEffect(() => {
    initializeIngredientMatchers(ingredients);
  }, [ingredients]);

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
