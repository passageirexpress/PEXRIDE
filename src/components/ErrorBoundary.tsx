import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends (React.Component as any) {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    const { hasError, error } = this.state as State;
    if (hasError) {
      let errorMessage = 'An unexpected error occurred.';
      let errorDetails = '';

      try {
        // Check if it's a Firestore error JSON
        if (error?.message.startsWith('{')) {
          const info = JSON.parse(error.message);
          if (info.error?.includes('insufficient permissions')) {
            errorMessage = 'You do not have permission to perform this action.';
            errorDetails = `Operation: ${info.operationType} on ${info.path}`;
          } else {
            errorMessage = info.error || errorMessage;
          }
        } else {
          errorMessage = error?.message || errorMessage;
        }
      } catch (e) {
        // Fallback if parsing fails
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="text-red-600 w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">{errorMessage}</p>
            {errorDetails && (
              <p className="text-xs text-gray-400 font-mono mb-6 bg-gray-50 p-2 rounded">
                {errorDetails}
              </p>
            )}
            <Button 
              onClick={this.handleReset}
              className="w-full bg-pex-blue hover:bg-pex-blue/90 text-white"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return (this.props as Props).children;
  }
}
