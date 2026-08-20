import React from 'react';
import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import Widget from '../../../../src/js/widgets/weeklyTimeEntry/Widget';

// Import the mocked NLS module
const mockNls = require('src/nls');

// Mock the dependencies
jest.mock('@payroll/quicksand', () => ({
  QuicksandProvider: ({ children }) => (
    <div data-testid="quicksand-provider">{children}</div>
  ),
  useSandbox: jest.fn(() => ({
    featureFlags: {
      isFeatureEnabled: jest.fn(() => true),
    },
  })),
  useIntl: jest.fn(() => ({
    formatMessage: jest.fn(({ id }) => id),
  })),
}));

jest.mock('src/js/providers/ADSProvider', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="ads-provider">{children}</div>,
}));

jest.mock(
  'src/js/widgets/weeklyTimeEntry/components/WeeklyTimeEntryTrowser',
  () => ({
    WeeklyTimeEntryTrowser: ({ isOpen, setOpen }) => (
      <div data-testid="weekly-time-entry-trowser">
        <span>isOpen: {isOpen.toString()}</span>
        <button type="button" onClick={() => setOpen(false)}>
          Close
        </button>
      </div>
    ),
  }),
);

jest.mock(
  'src/js/widgets/weeklyTimeEntry/components/WeeklyTimeEntryDataProvider',
  () => ({
    WeeklyTimeEntryDataProvider: ({ isOpen, setOpen }) => (
      <div data-testid="weekly-time-entry-data-provider">
        <div data-testid="weekly-time-entry-trowser">
          <span>isOpen: {isOpen.toString()}</span>
          <button type="button" onClick={() => setOpen(false)}>
            Close
          </button>
        </div>
      </div>
    ),
  }),
);

// Mock the experiment gate to pass through children without IXP evaluation
jest.mock(
  'src/js/widgets/weeklyTimeEntry/components/WeeklyTimeEntryExperimentGate',
  () => ({
    WeeklyTimeEntryExperimentGate: ({ children }) => (
      <div data-testid="experiment-gate">{children}</div>
    ),
  }),
);

// Mock the WeeklyTimeEntryApolloProvider to prevent Apollo client initialization
jest.mock(
  'src/js/widgets/weeklyTimeEntry/components/WeeklyTimeEntryApolloProvider',
  () => ({
    WeeklyTimeEntryApolloProvider: ({ children }) => (
      <div data-testid="weekly-time-entry-apollo-provider">{children}</div>
    ),
  }),
);

jest.mock('src/js/service/ApolloClientBuilder', () => ({
  getApolloClientInstance: jest.fn(() => ({})),
}));

jest.mock(
  'src/js/widgets/weeklyTimeEntry/hooks/useCombinedDataFetching',
  () => ({
    useCombinedDataFetching: jest.fn(() => ({
      loading: false,
      error: null,
      settings: {
        isServiceFieldEnabled: true,
        isBillingFieldEnabled: true,
        firstDayOfWeek: 0,
        isClassEnabled: true,
        isLocationEnabled: true,
      },
      currentWeek: {
        startDate: '2024-01-01',
        endDate: '2024-01-07',
      },
      timeEntrySettings: {
        hideTimeEntryFields: [],
        hideWeekdays: [],
        timeEntryTimeFor: null,
      },
    })),
  }),
);

jest.mock('src/nls', () => ({
  requireNlsForLocale: jest.fn(() => ({})),
}));

// Mock the Redux store
jest.mock('../../../../src/js/widgets/weeklyTimeEntry/store', () => ({
  __esModule: true,
  default: {
    getState: () => ({}),
    dispatch: jest.fn(),
    subscribe: jest.fn(),
    replaceReducer: jest.fn(),
  },
}));

