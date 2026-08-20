import React from 'react';
import { render, screen } from '@testing-library/react';
import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec';
import WhosWorkingWidget from 'src/js/widgets/whosworking/WhosWorkingWidget';
import { WHOS_WORKING_LOGGING_CONSTANTS } from 'src/js/widgets/whosworking/constants';

// Mock all providers as passthroughs
jest.mock('@payroll/quicksand', () => ({
  QuicksandProvider: ({ children }: any) => (
    <div data-testid="mock-quicksand-provider">{children}</div>
  ),
}));
jest.mock('@apollo/client', () => ({
  ApolloProvider: ({ children }: any) => (
    <div data-testid="mock-apollo-provider">{children}</div>
  ),
}));
jest.mock('@design-systems/theme', () => ({
  ThemeProvider: ({ children }: any) => (
    <div data-testid="mock-theme-provider">{children}</div>
  ),
}));
jest.mock('src/js/providers/LoggingConfigProvider', () => ({
  LoggingConfigProvider: ({ children }: any) => (
    <div data-testid="mock-logging-provider">{children}</div>
  ),
}));
jest.mock('src/js/widgets/whosworking/components/WhosWorkingContent', () => ({
  __esModule: true,
  default: ({ employeeId }: any) => (
    <div data-testid="mock-whos-working-content">
      WhosWorkingContent:{employeeId ?? 'none'}
    </div>
  ),
}));
jest.mock('src/nls', () => ({
  __esModule: true,
  default: {
    requireNlsForLocale: jest.fn().mockReturnValue({}),
  },
}));

const getAssignmentApolloClient = jest.fn();
jest.mock('src/js/service/AssignmentApolloClient', () => ({
  getAssignmentApolloClient: () => getAssignmentApolloClient(),
}));

function getSandbox(): QuickbooksOnlineSandbox {
  return {
    logger: {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    },
  } as unknown as QuickbooksOnlineSandbox;
}

