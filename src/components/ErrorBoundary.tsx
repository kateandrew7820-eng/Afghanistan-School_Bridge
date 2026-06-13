/**
 * Error Boundary Component
 * 
 * Catches React errors and displays user-friendly Persian messages
 * Prevents entire app from crashing
 */

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorCount: number;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Update state
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by ErrorBoundary:', error);
      console.error('Error info:', errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // If custom fallback provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      const isDev = process.env.NODE_ENV === 'development';
      const errorMessage = this.state.error?.message || 'خطای نامشخص رخ داده است';

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive to-warning p-4">
          <Card className="w-full max-w-md border-destructive/20">
            <CardContent className="pt-6 space-y-4">
              {/* Error Icon */}
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
              </div>

              {/* Error Title */}
              <div className="text-center">
                <h2 className="text-xl font-bold text-muted-foreground">
                  متأسفانه خطایی رخ داد
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  ما به مشکل کاری روبرو شده‌ایم. لطفاً دوباره تلاش کنید یا صفحه اول را بازدید کنید.
                </p>
              </div>

              {/* Error Details (Dev Only) */}
              {isDev && this.state.error && (
                <div className="bg-muted rounded-lg p-3 border border-border">
                  <details className="cursor-pointer">
                    <summary className="font-mono text-xs text-muted-foreground font-semibold">
                      جزئیات خطا (تنها برای توسعه‌دهندگان)
                    </summary>
                    <pre className="mt-2 text-xs text-destructive overflow-auto max-h-40 whitespace-pre-wrap">
                      {errorMessage}
                    </pre>
                    {this.state.errorInfo && (
                      <pre className="mt-2 text-xs text-muted-foreground overflow-auto max-h-40 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </details>
                </div>
              )}

              {/* Error Count Warning */}
              {this.state.errorCount > 3 && (
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                  <p className="text-xs text-warning">
                    خطاهای متعدد رخ داده است. اگر مشکل ادامه دارد، صفحه را بارگذاری کنید.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={this.handleReset}
                  className="flex-1"
                  variant="default"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  دوباره تلاش
                </Button>
                <Button
                  onClick={this.handleHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  صفحه اول
                </Button>
              </div>

              {/* Reload Option */}
              <Button
                onClick={this.handleReload}
                variant="ghost"
                className="w-full text-sm"
              >
                بارگذاری مجدد صفحه
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
