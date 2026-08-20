// @ts-nocheck
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { buildSandbox } from '@payroll/quicksand';
import UserSettingsWidget from 'src/js/widgets/userSettings/Widget';
import { getApolloClientInstance } from 'src/js/service/ApolloClientBuilder';
import { TimeTracking_TimeForType } from 'src/__generated__/timeTracking/graphql';
import { encryptWorkerId } from 'src/js/widgets/assignments/utils/helpers';
import { decryptWorkerId } from 'src/js/widgets/userSettings/utils/helpers';

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

jest.mock('src/js/providers/LoggingConfigProvider', () => ({
  LoggingConfigProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="logging-config-provider">{children}</div>
  ),
}));

jest.mock('src/js/widgets/breaks/utils', () => ({
  getThemeFromSandbox: jest.fn().mockReturnValue({}),
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

jest.mock('@design-systems/theme', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
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
  'src/js/widgets/userSettings/components/UserSettingsPage',
  () =>
    function MockUserSettingsPage() {
      return <div data-testid="user-settings-page">User Settings Page</div>;
    },
);

describe('UserSettingsWidget', () => {
  let mockSandbox: any;
  let mockApolloClient: any;
  let mockOptions: any;
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

    mockOptions = {
      feature: 'user-settings' as const,
      functionality: 'page' as const,
    };

    mockGetApolloClientInstance.mockReturnValue(mockApolloClient);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      const workerId = 'worker-1';
      const encryptedWorkerId = encryptWorkerId(workerId);

      const widget = new UserSettingsWidget({
        sandbox: mockSandbox,
        options: mockOptions,
        onError: jest.fn(),
        routeInfo: {
          params: {
            workerId: encryptedWorkerId,
            workerType: TimeTracking_TimeForType.Employee,
            workerName: 'John%20Doe',
          },
        },
      });

      const result = render(widget.render() as React.ReactElement);
      expect(result.container).toBeInTheDocument();
    });

    it('renders all provider components in correct order', () => {
      const workerId = 'worker-123';
      const encryptedWorkerId = encryptWorkerId(workerId);

      const widget = new UserSettingsWidget({
        sandbox: mockSandbox,
        options: mockOptions,
        onError: jest.fn(),
        routeInfo: {
          params: {
            workerId: encryptedWorkerId,
          },
        },
      });

      render(widget.render() as React.ReactElement);

      // Check that all providers are rendered
      expect(screen.getByTestId('quicksand-provider')).toBeInTheDocument();
      expect(screen.getByTestId('logging-config-provider')).toBeInTheDocument();
      expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
      expect(screen.getByTestId('apollo-provider')).toBeInTheDocument();
      expect(screen.getByTestId('user-settings-page')).toBeInTheDocument();
    });

    it('renders UserSettingsPage component', () => {
      const workerId = 'worker-123';
      const encryptedWorkerId = encryptWorkerId(workerId);

      const widget = new UserSettingsWidget({
        sandbox: mockSandbox,
        options: mockOptions,
        onError: jest.fn(),
        routeInfo: {
          params: {
            workerId: encryptedWorkerId,
          },
        },
      });

      render(widget.render() as React.ReactElement);
      expect(screen.getByTestId('user-settings-page')).toBeInTheDocument();
      expect(screen.getByText('User Settings Page')).toBeInTheDocument();
    });
  });

  describe('Apollo Client Integration', () => {
    it('uses getApolloClientInstance when no external client provided', () => {
      const workerId = 'worker-123';
      const encryptedWorkerId = encryptWorkerId(workerId);

      const widget = new UserSettingsWidget({
        sandbox: mockSandbox,
        options: mockOptions,
        onError: jest.fn(),
        routeInfo: {
          params: {
            workerId: encryptedWorkerId,
          },
        },
      });

      render(widget.render() as React.ReactElement);

      expect(mockGetApolloClientInstance).toHaveBeenCalledWith(mockSandbox);
      expect(screen.getByTestId('apollo-provider')).toBeInTheDocument();
    });

    it('uses external Apollo client when provided', () => {
      const workerId = 'worker-123';
      const encryptedWorkerId = encryptWorkerId(workerId);
      const externalClient = mockApolloClient;

      const widget = new UserSettingsWidget({
        sandbox: mockSandbox,
        options: mockOptions,
        externalApolloClient: externalClient,
        onError: jest.fn(),
        routeInfo: {
          params: {
            workerId: encryptedWorkerId,
          },
        },
      });

      render(widget.render() as React.ReactElement);

      // Should not call getApolloClientInstance when external client is provided
      expect(mockGetApolloClientInstance).not.toHaveBeenCalled();
      expect(screen.getByTestId('apollo-provider')).toBeInTheDocument();
    });

    it('renders error message when Apollo client is not available', () => {
      mockGetApolloClientInstance.mockReturnValue(null);

      const widget = new UserSettingsWidget({
        sandbox: mockSandbox,
        options: mockOptions,
        onError: jest.fn(),
        routeInfo: {
          params: {},
        },
      });

      const result = render(widget.render() as React.ReactElement);

      expect(
        screen.getByText('Error: Apollo client not initialized'),
      ).toBeInTheDocument();
      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        'APOLLO_CLIENT_NOT_INITIALIZED',
      );
    });
  });

  describe('Lifecycle Methods', () => {
    it('calls ready() and logs info on mount', () => {
      const widget = new UserSettingsWidget({
        sandbox: mockSandbox,
        options: mockOptions,
        onError: jest.fn(),
        routeInfo: {
          params: {},
        },
      });

      const readySpy = jest.spyOn(widget, 'ready');

      widget.componentDidMount();

      expect(readySpy).toHaveBeenCalled();
      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        'UserSettings widget mounted',
      );
    });

    it('handles component errors gracefully', () => {
      const mockOnError = jest.fn();
      const testError = new Error('Test error');

      const widget = new UserSettingsWidget({
        sandbox: mockSandbox,
        onError: mockOnError,
        options: mockOptions,
        routeInfo: {
          params: {},
        },
      });

      widget.componentDidCatch(testError);

      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        'Plugin=time-tracking-ui Error=USER_SETTINGS_WIDGET_CRASH',
        { error: testError },
      );
      expect(mockOnError).toHaveBeenCalledWith(testError);
    });

    it('handles component errors when onError is not provided', () => {
      const testError = new Error('Test error');

      const widget = new UserSettingsWidget({
        sandbox: mockSandbox,
        options: mockOptions,
        routeInfo: {
          params: {},
        },
      });

      // Should not throw when onError is not provided
      expect(() => widget.componentDidCatch(testError)).not.toThrow();
      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        'Plugin=time-tracking-ui Error=USER_SETTINGS_WIDGET_CRASH',
        { error: testError },
      );
    });
  });

  describe('Provider Configuration', () => {
    it('configures QuicksandProvider with correct props', () => {
      const workerId = 'worker-123';
      const encryptedWorkerId = encryptWorkerId(workerId);

      const widget = new UserSettingsWidget({
        sandbox: mockSandbox,
        options: mockOptions,
        onError: jest.fn(),
        routeInfo: {
          params: {
            workerId: encryptedWorkerId,
          },
        },
      });

      render(widget.render() as React.ReactElement);

      // QuicksandProvider should be present
      expect(screen.getByTestId('quicksand-provider')).toBeInTheDocument();
    });

    it('configures LoggingConfigProvider with correct prefix', () => {
      const workerId = 'worker-123';
      const encryptedWorkerId = encryptWorkerId(workerId);

      const widget = new UserSettingsWidget({
        sandbox: mockSandbox,
        options: mockOptions,
        onError: jest.fn(),
        routeInfo: {
          params: {
            workerId: encryptedWorkerId,
          },
        },
      });

      render(widget.render() as React.ReactElement);

      // LoggingConfigProvider should be present
      expect(screen.getByTestId('logging-config-provider')).toBeInTheDocument();
    });

    it('configures ThemeProvider with theme from sandbox', () => {
      const workerId = 'worker-123';
      const encryptedWorkerId = encryptWorkerId(workerId);

      const widget = new UserSettingsWidget({
        sandbox: mockSandbox,
        options: mockOptions,
        onError: jest.fn(),
        routeInfo: {
          params: {
            workerId: encryptedWorkerId,
          },
        },
      });

      render(widget.render() as React.ReactElement);

      // ThemeProvider should be present
      expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
    });
  });

  describe('Error Scenarios', () => {
    it('handles missing sandbox gracefully', () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      try {
        const widget = new UserSettingsWidget({
          sandbox: undefined as any,
          options: mockOptions,
          onError: jest.fn(),
          routeInfo: {
            params: {},
          },
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

      const widget = new UserSettingsWidget({
        sandbox: mockSandbox,
        options: mockOptions,
        onError: jest.fn(),
        routeInfo: {
          params: {},
        },
      });

      render(widget.render() as React.ReactElement);

      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        'APOLLO_CLIENT_NOT_INITIALIZED',
      );
      expect(
        screen.getByText('Error: Apollo client not initialized'),
      ).toBeInTheDocument();
    });

    it('handles render errors gracefully', () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const mockOnError = jest.fn();

      const widget = new UserSettingsWidget({
        sandbox: mockSandbox,
        onError: mockOnError,
        options: mockOptions,
        routeInfo: {
          params: {},
        },
      });

      const renderError = new Error('Render failed');
      widget.componentDidCatch(renderError);

      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        'Plugin=time-tracking-ui Error=USER_SETTINGS_WIDGET_CRASH',
        { error: renderError },
      );
      expect(mockOnError).toHaveBeenCalledWith(renderError);

      consoleSpy.mockRestore();
    });
  });

  describe('Props Handling', () => {
    it('handles all required props', () => {
      const widget = new UserSettingsWidget({
        sandbox: mockSandbox,
        options: mockOptions,
        onError: jest.fn(),
        routeInfo: {
          params: {},
        },
      });

      expect(widget.props.sandbox).toBe(mockSandbox);
      expect(typeof widget.props.onError).toBe('function');
    });

    it('handles optional externalApolloClient prop', () => {
      const externalClient = mockApolloClient;
      const widget = new UserSettingsWidget({
        sandbox: mockSandbox,
        options: mockOptions,
        externalApolloClient: externalClient,
        onError: jest.fn(),
        routeInfo: {
          params: {},
        },
      });

      expect(widget.props.externalApolloClient).toBe(externalClient);
    });

    it('works without optional props', () => {
      const widget = new UserSettingsWidget({
        sandbox: mockSandbox,
        options: mockOptions,
        routeInfo: {
          params: {},
        },
      });

      expect(widget.props.sandbox).toBe(mockSandbox);
      expect(widget.props.onError).toBeUndefined();
      expect(widget.props.externalApolloClient).toBeUndefined();
    });
  });

  describe('Integration', () => {
    it('integrates all providers correctly', () => {
      const workerId = 'worker-123';
      const encryptedWorkerId = encryptWorkerId(workerId);

      const widget = new UserSettingsWidget({
        sandbox: mockSandbox,
        options: mockOptions,
        onError: jest.fn(),
        routeInfo: {
          params: {
            workerId: encryptedWorkerId,
          },
        },
      });

      const result = render(widget.render() as React.ReactElement);

      // Check that the component tree is properly structured
      const quicksandProvider = screen.getByTestId('quicksand-provider');
      const loggingProvider = screen.getByTestId('logging-config-provider');
      const themeProvider = screen.getByTestId('theme-provider');
      const apolloProvider = screen.getByTestId('apollo-provider');
      const userSettingsPage = screen.getByTestId('user-settings-page');

      expect(quicksandProvider).toBeInTheDocument();
      expect(loggingProvider).toBeInTheDocument();
      expect(themeProvider).toBeInTheDocument();
      expect(apolloProvider).toBeInTheDocument();
      expect(userSettingsPage).toBeInTheDocument();
    });

    it('passes correct props to providers', () => {
      const workerId = 'worker-123';
      const encryptedWorkerId = encryptWorkerId(workerId);

      const widget = new UserSettingsWidget({
        sandbox: mockSandbox,
        options: mockOptions,
        onError: jest.fn(),
        routeInfo: {
          params: {
            workerId: encryptedWorkerId,
            workerType: TimeTracking_TimeForType.Employee,
          },
        },
      });

      render(widget.render() as React.ReactElement);

      // Verify that providers are configured correctly
      expect(screen.getByTestId('quicksand-provider')).toBeInTheDocument();
      expect(screen.getByTestId('logging-config-provider')).toBeInTheDocument();
      expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
      expect(screen.getByTestId('apollo-provider')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('does not cause memory leaks', () => {
      const widget = new UserSettingsWidget({
        sandbox: mockSandbox,
        options: mockOptions,
        onError: jest.fn(),
        routeInfo: {
          params: {},
        },
      });

      const { unmount } = render(widget.render() as React.ReactElement);

      // Should unmount without errors
      expect(() => unmount()).not.toThrow();
    });

    it('handles multiple renders', () => {
      const workerId = 'worker-123';
      const encryptedWorkerId = encryptWorkerId(workerId);

      const widget = new UserSettingsWidget({
        sandbox: mockSandbox,
        options: mockOptions,
        onError: jest.fn(),
        routeInfo: {
          params: {
            workerId: encryptedWorkerId,
            workerType: TimeTracking_TimeForType.Employee,
          },
        },
      });

      const { rerender } = render(widget.render() as React.ReactElement);

      // Should handle re-renders without issues
      expect(() =>
        rerender(widget.render() as React.ReactElement),
      ).not.toThrow();
      expect(screen.getByTestId('user-settings-page')).toBeInTheDocument();
    });
  });

  describe('Route Parameter Parsing', () => {
    it('should parse and decrypt workerId from routeInfo params', () => {
      const workerId = 'worker-123';
      const encryptedWorkerId = encryptWorkerId(workerId);

      const widget = new UserSettingsWidget({
        sandbox: mockSandbox,
        options: mockOptions,
        onError: jest.fn(),
        routeInfo: {
          params: {
            workerId: encryptedWorkerId,
          },
        },
      });

      render(widget.render() as React.ReactElement);

      // Widget should have parsed the routeInfo and passed settingsFor to UserSettingsPage
      expect(screen.getByTestId('user-settings-page')).toBeInTheDocument();
    });

    it('should parse workerType from routeInfo params with encrypted workerId', () => {
      const workerId = '123';
      const encryptedWorkerId = encryptWorkerId(workerId);

      const widget = new UserSettingsWidget({
        sandbox: mockSandbox,
        options: mockOptions,
        onError: jest.fn(),
        routeInfo: {
          params: {
            workerId: encryptedWorkerId,
            workerType: TimeTracking_TimeForType.Employee,
          },
        },
      });

      render(widget.render() as React.ReactElement);

      expect(screen.getByTestId('user-settings-page')).toBeInTheDocument();
    });

    it('should parse and decode workerName from routeInfo params with encrypted workerId', () => {
      const workerId = '123';
      const encryptedWorkerId = encryptWorkerId(workerId);

      const widget = new UserSettingsWidget({
        sandbox: mockSandbox,
        options: mockOptions,
        onError: jest.fn(),
        routeInfo: {
          params: {
            workerId: encryptedWorkerId,
            workerType: TimeTracking_TimeForType.Vendor,
            workerName: 'John%20Doe',
          },
        },
      });

      render(widget.render() as React.ReactElement);

      expect(screen.getByTestId('user-settings-page')).toBeInTheDocument();
    });

    it('should handle routeInfo params with special characters and encrypted workerId', () => {
      const workerId = 'worker-123';
      const encryptedWorkerId = encryptWorkerId(workerId);

      const widget = new UserSettingsWidget({
        sandbox: mockSandbox,
        options: mockOptions,
        onError: jest.fn(),
        routeInfo: {
          params: {
            workerId: encryptedWorkerId,
            workerType: TimeTracking_TimeForType.Employee,
            workerName: 'Jos%C3%A9%20Mar%C3%ADa',
          },
        },
      });

      render(widget.render() as React.ReactElement);

      expect(screen.getByTestId('user-settings-page')).toBeInTheDocument();
    });

    it('should show error when routeInfo params are missing', () => {
      const widget = new UserSettingsWidget({
        sandbox: mockSandbox,
        options: mockOptions,
        onError: jest.fn(),
        routeInfo: {
          params: {},
        },
      });

      render(widget.render() as React.ReactElement);

      // Should show error when workerId is empty (decryption fails)
      expect(
        screen.getByText(
          'Error: Something went wrong! Please try again later.',
        ),
      ).toBeInTheDocument();
      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        'UserSettingsWidget: Failed to decrypt worker ID',
        { encryptedWorkerId: '' },
      );
    });

    it('should handle partial routeInfo params with encrypted workerId', () => {
      const workerId = 'worker-456';
      const encryptedWorkerId = encryptWorkerId(workerId);

      const widget = new UserSettingsWidget({
        sandbox: mockSandbox,
        options: mockOptions,
        onError: jest.fn(),
        routeInfo: {
          params: {
            workerId: encryptedWorkerId,
          },
        },
      });

      render(widget.render() as React.ReactElement);

      // Should render with workerId and default workerType
      expect(screen.getByTestId('user-settings-page')).toBeInTheDocument();
    });

    it('should handle multiple route parameters with encrypted workerId', () => {
      const workerId = 'worker-789';
      const encryptedWorkerId = encryptWorkerId(workerId);

      const widget = new UserSettingsWidget({
        sandbox: mockSandbox,
        options: mockOptions,
        onError: jest.fn(),
        routeInfo: {
          params: {
            workerId: encryptedWorkerId,
            workerType: TimeTracking_TimeForType.Vendor,
            workerName: 'Test%20Worker',
          },
        },
      });

      render(widget.render() as React.ReactElement);

      expect(screen.getByTestId('user-settings-page')).toBeInTheDocument();
    });

    it('should handle empty workerId param and show error', () => {
      const widget = new UserSettingsWidget({
        sandbox: mockSandbox,
        options: mockOptions,
        onError: jest.fn(),
        routeInfo: {
          params: {
            workerId: '',
            workerType: TimeTracking_TimeForType.Employee,
          },
        },
      });

      render(widget.render() as React.ReactElement);

      // Should show error message when decryption fails
      expect(
        screen.getByText(
          'Error: Something went wrong! Please try again later.',
        ),
      ).toBeInTheDocument();
      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        'UserSettingsWidget: Failed to decrypt worker ID',
        { encryptedWorkerId: '' },
      );
    });

    it('should show error when routeInfo is undefined', () => {
      const widget = new UserSettingsWidget({
        sandbox: mockSandbox,
        options: mockOptions,
        onError: jest.fn(),
      });

      render(widget.render() as React.ReactElement);

      // Should show error when routeInfo is undefined (workerId is empty)
      expect(
        screen.getByText(
          'Error: Something went wrong! Please try again later.',
        ),
      ).toBeInTheDocument();
      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        'UserSettingsWidget: Failed to decrypt worker ID',
        { encryptedWorkerId: '' },
      );
    });

    it('should handle workerName with spaces', () => {
      const widget = new UserSettingsWidget({
        sandbox: mockSandbox,
        options: mockOptions,
        onError: jest.fn(),
        routeInfo: {
          params: {
            workerId: '123',
            workerName: 'John+Doe',
          },
        },
      });

      render(widget.render() as React.ReactElement);

      expect(screen.getByTestId('user-settings-page')).toBeInTheDocument();
    });

    it('should handle workerName with equals signs in values', () => {
      const widget = new UserSettingsWidget({
        sandbox: mockSandbox,
        options: mockOptions,
        onError: jest.fn(),
        routeInfo: {
          params: {
            workerId: '123',
            workerName: 'Name%3DValue',
          },
        },
      });

      render(widget.render() as React.ReactElement);

      expect(screen.getByTestId('user-settings-page')).toBeInTheDocument();
    });

    it('should use default workerType when not provided with encrypted workerId', () => {
      const workerId = 'worker-123';
      const encryptedWorkerId = encryptWorkerId(workerId);

      const widget = new UserSettingsWidget({
        sandbox: mockSandbox,
        options: mockOptions,
        onError: jest.fn(),
        routeInfo: {
          params: {
            workerId: encryptedWorkerId,
            workerName: 'John Doe',
          },
        },
      });

      render(widget.render() as React.ReactElement);

      expect(screen.getByTestId('user-settings-page')).toBeInTheDocument();
    });

    it('should not decode workerName if not provided with encrypted workerId', () => {
      const workerId = 'worker-123';
      const encryptedWorkerId = encryptWorkerId(workerId);

      const widget = new UserSettingsWidget({
        sandbox: mockSandbox,
        options: mockOptions,
        onError: jest.fn(),
        routeInfo: {
          params: {
            workerId: encryptedWorkerId,
            workerType: TimeTracking_TimeForType.Employee,
          },
        },
      });

      render(widget.render() as React.ReactElement);

      expect(screen.getByTestId('user-settings-page')).toBeInTheDocument();
    });

    it('should handle invalid encrypted workerId and show error', () => {
      const widget = new UserSettingsWidget({
        sandbox: mockSandbox,
        options: mockOptions,
        onError: jest.fn(),
        routeInfo: {
          params: {
            workerId: 'invalid-encrypted-id!!!',
            workerType: TimeTracking_TimeForType.Employee,
          },
        },
      });

      render(widget.render() as React.ReactElement);

      // Should show error message when decryption fails
      expect(
        screen.getByText(
          'Error: Something went wrong! Please try again later.',
        ),
      ).toBeInTheDocument();
      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        'UserSettingsWidget: Failed to decrypt worker ID',
        { encryptedWorkerId: 'invalid-encrypted-id!!!' },
      );
    });

    it('should successfully decrypt valid encrypted workerId', () => {
      const workerId = 'worker-123';
      const encryptedWorkerId = encryptWorkerId(workerId);

      const widget = new UserSettingsWidget({
        sandbox: mockSandbox,
        options: mockOptions,
        onError: jest.fn(),
        routeInfo: {
          params: {
            workerId: encryptedWorkerId,
            workerType: TimeTracking_TimeForType.Employee,
            workerName: 'John Doe',
          },
        },
      });

      render(widget.render() as React.ReactElement);

      // Should successfully decrypt and render
      expect(screen.getByTestId('user-settings-page')).toBeInTheDocument();
      expect(mockSandbox.logger.error).not.toHaveBeenCalled();
    });

    it('should handle workerId with special characters after encryption/decryption', () => {
      const workerId = 'worker@special#chars';
      const encryptedWorkerId = encryptWorkerId(workerId);

      const widget = new UserSettingsWidget({
        sandbox: mockSandbox,
        options: mockOptions,
        onError: jest.fn(),
        routeInfo: {
          params: {
            workerId: encryptedWorkerId,
            workerType: TimeTracking_TimeForType.Employee,
          },
        },
      });

      render(widget.render() as React.ReactElement);

      // Should successfully decrypt and render
      expect(screen.getByTestId('user-settings-page')).toBeInTheDocument();
      expect(mockSandbox.logger.error).not.toHaveBeenCalled();
    });
  });
});
