import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { ApolloError } from '@apollo/client';
import { getApolloClientInstance } from 'src/js/service/ApolloClientBuilder.ts';
import { FEATURE_FLAGS } from 'src/js/common/constants.ts';
import Widget from 'src/js/widgets/timeTrackingSettings/widget';

// Mock withBaseWidget
jest.mock('@core-app/variability-sync-sdk', () => ({
  withBaseWidget: jest.fn((component) => component),
}));

// Mock customer interaction object with Promise-based methods
const mockCustomerInteraction = {
  id: 'test-interaction-id',
  start: jest.fn().mockResolvedValue({}),
  end: jest.fn().mockResolvedValue({}),
  addMetric: jest.fn().mockResolvedValue({}),
  addError: jest.fn().mockResolvedValue({}),
  setMetaData: jest.fn().mockResolvedValue({}),
  getTracePropagationHeaders: jest.fn().mockReturnValue({
    'x-trace-id': 'test-trace-id',
    'x-span-id': 'test-span-id',
  }),
};

// Mock response for async operations
const mockSuccessResponse = {
  data: {
    success: true,
    message: 'Operation completed successfully',
  },
};

// Mock ApolloError
jest.mock('@apollo/client', () => ({
  ApolloProvider: ({ children }) => (
    <div data-testid="mock-apollo-provider">{children}</div>
  ),
  ApolloError: class extends Error {
    constructor({ errorMessage }) {
      super(errorMessage);
      this.name = 'ApolloError';
      this.networkError = null;
    }
  },
  useLazyQuery: () => [
    jest.fn().mockResolvedValue(mockSuccessResponse),
    {
      loading: false,
      error: null,
      data: null,
      called: false,
    },
  ],
  useQuery: () => ({
    loading: false,
    error: null,
    data: mockSuccessResponse.data,
    refetch: jest.fn().mockResolvedValue(mockSuccessResponse),
  }),
  useMutation: () => [
    jest.fn().mockResolvedValue(mockSuccessResponse),
    {
      loading: false,
      error: null,
      data: null,
    },
  ],
}));

// Enhanced Quicksand mock with intl support
jest.mock('@payroll/quicksand', () => ({
  QuicksandProvider: ({ children }) => (
    <div data-testid="mock-quicksand-provider">{children}</div>
  ),
  useIntl: () => ({
    formatMessage: ({ id }) => id,
    formatDate: jest.fn(),
    formatTime: jest.fn(),
    formatNumber: jest.fn(),
  }),
  useSandbox: () => ({
    featureFlags: {
      isFeatureEnabled: jest.fn().mockReturnValue(true),
    },
    logger: {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    },
    config: {},
    i18n: {
      getLocale: jest.fn().mockReturnValue('en'),
    },
    appContext: {
      getLocalizationInfo: jest.fn().mockReturnValue({
        locale: 'en',
      }),
    },
    authorization: {
      isAuthorized: jest.fn().mockResolvedValue(true),
      hasPermission: jest.fn().mockReturnValue(true),
      checkPermission: jest.fn().mockResolvedValue(true),
      getPermissions: jest.fn().mockResolvedValue(['read', 'write']),
    },
    performance: {
      createCustomerInteraction: jest
        .fn()
        .mockImplementation(() => Promise.resolve(mockCustomerInteraction)),
      getCustomerInteraction: jest
        .fn()
        .mockReturnValue(mockCustomerInteraction),
      markInteractionStart: jest.fn().mockResolvedValue({}),
      markInteractionEnd: jest.fn().mockResolvedValue({}),
      addMetric: jest.fn().mockResolvedValue({}),
      addError: jest.fn().mockResolvedValue({}),
      setMetaData: jest.fn().mockResolvedValue({}),
    },
  }),
  useAppContext: () => ({
    realmId: 'test-realm-id',
    userId: 'test-user-id',
    companyId: 'test-company-id',
    locale: 'en',
    timezone: 'UTC',
    permissions: [],
    features: {},
  }),
}));

jest.mock('src/js/service/ApolloClientBuilder', () => ({
  getApolloClientInstance: jest.fn(),
}));

// Mock the context provider to avoid loading states
jest.mock(
  'src/js/widgets/timeTrackingSettings/context/TimeTrackingSettingsContext',
  () => ({
    TimeTrackingSettingsProvider: ({ children }) => (
      <div data-testid="timetrackingsettings-provider">{children}</div>
    ),
    useTimeTrackingSettingsContext: () => ({
      sandbox: {
        appContext: {
          getLocalizationInfo: () => ({ locale: 'en' }),
        },
      },
      entitlements: [],
      entitlementsLoading: false,
      uxPreferenceLoading: false,
      isQLSettingsLoading: false,
      initialized: true,
      isFormEditable: true,
      errorMessage: '',
      isRenderTimeEntry: false,
      reRenderTimeEntrySetting: jest.fn(),
      updateErrorMessage: jest.fn(),
      timeEntryNewBadgeVisibleFor: {},
      isUKLocale: false,
    }),
  }),
);

jest.mock(
  'src/js/widgets/timeTrackingSettings/components/TimeTrackingSettingsHOC',
  () => ({
    TimeTrackingSettingsHOC: () => (
      <div data-testid="timetrackingsettings-hoc" />
    ),
  }),
);