describe('WeeklyTimeEntry Widget', () => {
  const defaultProps = {
    sandbox: {
      logger: {
        log: jest.fn(),
        error: jest.fn(),
      },
      appContext: {
        getEnvironment: jest.fn(() => 'PROD'),
      },
    },
    onReady: jest.fn(),
    onClose: jest.fn(),
    onSaveSuccess: jest.fn(),
    open: true,
    setOpen: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the widget with all providers', () => {
    render(
      <MockedProvider>
        <Widget {...defaultProps} />
      </MockedProvider>,
    );

    expect(screen.getByTestId('quicksand-provider')).toBeInTheDocument();
    expect(screen.getByTestId('ads-provider')).toBeInTheDocument();
    expect(
      screen.getByTestId('weekly-time-entry-data-provider'),
    ).toBeInTheDocument();
  });

  it('should call onReady when open is true', () => {
    render(
      <MockedProvider>
        <Widget {...defaultProps} open />
      </MockedProvider>,
    );

    expect(defaultProps.onReady).toHaveBeenCalled();
  });

  it('should log when component mounts', () => {
    render(
      <MockedProvider>
        <Widget {...defaultProps} />
      </MockedProvider>,
    );

    expect(defaultProps.sandbox.logger.log).toHaveBeenCalledWith(
      'Component=Widget Message=Weekly Time Entry Widget Mounted',
    );
  });

  it('should log when component unmounts', () => {
    const { unmount } = render(
      <MockedProvider>
        <Widget {...defaultProps} />
      </MockedProvider>,
    );

    unmount();

    expect(defaultProps.sandbox.logger.log).toHaveBeenCalledWith(
      'Component=Widget Message=Weekly Time Entry Widget Unmounted',
    );
  });

  it('should pass isOpen and setOpen props to WeeklyTimeEntryTrowser', () => {
    render(
      <MockedProvider>
        <Widget {...defaultProps} open />
      </MockedProvider>,
    );

    expect(screen.getByText('isOpen: true')).toBeInTheDocument();
  });

  it('should use external Apollo client when provided', () => {
    const externalClient = { external: true };

    render(
      <MockedProvider>
        <Widget {...defaultProps} externalApolloClient={externalClient} />
      </MockedProvider>,
    );

    // The component should render without errors when external client is provided
    expect(
      screen.getByTestId('weekly-time-entry-data-provider'),
    ).toBeInTheDocument();
  });

  it('should load NLS files for weeklyTimeEntry', () => {
    render(
      <MockedProvider>
        <Widget {...defaultProps} />
      </MockedProvider>,
    );

    expect(mockNls.requireNlsForLocale).toHaveBeenCalledWith([
      'weeklyTimeEntry',
      'timeTrackingUI',
      'breaks',
    ]);
  });

  it('should pass NLS loader to QuicksandProvider', () => {
    render(
      <MockedProvider>
        <Widget {...defaultProps} />
      </MockedProvider>,
    );

    expect(mockNls.requireNlsForLocale).toHaveBeenCalled();
  });

  describe('Apollo Client Error Handling', () => {
    const { getApolloClientInstance } = jest.requireMock(
      'src/js/service/ApolloClientBuilder',
    );

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should render error message when Apollo client is not initialized', () => {
      getApolloClientInstance.mockReturnValue(null);

      render(
        <MockedProvider>
          <Widget {...defaultProps} />
        </MockedProvider>,
      );

      expect(
        screen.getByText('Error: Apollo client not initialized'),
      ).toBeInTheDocument();
    });

    it('should log error when Apollo client is not initialized', () => {
      getApolloClientInstance.mockReturnValue(null);

      render(
        <MockedProvider>
          <Widget {...defaultProps} />
        </MockedProvider>,
      );

      expect(defaultProps.sandbox.logger.error).toHaveBeenCalledWith(
        'Component=Widget Error=Apollo Client Not Initialized',
      );
    });

    it('should render error message when Apollo client is undefined', () => {
      getApolloClientInstance.mockReturnValue(undefined);

      render(
        <MockedProvider>
          <Widget {...defaultProps} />
        </MockedProvider>,
      );

      expect(
        screen.getByText('Error: Apollo client not initialized'),
      ).toBeInTheDocument();
    });

    it('should log error when Apollo client is undefined', () => {
      getApolloClientInstance.mockReturnValue(undefined);

      render(
        <MockedProvider>
          <Widget {...defaultProps} />
        </MockedProvider>,
      );

      expect(defaultProps.sandbox.logger.error).toHaveBeenCalledWith(
        'Component=Widget Error=Apollo Client Not Initialized',
      );
    });

    it('should not render error when external Apollo client is provided even if getApolloClientInstance returns null', () => {
      getApolloClientInstance.mockReturnValue(null);
      const externalClient = { external: true };

      render(
        <MockedProvider>
          <Widget {...defaultProps} externalApolloClient={externalClient} />
        </MockedProvider>,
      );

      expect(
        screen.queryByText('Error: Apollo client not initialized'),
      ).not.toBeInTheDocument();
      expect(defaultProps.sandbox.logger.error).not.toHaveBeenCalled();
    });

    it('should render error when both external client and getApolloClientInstance return null', () => {
      getApolloClientInstance.mockReturnValue(null);

      render(
        <MockedProvider>
          <Widget {...defaultProps} externalApolloClient={null} />
        </MockedProvider>,
      );

      expect(
        screen.getByText('Error: Apollo client not initialized'),
      ).toBeInTheDocument();
      expect(defaultProps.sandbox.logger.error).toHaveBeenCalledWith(
        'Component=Widget Error=Apollo Client Not Initialized',
      );
    });

    it('should not render WeeklyTimeEntryDataProvider when Apollo client is not available', () => {
      getApolloClientInstance.mockReturnValue(null);

      render(
        <MockedProvider>
          <Widget {...defaultProps} />
        </MockedProvider>,
      );

      expect(
        screen.queryByTestId('weekly-time-entry-data-provider'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('quicksand-provider'),
      ).not.toBeInTheDocument();
    });
  });

  describe('EmployeeId prop support', () => {
    const { getApolloClientInstance } = jest.requireMock(
      'src/js/service/ApolloClientBuilder',
    );

    beforeEach(() => {
      getApolloClientInstance.mockReturnValue({ mock: 'client' });
    });

    it('should pass employeeId prop to WeeklyTimeEntryDataProvider', () => {
      const testEmployeeId = 'emp-wte-123';

      render(
        <MockedProvider>
          <Widget {...defaultProps} employeeId={testEmployeeId} />
        </MockedProvider>,
      );

      const dataProvider = screen.getByTestId(
        'weekly-time-entry-data-provider',
      );
      expect(dataProvider).toBeInTheDocument();
    });

    it('should pass null employeeId to WeeklyTimeEntryDataProvider when not provided', () => {
      render(
        <MockedProvider>
          <Widget {...defaultProps} />
        </MockedProvider>,
      );

      const dataProvider = screen.getByTestId(
        'weekly-time-entry-data-provider',
      );
      expect(dataProvider).toBeInTheDocument();
    });

    it('should pass empty string employeeId to WeeklyTimeEntryDataProvider', () => {
      render(
        <MockedProvider>
          <Widget {...defaultProps} employeeId="" />
        </MockedProvider>,
      );

      const dataProvider = screen.getByTestId(
        'weekly-time-entry-data-provider',
      );
      expect(dataProvider).toBeInTheDocument();
    });

    it('should handle employeeId prop along with other props', () => {
      const testEmployeeId = 'emp-combined-test';
      const externalClient = { external: true };

      render(
        <MockedProvider>
          <Widget
            {...defaultProps}
            employeeId={testEmployeeId}
            externalApolloClient={externalClient}
            open
          />
        </MockedProvider>,
      );

      expect(
        screen.getByTestId('weekly-time-entry-data-provider'),
      ).toBeInTheDocument();
      expect(screen.getByText('isOpen: true')).toBeInTheDocument();
    });

    it('should render successfully with employeeId even if Apollo client is not initialized', () => {
      getApolloClientInstance.mockReturnValue(null);
      const testEmployeeId = 'emp-no-client';

      render(
        <MockedProvider>
          <Widget {...defaultProps} employeeId={testEmployeeId} />
        </MockedProvider>,
      );

      expect(
        screen.getByText('Error: Apollo client not initialized'),
      ).toBeInTheDocument();
    });

    it('should prioritize external Apollo client even with employeeId prop', () => {
      const externalClient = { external: true };
      const testEmployeeId = 'emp-external';

      render(
        <MockedProvider>
          <Widget
            {...defaultProps}
            employeeId={testEmployeeId}
            externalApolloClient={externalClient}
          />
        </MockedProvider>,
      );

      expect(
        screen.getByTestId('weekly-time-entry-data-provider'),
      ).toBeInTheDocument();
      expect(defaultProps.sandbox.logger.error).not.toHaveBeenCalled();
    });
  });
});
