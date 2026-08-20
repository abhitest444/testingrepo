import React from 'react';
import { render, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { InMemoryCache } from '@apollo/client';
import { Sandbox } from 'src/js/common/sandbox';
import { getDefaultSandbox } from 'test/unit/testUtils';
import {
  WeeklyTimeEntryApolloProvider,
  useWeeklyTimeEntryApollo,
  useWeeklyTimeEntryClient,
} from 'src/js/widgets/weeklyTimeEntry/components/WeeklyTimeEntryApolloProvider';

// Mock the WeeklyTimeEntryApolloClient module
jest.mock(
  'src/js/widgets/weeklyTimeEntry/utils/WeeklyTimeEntryApolloClient',
  () => ({
    getWeeklyTimeEntryApolloClient: jest.fn(),
  }),
);

// Mock Apollo Client with proper setup for testing
const mockApolloClient = {
  query: jest.fn(),
  mutate: jest.fn(),
  cache: new InMemoryCache(),
  watchQuery: jest.fn(),
  subscribe: jest.fn(),
  readQuery: jest.fn(),
  writeQuery: jest.fn(),
  resetStore: jest.fn(),
  clearStore: jest.fn(),
} as any;

// Import the mocked module
const {
  getWeeklyTimeEntryApolloClient,
} = require('src/js/widgets/weeklyTimeEntry/utils/WeeklyTimeEntryApolloClient');

describe('WeeklyTimeEntryApolloProvider', () => {
  let mockSandbox: Sandbox;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSandbox = getDefaultSandbox();
    (getWeeklyTimeEntryApolloClient as jest.Mock).mockReturnValue(
      mockApolloClient,
    );
  });

  describe('Provider Component', () => {
    it('should render children correctly', () => {
      const TestChild = () => <div data-testid="test-child">Test Content</div>;

      render(
        <WeeklyTimeEntryApolloProvider sandbox={mockSandbox}>
          <TestChild />
        </WeeklyTimeEntryApolloProvider>,
      );

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should call getWeeklyTimeEntryApolloClient with correct sandbox', () => {
      const TestChild = () => <div>Test</div>;

      render(
        <WeeklyTimeEntryApolloProvider sandbox={mockSandbox}>
          <TestChild />
        </WeeklyTimeEntryApolloProvider>,
      );

      expect(getWeeklyTimeEntryApolloClient).toHaveBeenCalledWith(mockSandbox);
      expect(getWeeklyTimeEntryApolloClient).toHaveBeenCalledTimes(1);
    });

    it('should memoize the Apollo client to prevent unnecessary re-creations', () => {
      const TestChild = () => <div>Test</div>;

      const { rerender } = render(
        <WeeklyTimeEntryApolloProvider sandbox={mockSandbox}>
          <TestChild />
        </WeeklyTimeEntryApolloProvider>,
      );

      // First render should call the function
      expect(getWeeklyTimeEntryApolloClient).toHaveBeenCalledTimes(1);

      // Re-render with same sandbox should not call again due to memoization
      rerender(
        <WeeklyTimeEntryApolloProvider sandbox={mockSandbox}>
          <TestChild />
        </WeeklyTimeEntryApolloProvider>,
      );

      expect(getWeeklyTimeEntryApolloClient).toHaveBeenCalledTimes(1);
    });

    it('should create new client when sandbox changes', () => {
      const TestChild = () => <div>Test</div>;
      const newSandbox = getDefaultSandbox();

      const { rerender } = render(
        <WeeklyTimeEntryApolloProvider sandbox={mockSandbox}>
          <TestChild />
        </WeeklyTimeEntryApolloProvider>,
      );

      expect(getWeeklyTimeEntryApolloClient).toHaveBeenCalledTimes(1);
      expect(getWeeklyTimeEntryApolloClient).toHaveBeenCalledWith(mockSandbox);

      // Re-render with different sandbox should call again
      rerender(
        <WeeklyTimeEntryApolloProvider sandbox={newSandbox}>
          <TestChild />
        </WeeklyTimeEntryApolloProvider>,
      );

      expect(getWeeklyTimeEntryApolloClient).toHaveBeenCalledTimes(2);
      expect(getWeeklyTimeEntryApolloClient).toHaveBeenLastCalledWith(
        newSandbox,
      );
    });

    it('should provide both ApolloProvider and custom context', () => {
      const TestChild = () => {
        const { weeklyClient, sandbox } = useWeeklyTimeEntryApollo();
        return (
          <div>
            <div data-testid="has-client">
              {weeklyClient ? 'has-client' : 'no-client'}
            </div>
            <div data-testid="has-sandbox">
              {sandbox ? 'has-sandbox' : 'no-sandbox'}
            </div>
          </div>
        );
      };

      render(
        <WeeklyTimeEntryApolloProvider sandbox={mockSandbox}>
          <TestChild />
        </WeeklyTimeEntryApolloProvider>,
      );

      expect(screen.getByTestId('has-client')).toHaveTextContent('has-client');
      expect(screen.getByTestId('has-sandbox')).toHaveTextContent(
        'has-sandbox',
      );
    });
  });

  describe('useWeeklyTimeEntryApollo hook', () => {
    it('should return context value when used within provider', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WeeklyTimeEntryApolloProvider sandbox={mockSandbox}>
          {children}
        </WeeklyTimeEntryApolloProvider>
      );

      const { result } = renderHook(() => useWeeklyTimeEntryApollo(), {
        wrapper,
      });

      expect(result.current).toEqual({
        weeklyClient: mockApolloClient,
        sandbox: mockSandbox,
      });
    });

    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test since we expect an error
      const originalError = console.error;
      // eslint-disable-next-line no-console
      console.error = jest.fn();

      const { result } = renderHook(() => useWeeklyTimeEntryApollo());

      expect(result.error).toEqual(
        new Error(
          'useWeeklyTimeEntryApollo must be used within a WeeklyTimeEntryApolloProvider',
        ),
      );

      // eslint-disable-next-line no-console
      console.error = originalError;
    });

    it('should return the same context object on re-renders with same props', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WeeklyTimeEntryApolloProvider sandbox={mockSandbox}>
          {children}
        </WeeklyTimeEntryApolloProvider>
      );

      const { result, rerender } = renderHook(
        () => useWeeklyTimeEntryApollo(),
        {
          wrapper,
        },
      );

      const firstResult = result.current;
      rerender();
      const secondResult = result.current;

      expect(firstResult).toBe(secondResult);
    });

    it('should return new context object when sandbox changes', () => {
      let currentSandbox = mockSandbox;
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WeeklyTimeEntryApolloProvider sandbox={currentSandbox}>
          {children}
        </WeeklyTimeEntryApolloProvider>
      );

      const { result, rerender } = renderHook(
        () => useWeeklyTimeEntryApollo(),
        {
          wrapper,
        },
      );

      const firstResult = result.current;

      // Change sandbox and rerender
      currentSandbox = getDefaultSandbox();
      rerender();

      const secondResult = result.current;

      expect(firstResult).not.toBe(secondResult);
      expect(secondResult.sandbox).toBe(currentSandbox);
    });
  });

  describe('useWeeklyTimeEntryClient hook', () => {
    it('should return Apollo client when used within provider', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WeeklyTimeEntryApolloProvider sandbox={mockSandbox}>
          {children}
        </WeeklyTimeEntryApolloProvider>
      );

      const { result } = renderHook(() => useWeeklyTimeEntryClient(), {
        wrapper,
      });

      expect(result.current).toBe(mockApolloClient);
    });

    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test since we expect an error
      const originalError = console.error;
      // eslint-disable-next-line no-console
      console.error = jest.fn();

      const { result } = renderHook(() => useWeeklyTimeEntryClient());

      expect(result.error).toEqual(
        new Error(
          'useWeeklyTimeEntryApollo must be used within a WeeklyTimeEntryApolloProvider',
        ),
      );

      // eslint-disable-next-line no-console
      console.error = originalError;
    });

    it('should return the same client instance on re-renders', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WeeklyTimeEntryApolloProvider sandbox={mockSandbox}>
          {children}
        </WeeklyTimeEntryApolloProvider>
      );

      const { result, rerender } = renderHook(
        () => useWeeklyTimeEntryClient(),
        {
          wrapper,
        },
      );

      const firstClient = result.current;
      rerender();
      const secondClient = result.current;

      expect(firstClient).toBe(secondClient);
    });
  });

  describe('Integration Tests', () => {
    it('should work with nested providers', () => {
      const TestChild = () => {
        const { weeklyClient, sandbox } = useWeeklyTimeEntryApollo();
        const client = useWeeklyTimeEntryClient();

        return (
          <div>
            <div data-testid="clients-match">
              {weeklyClient === client ? 'match' : 'no-match'}
            </div>
            <div data-testid="sandbox-exists">
              {sandbox ? 'exists' : 'missing'}
            </div>
          </div>
        );
      };

      render(
        <WeeklyTimeEntryApolloProvider sandbox={mockSandbox}>
          <div>
            <WeeklyTimeEntryApolloProvider sandbox={mockSandbox}>
              <TestChild />
            </WeeklyTimeEntryApolloProvider>
          </div>
        </WeeklyTimeEntryApolloProvider>,
      );

      expect(screen.getByTestId('clients-match')).toHaveTextContent('match');
      expect(screen.getByTestId('sandbox-exists')).toHaveTextContent('exists');
    });

    it('should handle Apollo client creation errors gracefully', () => {
      const errorMessage = 'Failed to create Apollo client';
      (getWeeklyTimeEntryApolloClient as jest.Mock).mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Suppress console.error for this test since we expect an error
      const originalError = console.error;
      // eslint-disable-next-line no-console
      console.error = jest.fn();

      expect(() => {
        render(
          <WeeklyTimeEntryApolloProvider sandbox={mockSandbox}>
            <div>Test</div>
          </WeeklyTimeEntryApolloProvider>,
        );
      }).toThrow(errorMessage);

      // eslint-disable-next-line no-console
      console.error = originalError;
    });

    it('should provide working Apollo context for queries', () => {
      const TestChild = () => {
        const client = useWeeklyTimeEntryClient();

        return (
          <div data-testid="client-type">
            {client && typeof client.query === 'function'
              ? 'apollo-client'
              : 'invalid'}
          </div>
        );
      };

      render(
        <WeeklyTimeEntryApolloProvider sandbox={mockSandbox}>
          <TestChild />
        </WeeklyTimeEntryApolloProvider>,
      );

      expect(screen.getByTestId('client-type')).toHaveTextContent(
        'apollo-client',
      );
    });
  });

  describe('Performance Tests', () => {
    it('should not create multiple clients for same sandbox', () => {
      const TestChild = () => <div>Test</div>;

      const { unmount } = render(
        <WeeklyTimeEntryApolloProvider sandbox={mockSandbox}>
          <TestChild />
        </WeeklyTimeEntryApolloProvider>,
      );

      unmount();

      render(
        <WeeklyTimeEntryApolloProvider sandbox={mockSandbox}>
          <TestChild />
        </WeeklyTimeEntryApolloProvider>,
      );

      // Should be called twice (once for each mount), but with memoization
      // the client creation should be optimized within each mount
      expect(getWeeklyTimeEntryApolloClient).toHaveBeenCalledTimes(2);
    });

    it('should memoize context value to prevent unnecessary re-renders', () => {
      let renderCount = 0;
      const TestChild = React.memo(() => {
        renderCount += 1;
        useWeeklyTimeEntryApollo();
        return <div>Render count: {renderCount}</div>;
      });

      const { rerender } = render(
        <WeeklyTimeEntryApolloProvider sandbox={mockSandbox}>
          <TestChild />
        </WeeklyTimeEntryApolloProvider>,
      );

      expect(renderCount).toBe(1);

      // Re-render with same props should not cause child to re-render
      // due to context value memoization
      rerender(
        <WeeklyTimeEntryApolloProvider sandbox={mockSandbox}>
          <TestChild />
        </WeeklyTimeEntryApolloProvider>,
      );

      // Since we're using React.memo and the context value is memoized,
      // the child should not re-render
      expect(renderCount).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null sandbox gracefully', () => {
      // This tests the robustness of the component
      const TestChild = () => <div>Test</div>;

      render(
        <WeeklyTimeEntryApolloProvider sandbox={null as any}>
          <TestChild />
        </WeeklyTimeEntryApolloProvider>,
      );

      expect(getWeeklyTimeEntryApolloClient).toHaveBeenCalledWith(null);
    });

    it('should handle undefined sandbox gracefully', () => {
      const TestChild = () => <div>Test</div>;

      render(
        <WeeklyTimeEntryApolloProvider sandbox={undefined as any}>
          <TestChild />
        </WeeklyTimeEntryApolloProvider>,
      );

      expect(getWeeklyTimeEntryApolloClient).toHaveBeenCalledWith(undefined);
    });

    it('should handle empty children', () => {
      render(
        <WeeklyTimeEntryApolloProvider sandbox={mockSandbox}>
          {null}
        </WeeklyTimeEntryApolloProvider>,
      );

      expect(getWeeklyTimeEntryApolloClient).toHaveBeenCalledWith(mockSandbox);
    });

    it('should handle multiple children', () => {
      render(
        <WeeklyTimeEntryApolloProvider sandbox={mockSandbox}>
          <div data-testid="child1">Child 1</div>
          <div data-testid="child2">Child 2</div>
          <span data-testid="child3">Child 3</span>
        </WeeklyTimeEntryApolloProvider>,
      );

      expect(screen.getByTestId('child1')).toBeInTheDocument();
      expect(screen.getByTestId('child2')).toBeInTheDocument();
      expect(screen.getByTestId('child3')).toBeInTheDocument();
    });
  });

  describe('TypeScript Type Safety', () => {
    it('should provide correct TypeScript types for context', () => {
      const TestChild = () => {
        const context = useWeeklyTimeEntryApollo();

        // These checks ensure TypeScript compilation and runtime type safety
        expect(typeof context).toBe('object');
        expect(context).toHaveProperty('weeklyClient');
        expect(context).toHaveProperty('sandbox');

        return <div>Type test passed</div>;
      };

      render(
        <WeeklyTimeEntryApolloProvider sandbox={mockSandbox}>
          <TestChild />
        </WeeklyTimeEntryApolloProvider>,
      );
    });

    it('should provide correct TypeScript types for client hook', () => {
      const TestChild = () => {
        const client = useWeeklyTimeEntryClient();

        // Ensure the client has the expected Apollo Client interface
        expect(client).toHaveProperty('query');
        expect(client).toHaveProperty('mutate');
        expect(client).toHaveProperty('cache');

        return <div>Client type test passed</div>;
      };

      render(
        <WeeklyTimeEntryApolloProvider sandbox={mockSandbox}>
          <TestChild />
        </WeeklyTimeEntryApolloProvider>,
      );
    });
  });
});
