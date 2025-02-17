import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
}

export const CameraCapture = ({ onCapture, onClose }: CameraCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const permissions = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      setStream(permissions);
      if (videoRef.current) {
        videoRef.current.srcObject = permissions;
        setIsCameraReady(true);
      }
    } catch (error) {
      console.error('Camera access error:', error);
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          setPermissionDenied(true);
        } else {
          setError('Unable to access camera. Please try again.');
        }
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsCameraReady(false);
    }
  }, [stream]);

  const takePhoto = useCallback(() => {
    if (!videoRef.current || !isCameraReady) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');

    if (ctx && videoRef.current) {
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg');
      onCapture(imageData);
      stopCamera();
    }
  }, [isCameraReady, onCapture, stopCamera]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  if (permissionDenied) {
    return (
      <Card className="fixed inset-0 z-50 bg-pastel-blue/95 flex flex-col">
        <div className="p-4 flex justify-between items-center">
          <h3 className="text-lg font-medium">Camera Access Required</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-red-100"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
          <p className="text-center mb-4">
            Please allow camera access to scan nutrition labels.
          </p>
          <Button
            onClick={() => {
              setPermissionDenied(false);
              startCamera();
            }}
          >
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="fixed inset-0 z-50 bg-pastel-blue/95 flex flex-col">
      <div className="p-4 flex justify-between items-center">
        <h3 className="text-lg font-medium">Take a Photo</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="rounded-full hover:bg-red-100"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 relative">
        {!stream && (
          <Button
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                       bg-white/90 hover:bg-white text-gray-800"
            onClick={startCamera}
          >
            <Camera className="mr-2 h-5 w-5" />
            Start Camera
          </Button>
        )}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      </div>

      {isCameraReady && (
        <div className="p-4 flex justify-center">
          <Button
            onClick={takePhoto}
            className="rounded-full w-16 h-16 bg-white border-4 border-pastel-blue
                     hover:bg-gray-100 transition-all"
            size="icon"
          >
            <div className="w-12 h-12 rounded-full bg-pastel-blue/20" />
          </Button>
        </div>
      )}
    </Card>
  );
};
