import React, { Component, ErrorInfo } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: React.ReactNode;
  onError: () => void;
}

interface State {
  hasError: boolean;
}

export class CameraErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Camera error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-4 space-y-4">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <p className="text-sm text-gray-600 text-center">
            Sorry, there was a problem accessing your camera.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              this.setState({ hasError: false });
              this.props.onError();
            }}
          >
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
