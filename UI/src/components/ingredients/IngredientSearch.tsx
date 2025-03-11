import { Input } from "@/components/ui/input";
import { Search, Heart, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

// Add these declarations at the top of your file
declare global {
  interface SpeechRecognition {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: (event: SpeechRecognitionEvent) => void;
    onspeechend: () => void;
    start: () => void;
    stop: () => void;
  }

  interface SpeechRecognitionEvent {
    results: {
      [key: number]: {
        [key: number]: {
          transcript: string;
        };
      };
    };
  }

  interface Window {
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

interface IngredientSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  showOnlyFavorites: boolean;
  onToggleFavorites: () => void;
}

export const IngredientSearch = ({
  searchTerm,
  onSearchChange,
  showOnlyFavorites,
  onToggleFavorites
}: IngredientSearchProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      console.error('Web Speech API not supported in this browser.');
      return;
    }
    const speechRecognition = new window.webkitSpeechRecognition();
    speechRecognition.continuous = false;
    speechRecognition.interimResults = false;
    speechRecognition.lang = 'en-US';

    speechRecognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      onSearchChange(transcript);
    };

    speechRecognition.onspeechend = () => {
      setIsRecording(false);
      speechRecognition.stop();
    };

    setRecognition(speechRecognition);
  }, [onSearchChange]);

  const handleMicClick = () => {
    if (isRecording) {
      recognition?.stop();
      setIsRecording(false);
    } else {
      recognition?.start();
      setIsRecording(true);
    }
  };

  return (
    <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
      <div className="relative flex-1">
        <Input
          type="text"
          placeholder="Search ingredients..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
        <Mic
          onClick={handleMicClick}
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer ${isRecording ? 'text-red-500' : 'text-gray-400'} hover:text-blue-500`}
          size={18}
        />
      </div>
      <Button
        variant={showOnlyFavorites ? "default" : "outline"}
        onClick={onToggleFavorites}
        className="w-full sm:w-auto"
      >
        <Heart className="mr-2 h-4 w-4" />
        {showOnlyFavorites ? "Show All" : "Show Favorites"}
      </Button>
    </div>
  );
};
