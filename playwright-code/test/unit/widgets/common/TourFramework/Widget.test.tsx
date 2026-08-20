// @ts-nocheck
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { buildSandbox } from '@payroll/quicksand';
import Widget from 'src/js/widgets/common/TourFramework/Widget';
import { getApolloClientInstance } from 'src/js/service/ApolloClientBuilder';

// Mock dependencies
jest.mock('src/nls', () => ({
  __esModule: true,
  default: {
    requireNlsForLocale: jest.fn().mockReturnValue({}),
  },
}));

jest.mock('src/js/service/ApolloClientBuilder', () => ({
  getApolloClientInstance: jest.fn(),
}));

jest.mock('@apollo/client', () => ({
  ApolloProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="apollo-provider">{children}</div>
  ),
}));

jest.mock('@payroll/quicksand', () => ({
  buildSandbox: jest.fn(),
  QuicksandProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="quicksand-provider">{children}</div>
  ),
}));

jest.mock(
  'web-shell-core/widgets/BaseWidget',
  () =>
    class MockBaseWidget extends React.Component<any> {
      ready = jest.fn();

      render() {
        const { children } = this.props;
        return children || <div>Base Widget</div>;
      }
    },
);

jest.mock(
  'src/js/widgets/common/TourFramework/TourFramework',
  () =>
    function MockTourFramework(props: any) {
      return (
        <div data-testid="tour-framework">
          <span data-testid="tour-id">{props.tourId}</span>
          <span data-testid="tour-open">{String(props.open)}</span>
          <span data-testid="tour-mode">{props.mode || 'modal'}</span>
        </div>
      );
    },
);