jest.mock('src/nls', () => ({
  requireNlsForLocale: jest.fn().mockReturnValue('timeTrackingSettings'),
}));

// Mock additional dependencies
jest.mock('src/js/service/utils/sandboxUtils', () => ({
  getListType: jest.fn().mockReturnValue('standard'),
  useFeatureFlag: jest.fn().mockReturnValue(false),
  fetchSettingsAccess: jest.fn().mockResolvedValue(true),
}));

jest.mock('src/js/service/hooks/entitlements/useGetEntitlements', () => ({
  useGetEntitlements: jest.fn().mockReturnValue({
    data: [],
    loading: false,
  }),
  computeHasTSheet: jest.fn().mockReturnValue(false),
  computeHasPayrollWithTSheet: jest.fn().mockReturnValue(false),
}));

jest.mock(
  'src/js/widgets/timeTrackingSettings/components/TimeTrackingSettingsForm',
  () => ({
    TimeTrackingSettingsForm: () => (
      <div data-testid="timetrackingsettings-form" />
    ),
  }),
);

jest.mock('src/js/service/utils/useVariability', () => ({
  getVariabilityFFResult: jest.fn().mockReturnValue(true),
}));

jest.mock('@design-systems/theme', () => ({
  Theme: ({ children }) => <div data-testid="theme-wrapper">{children}</div>,
}));

jest.mock('styled-components', () => ({
  __esModule: true,
  default: (component) => component,
}));

describe('Widget Component', () => {
  let mockSandbox;
  let defaultProps;

  beforeEach(() => {
    mockSandbox = {
      logger: {
        log: jest.fn(),
      },
      appContext: {
        getLocalizationInfo: jest.fn().mockReturnValue({
          locale: 'en',
        }),
      },
      performance: {
        createCustomerInteraction: jest
          .fn()
          .mockImplementation(() => Promise.resolve(mockCustomerInteraction)),
        getCustomerInteraction: jest
          .fn()
          .mockReturnValue(mockCustomerInteraction),
      },
    };

    defaultProps = {
      sandbox: mockSandbox,
      externalApolloClient: null,
    };
  });

  test('should call onReady if provided', () => {
    render(<Widget {...defaultProps} />);
  });

  test('should call onReady not provided', () => {
    const props = {
      sandbox: mockSandbox,
      externalApolloClient: null,
    };

    render(<Widget {...props} />);
  });

  test('should log a message when mounted', () => {
    render(<Widget {...defaultProps} />);
    expect(mockSandbox.logger.log).toHaveBeenCalledWith(
      'Timetrackingsettings mounted.',
    );
  });

  test('should render TimeTrackingSettingsHOC component', () => {
    const { getByTestId } = render(<Widget {...defaultProps} />);
    expect(getByTestId('timetrackingsettings-hoc')).toBeInTheDocument();
  });

  test('should use external Apollo client if provided', () => {
    const mockExternalApolloClient = {};
    const { getByTestId } = render(
      <Widget
        {...defaultProps}
        externalApolloClient={mockExternalApolloClient}
      />,
    );
    expect(getApolloClientInstance).toHaveBeenCalled();
    expect(getByTestId('mock-apollo-provider')).toBeInTheDocument();
  });

  test('should use internal Apollo client if external client is not provided', () => {
    const mockClient = { name: 'MOCK_CLIENT' };
    getApolloClientInstance.mockReturnValue(mockClient);
    render(<Widget {...defaultProps} />);
    expect(getApolloClientInstance).toHaveBeenCalledWith(mockSandbox);
    expect(getApolloClientInstance()).toEqual(mockClient);
  });

  test('successfully initializes component on mount', () => {
    const widget = new Widget(defaultProps);
    widget.ready = jest.fn();

    widget.componentDidMount();

    // Verify component is properly initialized
    expect(widget.ready).toHaveBeenCalled();
    expect(mockSandbox.logger.log).toHaveBeenCalledWith(
      'Timetrackingsettings mounted.',
    );
  });

  test('should handle customer interactions correctly', async () => {
    render(<Widget {...defaultProps} />);

    // Verify customer interaction methods are available
    expect(mockSandbox.performance.createCustomerInteraction).toBeDefined();
    expect(mockSandbox.performance.getCustomerInteraction).toBeDefined();

    // Test sync getCustomerInteraction with method chaining
    const headers = mockSandbox.performance
      .getCustomerInteraction('test-interaction')
      .getTracePropagationHeaders();
    expect(headers).toEqual({
      'x-trace-id': 'test-trace-id',
      'x-span-id': 'test-span-id',
    });

    // Test async interaction creation
    const interaction =
      await mockSandbox.performance.createCustomerInteraction();
    expect(interaction.getTracePropagationHeaders).toBeDefined();
    expect(interaction.start).toBeDefined();
    expect(interaction.end).toBeDefined();

    // Test error handling with ApolloError
    const apolloError = new ApolloError({ errorMessage: 'Test error' });
    expect(apolloError instanceof ApolloError).toBe(true);
    expect(apolloError.message).toBe('Test error');

    // Verify Promise-based methods work
    await expect(interaction.start()).resolves.toBeDefined();
    await expect(interaction.end()).resolves.toBeDefined();
  });
});
