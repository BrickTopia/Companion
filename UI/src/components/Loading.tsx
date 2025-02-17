import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { useState, useEffect } from 'react';

interface LoadingProps {
  messages?: string[];
  fullScreen?: boolean;
}

const defaultMessages = [
  'Checking ingredients for you...',
  "Making sure everything's gluten-free...",
  'Scanning the pantry...',
  'Double-checking labels...',
  'Preparing your safe ingredients list...',
];

const Loading = ({
  messages = defaultMessages,
  fullScreen = false,
}: LoadingProps) => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((current) =>
        current === messages.length - 1 ? 0 : current + 1
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [messages.length]);

  const containerClasses = fullScreen
    ? 'min-h-screen w-full fixed inset-0 bg-pastel-blue/20 flex items-center justify-center'
    : 'flex flex-col items-center justify-center py-8';

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center justify-center p-4">
        <div className="w-48 h-48 md:w-64 md:h-64">
          <DotLottieReact
            src="https://lottie.host/af0ad337-c507-43e9-8ceb-50ad286a5113/sNO3AHoAX0.lottie"
            loop
            autoplay
          />
        </div>
        <p
          className="text-gray-600 mt-4 text-base md:text-lg font-medium text-center transition-opacity duration-500 max-w-sm"
          key={messageIndex}
        >
          {messages[messageIndex]}
        </p>
      </div>
    </div>
  );
};

export default Loading;
