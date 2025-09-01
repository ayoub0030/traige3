// Client-side error handling and logging

interface ClientError {
  message: string;
  stack?: string;
  category: string;
  severity: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  details?: any;
  url?: string;
  userAgent?: string;
}

class ClientErrorHandler {
  private errorQueue: ClientError[] = [];
  private isOnline: boolean = navigator.onLine;
  private flushInterval: number = 5000; // 5 seconds
  private maxQueueSize: number = 50;

  constructor() {
    this.setupGlobalErrorHandlers();
    this.setupNetworkListeners();
    this.startFlushInterval();
  }

  private setupGlobalErrorHandlers() {
    // Catch unhandled errors
    window.addEventListener('error', (event) => {
      this.logError({
        message: event.message,
        stack: event.error?.stack,
        category: 'RUNTIME_ERROR',
        severity: 'ERROR',
        details: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        category: 'PROMISE_REJECTION',
        severity: 'ERROR',
        details: {
          reason: event.reason
        }
      });
    });

    // React Error Boundary errors will be caught separately
  }

  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrors(); // Send queued errors when back online
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private startFlushInterval() {
    setInterval(() => {
      if (this.errorQueue.length > 0 && this.isOnline) {
        this.flushErrors();
      }
    }, this.flushInterval);
  }

  public logError(error: Partial<ClientError>) {
    const fullError: ClientError = {
      message: error.message || 'Unknown error',
      category: error.category || 'UNKNOWN',
      severity: error.severity || 'ERROR',
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...error
    };

    // Add to queue
    this.errorQueue.push(fullError);

    // Console log in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Client Error]', fullError);
    }

    // Prevent queue from growing too large
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(-this.maxQueueSize);
    }

    // Try to send immediately if critical
    if (fullError.severity === 'CRITICAL' && this.isOnline) {
      this.flushErrors();
    }
  }

  private async flushErrors() {
    if (this.errorQueue.length === 0) return;

    const errorsToSend = [...this.errorQueue];
    this.errorQueue = [];

    try {
      for (const error of errorsToSend) {
        await fetch('/api/error-logs/client-error', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(error)
        });
      }
    } catch (error) {
      // If sending fails, add back to queue (but avoid infinite loop)
      console.error('Failed to send error logs:', error);
      
      // Only add back if we're offline
      if (!this.isOnline) {
        this.errorQueue = [...errorsToSend, ...this.errorQueue].slice(-this.maxQueueSize);
      }
    }
  }

  // Manual error logging methods
  public logApiError(endpoint: string, error: any, requestData?: any) {
    this.logError({
      message: `API Error: ${endpoint}`,
      category: 'API_ERROR',
      severity: 'ERROR',
      details: {
        endpoint,
        error: error.message || error,
        requestData,
        response: error.response
      }
    });
  }

  public logGameError(message: string, details?: any) {
    this.logError({
      message: `Game Error: ${message}`,
      category: 'GAME_ERROR',
      severity: 'ERROR',
      details
    });
  }

  public logMultiplayerError(message: string, details?: any) {
    this.logError({
      message: `Multiplayer Error: ${message}`,
      category: 'MULTIPLAYER_ERROR',
      severity: 'ERROR',
      details
    });
  }

  public logPerformanceIssue(metric: string, value: number, threshold: number) {
    if (value > threshold) {
      this.logError({
        message: `Performance issue: ${metric} exceeded threshold`,
        category: 'PERFORMANCE',
        severity: 'WARNING',
        details: {
          metric,
          value,
          threshold,
          exceededBy: value - threshold
        }
      });
    }
  }

  // Get local error history
  public getLocalErrors(): ClientError[] {
    return [...this.errorQueue];
  }

  // Clear local error queue
  public clearLocalErrors() {
    this.errorQueue = [];
  }
}

// Export singleton instance
export const clientErrorHandler = new ClientErrorHandler();

// React Error Boundary Component
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    clientErrorHandler.logError({
      message: error.message,
      stack: error.stack,
      category: 'REACT_ERROR',
      severity: 'ERROR',
      details: {
        componentStack: errorInfo.componentStack
      }
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-red-500">Something went wrong</h1>
            <p className="text-gray-600">We've logged this error and will fix it soon.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Performance monitoring
export function measurePerformance(name: string, fn: () => any) {
  const startTime = performance.now();
  
  try {
    const result = fn();
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Log if performance is poor (> 100ms)
    clientErrorHandler.logPerformanceIssue(name, duration, 100);
    
    return result;
  } catch (error) {
    clientErrorHandler.logError({
      message: `Error in ${name}`,
      category: 'FUNCTION_ERROR',
      severity: 'ERROR',
      details: { functionName: name, error }
    });
    throw error;
  }
}

// API call wrapper with error logging
export async function apiCall(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clientErrorHandler.logApiError(endpoint, error, options.body);
    throw error;
  }
}