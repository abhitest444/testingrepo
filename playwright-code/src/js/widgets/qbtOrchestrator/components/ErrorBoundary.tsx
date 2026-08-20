import React, { Component, ErrorInfo, ReactNode } from 'react';
import { B2, B3 } from '@ids-ts/typography';
import { Card, CardContent } from '@ids-ts/cards';
import { SandboxLogger } from '@appfabric/sandbox-spec';
import { ORCHESTRATOR_LOGGING } from '../constants';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error | string) => void;
  logger?: SandboxLogger;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * Error Boundary for QbtOrchestrator Widget
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs them, and displays a fallback UI.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, logger } = this.props;

    logger?.error(ORCHESTRATOR_LOGGING.ERROR_BOUNDARY_CAUGHT, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    onError?.(error);
    this.setState({ error, errorInfo });
  }

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <Card size="standard" style={{ margin: '20px', padding: '20px' }}>
          <CardContent>
            <B2
              weight="demi"
              style={{ color: '#d32f2f', marginBottom: '12px' }}
            >
              Something went wrong
            </B2>
            <B3 style={{ color: '#666', marginBottom: '16px' }}>
              The time tracking widget encountered an error. Please try
              refreshing the page.
            </B3>
            {process.env.NODE_ENV === 'e2e' && error && (
              <details style={{ marginTop: '16px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                  Error Details (Development)
                </summary>
                <pre
                  style={{
                    marginTop: '8px',
                    padding: '8px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    fontSize: '12px',
                    overflow: 'auto',
                  }}
                >
                  {error.toString()}
                  {errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      );
    }

    return children;
  }
}

export default ErrorBoundary;
