
import { BrowserRouter as Router } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Toaster } from "@/components/ui/sonner";
import Index from "./pages/Index";
import "./App.css";

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Index />
      </Router>
      <Toaster />
    </ErrorBoundary>
  );
}

export default App;
