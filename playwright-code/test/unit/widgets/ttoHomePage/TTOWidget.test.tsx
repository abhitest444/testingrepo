import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { QuickbooksOnlineSandbox } from '@appfabric/sandbox-spec';
import TTOWidget from 'src/js/widgets/ttoHomePage/TTOWidget';
import { getDefaultSandbox } from 'test/unit/testUtils';

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
jest.mock('src/js/widgets/ttoHomePage/context/TTOContext', () => ({
  TTOProvider: ({ children }: any) => (
    <div data-testid="mock-tto-provider">{children}</div>
  ),
}));
jest.mock('src/js/widgets/ttoHomePage/TTOFeatureRenderer', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-feature-renderer">FeatureRenderer</div>,
}));
jest.mock('src/nls', () => ({
  __esModule: true,
  default: {
    requireNlsForLocale: jest.fn().mockReturnValue({}),
  },
}));

const getApolloClientInstance = jest.fn();
jest.mock('src/js/service/ApolloClientBuilder', () => ({
  getApolloClientInstance: () => getApolloClientInstance(),
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

describe('TTOWidget', () => {
  beforeEach(() => {
    getApolloClientInstance.mockReset();
  });

  it('renders error if no Apollo client', () => {
    getApolloClientInstance.mockReturnValue(undefined);
    render(
      <TTOWidget
        sandbox={getSandbox() as any}
        options={{ feature: 'tto-home' }}
        routeInfo={{}}
      />,
    );
    expect(
      screen.getByText(/apollo client not initialized/i),
    ).toBeInTheDocument();
  });

  it('renders widget container if Apollo client exists', () => {
    getApolloClientInstance.mockReturnValue({});
    render(
      <TTOWidget
        sandbox={getSandbox() as any}
        options={{ feature: 'tto-home' }}
        routeInfo={{}}
      />,
    );
    expect(screen.getByTestId('tto-widget-container')).toBeInTheDocument();
    expect(screen.getByTestId('mock-feature-renderer')).toBeInTheDocument();
  });

  it('passes correct props to TTOFeatureRenderer', () => {
    getApolloClientInstance.mockReturnValue({});
    render(
      <TTOWidget
        sandbox={getSandbox() as any}
        options={{ feature: 'tto-home' }}
        routeInfo={{}}
      />,
    );
    expect(screen.getByTestId('mock-feature-renderer')).toBeInTheDocument();
  });

  it('calls ready and logs on mount', () => {
    const sandbox = getSandbox();
    sandbox.navigation = { navigate: jest.fn() };
    sandbox.logger.log = jest.fn();
    const readySpy = jest.spyOn(TTOWidget.prototype, 'ready');
    getApolloClientInstance.mockReturnValue({});
    render(
      <TTOWidget
        sandbox={sandbox as any}
        options={{ feature: 'tto-home' }}
        routeInfo={{}}
      />,
    );
    expect(readySpy).toHaveBeenCalled();
    expect(sandbox.logger.log).toHaveBeenCalledWith(
      'TTO Home Page widget mounted',
    );
    readySpy.mockRestore();
  });

  it('handleAddTime navigates to HOME_DETAILS_TIME', () => {
    const sandbox = getSandbox();
    sandbox.navigation = { navigate: jest.fn() };
    const widget = new TTOWidget({ sandbox } as any);
    widget.handleAddTime();
    expect(sandbox.navigation.navigate).toHaveBeenCalledWith(
      'timetracking/homepage?detailsPage=time',
    );
  });

  it('handleView navigates to HOME_DETAILS_TIME', () => {
    const sandbox = getSandbox();
    sandbox.navigation = { navigate: jest.fn() };
    const widget = new TTOWidget({ sandbox } as any);
    widget.handleView();
    expect(sandbox.navigation.navigate).toHaveBeenCalledWith(
      'timetracking/homepage?detailsPage=time',
    );
  });

  it('handleBack navigates to HOME', () => {
    const sandbox = getSandbox();
    sandbox.navigation = { navigate: jest.fn() };
    const widget = new TTOWidget({ sandbox } as any);
    widget.handleBack();
    expect(sandbox.navigation.navigate).toHaveBeenCalledWith(
      'timetracking/homepage',
    );
  });

  it('uses externalApolloClient if provided', () => {
    const externalApolloClient = {
      link: {},
      cache: {},
      disableNetworkFetches: false,
      version: '',
    };
    render(
      <TTOWidget
        sandbox={getSandbox() as any}
        externalApolloClient={externalApolloClient as any}
        options={{ feature: 'tto-home' }}
        routeInfo={{}}
      />,
    );
    expect(getApolloClientInstance).not.toHaveBeenCalled();
  });
});