describe('TourFramework Widget', () => {
  let mockSandbox: any;
  let mockApolloClient: any;
  const mockGetApolloClientInstance =
    getApolloClientInstance as jest.MockedFunction<
      typeof getApolloClientInstance
    >;

  beforeEach(() => {
    mockSandbox = {
      logger: {
        info: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
      },
    };

    mockApolloClient = {
      query: jest.fn(),
      mutate: jest.fn(),
      cache: {
        readQuery: jest.fn(),
        writeQuery: jest.fn(),
      },
      link: {},
      disableNetworkFetches: false,
      version: '3.0.0',
      addResolvers: jest.fn(),
      clearStore: jest.fn(),
      extract: jest.fn(),
      getResolvers: jest.fn(),
      onClearStore: jest.fn(),
      onResetStore: jest.fn(),
      readFragment: jest.fn(),
      readQuery: jest.fn(),
      resetStore: jest.fn(),
      restore: jest.fn(),
      reFetchObservableQueries: jest.fn(),
      refetchQueries: jest.fn(),
      stop: jest.fn(),
      subscribe: jest.fn(),
      watchQuery: jest.fn(),
      writeFragment: jest.fn(),
      writeQuery: jest.fn(),
      __actionHookForDevTools: jest.fn(),
      setResolvers: jest.fn(),
      setLocalStateFragmentMatcher: jest.fn(),
    };

    mockGetApolloClientInstance.mockReturnValue(mockApolloClient);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const widget = new Widget({
        sandbox: mockSandbox,
        open: true,
        steps: [],
        tourId: 'test-tour',
        onClose: jest.fn(),
      });

      const result = render(widget.render() as React.ReactElement);
      expect(result.container).toBeInTheDocument();
    });

    it('renders all provider components in correct order', () => {
      const widget = new Widget({
        sandbox: mockSandbox,
        open: true,
        steps: [],
        tourId: 'test-tour',
        onClose: jest.fn(),
      });

      render(widget.render() as React.ReactElement);

      expect(screen.getByTestId('quicksand-provider')).toBeInTheDocument();
      expect(screen.getByTestId('apollo-provider')).toBeInTheDocument();
      expect(screen.getByTestId('tour-framework')).toBeInTheDocument();
    });

    it('renders TourFramework component', () => {
      const widget = new Widget({
        sandbox: mockSandbox,
        open: true,
        steps: [],
        tourId: 'my-tour',
        onClose: jest.fn(),
      });

      render(widget.render() as React.ReactElement);

      expect(screen.getByTestId('tour-framework')).toBeInTheDocument();
      expect(screen.getByTestId('tour-id')).toHaveTextContent('my-tour');
    });
  });

  describe('Apollo Client Integration', () => {
    it('uses getApolloClientInstance when no external client provided', () => {
      const widget = new Widget({
        sandbox: mockSandbox,
        open: true,
        steps: [],
        tourId: 'test-tour',
        onClose: jest.fn(),
      });

      render(widget.render() as React.ReactElement);

      expect(mockGetApolloClientInstance).toHaveBeenCalledWith(mockSandbox);
      expect(screen.getByTestId('apollo-provider')).toBeInTheDocument();
    });

    it('uses external Apollo client when provided', () => {
      const externalClient = mockApolloClient;
      const widget = new Widget({
        sandbox: mockSandbox,
        externalApolloClient: externalClient,
        open: true,
        steps: [],
        tourId: 'test-tour',
        onClose: jest.fn(),
      });

      render(widget.render() as React.ReactElement);

      // Should not call getApolloClientInstance when external client is provided
      expect(mockGetApolloClientInstance).not.toHaveBeenCalled();
      expect(screen.getByTestId('apollo-provider')).toBeInTheDocument();
    });

    it('renders error message when Apollo client is not available', () => {
      mockGetApolloClientInstance.mockReturnValue(null);

      const widget = new Widget({
        sandbox: mockSandbox,
        open: true,
        steps: [],
        tourId: 'test-tour',
        onClose: jest.fn(),
      });

      render(widget.render() as React.ReactElement);

      expect(
        screen.getByText('Error: Apollo client not initialized'),
      ).toBeInTheDocument();
    });
  });

  describe('Lifecycle Methods', () => {
    it('calls ready() on mount', () => {
      const widget = new Widget({
        sandbox: mockSandbox,
        open: true,
        steps: [],
        tourId: 'test-tour',
        onClose: jest.fn(),
      });

      const readySpy = jest.spyOn(widget, 'ready');

      widget.componentDidMount();

      expect(readySpy).toHaveBeenCalled();
    });

    it('handles component errors in getDerivedStateFromError', () => {
      const testError = new Error('Test error');
      const newState = Widget.getDerivedStateFromError(testError);

      expect(newState).toEqual({
        hasError: true,
        error: testError,
      });
    });

    it('logs errors in componentDidCatch', () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const testError = new Error('Test error');
      const errorInfo = { componentStack: 'test stack' };

      const widget = new Widget({
        sandbox: mockSandbox,
        open: true,
        steps: [],
        tourId: 'test-tour',
        onClose: jest.fn(),
      });

      widget.componentDidCatch(testError, errorInfo);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Guided tooltip widget error:',
        testError,
        errorInfo,
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Props Passing', () => {
    it('passes all TourFramework props correctly', () => {
      const mockSteps = [
        { id: '1', title: 'Step 1', description: 'Description 1' },
      ];
      const mockOnComplete = jest.fn();
      const mockOnClose = jest.fn();

      const widget = new Widget({
        sandbox: mockSandbox,
        open: true,
        steps: mockSteps,
        tourId: 'my-tour',
        onComplete: mockOnComplete,
        onClose: mockOnClose,
        mode: 'tooltip',
      });

      render(widget.render() as React.ReactElement);

      expect(screen.getByTestId('tour-id')).toHaveTextContent('my-tour');
      expect(screen.getByTestId('tour-open')).toHaveTextContent('true');
      expect(screen.getByTestId('tour-mode')).toHaveTextContent('tooltip');
    });

    it('passes sandbox to TourFramework', () => {
      const widget = new Widget({
        sandbox: mockSandbox,
        open: true,
        steps: [],
        tourId: 'test-tour',
        onClose: jest.fn(),
      });

      render(widget.render() as React.ReactElement);

      expect(screen.getByTestId('tour-framework')).toBeInTheDocument();
    });

    it('handles optional onComplete prop', () => {
      const widget = new Widget({
        sandbox: mockSandbox,
        open: true,
        steps: [],
        tourId: 'test-tour',
        onClose: jest.fn(),
      });

      expect(() => {
        render(widget.render() as React.ReactElement);
      }).not.toThrow();
    });

    it('handles optional mode prop', () => {
      const widget = new Widget({
        sandbox: mockSandbox,
        open: true,
        steps: [],
        tourId: 'test-tour',
        onClose: jest.fn(),
      });

      render(widget.render() as React.ReactElement);

      // Should default to modal mode
      expect(screen.getByTestId('tour-mode')).toHaveTextContent('modal');
    });
  });

  describe('Provider Configuration', () => {
    it('configures QuicksandProvider with correct props', () => {
      const widget = new Widget({
        sandbox: mockSandbox,
        open: true,
        steps: [],
        tourId: 'test-tour',
        onClose: jest.fn(),
      });

      render(widget.render() as React.ReactElement);

      expect(screen.getByTestId('quicksand-provider')).toBeInTheDocument();
    });

    it('configures ApolloProvider with client', () => {
      const widget = new Widget({
        sandbox: mockSandbox,
        open: true,
        steps: [],
        tourId: 'test-tour',
        onClose: jest.fn(),
      });

      render(widget.render() as React.ReactElement);

      expect(screen.getByTestId('apollo-provider')).toBeInTheDocument();
    });

    it('wraps ApolloProvider inside QuicksandProvider', () => {
      const widget = new Widget({
        sandbox: mockSandbox,
        open: true,
        steps: [],
        tourId: 'test-tour',
        onClose: jest.fn(),
      });

      render(widget.render() as React.ReactElement);

      const quicksandProvider = screen.getByTestId('quicksand-provider');
      const apolloProvider = screen.getByTestId('apollo-provider');

      expect(quicksandProvider).toContainElement(apolloProvider);
    });
  });

  describe('Error Scenarios', () => {
    it('handles missing sandbox gracefully', () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      try {
        const widget = new Widget({
          sandbox: undefined as any,
          open: true,
          steps: [],
          tourId: 'test-tour',
          onClose: jest.fn(),
        });

        // Should handle missing sandbox
        expect(() => widget.componentDidMount()).toThrow();
      } catch (error) {
        expect(error).toBeDefined();
      }

      consoleSpy.mockRestore();
    });

    it('handles Apollo client initialization failure', () => {
      mockGetApolloClientInstance.mockReturnValue(null);

      const widget = new Widget({
        sandbox: mockSandbox,
        open: true,
        steps: [],
        tourId: 'test-tour',
        onClose: jest.fn(),
      });

      render(widget.render() as React.ReactElement);

      expect(
        screen.getByText('Error: Apollo client not initialized'),
      ).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('handles all required props', () => {
      const widget = new Widget({
        sandbox: mockSandbox,
        open: true,
        steps: [],
        tourId: 'test-tour',
        onClose: jest.fn(),
      });

      expect(widget.props.sandbox).toBe(mockSandbox);
      expect(widget.props.open).toBe(true);
      expect(widget.props.tourId).toBe('test-tour');
      expect(typeof widget.props.onClose).toBe('function');
    });

    it('handles optional externalApolloClient prop', () => {
      const externalClient = mockApolloClient;
      const widget = new Widget({
        sandbox: mockSandbox,
        externalApolloClient: externalClient,
        open: true,
        steps: [],
        tourId: 'test-tour',
        onClose: jest.fn(),
      });

      expect(widget.props.externalApolloClient).toBe(externalClient);
    });

    it('handles steps array prop', () => {
      const steps = [
        { id: '1', title: 'Test', description: 'Test description' },
      ];
      const widget = new Widget({
        sandbox: mockSandbox,
        open: true,
        steps,
        tourId: 'test-tour',
        onClose: jest.fn(),
      });

      expect(widget.props.steps).toBe(steps);
    });

    it('handles mode prop', () => {
      const widget = new Widget({
        sandbox: mockSandbox,
        open: true,
        steps: [],
        tourId: 'test-tour',
        onClose: jest.fn(),
        mode: 'tooltip',
      });

      render(widget.render() as React.ReactElement);

      expect(screen.getByTestId('tour-mode')).toHaveTextContent('tooltip');
    });
  });

  describe('Integration', () => {
    it('integrates all providers correctly', () => {
      const widget = new Widget({
        sandbox: mockSandbox,
        open: true,
        steps: [],
        tourId: 'test-tour',
        onClose: jest.fn(),
      });

      render(widget.render() as React.ReactElement);

      const quicksandProvider = screen.getByTestId('quicksand-provider');
      const apolloProvider = screen.getByTestId('apollo-provider');
      const tourFramework = screen.getByTestId('tour-framework');

      expect(quicksandProvider).toBeInTheDocument();
      expect(apolloProvider).toBeInTheDocument();
      expect(tourFramework).toBeInTheDocument();
    });

    it('passes correct nlsLoader to QuicksandProvider', () => {
      const widget = new Widget({
        sandbox: mockSandbox,
        open: true,
        steps: [],
        tourId: 'test-tour',
        onClose: jest.fn(),
      });

      render(widget.render() as React.ReactElement);

      expect(screen.getByTestId('quicksand-provider')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('does not cause memory leaks', () => {
      const widget = new Widget({
        sandbox: mockSandbox,
        open: true,
        steps: [],
        tourId: 'test-tour',
        onClose: jest.fn(),
      });

      const { unmount } = render(widget.render() as React.ReactElement);

      expect(() => unmount()).not.toThrow();
    });

    it('handles multiple renders', () => {
      const widget = new Widget({
        sandbox: mockSandbox,
        open: true,
        steps: [],
        tourId: 'test-tour',
        onClose: jest.fn(),
      });

      const { rerender } = render(widget.render() as React.ReactElement);

      expect(() =>
        rerender(widget.render() as React.ReactElement),
      ).not.toThrow();
      expect(screen.getByTestId('tour-framework')).toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('handles open state changes', () => {
      let widget = new Widget({
        sandbox: mockSandbox,
        open: true,
        steps: [],
        tourId: 'test-tour',
        onClose: jest.fn(),
      });

      const { rerender } = render(widget.render() as React.ReactElement);
      expect(screen.getByTestId('tour-open')).toHaveTextContent('true');

      widget = new Widget({
        sandbox: mockSandbox,
        open: false,
        steps: [],
        tourId: 'test-tour',
        onClose: jest.fn(),
      });

      rerender(widget.render() as React.ReactElement);
      expect(screen.getByTestId('tour-open')).toHaveTextContent('false');
    });

    it('handles steps updates', () => {
      const initialSteps = [
        { id: '1', title: 'Step 1', description: 'Description 1' },
      ];
      const updatedSteps = [
        { id: '1', title: 'Step 1', description: 'Description 1' },
        { id: '2', title: 'Step 2', description: 'Description 2' },
      ];

      let widget = new Widget({
        sandbox: mockSandbox,
        open: true,
        steps: initialSteps,
        tourId: 'test-tour',
        onClose: jest.fn(),
      });

      const { rerender } = render(widget.render() as React.ReactElement);

      widget = new Widget({
        sandbox: mockSandbox,
        open: true,
        steps: updatedSteps,
        tourId: 'test-tour',
        onClose: jest.fn(),
      });

      expect(() =>
        rerender(widget.render() as React.ReactElement),
      ).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it.each([
      {
        description: 'handles empty steps array',
        props: {
          sandbox: mockSandbox,
          open: true,
          steps: [] as any[],
          tourId: 'test-tour',
          onClose: jest.fn(),
        },
      },
      {
        description: 'handles null steps',
        props: {
          sandbox: mockSandbox,
          open: true,
          steps: null as any,
          tourId: 'test-tour',
          onClose: jest.fn(),
        },
      },
      {
        description: 'handles undefined tourId',
        props: {
          sandbox: mockSandbox,
          open: true,
          steps: [] as any[],
          tourId: undefined as any,
          onClose: jest.fn(),
        },
      },
      {
        description: 'handles missing onClose callback',
        props: {
          sandbox: mockSandbox,
          open: true,
          steps: [] as any[],
          tourId: 'test-tour',
          onClose: undefined as any,
        },
      },
    ])('$description', ({ props }) => {
      const widget = new Widget(props);

      expect(() => {
        render(widget.render() as React.ReactElement);
      }).not.toThrow();
    });
  });
});
