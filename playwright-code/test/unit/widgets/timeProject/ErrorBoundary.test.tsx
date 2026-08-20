import React from 'react';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from 'src/js/widgets/timeProject/ErrorBoundary';

const ThrowingComponent: React.FC = () => {
  throw new Error('Test error');
};

const GoodComponent: React.FC = () => <div>All good</div>;

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <GoodComponent />
      </ErrorBoundary>,
    );
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('should render default fallback when an error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );
    expect(
      screen.getByText('Something went wrong in the Time Project widget.'),
    ).toBeInTheDocument();
  });

  it('should render custom fallback when provided and error occurs', () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowingComponent />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
  });

  it('should log the error to console', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    );
    expect(console.error).toHaveBeenCalled();
  });

  it('should set hasError state via getDerivedStateFromError', () => {
    const result = ErrorBoundary.getDerivedStateFromError();
    expect(result).toEqual({ hasError: true });
  });
});