describe('WhosWorkingWidget', () => {
  beforeEach(() => {
    getAssignmentApolloClient.mockReset();
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders error if no Apollo client', () => {
      getAssignmentApolloClient.mockReturnValue(undefined);
      const sandbox = getSandbox();
      render(
        <WhosWorkingWidget
          sandbox={sandbox as any}
          options={{ feature: 'whos-working' }}
        />,
      );
      expect(
        screen.getByText(/apollo client not initialized/i),
      ).toBeInTheDocument();
    });

    it('logs error when Apollo client is not initialized', () => {
      getAssignmentApolloClient.mockReturnValue(undefined);
      const sandbox = getSandbox();
      render(
        <WhosWorkingWidget
          sandbox={sandbox as any}
          options={{ feature: 'whos-working' }}
        />,
      );
      expect(sandbox.logger.error).toHaveBeenCalledWith(
        WHOS_WORKING_LOGGING_CONSTANTS.API_ERRORS.APOLLO_CLIENT_NOT_INITIALIZED,
      );
    });

    it('renders widget container if Apollo client exists', () => {
      getAssignmentApolloClient.mockReturnValue({});
      const sandbox = getSandbox();
      render(
        <WhosWorkingWidget
          sandbox={sandbox as any}
          options={{ feature: 'whos-working' }}
        />,
      );
      expect(
        screen.getByTestId('mock-whos-working-content'),
      ).toBeInTheDocument();
    });

    it('renders all providers in correct hierarchy', () => {
      getAssignmentApolloClient.mockReturnValue({});
      const sandbox = getSandbox();
      render(
        <WhosWorkingWidget
          sandbox={sandbox as any}
          options={{ feature: 'whos-working' }}
        />,
      );
      expect(screen.getByTestId('mock-quicksand-provider')).toBeInTheDocument();
      expect(screen.getByTestId('mock-logging-provider')).toBeInTheDocument();
      expect(screen.getByTestId('mock-theme-provider')).toBeInTheDocument();
      expect(screen.getByTestId('mock-apollo-provider')).toBeInTheDocument();
    });
  });

  describe('Lifecycle Methods', () => {
    it('calls ready and logs on mount', () => {
      const sandbox = getSandbox();
      const readySpy = jest.spyOn(WhosWorkingWidget.prototype, 'ready');
      getAssignmentApolloClient.mockReturnValue({});
      render(
        <WhosWorkingWidget
          sandbox={sandbox as any}
          options={{ feature: 'whos-working' }}
        />,
      );
      expect(readySpy).toHaveBeenCalled();
      expect(sandbox.logger.info).toHaveBeenCalledWith(
        WHOS_WORKING_LOGGING_CONSTANTS.NAVIGATION.WHOS_WORKING_WIDGET_MOUNTED,
      );
      readySpy.mockRestore();
    });
  });

  describe('Apollo Client', () => {
    it('uses externalApolloClient if provided', () => {
      const externalApolloClient = {
        link: {},
        cache: {},
        disableNetworkFetches: false,
        version: '',
      };
      const sandbox = getSandbox();
      render(
        <WhosWorkingWidget
          sandbox={sandbox as any}
          externalApolloClient={externalApolloClient as any}
          options={{ feature: 'whos-working' }}
        />,
      );
      expect(getAssignmentApolloClient).not.toHaveBeenCalled();
    });

    it('uses internal Apollo client when no external client provided', () => {
      const mockClient = { name: 'MOCK_CLIENT' };
      getAssignmentApolloClient.mockReturnValue(mockClient);
      const sandbox = getSandbox();
      render(
        <WhosWorkingWidget
          sandbox={sandbox as any}
          options={{ feature: 'whos-working' }}
        />,
      );
      expect(getAssignmentApolloClient).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('handles componentDidCatch and logs error', () => {
      const sandbox = getSandbox();
      const onError = jest.fn();
      const widget = new WhosWorkingWidget({
        sandbox: sandbox as any,
        options: { feature: 'whos-working' },
        onError,
      });
      const testError = new Error('test error');

      widget.componentDidCatch(testError);

      expect(sandbox.logger.error).toHaveBeenCalledWith(
        'Plugin=time-tracking-ui Error=WHOS_WORKING_WIDGET_CRASH',
        { error: testError },
      );
      expect(onError).toHaveBeenCalledWith(testError);
    });

    it('handles componentDidCatch without onError callback', () => {
      const sandbox = getSandbox();
      const widget = new WhosWorkingWidget({
        sandbox: sandbox as any,
        options: { feature: 'whos-working' },
      });
      const testError = new Error('test error');

      widget.componentDidCatch(testError);

      expect(sandbox.logger.error).toHaveBeenCalledWith(
        'Plugin=time-tracking-ui Error=WHOS_WORKING_WIDGET_CRASH',
        { error: testError },
      );
    });
  });

  describe('Props', () => {
    it('passes sandbox to providers', () => {
      getAssignmentApolloClient.mockReturnValue({});
      const sandbox = getSandbox();
      render(
        <WhosWorkingWidget
          sandbox={sandbox as any}
          options={{ feature: 'whos-working' }}
        />,
      );
      expect(screen.getByTestId('mock-quicksand-provider')).toBeInTheDocument();
    });

    it('handles feature option', () => {
      getAssignmentApolloClient.mockReturnValue({});
      const sandbox = getSandbox();
      render(
        <WhosWorkingWidget
          sandbox={sandbox as any}
          options={{ feature: 'whos-working' }}
        />,
      );
      expect(
        screen.getByTestId('mock-whos-working-content'),
      ).toBeInTheDocument();
    });

    it('passes employeeId to WhosWorkingContent', () => {
      getAssignmentApolloClient.mockReturnValue({});
      const sandbox = getSandbox();
      render(
        <WhosWorkingWidget
          sandbox={sandbox as any}
          options={{ feature: 'whos-working' }}
          employeeId="worker-321"
        />,
      );
      expect(screen.getByTestId('mock-whos-working-content')).toHaveTextContent(
        'WhosWorkingContent:worker-321',
      );
    });
  });
});
