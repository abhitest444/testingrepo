import React from 'react';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from 'src/js/widgets/qbtOrchestrator/components/ErrorBoundary';
import { ORCHESTRATOR_LOGGING } from 'src/js/widgets/qbtOrchestrator/constants';

// Component that throws an error for testing
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({
  shouldThrow = true,
}) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

// Component that renders normally
const NormalComponent: React.FC = () => <div>Normal content</div>;

describe('ErrorBoundary', () => {
  // Suppress console.error for cleaner test output (React logs error boundary catches)
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Normal Rendering', () => {
    it('should render children when there is no error', () => {
      render(
        <ErrorBoundary>
          <NormalComponent />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Normal content')).toBeInTheDocument();
    });

    it('should render multiple children when there is no error', () => {
      render(
        <ErrorBoundary>
          <div>Child 1</div>
          <div>Child 2</div>
        </ErrorBoundary>,
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should catch errors and display default fallback UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(
        screen.getByText(/The time tracking widget encountered an error/),
      ).toBeInTheDocument();
    });

    it('should display custom fallback when provided', () => {
      const customFallback = <div>Custom error message</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(
        screen.queryByText('Something went wrong'),
      ).not.toBeInTheDocument();
    });

    it('should call onError callback when error occurs', () => {
      const mockOnError = jest.fn();

      render(
        <ErrorBoundary onError={mockOnError}>
          <ThrowError />
        </ErrorBoundary>,
      );

      expect(mockOnError).toHaveBeenCalledTimes(1);
      expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
      expect(mockOnError.mock.calls[0][0].message).toBe('Test error message');
    });

    it('should log error using logger when provided', () => {
      const mockLogger = {
        error: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
      };

      render(
        <ErrorBoundary logger={mockLogger as any}>
          <ThrowError />
        </ErrorBoundary>,
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        ORCHESTRATOR_LOGGING.ERROR_BOUNDARY_CAUGHT,
        expect.objectContaining({
          error: 'Test error message',
          stack: expect.any(String),
          componentStack: expect.any(String),
        }),
      );
    });

    it('should handle error without logger gracefully', () => {
      // Should not throw when logger is not provided
      expect(() => {
        render(
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>,
        );
      }).not.toThrow();

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should handle error without onError callback gracefully', () => {
      // Should not throw when onError is not provided
      expect(() => {
        render(
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>,
        );
      }).not.toThrow();

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('Error Details in Development', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should show error details in e2e environment', () => {
      process.env.NODE_ENV = 'e2e';

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>,
      );

      expect(
        screen.getByText('Error Details (Development)'),
      ).toBeInTheDocument();
      expect(screen.getByText(/Test error message/)).toBeInTheDocument();
    });

    it('should not show error details in production environment', () => {
      process.env.NODE_ENV = 'production';

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>,
      );

      expect(
        screen.queryByText('Error Details (Development)'),
      ).not.toBeInTheDocument();
    });

    it('should not show error details in test environment', () => {
      process.env.NODE_ENV = 'test';

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>,
      );

      expect(
        screen.queryByText('Error Details (Development)'),
      ).not.toBeInTheDocument();
    });
  });

  describe('getDerivedStateFromError', () => {
    it('should set hasError to true when error occurs', () => {
      const error = new Error('Test error');
      const result = (ErrorBoundary as any).getDerivedStateFromError(error);

      expect(result).toEqual({
        hasError: true,
        error,
      });
    });
  });

  describe('componentDidCatch', () => {
    it('should update state with error and errorInfo', () => {
      const mockOnError = jest.fn();
      const mockLogger = {
        error: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
      };

      render(
        <ErrorBoundary onError={mockOnError} logger={mockLogger as any}>
          <ThrowError />
        </ErrorBoundary>,
      );

      // Verify the error was handled
      expect(mockOnError).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('should initialize with hasError false', () => {
      render(
        <ErrorBoundary>
          <NormalComponent />
        </ErrorBoundary>,
      );

      // If hasError was true, it would show the error UI
      expect(screen.getByText('Normal content')).toBeInTheDocument();
      expect(
        screen.queryByText('Something went wrong'),
      ).not.toBeInTheDocument();
    });

    it('should maintain error state after catching error', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      // Rerender with same children - error state should persist
      rerender(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null children', () => {
      render(<ErrorBoundary>{null}</ErrorBoundary>);

      expect(
        screen.queryByText('Something went wrong'),
      ).not.toBeInTheDocument();
    });

    it('should handle text node children', () => {
      render(<ErrorBoundary>Simple text content</ErrorBoundary>);

      expect(screen.getByText('Simple text content')).toBeInTheDocument();
      expect(
        screen.queryByText('Something went wrong'),
      ).not.toBeInTheDocument();
    });

    it('should handle empty fragment children', () => {
      render(
        <ErrorBoundary>
          <></>
        </ErrorBoundary>,
      );

      expect(
        screen.queryByText('Something went wrong'),
      ).not.toBeInTheDocument();
    });

    it('should handle string error in onError callback', () => {
      const mockOnError = jest.fn();

      render(
        <ErrorBoundary onError={mockOnError}>
          <ThrowError />
        </ErrorBoundary>,
      );

      // onError receives Error object, not string
      expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('Props Combinations', () => {
    it('should work with all props provided', () => {
      const mockOnError = jest.fn();
      const mockLogger = {
        error: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
      };
      const customFallback = <div>All props fallback</div>;

      render(
        <ErrorBoundary
          onError={mockOnError}
          logger={mockLogger as any}
          fallback={customFallback}
        >
          <ThrowError />
        </ErrorBoundary>,
      );

      expect(screen.getByText('All props fallback')).toBeInTheDocument();
      expect(mockOnError).toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should work with only fallback prop', () => {
      const customFallback = <div>Only fallback</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Only fallback')).toBeInTheDocument();
    });

    it('should work with only onError prop', () => {
      const mockOnError = jest.fn();

      render(
        <ErrorBoundary onError={mockOnError}>
          <ThrowError />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(mockOnError).toHaveBeenCalled();
    });

    it('should work with only logger prop', () => {
      const mockLogger = {
        error: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
      };

      render(
        <ErrorBoundary logger={mockLogger as any}>
          <ThrowError />
        </ErrorBoundary>,
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
