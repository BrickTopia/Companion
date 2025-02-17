import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useState, useEffect } from 'react';

const loadingMessages = [
  'Checking ingredients for you...',
  "Making sure everything's gluten-free...",
  'Scanning the pantry...',
  'Double-checking labels...',
  'Preparing your safe ingredients list...',
];

const Loading = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((current) =>
        current === loadingMessages.length - 1 ? 0 : current + 1
      );
    }, 2000); // Change message every 2 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-pastel-blue/20">
      <div className="w-64 h-64">
        <DotLottieReact
          src="https://lottie.host/af0ad337-c507-43e9-8ceb-50ad286a5113/sNO3AHoAX0.lottie"
          loop
          autoplay
        />
      </div>
      <p
        className="text-gray-600 mt-4 text-lg font-medium transition-opacity duration-500"
        key={messageIndex} // Force re-render for animation
      >
        {loadingMessages[messageIndex]}
      </p>
    </div>
  );
};

export default Loading;
