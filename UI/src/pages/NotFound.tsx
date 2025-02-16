import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { Home } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      '404 Error: User attempted to access non-existent route:',
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-pastel-blue/20">
      <div className="text-center">
        <div className="w-64 h-64 mx-auto">
          <DotLottieReact
            src="https://lottie.host/1fcddfd3-11ae-4118-9fd5-9723f8c9a865/6R9VrZPu7U.lottie"
            loop
            autoplay
          />
        </div>
        <a
          href="/"
          className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/70 backdrop-blur-sm text-gray-800 hover:bg-white/80 transition-colors shadow-sm"
        >
          <Home size={18} />
          <span>Return Home</span>
        </a>
      </div>
    </div>
  );
};

export default NotFound;
