import React from 'react';
import { render, screen } from '@testing-library/react';
import Widget from 'src/js/widgets/timeProject/Widget';

const mockClient = {
  query: jest.fn(),
  mutate: jest.fn(),
  cache: {},
};

jest.mock('@accounting-core/templado-asset-libary', () => ({
  MeterBarChart: () => null,
}));

jest.mock('src/js/widgets/timeProject/apollo/TimeProjectApolloClient', () => ({
  getTimeProjectApolloClient: jest.fn(() => mockClient),
  createTimeProjectApolloClient: jest.fn(() => mockClient),
  resetTimeProjectApolloClient: jest.fn(),
}));

jest.mock('src/nls', () => ({
  __esModule: true,
  default: {
    requireNlsForLocale: jest.fn(() => ({})),
  },
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

jest.mock('src/js/providers/LoggingConfigProvider', () => ({
  LoggingConfigProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="logging-provider">{children}</div>
  ),
}));

jest.mock('@payroll/quicksand', () => ({
  QuicksandProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="quicksand-provider">{children}</div>
  ),
  useIntl: () => ({
    formatMessage: ({ id }: { id: string }) => id,
  }),
  useSandbox: () => ({
    navigation: { navigate: jest.fn() },
    logger: { error: jest.fn() },
  }),
  useTracking: () => jest.fn(),
}));

jest.mock('src/js/widgets/timeProject/store', () => ({
  __esModule: true,
  default: {
    getState: jest.fn(() => ({})),
    dispatch: jest.fn(),
    subscribe: jest.fn(() => jest.fn()),
    replaceReducer: jest.fn(),
    [Symbol.observable]: jest.fn(),
  },
  useAppSelector: jest.fn((selector: any) =>
    selector({
      ui: { loading: false, error: null },
      projects: {
        rows: [],
        pagination: { page: 1, pageSize: 10, totalCount: 0 },
      },
      filters: { searchText: '', statusFilter: '', customerFilter: '' },
    }),
  ),
  useAppDispatch: jest.fn(() => jest.fn()),
}));

const mockSandbox = {
  logger: {
    log: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
  appContext: {
    getEnvironment: jest.fn(() => 'QA'),
    getRealmInfo: jest.fn(() => ({ realmId: 'test-realm' })),
    getUserAuthInfo: jest.fn(() => ({ authId: 'test-auth' })),
  },
  extensions: {
    qbo: {
      context: {
        getEnvironmentInfo: jest.fn(() => ({ xCsrfToken: 'test-token' })),
        getCompanyL10nInfo: jest.fn(() => ({ region: 'US' })),
      },
    },
  },
  pluginConfig: {
    extendedProperties: {
      appSecret: 'test-secret',
    },
  },
  navigation: { navigate: jest.fn() },
} as any;

const mockOptions = {
  feature: 'default',
} as any;

describe('Widget', () => {
  it('should render without crashing', () => {
    const { container } = render(
      <Widget sandbox={mockSandbox} options={mockOptions} />,
    );
    expect(container).toBeTruthy();
  });

  it('should call ready() on mount', () => {
    const WidgetClass = Widget as any;
    const instance = new WidgetClass({
      sandbox: mockSandbox,
      options: mockOptions,
    });
    instance.ready = jest.fn();
    instance.componentDidMount();
    expect(instance.ready).toHaveBeenCalled();
  });

  it('should log info on mount', () => {
    const WidgetClass = Widget as any;
    const instance = new WidgetClass({
      sandbox: mockSandbox,
      options: mockOptions,
    });
    instance.ready = jest.fn();
    instance.componentDidMount();
    expect(mockSandbox.logger.info).toHaveBeenCalledWith(
      'Component=Widget Event=TimeProject Widget Mounted',
    );
  });

  it('should render providers when apollo client is available', () => {
    render(<Widget sandbox={mockSandbox} options={mockOptions} />);
    expect(screen.getByTestId('quicksand-provider')).toBeInTheDocument();
    expect(screen.getByTestId('logging-provider')).toBeInTheDocument();
  });

  it('should render error when apollo client is null', () => {
    const {
      getTimeProjectApolloClient,
    } = require('src/js/widgets/timeProject/apollo/TimeProjectApolloClient');
    getTimeProjectApolloClient.mockReturnValueOnce(null);

    render(<Widget sandbox={mockSandbox} options={mockOptions} />);
    expect(
      screen.getByText('Error: Apollo client not initialized'),
    ).toBeInTheDocument();
  });

  it('should log error when apollo client is null', () => {
    const {
      getTimeProjectApolloClient,
    } = require('src/js/widgets/timeProject/apollo/TimeProjectApolloClient');
    getTimeProjectApolloClient.mockReturnValueOnce(null);

    render(<Widget sandbox={mockSandbox} options={mockOptions} />);
    expect(mockSandbox.logger.error).toHaveBeenCalledWith(
      'Component=Widget Error=Apollo Client Not Initialized',
    );
  });
});
