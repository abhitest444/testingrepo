import React, { Component, ErrorInfo, ReactNode } from 'react';
import { B2, B3 } from '@ids-ts/typography';
import { Card, CardContent } from '@ids-ts/cards';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console or error reporting service
    // eslint-disable-next-line no-console
    console.error('TimeImportAgentic Widget Error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { fallback } = this.props;

    if (hasError) {
      // Custom fallback UI
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
              The demo widget encountered an error. Please try refreshing the
              page.
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
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '16px',
                padding: '8px 16px',
                backgroundColor: '#236cff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Refresh Page
            </button>
          </CardContent>
        </Card>
      );
    }

    const { children } = this.props;
    return children;
  }
}

export default ErrorBoundary;
